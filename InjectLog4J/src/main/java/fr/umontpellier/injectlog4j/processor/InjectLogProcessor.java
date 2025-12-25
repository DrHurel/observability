package fr.umontpellier.injectlog4j.processor;

import fr.umontpellier.injectlog4j.config.LoggingRule;
import fr.umontpellier.injectlog4j.config.LoggingRulesConfig;
import fr.umontpellier.injectlog4j.config.LoggingRulesLoader;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import spoon.processing.AbstractProcessor;
import spoon.reflect.code.CtBlock;
import spoon.reflect.code.CtStatement;
import spoon.reflect.declaration.CtClass;
import spoon.reflect.declaration.CtMethod;
import spoon.reflect.factory.Factory;

import java.io.IOException;

/**
 * Spoon processor that injects logging code into methods based on
 * the logging.rules.yaml configuration.
 * 
 * Target format: package.Class.method
 * Example: fr.umontpellier.observability.service.ProductService.getAllProducts
 * 
 * Follows the Single Responsibility Principle - only responsible for
 * determining which methods to process and delegating code injection.
 * 
 * Follows the Dependency Inversion Principle - depends on CodeInjector
 * abstraction rather than concrete implementation.
 * 
 * Follows the Open/Closed Principle - behavior can be extended by
 * providing different CodeInjector implementations.
 */
public class InjectLogProcessor extends AbstractProcessor<CtMethod<?>> {

    private static final Logger LOGGER = LogManager.getLogger(InjectLogProcessor.class);

    private final LoggingRulesConfig config;
    private final CodeInjector codeInjector;

    /**
     * Create an InjectLogProcessor with default configuration and code injector.
     */
    public InjectLogProcessor() {
        this(loadDefaultConfig(), new DefaultCodeInjector());
    }

    /**
     * Create an InjectLogProcessor with custom configuration and default code
     * injector.
     *
     * @param config the logging rules configuration
     */
    public InjectLogProcessor(LoggingRulesConfig config) {
        this(config, new DefaultCodeInjector());
    }

    /**
     * Create an InjectLogProcessor with custom configuration and code injector.
     * Follows Dependency Inversion Principle by accepting abstractions.
     *
     * @param config       the logging rules configuration
     * @param codeInjector the code injector implementation
     */
    public InjectLogProcessor(LoggingRulesConfig config, CodeInjector codeInjector) {
        this.config = config != null ? config : new LoggingRulesConfig();
        this.codeInjector = codeInjector != null ? codeInjector : new DefaultCodeInjector();
    }

    private static LoggingRulesConfig loadDefaultConfig() {
        try {
            return LoggingRulesLoader.load();
        } catch (IOException e) {
            LOGGER.warn("Could not load logging rules: {}", e.getMessage());
            return new LoggingRulesConfig();
        }
    }

    @Override
    public boolean isToBeProcessed(CtMethod<?> method) {
        String target = getTarget(method);
        LoggingRule rule = config.findRule(target);
        return rule != null;
    }

    @Override
    public void process(CtMethod<?> method) {
        String target = getTarget(method);
        LoggingRule rule = config.findRule(target);

        if (rule == null) {
            return;
        }

        Factory factory = getFactory();
        CtClass<?> declaringClass = method.getParent(CtClass.class);
        String className = declaringClass != null ? declaringClass.getSimpleName() : "Unknown";
        String methodName = method.getSimpleName();

        CtBlock<?> body = method.getBody();
        if (body == null) {
            return;
        }

        LOGGER.info("InjectLog4J: Processing method {}", target);

        injectLogging(factory, method, rule, target, className, methodName);
    }

    /**
     * Inject logging code based on the rule configuration.
     * Delegates actual code generation to the CodeInjector.
     */
    private void injectLogging(Factory factory, CtMethod<?> method, LoggingRule rule,
            String target, String className, String methodName) {
        CtBlock<?> body = method.getBody();

        // Entry logging
        if (rule.triggersOnEntry()) {
            CtStatement entryLog = codeInjector.createEntryLogStatement(
                    factory, target, className, methodName, method.getParameters());
            body.insertBegin(entryLog);
        }

        // Return logging
        if (rule.triggersOnReturn()) {
            codeInjector.wrapReturnStatements(factory, method, target, className, methodName);
        }

        // Exception logging
        if (rule.triggersOnException()) {
            codeInjector.wrapWithExceptionLogging(factory, method, target, className, methodName);
        }
    }

    /**
     * Get the target identifier for a method in format: package.Class.method
     */
    private String getTarget(CtMethod<?> method) {
        CtClass<?> declaringClass = method.getParent(CtClass.class);
        String className = declaringClass != null ? declaringClass.getQualifiedName() : "Unknown";
        return className + "." + method.getSimpleName();
    }
}
