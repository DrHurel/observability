package fr.umontpellier.injectlog4j.output;

/**
 * Interface for log output destinations.
 */
public interface LogOutput {

    /**
     * Write a log message.
     * 
     * @param level   the log level (INFO, WARN, ERROR, DEBUG, TRACE)
     * @param message the formatted message
     */
    void log(String level, String message);

    /**
     * Close this output and release resources.
     */
    void close();
}
