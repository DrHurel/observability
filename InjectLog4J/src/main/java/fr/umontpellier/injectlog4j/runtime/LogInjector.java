package fr.umontpellier.injectlog4j.runtime;

import fr.umontpellier.injectlog4j.config.LoggerConfig;
import fr.umontpellier.injectlog4j.config.LoggingRule;
import fr.umontpellier.injectlog4j.config.LoggingRulesConfig;
import fr.umontpellier.injectlog4j.config.LoggingRulesLoader;
import fr.umontpellier.injectlog4j.formatter.MessageFormatter;
import fr.umontpellier.injectlog4j.output.LogOutput;
import fr.umontpellier.injectlog4j.output.LogOutputFactory;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Runtime log injector that processes log events based on the configuration.
 * This class is used by the injected code at runtime.
 * Uses the Initialization-on-demand holder idiom for thread-safe lazy
 * initialization.
 */
public class LogInjector {

    private static final Logger LOGGER = LogManager.getLogger(LogInjector.class);
    private static final String MESSAGE_KEY = "message";

    private final LoggingRulesConfig config;
    private final Map<String, LogOutput> outputs = new ConcurrentHashMap<>();
    private final Map<String, MessageFormatter> formatters = new ConcurrentHashMap<>();

    /**
     * Holder class for lazy initialization (thread-safe).
     */
    private static final class InstanceHolder {
        private static final LogInjector INSTANCE = createInstance();

        private static LogInjector createInstance() {
            try {
                LoggingRulesConfig config = LoggingRulesLoader.load();
                return new LogInjector(config);
            } catch (IOException e) {
                LOGGER.error("Failed to load logging rules: {}", e.getMessage());
                return new LogInjector(new LoggingRulesConfig());
            }
        }
    }

    private static LogInjector customInstance;
    private static final Object lock = new Object();

    private LogInjector(LoggingRulesConfig config) {
        this.config = config;
        initializeOutputs();
    }

    /**
     * Get the singleton instance of the LogInjector.
     */
    public static LogInjector getInstance() {
        synchronized (lock) {
            if (customInstance != null) {
                return customInstance;
            }
        }
        return InstanceHolder.INSTANCE;
    }

    /**
     * Initialize with a custom configuration (for testing).
     */
    public static void initialize(LoggingRulesConfig config) {
        synchronized (lock) {
            if (customInstance != null) {
                customInstance.shutdown();
            }
            customInstance = new LogInjector(config);
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

    private void initializeOutputs() {
        if (config.getLoggers() != null) {
            for (Map.Entry<String, LoggerConfig> entry : config.getLoggers().entrySet()) {
                String name = entry.getKey();
                LoggerConfig loggerConfig = entry.getValue();

                outputs.put(name, LogOutputFactory.create(name, loggerConfig));
                formatters.put(name, new MessageFormatter(loggerConfig.getFormat()));
            }
        }
    }

    /**
     * Log a method entry event.
     * 
     * @param target     the method identifier (class.method or annotation id)
     * @param className  the class name
     * @param methodName the method name
     * @param args       the method arguments
     */
    public void logEntry(String target, String className, String methodName, Object[] args) {
        LoggingRule rule = config.findRule(target);
        if (rule == null || !rule.triggersOnEntry()) {
            return;
        }

        Map<String, Object> context = createContext(className, methodName, args);
        context.put(MESSAGE_KEY, rule.getMessage());

        log(rule, context);
    }

    /**
     * Log a method return event.
     * 
     * @param target      the method identifier
     * @param className   the class name
     * @param methodName  the method name
     * @param args        the method arguments
     * @param returnValue the return value
     */
    public void logReturn(String target, String className, String methodName, Object[] args, Object returnValue) {
        LoggingRule rule = config.findRule(target);
        if (rule == null || !rule.triggersOnReturn()) {
            return;
        }

        Map<String, Object> context = createContext(className, methodName, args);
        context.put(MESSAGE_KEY, rule.getMessage());
        context.put("value", returnValue);

        log(rule, context);
    }

    /**
     * Log an exception event.
     * 
     * @param target     the method identifier
     * @param className  the class name
     * @param methodName the method name
     * @param args       the method arguments
     * @param exception  the exception that was thrown
     */
    public void logException(String target, String className, String methodName, Object[] args, Throwable exception) {
        LoggingRule rule = config.findRule(target);
        if (rule == null || !rule.triggersOnException()) {
            return;
        }

        Map<String, Object> context = createContext(className, methodName, args);
        context.put(MESSAGE_KEY, rule.getMessage());
        context.put("exception", exception);
        context.put("value", exception.getMessage());

        log(rule, context);
    }

    private Map<String, Object> createContext(String className, String methodName, Object[] args) {
        Map<String, Object> context = new HashMap<>();
        context.put("class", className);
        context.put("method", methodName);
        context.put("args", args);
        return context;
    }

    private void log(LoggingRule rule, Map<String, Object> context) {
        String loggerName = rule.getLogger();

        LogOutput output = outputs.get(loggerName);
        MessageFormatter formatter = formatters.get(loggerName);

        if (output == null) {
            output = LogOutputFactory.create(loggerName, null);
            outputs.put(loggerName, output);
        }

        if (formatter == null) {
            LoggerConfig loggerConfig = config.getLogger(loggerName);
            String format = loggerConfig != null ? loggerConfig.getFormat() : null;
            formatter = new MessageFormatter(format);
            formatters.put(loggerName, formatter);
        }

        String formattedMessage = formatter.format(context);
        output.log(rule.getCriticality(), formattedMessage);
    }

    /**
     * Shutdown and release all resources.
     */
    public void shutdown() {
        for (LogOutput output : outputs.values()) {
            output.close();
        }
        outputs.clear();
        formatters.clear();
    }
}
