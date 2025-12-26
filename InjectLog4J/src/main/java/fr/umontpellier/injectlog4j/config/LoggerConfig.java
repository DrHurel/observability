package fr.umontpellier.injectlog4j.config;

import java.util.ArrayList;
import java.util.List;

/**
 * Configuration for a logger output.
 * 
 * <p>
 * When using terminal/console output, the library uses the Log4J2 configuration
 * from the consuming project. The {@code log4jLogger} property specifies which
 * logger name to use from the project's log4j2.xml configuration.
 * </p>
 * 
 * <p>
 * Supports multiple output destinations via the {@code files} property for
 * writing logs to multiple files simultaneously.
 * </p>
 * 
 * <p>
 * Example in logging.rules.yaml:
 * </p>
 * 
 * <pre>
 * loggers:
 *   business:
 *     output: terminal
 *     log4jLogger: com.example.business  # References logger from project's log4j2.xml
 *     format: "{{time}} {{message}}"
 *     category: business  # Category: system or business
 *     files:
 *       - path: logs/business.log
 *         format: "{{time}} [{{level}}] {{message}}"
 *       - path: logs/all.log
 *         format: "{{time}} [{{category}}] {{message}}"
 * </pre>
 */
public class LoggerConfig {

    private String output;
    private String format;
    private String log4jLogger; // Log4J2 logger name from project's configuration
    private String topic; // For Kafka output
    private String bootstrapServers; // For Kafka output
    private String category; // Logger category: system, business
    private List<FileConfig> files; // Multiple file outputs

    /**
     * Configuration for a file output destination.
     */
    public static class FileConfig {
        private String path;
        private String format;
        private boolean append = true;
        private String maxSize;
        private int maxFiles = 10;

        public FileConfig() {
        }

        public FileConfig(String path, String format) {
            this.path = path;
            this.format = format;
        }

        public String getPath() {
            return path;
        }

        public void setPath(String path) {
            this.path = path;
        }

        public String getFormat() {
            return format;
        }

        public void setFormat(String format) {
            this.format = format;
        }

        public boolean isAppend() {
            return append;
        }

        public void setAppend(boolean append) {
            this.append = append;
        }

        public String getMaxSize() {
            return maxSize;
        }

        public void setMaxSize(String maxSize) {
            this.maxSize = maxSize;
        }

        public int getMaxFiles() {
            return maxFiles;
        }

        public void setMaxFiles(int maxFiles) {
            this.maxFiles = maxFiles;
        }

        @Override
        public String toString() {
            return "FileConfig{" +
                    "path='" + path + '\'' +
                    ", format='" + format + '\'' +
                    ", append=" + append +
                    ", maxSize='" + maxSize + '\'' +
                    ", maxFiles=" + maxFiles +
                    '}';
        }
    }

    public LoggerConfig() {
        this.files = new ArrayList<>();
    }

    public LoggerConfig(String output, String format) {
        this.output = output;
        this.format = format;
        this.files = new ArrayList<>();
    }

    public LoggerConfig(String output, String format, String log4jLogger) {
        this.output = output;
        this.format = format;
        this.log4jLogger = log4jLogger;
        this.files = new ArrayList<>();
    }

    /**
     * Get the Log4J2 logger name to use from the project's configuration.
     * If not specified, a default logger will be used.
     * 
     * @return the Log4J2 logger name
     */
    public String getLog4jLogger() {
        return log4jLogger;
    }

    /**
     * Set the Log4J2 logger name from the project's log4j2.xml configuration.
     * 
     * @param log4jLogger the logger name (e.g., "com.example.MyLogger")
     */
    public void setLog4jLogger(String log4jLogger) {
        this.log4jLogger = log4jLogger;
    }

    public String getOutput() {
        return output;
    }

    public void setOutput(String output) {
        this.output = output;
    }

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public List<FileConfig> getFiles() {
        return files;
    }

    public void setFiles(List<FileConfig> files) {
        this.files = files != null ? files : new ArrayList<>();
    }

    public void addFile(FileConfig fileConfig) {
        if (this.files == null) {
            this.files = new ArrayList<>();
        }
        this.files.add(fileConfig);
    }

    public boolean hasFileOutputs() {
        return files != null && !files.isEmpty();
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public String getBootstrapServers() {
        return bootstrapServers;
    }

    public void setBootstrapServers(String bootstrapServers) {
        this.bootstrapServers = bootstrapServers;
    }

    @Override
    public String toString() {
        return "LoggerConfig{" +
                "output='" + output + '\'' +
                ", format='" + format + '\'' +
                ", log4jLogger='" + log4jLogger + '\'' +
                ", category='" + category + '\'' +
                ", files=" + files +
                ", topic='" + topic + '\'' +
                ", bootstrapServers='" + bootstrapServers + '\'' +
                '}';
    }
}
