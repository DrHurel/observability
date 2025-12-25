package fr.umontpellier.observability.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a user's behavioral profile based on their actions in the system.
 * Profiles categorize users by their predominant activity patterns:
 * - READ_HEAVY: Users who mostly perform read operations
 * - WRITE_HEAVY: Users who mostly perform write operations
 * - EXPENSIVE_SEEKER: Users who search for expensive products
 * - BALANCED: Users with mixed activity patterns
 */
@Document(collection = "user_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfile {

    @Id
    private String id;

    @Indexed(unique = true, sparse = true)
    private String userId;

    private String userName;

    @Indexed(unique = true, sparse = true)
    private String userEmail;

    // Operation counts - initialized in constructor
    private int readOperations;
    private int writeOperations;
    private int expensiveProductSearches;

    // Thresholds for expensive products (configurable)
    private double expensiveThreshold;

    // Profile classification
    private ProfileType profileType;

    // Detailed action history
    private List<ProfileAction> recentActions;

    // Statistics
    private double averageProductPriceViewed;
    private double maxProductPriceViewed;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastActivityAt;

    /**
     * Profile types based on user behavior patterns.
     */
    public enum ProfileType {
        READ_HEAVY("Predominantly performs read operations"),
        WRITE_HEAVY("Predominantly performs write operations"),
        EXPENSIVE_SEEKER("Frequently searches for expensive products"),
        BALANCED("Mixed activity pattern");

        private final String description;

        ProfileType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * Represents a single action in the profile history.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProfileAction {
        private String actionType; // READ, WRITE, SEARCH
        private String operationType; // GET_ALL, GET_BY_ID, CREATE, UPDATE, DELETE
        private String targetEntity; // USER, PRODUCT
        private String targetId;
        private Double productPrice; // For product operations
        private LocalDateTime timestamp;
        private String details;

        public static ProfileActionBuilder builder() {
            return new ProfileActionBuilder();
        }

        public static class ProfileActionBuilder {
            private String actionType;
            private String operationType;
            private String targetEntity;
            private String targetId;
            private Double productPrice;
            private LocalDateTime timestamp;
            private String details;

            public ProfileActionBuilder actionType(String actionType) {
                this.actionType = actionType;
                return this;
            }

            public ProfileActionBuilder operationType(String operationType) {
                this.operationType = operationType;
                return this;
            }

            public ProfileActionBuilder targetEntity(String targetEntity) {
                this.targetEntity = targetEntity;
                return this;
            }

            public ProfileActionBuilder targetId(String targetId) {
                this.targetId = targetId;
                return this;
            }

            public ProfileActionBuilder productPrice(Double productPrice) {
                this.productPrice = productPrice;
                return this;
            }

            public ProfileActionBuilder timestamp(LocalDateTime timestamp) {
                this.timestamp = timestamp;
                return this;
            }

            public ProfileActionBuilder details(String details) {
                this.details = details;
                return this;
            }

            public ProfileAction build() {
                ProfileAction action = new ProfileAction();
                action.setActionType(actionType);
                action.setOperationType(operationType);
                action.setTargetEntity(targetEntity);
                action.setTargetId(targetId);
                action.setProductPrice(productPrice);
                action.setTimestamp(timestamp);
                action.setDetails(details);
                return action;
            }
        }
    }

    /**
     * Builder pattern for creating UserProfile instances.
     */
    public static UserProfileBuilder builder() {
        return new UserProfileBuilder();
    }

    public static class UserProfileBuilder {
        private String id;
        private String userId;
        private String userName;
        private String userEmail;
        private int readOperations = 0;
        private int writeOperations = 0;
        private int expensiveProductSearches = 0;
        private double expensiveThreshold = 100.0;
        private ProfileType profileType;
        private List<ProfileAction> recentActions = new ArrayList<>();
        private double averageProductPriceViewed = 0.0;
        private double maxProductPriceViewed = 0.0;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private LocalDateTime lastActivityAt;

        public UserProfileBuilder id(String id) {
            this.id = id;
            return this;
        }

        public UserProfileBuilder userId(String userId) {
            this.userId = userId;
            return this;
        }

        public UserProfileBuilder userName(String userName) {
            this.userName = userName;
            return this;
        }

        public UserProfileBuilder userEmail(String userEmail) {
            this.userEmail = userEmail;
            return this;
        }

        public UserProfileBuilder readOperations(int readOperations) {
            this.readOperations = readOperations;
            return this;
        }

        public UserProfileBuilder writeOperations(int writeOperations) {
            this.writeOperations = writeOperations;
            return this;
        }

        public UserProfileBuilder expensiveProductSearches(int expensiveProductSearches) {
            this.expensiveProductSearches = expensiveProductSearches;
            return this;
        }

        public UserProfileBuilder expensiveThreshold(double expensiveThreshold) {
            this.expensiveThreshold = expensiveThreshold;
            return this;
        }

        public UserProfileBuilder profileType(ProfileType profileType) {
            this.profileType = profileType;
            return this;
        }

        public UserProfileBuilder recentActions(List<ProfileAction> recentActions) {
            this.recentActions = recentActions;
            return this;
        }

        public UserProfileBuilder averageProductPriceViewed(double averageProductPriceViewed) {
            this.averageProductPriceViewed = averageProductPriceViewed;
            return this;
        }

        public UserProfileBuilder maxProductPriceViewed(double maxProductPriceViewed) {
            this.maxProductPriceViewed = maxProductPriceViewed;
            return this;
        }

        public UserProfileBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public UserProfileBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public UserProfileBuilder lastActivityAt(LocalDateTime lastActivityAt) {
            this.lastActivityAt = lastActivityAt;
            return this;
        }

        public UserProfile build() {
            UserProfile profile = new UserProfile();
            profile.setId(id);
            profile.setUserId(userId);
            profile.setUserName(userName);
            profile.setUserEmail(userEmail);
            profile.setReadOperations(readOperations);
            profile.setWriteOperations(writeOperations);
            profile.setExpensiveProductSearches(expensiveProductSearches);
            profile.setExpensiveThreshold(expensiveThreshold);
            profile.setProfileType(profileType);
            profile.setRecentActions(recentActions != null ? recentActions : new ArrayList<>());
            profile.setAverageProductPriceViewed(averageProductPriceViewed);
            profile.setMaxProductPriceViewed(maxProductPriceViewed);
            profile.setCreatedAt(createdAt);
            profile.setUpdatedAt(updatedAt);
            profile.setLastActivityAt(lastActivityAt);
            return profile;
        }
    }

    /**
     * Increment read operations count.
     */
    public void incrementReadOperations() {
        this.readOperations++;
        this.lastActivityAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Increment write operations count.
     */
    public void incrementWriteOperations() {
        this.writeOperations++;
        this.lastActivityAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Record a product price viewed and update statistics.
     */
    public void recordProductPriceViewed(double price) {
        if (price > this.expensiveThreshold) {
            this.expensiveProductSearches++;
        }
        if (price > this.maxProductPriceViewed) {
            this.maxProductPriceViewed = price;
        }
        // Update average (simple moving average)
        int totalViews = this.readOperations > 0 ? this.readOperations : 1;
        this.averageProductPriceViewed = ((this.averageProductPriceViewed * (totalViews - 1)) + price) / totalViews;

        this.lastActivityAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Add an action to the recent actions list (keeping last 100 actions).
     */
    public void addAction(ProfileAction action) {
        if (this.recentActions == null) {
            this.recentActions = new ArrayList<>();
        }
        this.recentActions.add(action);
        // Keep only last 100 actions
        if (this.recentActions.size() > 100) {
            this.recentActions = new ArrayList<>(
                    this.recentActions.subList(this.recentActions.size() - 100, this.recentActions.size()));
        }
    }

    /**
     * Calculate and update the profile type based on current statistics.
     */
    public void calculateProfileType() {
        int totalOperations = this.readOperations + this.writeOperations;

        if (totalOperations == 0) {
            this.profileType = ProfileType.BALANCED;
            return;
        }

        double readRatio = (double) this.readOperations / totalOperations;
        double expensiveRatio = totalOperations > 0
                ? (double) this.expensiveProductSearches / totalOperations
                : 0;

        // Classify based on behavior patterns
        if (expensiveRatio > 0.3) {
            this.profileType = ProfileType.EXPENSIVE_SEEKER;
        } else if (readRatio > 0.7) {
            this.profileType = ProfileType.READ_HEAVY;
        } else if (readRatio < 0.3) {
            this.profileType = ProfileType.WRITE_HEAVY;
        } else {
            this.profileType = ProfileType.BALANCED;
        }
    }

    /**
     * Get a summary of the profile as a formatted string.
     */
    public String getSummary() {
        return String.format(
                "Profile[user=%s, type=%s, reads=%d, writes=%d, expensiveSearches=%d, avgPrice=%.2f]",
                this.userEmail != null ? this.userEmail : this.userId,
                this.profileType != null ? this.profileType.name() : "UNKNOWN",
                this.readOperations,
                this.writeOperations,
                this.expensiveProductSearches,
                this.averageProductPriceViewed);
    }
}
