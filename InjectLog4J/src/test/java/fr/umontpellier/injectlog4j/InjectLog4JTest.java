package fr.umontpellier.injectlog4j;

import fr.umontpellier.injectlog4j.config.LoggerConfig;
import fr.umontpellier.injectlog4j.config.LoggingRule;
import fr.umontpellier.injectlog4j.config.LoggingRulesConfig;
import fr.umontpellier.injectlog4j.formatter.MessageFormatter;
import fr.umontpellier.injectlog4j.runtime.LogInjector;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for InjectLog4J library.
 */
class InjectLog4JTest {

    @Test
    void testInitialize() {
        assertDoesNotThrow((org.junit.jupiter.api.function.Executable) InjectLog4J::initialize);
    }

    @Test
    void testLoggingRulesConfig() {
        LoggingRulesConfig config = new LoggingRulesConfig();

        // Set up loggers
        Map<String, LoggerConfig> loggers = new HashMap<>();
        LoggerConfig terminalLogger = new LoggerConfig("terminal", "{{time}} {{message}}");
        loggers.put("system", terminalLogger);
        config.setLoggers(loggers);

        // Set up rules
        LoggingRule rule = new LoggingRule();
        rule.setTarget("com.example.MyClass.myMethod");
        rule.setCriticality("INFO");
        rule.setWhy(Arrays.asList("OnReturn", "OnException"));
        rule.setMessage("Test message");
        rule.setLogger("system");
        config.setRules(List.of(rule));

        // Test find rule
        LoggingRule found = config.findRule("com.example.MyClass.myMethod");
        assertNotNull(found);
        assertEquals("INFO", found.getCriticality());
        assertTrue(found.triggersOnReturn());
        assertTrue(found.triggersOnException());
        assertFalse(found.triggersOnEntry());
    }

    @Test
    void testMessageFormatter() {
        MessageFormatter formatter = new MessageFormatter("{{time}} [{{class}}.{{method}}] {{message}}");

        Map<String, Object> context = new HashMap<>();
        context.put("class", "TestClass");
        context.put("method", "testMethod");
        context.put("message", "Hello World");

        String result = formatter.format(context);

        assertTrue(result.contains("[TestClass.testMethod]"));
        assertTrue(result.contains("Hello World"));
    }

    @Test
    void testMessageFormatterWithValue() {
        MessageFormatter formatter = new MessageFormatter("Result: {{value}}");

        Map<String, Object> context = new HashMap<>();
        context.put("value", "42");

        String result = formatter.format(context);
        assertEquals("Result: 42", result);
    }

    @Test
    void testMessageFormatterWithArgs() {
        MessageFormatter formatter = new MessageFormatter("Args: {{args}}");

        Map<String, Object> context = new HashMap<>();
        context.put("args", new Object[] { "arg1", 123, true });

        String result = formatter.format(context);
        assertEquals("Args: [arg1, 123, true]", result);
    }

    @Test
    void testWildcardMatching() {
        LoggingRulesConfig config = new LoggingRulesConfig();

        LoggingRule rule = new LoggingRule();
        rule.setTarget("com.example.service.*");
        rule.setCriticality("INFO");
        rule.setWhy(List.of("OnReturn"));
        config.setRules(List.of(rule));

        // Should match
        assertNotNull(config.findRule("com.example.service.UserService"));
        assertNotNull(config.findRule("com.example.service.PaymentService"));

        // Should not match
        assertNull(config.findRule("com.example.controller.UserController"));
    }

    @Test
    void testLogInjectorWithConfig() {
        LoggingRulesConfig config = new LoggingRulesConfig();

        Map<String, LoggerConfig> loggers = new HashMap<>();
        loggers.put("test", new LoggerConfig("terminal", "{{message}}"));
        config.setLoggers(loggers);

        LoggingRule rule = new LoggingRule();
        rule.setTarget("test.target");
        rule.setCriticality("INFO");
        rule.setWhy(List.of("OnReturn"));
        rule.setMessage("Test log");
        rule.setLogger("test");
        config.setRules(List.of(rule));

        // Initialize with config
        assertDoesNotThrow(() -> LogInjector.initialize(config));

        // Log return should not throw
        assertDoesNotThrow(() -> LogInjector.getInstance().logReturn("test.target", "TestClass", "testMethod",
                new Object[] {}, "result"));
    }
}
