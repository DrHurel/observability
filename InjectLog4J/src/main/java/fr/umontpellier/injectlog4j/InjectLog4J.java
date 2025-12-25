package fr.umontpellier.injectlog4j;

import fr.umontpellier.injectlog4j.config.LoggingRulesConfig;
import fr.umontpellier.injectlog4j.config.LoggingRulesLoader;
import fr.umontpellier.injectlog4j.processor.SpoonProjectProcessor;
import fr.umontpellier.injectlog4j.runtime.LogInjector;

import java.io.IOException;
import java.nio.file.Path;

/**
 * Main entry point for the InjectLog4J library.
 * 
 * <p>
 * This library provides automatic logging injection using Spoon for source code
 * transformation.
 * Methods annotated with {@code @InjectLog} will have logging code injected
 * based on rules
 * defined in {@code logging.rules.yaml}.
 * </p>
 * 
 * <h2>Usage:</h2>
 * <ol>
 * <li>Add the {@code @InjectLog} annotation to methods or classes</li>
 * <li>Create a {@code logging.rules.yaml} file in your resources</li>
 * <li>Run the Spoon processor during build or use the Maven plugin</li>
 * </ol>
 * 
 * <h2>Example logging.rules.yaml:</h2>
 * 
 * <pre>
 * loggers:
 *   business:
 *     output: kafka
 *     format: "{{time}} {{message}}"
 *   system:
 *     output: terminal
 *     format: "{{time}} {{message}}"
 * 
 * rules:
 *   - target: com.example.MyClass.myMethod
 *     criticality: INFO
 *     why: [OnException, OnReturn]
 *     message: "Processing completed with value: {{value}}"
 *     logger: system
 * </pre>
 */
public class InjectLog4J {

    private static final SpoonProjectProcessor PROJECT_PROCESSOR = new SpoonProjectProcessor();

    private InjectLog4J() {
        // Utility class - prevent instantiation
    }

    /**
     * Initialize the InjectLog4J runtime with default configuration.
     * This loads the logging.rules.yaml from the classpath.
     */
    public static void initialize() {
        LogInjector.getInstance();
    }

    /**
     * Initialize the InjectLog4J runtime with a custom configuration.
     * 
     * @param config the logging rules configuration
     */
    public static void initialize(LoggingRulesConfig config) {
        LogInjector.initialize(config);
    }

    /**
     * Initialize the InjectLog4J runtime from a configuration file.
     * 
     * @param configPath the path to the logging.rules.yaml file
     * @throws IOException if the configuration file cannot be read
     */
    public static void initialize(Path configPath) throws IOException {
        LoggingRulesConfig config = LoggingRulesLoader.loadFromFile(configPath);
        LogInjector.initialize(config);
    }

    /**
     * Process source files and inject logging code.
     * This is typically called during build time.
     * 
     * @param inputPath  the path to the source files
     * @param outputPath the path to output the transformed files
     * @throws java.io.IOException if the configuration cannot be read
     */
    public static void processProject(Path inputPath, Path outputPath) throws java.io.IOException {
        PROJECT_PROCESSOR.process(inputPath, outputPath);
    }

    /**
     * Process source files with a custom configuration file.
     * 
     * @param inputPath  the path to the source files
     * @param outputPath the path to output the transformed files
     * @param configPath the path to the logging.rules.yaml file
     * @throws java.io.IOException if the configuration cannot be read
     */
    public static void processProject(Path inputPath, Path outputPath, Path configPath) throws java.io.IOException {
        LoggingRulesConfig config = configPath != null
                ? LoggingRulesLoader.loadFromFile(configPath)
                : LoggingRulesLoader.load();
        PROJECT_PROCESSOR.process(inputPath, outputPath, config);
    }

    /**
     * Shutdown the InjectLog4J runtime and release resources.
     */
    public static void shutdown() {
        LogInjector.getInstance().shutdown();
    }

    /**
     * Get the runtime LogInjector instance.
     * 
     * @return the LogInjector instance
     */
    public static LogInjector getInjector() {
        return LogInjector.getInstance();
    }
}
