package fr.umontpellier.injectlog4j.output;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.logging.log4j.Level;

/**
 * Log output that writes to the terminal/console using Log4J2.
 * 
 * <p>
 * This output uses the Log4J2 configuration from the consuming project.
 * The logger name can be configured in logging.rules.yaml to reference
 * any logger defined in the project's log4j2.xml.
 * </p>
 * 
 * <p>
 * Example: If your project's log4j2.xml defines:
 * </p>
 * 
 * <pre>
 * &lt;Logger name="com.example.business" level="info"&gt;
 *   &lt;AppenderRef ref="BusinessAppender"/&gt;
 * &lt;/Logger&gt;
 * </pre>
 * 
 * <p>
 * You can reference it in logging.rules.yaml:
 * </p>
 * 
 * <pre>
 * loggers:
 *   business:
 *     output: terminal
 *     log4jLogger: com.example.business
 * </pre>
 */
public class TerminalOutput implements LogOutput {

    private final Logger logger;
    private final String loggerName;

    /**
     * Create a TerminalOutput with a specific Log4J2 logger name.
     * The logger name should match a logger defined in the project's log4j2.xml.
     * 
     * @param loggerName the Log4J2 logger name from the project's configuration
     */
    public TerminalOutput(String loggerName) {
        this.loggerName = loggerName;
        this.logger = LogManager.getLogger(loggerName);
    }

    /**
     * Create a TerminalOutput with the default InjectLog4J logger.
     * This uses Log4J2's default configuration from the consuming project.
     */
    public TerminalOutput() {
        this("InjectLog4J");
    }

    @Override
    public void log(String level, String message) {
        Level log4jLevel = Level.toLevel(level, Level.INFO);
        logger.log(log4jLevel, message);
    }

    @Override
    public void close() {
        // Nothing to close for terminal output
    }

    /**
     * Get the logger name being used.
     * 
     * @return the Log4J2 logger name
     */
    public String getLoggerName() {
        return loggerName;
    }
}
