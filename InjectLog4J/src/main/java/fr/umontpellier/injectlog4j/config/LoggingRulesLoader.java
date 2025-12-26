package fr.umontpellier.injectlog4j.config;

import org.yaml.snakeyaml.Yaml;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.FileSystem;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

/**
 * Loader for the logging.rules.yaml configuration files.
 * Supports loading multiple *.logging.rules.yaml files and merging them.
 */
public class LoggingRulesLoader {

    private static final String RULES_FILE_SUFFIX = ".logging.rules.yaml";
    private static final String LEGACY_CONFIG_FILE = "logging.rules.yaml";

    private LoggingRulesLoader() {
        // Utility class - prevent instantiation
    }

    /**
     * Load all logging rules from *.logging.rules.yaml files in classpath.
     * Also loads the legacy logging.rules.yaml if present.
     * 
     * @return the merged configuration
     * @throws IOException if files cannot be read
     */
    public static LoggingRulesConfig load() throws IOException {
        return loadAllFromClasspath();
    }

    /**
     * Load and merge all *.logging.rules.yaml files from the classpath.
     * 
     * @return the merged configuration
     * @throws IOException if files cannot be read
     */
    public static LoggingRulesConfig loadAllFromClasspath() throws IOException {
        LoggingRulesConfig mergedConfig = new LoggingRulesConfig();
        mergedConfig.setLoggers(new HashMap<>());
        mergedConfig.setRules(new ArrayList<>());

        List<String> resourceNames = findLoggingRulesResources();

        for (String resourceName : resourceNames) {
            try (InputStream is = LoggingRulesLoader.class.getClassLoader().getResourceAsStream(resourceName)) {
                if (is != null) {
                    LoggingRulesConfig config = parseYaml(is);
                    mergeConfigs(mergedConfig, config);
                }
            }
        }

        if (mergedConfig.getLoggers().isEmpty() && mergedConfig.getRules().isEmpty()) {
            throw new IOException(
                    "No logging rules configuration files found (*.logging.rules.yaml or logging.rules.yaml)");
        }

        return mergedConfig;
    }

    /**
     * Find all *.logging.rules.yaml resources in the classpath.
     */
    private static List<String> findLoggingRulesResources() throws IOException {
        List<String> resources = new ArrayList<>();
        ClassLoader classLoader = LoggingRulesLoader.class.getClassLoader();

        // Try to find resources from the root of the classpath
        try {
            Enumeration<URL> urls = classLoader.getResources("");
            while (urls.hasMoreElements()) {
                URL url = urls.nextElement();
                resources.addAll(findYamlFilesInUrl(url));
            }
        } catch (IOException e) {
            // Fallback: try specific known locations
        }

        // Also check legacy file
        if (classLoader.getResource(LEGACY_CONFIG_FILE) != null && !resources.contains(LEGACY_CONFIG_FILE)) {
            resources.add(LEGACY_CONFIG_FILE);
        }

        // Sort to ensure consistent loading order
        Collections.sort(resources);

        return resources;
    }

    /**
     * Find YAML files matching the pattern in a URL location.
     */
    private static List<String> findYamlFilesInUrl(URL url) {
        List<String> files = new ArrayList<>();

        try {
            if ("file".equals(url.getProtocol())) {
                Path path = Paths.get(url.toURI());
                if (Files.isDirectory(path)) {
                    try (Stream<Path> stream = Files.list(path)) {
                        stream.filter(p -> p.getFileName().toString().endsWith(RULES_FILE_SUFFIX))
                                .forEach(p -> files.add(p.getFileName().toString()));
                    }
                }
            } else if ("jar".equals(url.getProtocol())) {
                // Handle JAR files
                String jarPath = url.getPath();
                if (jarPath.contains("!")) {
                    String[] parts = jarPath.split("!");
                    try (FileSystem fs = FileSystems.newFileSystem(URI.create("jar:" + parts[0]),
                            Collections.emptyMap())) {
                        Path root = fs.getPath(parts.length > 1 ? parts[1] : "/");
                        try (Stream<Path> stream = Files.list(root)) {
                            stream.filter(p -> p.getFileName().toString().endsWith(RULES_FILE_SUFFIX))
                                    .forEach(p -> files.add(p.getFileName().toString()));
                        }
                    }
                }
            }
        } catch (IOException | URISyntaxException e) {
            // Ignore errors and continue
        }

        return files;
    }

    /**
     * Merge source configuration into target configuration.
     */
    private static void mergeConfigs(LoggingRulesConfig target, LoggingRulesConfig source) {
        if (source.getLoggers() != null) {
            target.getLoggers().putAll(source.getLoggers());
        }
        if (source.getRules() != null) {
            target.getRules().addAll(source.getRules());
        }
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
     * Load and merge all *.logging.rules.yaml files from a directory.
     * Also loads the legacy logging.rules.yaml if present.
     * 
     * @param directory the directory to scan
     * @return the merged configuration
     * @throws IOException if files cannot be read
     */
    public static LoggingRulesConfig loadAllFromDirectory(Path directory) throws IOException {
        LoggingRulesConfig mergedConfig = new LoggingRulesConfig();
        mergedConfig.setLoggers(new HashMap<>());
        mergedConfig.setRules(new ArrayList<>());

        if (!Files.isDirectory(directory)) {
            throw new IOException("Not a directory: " + directory);
        }

        List<Path> configFiles = new ArrayList<>();
        
        // Find all *.logging.rules.yaml files
        try (Stream<Path> stream = Files.list(directory)) {
            stream.filter(p -> p.getFileName().toString().endsWith(RULES_FILE_SUFFIX))
                  .forEach(configFiles::add);
        }

        // Also check for legacy file
        Path legacyFile = directory.resolve(LEGACY_CONFIG_FILE);
        if (Files.exists(legacyFile) && !configFiles.contains(legacyFile)) {
            configFiles.add(legacyFile);
        }

        // Sort for consistent loading order
        configFiles.sort((a, b) -> a.getFileName().toString().compareTo(b.getFileName().toString()));

        for (Path configFile : configFiles) {
            LoggingRulesConfig config = loadFromFile(configFile);
            mergeConfigs(mergedConfig, config);
        }

        if (mergedConfig.getLoggers().isEmpty() && mergedConfig.getRules().isEmpty()) {
            throw new IOException(
                    "No logging rules configuration files found in " + directory + 
                    " (*.logging.rules.yaml or logging.rules.yaml)");
        }

        return mergedConfig;
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
            config.setLoggers(parseLoggers(loggersData));
        }

        // Parse rules
        if (data.containsKey("rules")) {
            List<Map<String, Object>> rulesData = (List<Map<String, Object>>) data.get("rules");
            config.setRules(parseRules(rulesData));
        }

        return config;
    }

    /**
     * Parse loggers from YAML data.
     */
    private static Map<String, LoggerConfig> parseLoggers(Map<String, Map<String, Object>> loggersData) {
        Map<String, LoggerConfig> loggers = new HashMap<>();

        for (Map.Entry<String, Map<String, Object>> entry : loggersData.entrySet()) {
            LoggerConfig loggerConfig = parseLoggerConfig(entry.getValue());
            loggers.put(entry.getKey(), loggerConfig);
        }

        return loggers;
    }

    /**
     * Parse a single logger configuration.
     */
    @SuppressWarnings("unchecked")
    private static LoggerConfig parseLoggerConfig(Map<String, Object> loggerData) {
        LoggerConfig loggerConfig = new LoggerConfig();

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
        if (loggerData.containsKey("category")) {
            loggerConfig.setCategory((String) loggerData.get("category"));
        }
        if (loggerData.containsKey("files")) {
            List<Map<String, Object>> filesData = (List<Map<String, Object>>) loggerData.get("files");
            for (Map<String, Object> fileData : filesData) {
                loggerConfig.addFile(parseFileConfig(fileData));
            }
        }

        return loggerConfig;
    }

    /**
     * Parse a single file configuration.
     */
    private static LoggerConfig.FileConfig parseFileConfig(Map<String, Object> fileData) {
        LoggerConfig.FileConfig fileConfig = new LoggerConfig.FileConfig();

        if (fileData.containsKey("path")) {
            fileConfig.setPath((String) fileData.get("path"));
        }
        if (fileData.containsKey("format")) {
            fileConfig.setFormat((String) fileData.get("format"));
        }
        if (fileData.containsKey("append")) {
            fileConfig.setAppend((Boolean) fileData.get("append"));
        }
        if (fileData.containsKey("maxSize")) {
            fileConfig.setMaxSize((String) fileData.get("maxSize"));
        }
        if (fileData.containsKey("maxFiles")) {
            fileConfig.setMaxFiles((Integer) fileData.get("maxFiles"));
        }

        return fileConfig;
    }

    /**
     * Parse rules from YAML data.
     */
    private static List<LoggingRule> parseRules(List<Map<String, Object>> rulesData) {
        List<LoggingRule> rules = new ArrayList<>();

        for (Map<String, Object> ruleData : rulesData) {
            LoggingRule rule = parseLoggingRule(ruleData);
            rules.add(rule);
        }

        return rules;
    }

    /**
     * Parse a single logging rule.
     */
    @SuppressWarnings("unchecked")
    private static LoggingRule parseLoggingRule(Map<String, Object> ruleData) {
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

        return rule;
    }
}
