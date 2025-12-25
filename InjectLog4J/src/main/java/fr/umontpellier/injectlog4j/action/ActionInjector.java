package fr.umontpellier.injectlog4j.action;

import fr.umontpellier.injectlog4j.action.UserAction.ActionType;
import fr.umontpellier.injectlog4j.action.UserAction.EntityType;
import fr.umontpellier.injectlog4j.action.UserAction.OperationType;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

/**
 * Runtime action injector that records user actions for profiling.
 * This class is called by the code injected by InjectLog4J at compile time.
 * 
 * Uses the Initialization-on-demand holder idiom for thread-safe lazy
 * initialization.
 */
public class ActionInjector {

    private static final Logger LOGGER = LogManager.getLogger(ActionInjector.class);

    private final ActionRecorder recorder;
    private final ThreadLocal<UserContext> userContext;
    private final Map<String, OperationType> methodOperationMap;

    /**
     * User context holder for request-scoped user information.
     */
    public static class UserContext {
        private String userId;
        private String userEmail;
        private String userName;

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

        public void clear() {
            userId = null;
            userEmail = null;
            userName = null;
        }
    }

    /**
     * Holder class for lazy initialization (thread-safe).
     */
    private static final class InstanceHolder {
        private static final ActionInjector INSTANCE = createInstance();

        private static ActionInjector createInstance() {
            String recorderType = System.getenv("ACTION_RECORDER_TYPE");
            if (recorderType == null || recorderType.isEmpty()) {
                recorderType = System.getProperty("action.recorder.type", "kafka");
            }

            String recorderConfig = System.getenv("ACTION_RECORDER_CONFIG");
            if (recorderConfig == null || recorderConfig.isEmpty()) {
                recorderConfig = System.getProperty("action.recorder.config");
            }

            ActionRecorder recorder = ActionRecorderFactory.create(recorderType, recorderConfig);
            return new ActionInjector(recorder);
        }
    }

    private static ActionInjector customInstance;
    private static final Object lock = new Object();

    private ActionInjector(ActionRecorder recorder) {
        this.recorder = recorder;
        this.userContext = ThreadLocal.withInitial(UserContext::new);
        this.methodOperationMap = new ConcurrentHashMap<>();
        initializeMethodMappings();
    }

    /**
     * Get the singleton instance of ActionInjector.
     */
    public static ActionInjector getInstance() {
        synchronized (lock) {
            if (customInstance != null) {
                return customInstance;
            }
        }
        return InstanceHolder.INSTANCE;
    }

    /**
     * Initialize with a custom recorder (for testing).
     */
    public static void initialize(ActionRecorder recorder) {
        synchronized (lock) {
            if (customInstance != null) {
                customInstance.shutdown();
            }
            customInstance = new ActionInjector(recorder);
        }
    }

    /**
     * Reset to default instance (for testing).
     */
    public static void reset() {
        synchronized (lock) {
            if (customInstance != null) {
                customInstance.shutdown();
                customInstance = null;
            }
        }
    }

    private void initializeMethodMappings() {
        // Product operations
        methodOperationMap.put("getAllProducts", OperationType.GET_ALL);
        methodOperationMap.put("getProductById", OperationType.GET_BY_ID);
        methodOperationMap.put("addProduct", OperationType.CREATE);
        methodOperationMap.put("createProduct", OperationType.CREATE);
        methodOperationMap.put("updateProduct", OperationType.UPDATE);
        methodOperationMap.put("deleteProduct", OperationType.DELETE);

        // User operations
        methodOperationMap.put("getAllUsers", OperationType.GET_ALL);
        methodOperationMap.put("getUserById", OperationType.GET_BY_ID);
        methodOperationMap.put("getUserByEmail", OperationType.GET_BY_EMAIL);
        methodOperationMap.put("createUser", OperationType.CREATE);
        methodOperationMap.put("addUser", OperationType.CREATE);
        methodOperationMap.put("updateUser", OperationType.UPDATE);
        methodOperationMap.put("deleteUser", OperationType.DELETE);

        // Generic CRUD
        methodOperationMap.put("findAll", OperationType.GET_ALL);
        methodOperationMap.put("findById", OperationType.GET_BY_ID);
        methodOperationMap.put("save", OperationType.CREATE);
        methodOperationMap.put("update", OperationType.UPDATE);
        methodOperationMap.put("delete", OperationType.DELETE);
        methodOperationMap.put("deleteById", OperationType.DELETE);
    }

    /**
     * Set the current user context for this thread.
     */
    public void setUserContext(String userId, String userEmail, String userName) {
        UserContext ctx = userContext.get();
        ctx.setUserId(userId);
        ctx.setUserEmail(userEmail);
        ctx.setUserName(userName);
    }

    /**
     * Clear the current user context for this thread.
     */
    public void clearUserContext() {
        userContext.get().clear();
    }

    /**
     * Get the current user context.
     */
    public UserContext getCurrentUserContext() {
        return userContext.get();
    }

    /**
     * Record a method entry action.
     */
    public void recordEntry(String className, String methodName, Object[] args) {
        if (!recorder.isEnabled()) {
            return;
        }

        try {
            OperationType opType = determineOperationType(methodName);
            EntityType entityType = determineEntityType(className);
            UserContext ctx = userContext.get();

            UserAction action = UserAction.lpsBuilder()
                    .withTimestamp(LocalDateTime.now())
                    .withUser(ctx.getUserId(), ctx.getUserEmail(), ctx.getUserName())
                    .withAction(opType, className, methodName)
                    .withTarget(entityType, extractEntityId(args))
                    .withResult(true, null)
                    .build();

            recorder.recordAction(action);
            LOGGER.debug("Recorded entry action: {}", action.toStructuredLog());

        } catch (Exception e) {
            LOGGER.trace("Failed to record entry action: {}", e.getMessage());
        }
    }

    /**
     * Record a method return action with result.
     */
    public void recordReturn(String className, String methodName, Object[] args, Object result) {
        if (!recorder.isEnabled()) {
            return;
        }

        try {
            OperationType opType = determineOperationType(methodName);
            EntityType entityType = determineEntityType(className);
            UserContext ctx = userContext.get();

            String entityId = extractEntityId(args);
            Double productPrice = null;
            String productName = null;

            // Extract product details if applicable
            if (entityType == EntityType.PRODUCT && result != null) {
                productPrice = extractProductPrice(result);
                productName = extractProductName(result);
                if (entityId == null) {
                    entityId = extractEntityIdFromResult(result);
                }
            }

            UserAction action = UserAction.lpsBuilder()
                    .withTimestamp(LocalDateTime.now())
                    .withUser(ctx.getUserId(), ctx.getUserEmail(), ctx.getUserName())
                    .withAction(opType, className, methodName)
                    .withTarget(entityType, entityId)
                    .withProductContext(productName, productPrice)
                    .withResult(true, null)
                    .build();

            recorder.recordAction(action);
            LOGGER.debug("Recorded return action: {}", action.toStructuredLog());

        } catch (Exception e) {
            LOGGER.trace("Failed to record return action: {}", e.getMessage());
        }
    }

    /**
     * Record an exception action.
     */
    public void recordException(String className, String methodName, Object[] args, Throwable exception) {
        if (!recorder.isEnabled()) {
            return;
        }

        try {
            OperationType opType = determineOperationType(methodName);
            EntityType entityType = determineEntityType(className);
            UserContext ctx = userContext.get();

            UserAction action = UserAction.lpsBuilder()
                    .withTimestamp(LocalDateTime.now())
                    .withUser(ctx.getUserId(), ctx.getUserEmail(), ctx.getUserName())
                    .withAction(opType, className, methodName)
                    .withTarget(entityType, extractEntityId(args))
                    .withResult(false, exception.getMessage())
                    .build();

            recorder.recordAction(action);
            LOGGER.debug("Recorded exception action: {}", action.toStructuredLog());

        } catch (Exception e) {
            LOGGER.trace("Failed to record exception action: {}", e.getMessage());
        }
    }

    private OperationType determineOperationType(String methodName) {
        OperationType opType = methodOperationMap.get(methodName);
        if (opType != null) {
            return opType;
        }

        // Infer from method name patterns
        String lowerMethod = methodName.toLowerCase();
        if (lowerMethod.startsWith("get") || lowerMethod.startsWith("find") || lowerMethod.startsWith("fetch")) {
            return lowerMethod.contains("all") ? OperationType.GET_ALL : OperationType.GET_BY_ID;
        } else if (lowerMethod.startsWith("create") || lowerMethod.startsWith("add")
                || lowerMethod.startsWith("save")) {
            return OperationType.CREATE;
        } else if (lowerMethod.startsWith("update") || lowerMethod.startsWith("modify")
                || lowerMethod.startsWith("edit")) {
            return OperationType.UPDATE;
        } else if (lowerMethod.startsWith("delete") || lowerMethod.startsWith("remove")) {
            return OperationType.DELETE;
        } else if (lowerMethod.startsWith("search") || lowerMethod.startsWith("query")) {
            return OperationType.SEARCH;
        }

        return OperationType.GET_ALL; // Default
    }

    private EntityType determineEntityType(String className) {
        String lowerClass = className.toLowerCase();
        if (lowerClass.contains("product")) {
            return EntityType.PRODUCT;
        } else if (lowerClass.contains("user")) {
            return EntityType.USER;
        }
        return EntityType.UNKNOWN;
    }

    private String extractEntityId(Object[] args) {
        if (args == null || args.length == 0) {
            return null;
        }

        // First String argument is often the ID
        for (Object arg : args) {
            if (arg instanceof String) {
                return (String) arg;
            }
        }
        return null;
    }

    private String extractEntityIdFromResult(Object result) {
        if (result == null) {
            return null;
        }

        try {
            Method getId = result.getClass().getMethod("getId");
            Object id = getId.invoke(result);
            return id != null ? id.toString() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private Double extractProductPrice(Object result) {
        if (result == null) {
            return null;
        }

        try {
            Method getPrice = result.getClass().getMethod("getPrice");
            Object price = getPrice.invoke(result);
            if (price instanceof BigDecimal) {
                return ((BigDecimal) price).doubleValue();
            } else if (price instanceof Number) {
                return ((Number) price).doubleValue();
            }
        } catch (Exception e) {
            // Ignore
        }
        return null;
    }

    private String extractProductName(Object result) {
        if (result == null) {
            return null;
        }

        try {
            Method getName = result.getClass().getMethod("getName");
            Object name = getName.invoke(result);
            return name != null ? name.toString() : null;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Shutdown the action injector.
     */
    public void shutdown() {
        if (recorder != null) {
            recorder.shutdown();
        }
    }

    /**
     * Check if action recording is enabled.
     */
    public boolean isEnabled() {
        return recorder != null && recorder.isEnabled();
    }
}
