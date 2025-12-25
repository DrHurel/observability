package fr.umontpellier.injectlog4j.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to mark methods or classes for automatic log injection.
 * The logging behavior is defined in the logging.rules.yaml configuration file.
 * 
 * <p>
 * When applied to a class, all methods in that class will be candidates for log
 * injection.
 * When applied to a method, only that specific method will be processed.
 * </p>
 * 
 * <p>
 * The actual logging rules (what to log, when to log, output destination) are
 * configured in the logging.rules.yaml file in the project's resources.
 * </p>
 */
@Retention(RetentionPolicy.RUNTIME)
@Target({ ElementType.METHOD, ElementType.TYPE })
public @interface InjectLog {

    /**
     * Optional identifier for this log injection point.
     * If not specified, the fully qualified method name will be used.
     * This id can be referenced in the logging.rules.yaml file.
     * 
     * @return the identifier for this injection point
     */
    String id() default "";

    /**
     * Optional logger name to use.
     * If not specified, the logger defined in the rules file will be used.
     * 
     * @return the logger name
     */
    String logger() default "";
}
