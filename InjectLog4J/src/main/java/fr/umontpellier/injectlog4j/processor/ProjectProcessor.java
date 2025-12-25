package fr.umontpellier.injectlog4j.processor;

import fr.umontpellier.injectlog4j.config.LoggingRulesConfig;

import java.io.IOException;
import java.nio.file.Path;

/**
 * Interface for processing source code projects.
 * Follows the Dependency Inversion Principle - high-level modules
 * depend on this abstraction rather than concrete implementations.
 */
public interface ProjectProcessor {

    /**
     * Process a project directory.
     *
     * @param inputPath  the path to the source files
     * @param outputPath the path to output the transformed files
     * @throws IOException if an I/O error occurs
     */
    void process(Path inputPath, Path outputPath) throws IOException;

    /**
     * Process a project directory with a custom configuration.
     *
     * @param inputPath  the path to the source files
     * @param outputPath the path to output the transformed files
     * @param config     the logging rules configuration
     * @throws IOException if an I/O error occurs
     */
    void process(Path inputPath, Path outputPath, LoggingRulesConfig config) throws IOException;
}
