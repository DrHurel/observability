package fr.umontpellier.injectlog4j.processor;

import spoon.reflect.code.CtStatement;
import spoon.reflect.declaration.CtMethod;
import spoon.reflect.declaration.CtParameter;
import spoon.reflect.factory.Factory;

import java.util.List;

/**
 * Interface for injecting logging code into methods.
 * Follows the Interface Segregation Principle by providing
 * separate methods for different injection types.
 */
public interface CodeInjector {

    /**
     * Create an entry log statement.
     *
     * @param factory    the Spoon factory
     * @param target     the method target identifier
     * @param className  the class name
     * @param methodName the method name
     * @param parameters the method parameters
     * @return the entry log statement
     */
    CtStatement createEntryLogStatement(Factory factory, String target, String className,
            String methodName, List<CtParameter<?>> parameters);

    /**
     * Wrap the method with return logging.
     *
     * @param factory    the Spoon factory
     * @param method     the method to wrap
     * @param target     the method target identifier
     * @param className  the class name
     * @param methodName the method name
     */
    void wrapReturnStatements(Factory factory, CtMethod<?> method, String target,
            String className, String methodName);

    /**
     * Wrap the method with exception logging.
     *
     * @param factory    the Spoon factory
     * @param method     the method to wrap
     * @param target     the method target identifier
     * @param className  the class name
     * @param methodName the method name
     */
    void wrapWithExceptionLogging(Factory factory, CtMethod<?> method, String target,
            String className, String methodName);

    /**
     * Create an array representation of method arguments.
     *
     * @param parameters the method parameters
     * @return the args array code string
     */
    String createArgsArray(List<CtParameter<?>> parameters);
}
