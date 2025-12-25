package fr.umontpellier.injectlog4j.action;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * Represents a parsed user action from method invocations.
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

    public UserAction() {
        this.timestamp = LocalDateTime.now();
        this.successful = true;
    }

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
        PRODUCT,
        UNKNOWN
    }

    // Getters and Setters
    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public ActionType getActionType() {
        return actionType;
    }

    public void setActionType(ActionType actionType) {
        this.actionType = actionType;
    }

    public OperationType getOperationType() {
        return operationType;
    }

    public void setOperationType(OperationType operationType) {
        this.operationType = operationType;
    }

    public String getMethodName() {
        return methodName;
    }

    public void setMethodName(String methodName) {
        this.methodName = methodName;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public EntityType getEntityType() {
        return entityType;
    }

    public void setEntityType(EntityType entityType) {
        this.entityType = entityType;
    }

    public String getEntityId() {
        return entityId;
    }

    public void setEntityId(String entityId) {
        this.entityId = entityId;
    }

    public Double getProductPrice() {
        return productPrice;
    }

    public void setProductPrice(Double productPrice) {
        this.productPrice = productPrice;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public boolean isSuccessful() {
        return successful;
    }

    public void setSuccessful(boolean successful) {
        this.successful = successful;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    /**
     * Create an LPS Builder for fluent action construction.
     */
    public static LPSBuilder lpsBuilder() {
        return new LPSBuilder();
    }

    /**
     * Builder class for LPS construction.
     * Allows building the action from separate components.
     */
    public static class LPSBuilder {
        private final UserAction action;

        public LPSBuilder() {
            this.action = new UserAction();
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
         * Set product context (for product-related operations).
         */
        public LPSBuilder withProductContext(String productName, Double price) {
            this.action.setProductName(productName);
            this.action.setProductPrice(price);
            return this;
        }

        /**
         * Set operation result.
         */
        public LPSBuilder withResult(boolean successful, String errorMessage) {
            this.action.setSuccessful(successful);
            this.action.setErrorMessage(errorMessage);
            return this;
        }

        /**
         * Set additional details.
         */
        public LPSBuilder withDetails(String details) {
            this.action.setDetails(details);
            return this;
        }

        /**
         * Build the UserAction.
         */
        public UserAction build() {
            return this.action;
        }
    }

    /**
     * Convert to a structured log string (LPS format).
     */
    public String toStructuredLog() {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"timestamp\":\"")
                .append(timestamp != null ? timestamp.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : "null")
                .append("\"");

        if (userId != null)
            sb.append(",\"userId\":\"").append(userId).append("\"");
        if (userEmail != null)
            sb.append(",\"userEmail\":\"").append(userEmail).append("\"");
        if (userName != null)
            sb.append(",\"userName\":\"").append(userName).append("\"");

        if (actionType != null)
            sb.append(",\"actionType\":\"").append(actionType.name()).append("\"");
        if (operationType != null)
            sb.append(",\"operationType\":\"").append(operationType.name()).append("\"");
        if (className != null)
            sb.append(",\"className\":\"").append(className).append("\"");
        if (methodName != null)
            sb.append(",\"methodName\":\"").append(methodName).append("\"");

        if (entityType != null)
            sb.append(",\"entityType\":\"").append(entityType.name()).append("\"");
        if (entityId != null)
            sb.append(",\"entityId\":\"").append(entityId).append("\"");

        if (productName != null)
            sb.append(",\"productName\":\"").append(productName).append("\"");
        if (productPrice != null)
            sb.append(",\"productPrice\":").append(productPrice);

        sb.append(",\"successful\":").append(successful);
        if (errorMessage != null)
            sb.append(",\"errorMessage\":\"").append(errorMessage).append("\"");
        if (details != null)
            sb.append(",\"details\":\"").append(details).append("\"");

        sb.append("}");
        return sb.toString();
    }

    /**
     * Convert to a Map for serialization.
     */
    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("timestamp", timestamp != null ? timestamp.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null);
        map.put("userId", userId);
        map.put("userEmail", userEmail);
        map.put("userName", userName);
        map.put("actionType", actionType != null ? actionType.name() : null);
        map.put("operationType", operationType != null ? operationType.name() : null);
        map.put("className", className);
        map.put("methodName", methodName);
        map.put("entityType", entityType != null ? entityType.name() : null);
        map.put("entityId", entityId);
        map.put("productName", productName);
        map.put("productPrice", productPrice);
        map.put("successful", successful);
        map.put("errorMessage", errorMessage);
        map.put("details", details);
        return map;
    }

    @Override
    public String toString() {
        return toStructuredLog();
    }
}
