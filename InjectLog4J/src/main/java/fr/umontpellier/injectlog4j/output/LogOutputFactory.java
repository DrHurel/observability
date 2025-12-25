package fr.umontpellier.injectlog4j.output;

import fr.umontpellier.injectlog4j.config.LoggerConfig;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Factory for creating LogOutput instances based on configuration.
 * 
 * <p>
 * Follows Open/Closed Principle - new output types can be registered
 * without modifying this class.
 * </p>
 * 
 * <p>
 * For terminal/console output, this factory uses the Log4J2 configuration
 * from the consuming project. The logger name can be specified in the
 * {@code log4jLogger} property of the logger configuration.
 * </p>
 */
public class LogOutputFactory {

    private static final String DEFAULT_KAFKA_SERVERS = "localhost:9092";
    private static final String DEFAULT_KAFKA_TOPIC = "logs";
    private static final String DEFAULT_LOG4J_LOGGER = "InjectLog4J";
    private static final String DEFAULT_OUTPUT_TYPE = "terminal";

    /**
     * Registry of output providers, keyed by output type name.
     * Follows Open/Closed Principle - new providers can be added via register().
     */
    private static final Map<String, LogOutputProvider> providers = new ConcurrentHashMap<>();

    static {
        // Register built-in output providers
        registerBuiltInProviders();
    }

    private LogOutputFactory() {
        // Utility class - no instantiation
    }

    private static void registerBuiltInProviders() {
        // Terminal/Console output using Log4J2
        LogOutputProvider terminalProvider = (loggerName, config) -> {
            String log4jLoggerName = getLog4jLoggerName(loggerName, config);
            return new TerminalOutput(log4jLoggerName);
        };
        register(DEFAULT_OUTPUT_TYPE, terminalProvider);
        register("console", terminalProvider);
        register("log4j", terminalProvider);
        register("log4j2", terminalProvider);

        // Kafka output
        register("kafka", (loggerName, config) -> {
            String servers = config != null && config.getBootstrapServers() != null
                    ? config.getBootstrapServers()
                    : DEFAULT_KAFKA_SERVERS;
            String topic = config != null && config.getTopic() != null
                    ? config.getTopic()
                    : DEFAULT_KAFKA_TOPIC;
            return new KafkaOutput(servers, topic);
        });
    }

    private static String getLog4jLoggerName(String loggerName, LoggerConfig config) {
        if (config != null) {
            String log4jLoggerName = config.getLog4jLogger();
            if (log4jLoggerName != null && !log4jLoggerName.isBlank()) {
                return log4jLoggerName;
            }
        }
        if (loggerName != null && !loggerName.isBlank()) {
            return loggerName;
        }
        return DEFAULT_LOG4J_LOGGER;
    }

    /**
     * Register a new output provider.
     * Follows Open/Closed Principle - extends factory without modification.
     *
     * @param outputType the output type name (e.g., "kafka", "elasticsearch")
     * @param provider   the provider implementation
     */
    public static void register(String outputType, LogOutputProvider provider) {
        if (outputType == null || provider == null) {
            throw new IllegalArgumentException("Output type and provider cannot be null");
        }
        providers.put(outputType.toLowerCase(), provider);
    }

    /**
     * Unregister an output provider.
     *
     * @param outputType the output type name to remove
     */
    public static void unregister(String outputType) {
        if (outputType != null) {
            providers.remove(outputType.toLowerCase());
        }
    }

    /**
     * Check if an output type is registered.
     *
     * @param outputType the output type name
     * @return true if the output type is registered
     */
    public static boolean isRegistered(String outputType) {
        return outputType != null && providers.containsKey(outputType.toLowerCase());
    }

    /**
     * Create a LogOutput based on the logger configuration.
     * 
     * <p>
     * For terminal output, the Log4J2 logger is resolved in this order:
     * </p>
     * <ol>
     * <li>{@code log4jLogger} property from config (references project's
     * log4j2.xml)</li>
     * <li>The logger name from logging.rules.yaml</li>
     * <li>Default "InjectLog4J" logger</li>
     * </ol>
     * 
     * @param loggerName the name of the logger from logging.rules.yaml
     * @param config     the logger configuration
     * @return the appropriate LogOutput instance
     */
    public static LogOutput create(String loggerName, LoggerConfig config) {
        String outputType = getOutputType(config);
        LogOutputProvider provider = providers.get(outputType);

        if (provider == null) {
            // Fallback to terminal if unknown output type
            provider = providers.get(DEFAULT_OUTPUT_TYPE);
        }

        if (provider == null) {
            // Ultimate fallback - should never happen with built-in providers
            return new TerminalOutput(DEFAULT_LOG4J_LOGGER);
        }

        return provider.create(loggerName, config);
    }

    private static String getOutputType(LoggerConfig config) {
        if (config == null || config.getOutput() == null) {
            return DEFAULT_OUTPUT_TYPE;
        }
        return config.getOutput().toLowerCase();
    }
}
