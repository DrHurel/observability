package fr.umontpellier.injectlog4j.processor;

import fr.umontpellier.injectlog4j.config.LoggingRulesConfig;
import fr.umontpellier.injectlog4j.config.LoggingRulesLoader;
import spoon.Launcher;

import java.io.IOException;
import java.nio.file.Path;

/**
 * Spoon-based implementation of ProjectProcessor.
 * 
 * Follows the Single Responsibility Principle - only responsible for
 * orchestrating the Spoon transformation pipeline.
 * 
 * Follows the Dependency Inversion Principle - depends on abstractions
 * (ProjectProcessor, CodeInjector) rather than concretions.
 */
public class SpoonProjectProcessor implements ProjectProcessor {

    private final int complianceLevel;
    private final boolean autoImports;
    private final boolean noClasspath;

    /**
     * Create a SpoonProjectProcessor with default settings.
     */
    public SpoonProjectProcessor() {
        this(21, true, true);
    }

    /**
     * Create a SpoonProjectProcessor with custom settings.
     *
     * @param complianceLevel the Java compliance level
     * @param autoImports     whether to auto-import classes
     * @param noClasspath     whether to run without classpath
     */
    public SpoonProjectProcessor(int complianceLevel, boolean autoImports, boolean noClasspath) {
        this.complianceLevel = complianceLevel;
        this.autoImports = autoImports;
        this.noClasspath = noClasspath;
    }

    @Override
    public void process(Path inputPath, Path outputPath) throws IOException {
        LoggingRulesConfig config = LoggingRulesLoader.load();
        process(inputPath, outputPath, config);
    }

    @Override
    public void process(Path inputPath, Path outputPath, LoggingRulesConfig config) throws IOException {
        Launcher launcher = createLauncher(inputPath, outputPath);
        launcher.addProcessor(createProcessor(config));
        launcher.run();
    }

    /**
     * Create and configure the Spoon Launcher.
     */
    protected Launcher createLauncher(Path inputPath, Path outputPath) {
        Launcher launcher = new Launcher();
        launcher.addInputResource(inputPath.toString());
        launcher.setSourceOutputDirectory(outputPath.toString());
        launcher.getEnvironment().setAutoImports(autoImports);
        launcher.getEnvironment().setNoClasspath(noClasspath);
        launcher.getEnvironment().setComplianceLevel(complianceLevel);
        return launcher;
    }

    /**
     * Create the InjectLogProcessor with the given configuration.
     * Can be overridden for testing or customization.
     * 
     * Uses ActionAwareCodeInjector by default to enable action recording.
     */
    protected InjectLogProcessor createProcessor(LoggingRulesConfig config) {
        return new InjectLogProcessor(config, new ActionAwareCodeInjector(true));
    }
}
