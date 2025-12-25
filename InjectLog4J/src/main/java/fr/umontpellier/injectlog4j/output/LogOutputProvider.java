package fr.umontpellier.injectlog4j.output;

import fr.umontpellier.injectlog4j.config.LoggerConfig;

/**
 * Functional interface for creating LogOutput instances.
 * Follows Interface Segregation Principle - single method for output creation.
 */
@FunctionalInterface
public interface LogOutputProvider {

    /**
     * Create a LogOutput instance with the given configuration.
     *
     * @param loggerName the name of the logger from logging.rules.yaml
     * @param config     the logger configuration
     * @return a new LogOutput instance
     */
    LogOutput create(String loggerName, LoggerConfig config);
}
