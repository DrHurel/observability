package fr.umontpellier.observability.controller;

import fr.umontpellier.observability.model.UserProfile;
import fr.umontpellier.observability.model.UserProfile.ProfileType;
import fr.umontpellier.observability.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for user profile management and analytics.
 * 
 * Provides endpoints to:
 * - Retrieve user profiles by various criteria
 * - Get profile statistics and analytics
 * - Export profiles in JSON format
 * - Process logs to update profiles
 */
@RestController
@RequestMapping("/api/profiles")
@RequiredArgsConstructor
@Log4j2
public class ProfileController {

    private final UserProfileService userProfileService;

    /**
     * Get all user profiles.
     */
    @GetMapping
    public ResponseEntity<List<UserProfile>> getAllProfiles() {
        log.info("Fetching all user profiles");
        List<UserProfile> profiles = userProfileService.getAllProfiles();
        return ResponseEntity.ok(profiles);
    }

    /**
     * Get a user profile by user ID.
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<UserProfile> getProfileByUserId(@PathVariable String userId) {
        log.info("Fetching profile for user ID: {}", userId);
        return userProfileService.getProfileByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get a user profile by email.
     */
    @GetMapping("/email/{email}")
    public ResponseEntity<UserProfile> getProfileByEmail(@PathVariable String email) {
        log.info("Fetching profile for email: {}", email);
        return userProfileService.getProfileByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get profiles by type.
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<List<UserProfile>> getProfilesByType(@PathVariable String type) {
        log.info("Fetching profiles of type: {}", type);
        try {
            ProfileType profileType = ProfileType.valueOf(type.toUpperCase());
            List<UserProfile> profiles = userProfileService.getProfilesByType(profileType);
            return ResponseEntity.ok(profiles);
        } catch (IllegalArgumentException e) {
            log.error("Invalid profile type: {}", type);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get read-heavy users (mostly perform read operations).
     */
    @GetMapping("/read-heavy")
    public ResponseEntity<List<UserProfile>> getReadHeavyUsers() {
        log.info("Fetching read-heavy user profiles");
        List<UserProfile> profiles = userProfileService.getReadHeavyUsers();
        return ResponseEntity.ok(profiles);
    }

    /**
     * Get write-heavy users (mostly perform write operations).
     */
    @GetMapping("/write-heavy")
    public ResponseEntity<List<UserProfile>> getWriteHeavyUsers() {
        log.info("Fetching write-heavy user profiles");
        List<UserProfile> profiles = userProfileService.getWriteHeavyUsers();
        return ResponseEntity.ok(profiles);
    }

    /**
     * Get expensive product seekers (frequently search for expensive products).
     */
    @GetMapping("/expensive-seekers")
    public ResponseEntity<List<UserProfile>> getExpensiveSeekers() {
        log.info("Fetching expensive product seeker profiles");
        List<UserProfile> profiles = userProfileService.getExpensiveProductSeekers();
        return ResponseEntity.ok(profiles);
    }

    /**
     * Get profile statistics and analytics.
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        log.info("Fetching profile statistics");
        Map<String, Object> stats = userProfileService.getProfileStatistics();
        return ResponseEntity.ok(stats);
    }

    /**
     * Export all profiles as JSON file.
     */
    @GetMapping("/export")
    public ResponseEntity<String> exportProfiles() {
        log.info("Exporting all profiles as JSON");
        String json = userProfileService.exportProfilesAsJson();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=user_profiles.json")
                .contentType(MediaType.APPLICATION_JSON)
                .body(json);
    }

    /**
     * Process log content to update user profiles.
     */
    @PostMapping("/process-logs")
    public ResponseEntity<Map<String, Object>> processLogs(@RequestBody String logContent) {
        log.info("Processing logs to update profiles");
        int processed = userProfileService.processLogs(logContent);
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "processedActions", processed));
    }

    /**
     * Process multiple log lines to update user profiles.
     */
    @PostMapping("/process-log-lines")
    public ResponseEntity<Map<String, Object>> processLogLines(@RequestBody List<String> logLines) {
        log.info("Processing {} log lines", logLines.size());
        int processed = userProfileService.processLogLines(logLines);
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "processedActions", processed,
                "totalLines", logLines.size()));
    }

    /**
     * Recalculate all profile types based on current data.
     */
    @PostMapping("/recalculate")
    public ResponseEntity<Map<String, String>> recalculateProfiles() {
        log.info("Recalculating all user profiles");
        userProfileService.recalculateAllProfiles();
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "All profiles recalculated"));
    }

    /**
     * Delete a user profile.
     */
    @DeleteMapping("/user/{userId}")
    public ResponseEntity<Void> deleteProfile(@PathVariable String userId) {
        log.info("Deleting profile for user: {}", userId);
        userProfileService.deleteProfile(userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Delete all profiles (admin operation).
     */
    @DeleteMapping("/all")
    public ResponseEntity<Map<String, String>> deleteAllProfiles() {
        log.info("Deleting all user profiles");
        userProfileService.deleteAllProfiles();
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "All profiles deleted"));
    }

    /**
     * Get available profile types.
     */
    @GetMapping("/types")
    public ResponseEntity<List<Map<String, String>>> getProfileTypes() {
        List<Map<String, String>> types = List.of(
                Map.of("name", "READ_HEAVY", "description", ProfileType.READ_HEAVY.getDescription()),
                Map.of("name", "WRITE_HEAVY", "description", ProfileType.WRITE_HEAVY.getDescription()),
                Map.of("name", "EXPENSIVE_SEEKER", "description", ProfileType.EXPENSIVE_SEEKER.getDescription()),
                Map.of("name", "BALANCED", "description", ProfileType.BALANCED.getDescription()));
        return ResponseEntity.ok(types);
    }
}
