package fr.umontpellier.observability.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Represents a parsed user action from structured logs.
 * This class follows the Builder pattern for constructing LPS (Log Processing
 * Structure).
 * 
 * The LPS structure is:
 * - Timestamp: When the action occurred
 * - User: Who performed the action (userId, userEmail)
 * - Action: What was done (operation type, method name)
 * - Target: What entity was affected (entity type, entity id)
 * - Context: Additional context (product price, etc.)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAction {

    // Timestamp component
    private LocalDateTime timestamp;

    // User component
    private String userId;
    private String userEmail;
    private String userName;

    // Action component
    private ActionType actionType;
    private OperationType operationType;
    private String methodName;
    private String className;

    // Target component
    private EntityType entityType;
    private String entityId;

    // Context component
    private Double productPrice;
    private String productName;
    private String details;
    private boolean successful;
    private String errorMessage;

    /**
     * Types of actions based on database operation patterns.
     */
    public enum ActionType {
        READ("Read operation - fetching data"),
        WRITE("Write operation - creating, updating, or deleting data"),
        SEARCH("Search operation - querying for specific data");

        private final String description;

        ActionType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * Specific operation types.
     */
    public enum OperationType {
        GET_ALL("Fetching all records"),
        GET_BY_ID("Fetching a specific record by ID"),
        GET_BY_EMAIL("Fetching a user by email"),
        CREATE("Creating a new record"),
        UPDATE("Updating an existing record"),
        DELETE("Deleting a record"),
        SEARCH("Searching for records");

        private final String description;

        OperationType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }

        public ActionType toActionType() {
            return switch (this) {
                case GET_ALL, GET_BY_ID, GET_BY_EMAIL, SEARCH -> ActionType.READ;
                case CREATE, UPDATE, DELETE -> ActionType.WRITE;
            };
        }
    }

    /**
     * Entity types in the system.
     */
    public enum EntityType {
        USER,
        PRODUCT
    }

    /**
     * Builder class for LPS construction.
     * Allows building the action from separate components.
     */
    public static class LPSBuilder {
        private final UserAction action;

        public LPSBuilder() {
            this.action = new UserAction();
            this.action.setTimestamp(LocalDateTime.now());
            this.action.setSuccessful(true);
        }

        /**
         * Set timestamp component.
         */
        public LPSBuilder withTimestamp(LocalDateTime timestamp) {
            this.action.setTimestamp(timestamp);
            return this;
        }

        /**
         * Set user component.
         */
        public LPSBuilder withUser(String userId, String userEmail, String userName) {
            this.action.setUserId(userId);
            this.action.setUserEmail(userEmail);
            this.action.setUserName(userName);
            return this;
        }

        /**
         * Set action component.
         */
        public LPSBuilder withAction(OperationType operationType, String className, String methodName) {
            this.action.setOperationType(operationType);
            this.action.setActionType(operationType.toActionType());
            this.action.setClassName(className);
            this.action.setMethodName(methodName);
            return this;
        }

        /**
         * Set target component.
         */
        public LPSBuilder withTarget(EntityType entityType, String entityId) {
            this.action.setEntityType(entityType);
            this.action.setEntityId(entityId);
            return this;
        }

        /**
         * Set product context.
         */
        public LPSBuilder withProductContext(String productName, Double price) {
            this.action.setProductName(productName);
            this.action.setProductPrice(price);
            return this;
        }

        /**
         * Set result context.
         */
        public LPSBuilder withResult(boolean successful, String details) {
            this.action.setSuccessful(successful);
            this.action.setDetails(details);
            return this;
        }

        /**
         * Set error context.
         */
        public LPSBuilder withError(String errorMessage) {
            this.action.setSuccessful(false);
            this.action.setErrorMessage(errorMessage);
            return this;
        }

        /**
         * Build the final UserAction.
         */
        public UserAction build() {
            return this.action;
        }
    }

    /**
     * Create a new LPS Builder.
     */
    public static LPSBuilder lpsBuilder() {
        return new LPSBuilder();
    }

    /**
     * Format the action as a structured log string (JSON-like format).
     */
    public String toStructuredLog() {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"timestamp\":\"").append(timestamp).append("\",");
        sb.append("\"user\":{");
        sb.append("\"id\":\"").append(userId != null ? userId : "").append("\",");
        sb.append("\"email\":\"").append(userEmail != null ? userEmail : "").append("\",");
        sb.append("\"name\":\"").append(userName != null ? userName : "").append("\"");
        sb.append("},");
        sb.append("\"action\":{");
        sb.append("\"type\":\"").append(actionType).append("\",");
        sb.append("\"operation\":\"").append(operationType).append("\",");
        sb.append("\"class\":\"").append(className != null ? className : "").append("\",");
        sb.append("\"method\":\"").append(methodName != null ? methodName : "").append("\"");
        sb.append("},");
        sb.append("\"target\":{");
        sb.append("\"entity\":\"").append(entityType).append("\",");
        sb.append("\"id\":\"").append(entityId != null ? entityId : "").append("\"");
        sb.append("},");
        if (entityType == EntityType.PRODUCT && productPrice != null) {
            sb.append("\"context\":{");
            sb.append("\"productName\":\"").append(productName != null ? productName : "").append("\",");
            sb.append("\"price\":").append(productPrice);
            sb.append("},");
        }
        sb.append("\"result\":{");
        sb.append("\"successful\":").append(successful);
        if (details != null) {
            sb.append(",\"details\":\"").append(details).append("\"");
        }
        if (errorMessage != null) {
            sb.append(",\"error\":\"").append(errorMessage).append("\"");
        }
        sb.append("}");
        sb.append("}");
        return sb.toString();
    }
}
