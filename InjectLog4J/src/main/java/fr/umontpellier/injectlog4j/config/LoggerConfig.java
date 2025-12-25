package fr.umontpellier.injectlog4j.config;

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
 * Example in logging.rules.yaml:
 * </p>
 * 
 * <pre>
 * loggers:
 *   business:
 *     output: terminal
 *     log4jLogger: com.example.business  # References logger from project's log4j2.xml
 *     format: "{{time}} {{message}}"
 * </pre>
 */
public class LoggerConfig {

    private String output;
    private String format;
    private String log4jLogger; // Log4J2 logger name from project's configuration
    private String topic; // For Kafka output
    private String bootstrapServers; // For Kafka output

    public LoggerConfig() {
    }

    public LoggerConfig(String output, String format) {
        this.output = output;
        this.format = format;
    }

    public LoggerConfig(String output, String format, String log4jLogger) {
        this.output = output;
        this.format = format;
        this.log4jLogger = log4jLogger;
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
                ", topic='" + topic + '\'' +
                ", bootstrapServers='" + bootstrapServers + '\'' +
                '}';
    }
}
