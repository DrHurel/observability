package fr.umontpellier.injectlog4j.maven;

import fr.umontpellier.injectlog4j.config.LoggingRulesConfig;
import fr.umontpellier.injectlog4j.config.LoggingRulesLoader;
import fr.umontpellier.injectlog4j.processor.ProjectProcessor;
import fr.umontpellier.injectlog4j.processor.SpoonProjectProcessor;
import org.apache.maven.plugin.AbstractMojo;
import org.apache.maven.plugin.MojoExecutionException;
import org.apache.maven.plugins.annotations.LifecyclePhase;
import org.apache.maven.plugins.annotations.Mojo;
import org.apache.maven.plugins.annotations.Parameter;

import java.io.File;
import java.nio.file.Path;

/**
 * Maven plugin Mojo that processes source files and injects logging code.
 * 
 * <p>
 * Follows Dependency Inversion Principle by depending on ProjectProcessor
 * abstraction rather than concrete implementation.
 * </p>
 * 
 * <p>
 * Add to your pom.xml:
 * </p>
 * 
 * <pre>
 * &lt;plugin&gt;
 *   &lt;groupId&gt;fr.umontpellier&lt;/groupId&gt;
 *   &lt;artifactId&gt;inject-log4j&lt;/artifactId&gt;
 *   &lt;version&gt;0.0.1-SNAPSHOT&lt;/version&gt;
 *   &lt;executions&gt;
 *     &lt;execution&gt;
 *       &lt;phase&gt;process-sources&lt;/phase&gt;
 *       &lt;goals&gt;
 *         &lt;goal&gt;inject-log&lt;/goal&gt;
 *       &lt;/goals&gt;
 *     &lt;/execution&gt;
 *   &lt;/executions&gt;
 * &lt;/plugin&gt;
 * </pre>
 */
@Mojo(name = "inject-log", defaultPhase = LifecyclePhase.PROCESS_SOURCES)
public class InjectLogMojo extends AbstractMojo {

    /**
     * The project processor to use for source transformation.
     * Follows Dependency Inversion Principle.
     */
    private final ProjectProcessor projectProcessor;

    /**
     * Default constructor using SpoonProjectProcessor.
     */
    public InjectLogMojo() {
        this(new SpoonProjectProcessor());
    }

    /**
     * Constructor with custom project processor for testability.
     * Follows Dependency Inversion Principle.
     *
     * @param projectProcessor the processor to use
     */
    public InjectLogMojo(ProjectProcessor projectProcessor) {
        this.projectProcessor = projectProcessor;
    }

    /**
     * The source directory containing Java files to process.
     */
    @Parameter(defaultValue = "${project.build.sourceDirectory}", required = true)
    private File sourceDirectory;

    /**
     * The output directory for processed source files.
     */
    @Parameter(defaultValue = "${project.build.directory}/generated-sources/inject-log4j", required = true)
    private File outputDirectory;

    /**
     * Optional path to the logging.rules.yaml configuration file.
     * If not specified, the default location
     * (src/main/resources/logging.rules.yaml) is used.
     * 
     * @deprecated Use resourceDirectory instead to load all *.logging.rules.yaml
     *             files
     */
    @Parameter
    @Deprecated
    private File configFile;

    /**
     * Directory containing *.logging.rules.yaml configuration files.
     * All files matching the pattern will be loaded and merged.
     * If not specified, files are loaded from the classpath.
     */
    @Parameter
    private File resourceDirectory;

    /**
     * Whether to skip processing.
     */
    @Parameter(property = "injectlog.skip", defaultValue = "false")
    private boolean skip;

    @Override
    public void execute() throws MojoExecutionException {
        if (skip) {
            getLog().info("InjectLog4J processing skipped");
            return;
        }

        if (!sourceDirectory.exists()) {
            getLog().warn("Source directory does not exist: " + sourceDirectory);
            return;
        }

        getLog().info("Processing sources from: " + sourceDirectory);
        getLog().info("Output directory: " + outputDirectory);

        try {
            Path inputPath = sourceDirectory.toPath();
            Path outputPath = outputDirectory.toPath();
            LoggingRulesConfig config;

            if (resourceDirectory != null && resourceDirectory.exists()) {
                getLog().info("Loading configuration from directory: " + resourceDirectory);
                config = LoggingRulesLoader.loadAllFromDirectory(resourceDirectory.toPath());
                getLog().info(
                        "Loaded " + config.getLoggers().size() + " loggers and " + config.getRules().size() + " rules");
                projectProcessor.process(inputPath, outputPath, config);
            } else if (configFile != null && configFile.exists()) {
                getLog().info("Using configuration: " + configFile);
                config = LoggingRulesLoader.loadFromFile(configFile.toPath());
                projectProcessor.process(inputPath, outputPath, config);
            } else {
                getLog().info("Loading configuration from classpath");
                projectProcessor.process(inputPath, outputPath);
            }

            getLog().info("InjectLog4J processing completed successfully");
        } catch (Exception e) {
            throw new MojoExecutionException("Failed to process sources", e);
        }
    }
}
