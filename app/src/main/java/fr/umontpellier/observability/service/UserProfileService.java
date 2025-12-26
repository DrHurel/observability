package fr.umontpellier.observability.service;

import fr.umontpellier.observability.model.User;
import fr.umontpellier.observability.model.UserAction;
import fr.umontpellier.observability.model.UserAction.ActionType;
import fr.umontpellier.observability.model.UserAction.EntityType;
import fr.umontpellier.observability.model.UserAction.OperationType;
import fr.umontpellier.observability.model.UserProfile;
import fr.umontpellier.observability.model.UserProfile.ProfileAction;
import fr.umontpellier.observability.model.UserProfile.ProfileType;
import fr.umontpellier.observability.repository.UserProfileRepository;
import fr.umontpellier.observability.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for managing and analyzing user profiles based on their behavioral
 * patterns.
 * 
 * This service:
 * 1. Records user actions and updates profiles in real-time
 * 2. Classifies users into profile types (READ_HEAVY, WRITE_HEAVY,
 * EXPENSIVE_SEEKER, BALANCED)
 * 3. Provides analytics on user behavior patterns
 * 4. Exports profiles in JSON format
 */
@Service
@RequiredArgsConstructor
@Transactional
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;
    private final LogParserService logParserService;
    private final KafkaTemplate<String, String> kafkaTemplate;

    private static final String PROFILE_TOPIC = "user-profiles";
    private static final double DEFAULT_EXPENSIVE_THRESHOLD = 100.0;

    /**
     * Record a user action and update their profile.
     */
    public void recordAction(UserAction action) {
        if (action == null) {
            return;
        }

        String userId = action.getUserId();
        String userEmail = action.getUserEmail();

        if (userId == null && userEmail == null) {
            return;
        }

        // Get or create profile
        UserProfile profile = getOrCreateProfile(userId, userEmail, action.getUserName());

        // Update profile based on action type
        if (action.getActionType() == ActionType.READ) {
            profile.incrementReadOperations();
        } else if (action.getActionType() == ActionType.WRITE) {
            profile.incrementWriteOperations();
        }

        // Track product price if applicable
        if (action.getEntityType() == EntityType.PRODUCT && action.getProductPrice() != null) {
            profile.recordProductPriceViewed(action.getProductPrice());
        }

        // Add action to history
        ProfileAction profileAction = ProfileAction.builder()
                .actionType(action.getActionType() != null ? action.getActionType().name() : "UNKNOWN")
                .operationType(action.getOperationType() != null ? action.getOperationType().name() : "UNKNOWN")
                .targetEntity(action.getEntityType() != null ? action.getEntityType().name() : "UNKNOWN")
                .targetId(action.getEntityId())
                .productPrice(action.getProductPrice())
                .timestamp(action.getTimestamp() != null ? action.getTimestamp() : LocalDateTime.now())
                .details(action.getDetails())
                .build();
        profile.addAction(profileAction);

        // Recalculate profile type
        profile.calculateProfileType();

        // Save profile
        userProfileRepository.save(profile);

        // Publish profile update event
        publishProfileUpdate(profile);
    }

    /**
     * Record a user action directly from service calls.
     */
    public void recordAction(String userId, String userEmail, String userName,
            OperationType operationType, EntityType entityType,
            String entityId, Double productPrice, String productName) {
        UserAction action = UserAction.lpsBuilder()
                .withUser(userId, userEmail, userName)
                .withAction(operationType, null, operationType.name())
                .withTarget(entityType, entityId)
                .withProductContext(productName, productPrice)
                .withResult(true, null)
                .build();
        recordAction(action);
    }

    /**
     * Get or create a user profile.
     */
    private UserProfile getOrCreateProfile(String userId, String userEmail, String userName) {
        Optional<UserProfile> existingProfile;

        if (userId != null) {
            existingProfile = userProfileRepository.findByUserId(userId);
        } else {
            existingProfile = userProfileRepository.findByUserEmail(userEmail);
        }

        if (existingProfile.isPresent()) {
            return existingProfile.get();
        }

        // Try to get user info from database
        if (userName == null && userEmail != null) {
            userRepository.findByEmail(userEmail).ifPresent(user -> {
                // Update userName if found
            });
        }

        // Create new profile
        UserProfile newProfile = UserProfile.builder()
                .userId(userId)
                .userEmail(userEmail)
                .userName(userName)
                .expensiveThreshold(DEFAULT_EXPENSIVE_THRESHOLD)
                .profileType(ProfileType.BALANCED)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return userProfileRepository.save(newProfile);
    }

    /**
     * Get a user profile by user ID.
     */
    @Transactional(readOnly = true)
    public Optional<UserProfile> getProfileByUserId(String userId) {
        return userProfileRepository.findByUserId(userId);
    }

    /**
     * Get a user profile by email.
     */
    @Transactional(readOnly = true)
    public Optional<UserProfile> getProfileByEmail(String email) {
        return userProfileRepository.findByUserEmail(email);
    }

    /**
     * Get all profiles.
     */
    @Transactional(readOnly = true)
    public List<UserProfile> getAllProfiles() {
        return userProfileRepository.findAll();
    }

    /**
     * Get profiles by type.
     */
    @Transactional(readOnly = true)
    public List<UserProfile> getProfilesByType(ProfileType type) {
        return userProfileRepository.findByProfileType(type);
    }

    /**
     * Get read-heavy users (those who mostly perform read operations).
     */
    @Transactional(readOnly = true)
    public List<UserProfile> getReadHeavyUsers() {
        return userProfileRepository.findByProfileType(ProfileType.READ_HEAVY);
    }

    /**
     * Get write-heavy users (those who mostly perform write operations).
     */
    @Transactional(readOnly = true)
    public List<UserProfile> getWriteHeavyUsers() {
        return userProfileRepository.findByProfileType(ProfileType.WRITE_HEAVY);
    }

    /**
     * Get expensive product seekers.
     */
    @Transactional(readOnly = true)
    public List<UserProfile> getExpensiveProductSeekers() {
        return userProfileRepository.findByProfileType(ProfileType.EXPENSIVE_SEEKER);
    }

    /**
     * Get profile statistics summary.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getProfileStatistics() {
        List<UserProfile> allProfiles = userProfileRepository.findAll();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalProfiles", allProfiles.size());

        // Count by profile type
        Map<ProfileType, Long> typeDistribution = allProfiles.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getProfileType() != null ? p.getProfileType() : ProfileType.BALANCED,
                        Collectors.counting()));
        stats.put("profileTypeDistribution", typeDistribution);

        // Calculate averages
        double avgReadOps = allProfiles.stream()
                .mapToInt(UserProfile::getReadOperations)
                .average()
                .orElse(0);
        double avgWriteOps = allProfiles.stream()
                .mapToInt(UserProfile::getWriteOperations)
                .average()
                .orElse(0);
        double avgExpensiveSearches = allProfiles.stream()
                .mapToInt(UserProfile::getExpensiveProductSearches)
                .average()
                .orElse(0);

        stats.put("averageReadOperations", avgReadOps);
        stats.put("averageWriteOperations", avgWriteOps);
        stats.put("averageExpensiveSearches", avgExpensiveSearches);

        // Top users by category
        stats.put("topReadUsers", allProfiles.stream()
                .sorted((a, b) -> Integer.compare(b.getReadOperations(), a.getReadOperations()))
                .limit(5)
                .map(this::profileToSummaryMap)
                .collect(Collectors.toList()));

        stats.put("topWriteUsers", allProfiles.stream()
                .sorted((a, b) -> Integer.compare(b.getWriteOperations(), a.getWriteOperations()))
                .limit(5)
                .map(this::profileToSummaryMap)
                .collect(Collectors.toList()));

        stats.put("topExpensiveSeekers", allProfiles.stream()
                .sorted((a, b) -> Integer.compare(b.getExpensiveProductSearches(), a.getExpensiveProductSearches()))
                .limit(5)
                .map(this::profileToSummaryMap)
                .collect(Collectors.toList()));

        return stats;
    }

    /**
     * Convert profile to summary map for API response.
     */
    private Map<String, Object> profileToSummaryMap(UserProfile profile) {
        Map<String, Object> summary = new HashMap<>();
        summary.put("userId", profile.getUserId());
        summary.put("userEmail", profile.getUserEmail());
        summary.put("userName", profile.getUserName());
        summary.put("profileType", profile.getProfileType());
        summary.put("readOperations", profile.getReadOperations());
        summary.put("writeOperations", profile.getWriteOperations());
        summary.put("expensiveProductSearches", profile.getExpensiveProductSearches());
        summary.put("averageProductPriceViewed", profile.getAverageProductPriceViewed());
        return summary;
    }

    /**
     * Process log content and update profiles.
     */
    public int processLogs(String logContent) {
        List<UserAction> actions = logParserService.parseLogContent(logContent);
        int processed = 0;
        for (UserAction action : actions) {
            try {
                recordAction(action);
                processed++;
            } catch (Exception e) {
                // Exception logging handled by InjectLog4J via logging.rules.yaml
            }
        }
        return processed;
    }

    /**
     * Process log lines and update profiles.
     */
    public int processLogLines(List<String> logLines) {
        List<UserAction> actions = logParserService.parseLogLines(logLines);
        int processed = 0;
        for (UserAction action : actions) {
            try {
                recordAction(action);
                processed++;
            } catch (Exception e) {
                // Exception logging handled by InjectLog4J via logging.rules.yaml
            }
        }
        return processed;
    }

    /**
     * Recalculate all profile types based on current data.
     */
    public void recalculateAllProfiles() {
        List<UserProfile> profiles = userProfileRepository.findAll();
        for (UserProfile profile : profiles) {
            profile.calculateProfileType();
            profile.setUpdatedAt(LocalDateTime.now());
            userProfileRepository.save(profile);
        }
    }

    /**
     * Export all profiles as JSON.
     */
    @Transactional(readOnly = true)
    public String exportProfilesAsJson() {
        List<UserProfile> profiles = userProfileRepository.findAll();
        StringBuilder json = new StringBuilder();
        json.append("{\n  \"profiles\": [\n");

        for (int i = 0; i < profiles.size(); i++) {
            UserProfile profile = profiles.get(i);
            json.append("    ").append(profileToJson(profile));
            if (i < profiles.size() - 1) {
                json.append(",");
            }
            json.append("\n");
        }

        json.append("  ],\n");
        json.append("  \"statistics\": ").append(statsToJson(getProfileStatistics())).append("\n");
        json.append("}\n");

        return json.toString();
    }

    /**
     * Convert a profile to JSON string.
     */
    private String profileToJson(UserProfile profile) {
        return String.format(
                "{\"userId\":\"%s\",\"userEmail\":\"%s\",\"userName\":\"%s\"," +
                        "\"profileType\":\"%s\",\"readOperations\":%d,\"writeOperations\":%d," +
                        "\"expensiveProductSearches\":%d,\"averageProductPriceViewed\":%.2f," +
                        "\"maxProductPriceViewed\":%.2f}",
                profile.getUserId() != null ? profile.getUserId() : "",
                profile.getUserEmail() != null ? profile.getUserEmail() : "",
                profile.getUserName() != null ? profile.getUserName() : "",
                profile.getProfileType() != null ? profile.getProfileType().name() : "BALANCED",
                profile.getReadOperations(),
                profile.getWriteOperations(),
                profile.getExpensiveProductSearches(),
                profile.getAverageProductPriceViewed(),
                profile.getMaxProductPriceViewed());
    }

    /**
     * Convert statistics map to JSON.
     */
    private String statsToJson(Map<String, Object> stats) {
        StringBuilder json = new StringBuilder();
        json.append("{");
        json.append("\"totalProfiles\":").append(stats.get("totalProfiles")).append(",");
        json.append("\"averageReadOperations\":").append(stats.get("averageReadOperations")).append(",");
        json.append("\"averageWriteOperations\":").append(stats.get("averageWriteOperations")).append(",");
        json.append("\"averageExpensiveSearches\":").append(stats.get("averageExpensiveSearches"));
        json.append("}");
        return json.toString();
    }

    /**
     * Publish profile update to Kafka.
     */
    private void publishProfileUpdate(UserProfile profile) {
        try {
            String message = String.format("Profile updated: %s - Type: %s",
                    profile.getUserEmail() != null ? profile.getUserEmail() : profile.getUserId(),
                    profile.getProfileType());
            kafkaTemplate.send(PROFILE_TOPIC, message);
        } catch (Exception e) {
            // Exception logging handled by InjectLog4J via logging.rules.yaml
        }
    }

    /**
     * Delete a user profile.
     */
    public void deleteProfile(String userId) {
        userProfileRepository.deleteByUserId(userId);
    }

    /**
     * Delete all profiles.
     */
    public void deleteAllProfiles() {
        userProfileRepository.deleteAll();
    }
}
