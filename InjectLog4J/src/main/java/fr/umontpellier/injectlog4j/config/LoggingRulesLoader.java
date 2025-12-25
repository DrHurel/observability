package fr.umontpellier.injectlog4j.config;

import org.yaml.snakeyaml.Yaml;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Loader for the logging.rules.yaml configuration file.
 */
public class LoggingRulesLoader {

    private static final String DEFAULT_CONFIG_FILE = "logging.rules.yaml";

    private LoggingRulesLoader() {
        // Utility class - prevent instantiation
    }

    /**
     * Load the logging rules from the default location (classpath).
     * 
     * @return the loaded configuration
     * @throws IOException if the file cannot be read
     */
    public static LoggingRulesConfig load() throws IOException {
        return loadFromClasspath(DEFAULT_CONFIG_FILE);
    }

    /**
     * Load the logging rules from a specific classpath resource.
     * 
     * @param resourceName the resource name
     * @return the loaded configuration
     * @throws IOException if the file cannot be read
     */
    public static LoggingRulesConfig loadFromClasspath(String resourceName) throws IOException {
        try (InputStream is = LoggingRulesLoader.class.getClassLoader().getResourceAsStream(resourceName)) {
            if (is == null) {
                throw new IOException("Resource not found: " + resourceName);
            }
            return parseYaml(is);
        }
    }

    /**
     * Load the logging rules from a file path.
     * 
     * @param path the file path
     * @return the loaded configuration
     * @throws IOException if the file cannot be read
     */
    public static LoggingRulesConfig loadFromFile(Path path) throws IOException {
        try (InputStream is = Files.newInputStream(path)) {
            return parseYaml(is);
        }
    }

    /**
     * Parse the YAML configuration from an input stream.
     */
    @SuppressWarnings("unchecked")
    private static LoggingRulesConfig parseYaml(InputStream is) {
        Yaml yaml = new Yaml();
        Map<String, Object> data = yaml.load(is);

        LoggingRulesConfig config = new LoggingRulesConfig();

        // Parse loggers
        if (data.containsKey("loggers")) {
            Map<String, Map<String, Object>> loggersData = (Map<String, Map<String, Object>>) data.get("loggers");
            Map<String, LoggerConfig> loggers = new HashMap<>();

            for (Map.Entry<String, Map<String, Object>> entry : loggersData.entrySet()) {
                LoggerConfig loggerConfig = new LoggerConfig();
                Map<String, Object> loggerData = entry.getValue();

                if (loggerData.containsKey("output")) {
                    loggerConfig.setOutput((String) loggerData.get("output"));
                }
                if (loggerData.containsKey("format")) {
                    loggerConfig.setFormat((String) loggerData.get("format"));
                }
                if (loggerData.containsKey("topic")) {
                    loggerConfig.setTopic((String) loggerData.get("topic"));
                }
                if (loggerData.containsKey("bootstrapServers")) {
                    loggerConfig.setBootstrapServers((String) loggerData.get("bootstrapServers"));
                }
                if (loggerData.containsKey("log4jLogger")) {
                    loggerConfig.setLog4jLogger((String) loggerData.get("log4jLogger"));
                }

                loggers.put(entry.getKey(), loggerConfig);
            }
            config.setLoggers(loggers);
        }

        // Parse rules
        if (data.containsKey("rules")) {
            List<Map<String, Object>> rulesData = (List<Map<String, Object>>) data.get("rules");
            List<LoggingRule> rules = new ArrayList<>();

            for (Map<String, Object> ruleData : rulesData) {
                LoggingRule rule = new LoggingRule();

                if (ruleData.containsKey("target")) {
                    rule.setTarget((String) ruleData.get("target"));
                }
                if (ruleData.containsKey("criticality")) {
                    rule.setCriticality((String) ruleData.get("criticality"));
                }
                if (ruleData.containsKey("why")) {
                    rule.setWhy((List<String>) ruleData.get("why"));
                }
                if (ruleData.containsKey("message")) {
                    rule.setMessage((String) ruleData.get("message"));
                }
                if (ruleData.containsKey("logger")) {
                    rule.setLogger((String) ruleData.get("logger"));
                }

                rules.add(rule);
            }
            config.setRules(rules);
        }

        return config;
    }
}
