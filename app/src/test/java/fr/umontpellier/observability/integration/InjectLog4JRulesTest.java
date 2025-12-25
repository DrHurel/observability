package fr.umontpellier.observability.integration;

import fr.umontpellier.injectlog4j.InjectLog4J;
import fr.umontpellier.injectlog4j.config.LoggerConfig;
import fr.umontpellier.injectlog4j.config.LoggingRule;
import fr.umontpellier.injectlog4j.config.LoggingRulesConfig;
import fr.umontpellier.injectlog4j.config.LoggingRulesLoader;
import fr.umontpellier.injectlog4j.runtime.LogInjector;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test to verify that InjectLog4J rules are properly loaded and configured.
 * Target format: package.Class.method
 */
class InjectLog4JRulesTest {

    private static LoggingRulesConfig config;

    private static final String PRODUCT_SERVICE = "fr.umontpellier.observability.service.ProductService";
    private static final String USER_SERVICE = "fr.umontpellier.observability.service.UserService";

    @BeforeAll
    static void setUp() throws IOException {
        // Load the logging rules from classpath
        config = LoggingRulesLoader.load();
        assertNotNull(config, "Logging rules configuration should be loaded");
    }

    @Test
    void testLoggersAreConfigured() {
        assertNotNull(config.getLoggers(), "Loggers map should not be null");
        assertFalse(config.getLoggers().isEmpty(), "Loggers should be defined");

        // Verify 'service' logger
        LoggerConfig serviceLogger = config.getLogger("service");
        assertNotNull(serviceLogger, "Service logger should be defined");
        assertEquals("terminal", serviceLogger.getOutput());
        assertEquals("fr.umontpellier.observability", serviceLogger.getLog4jLogger());
        assertNotNull(serviceLogger.getFormat());

        // Verify 'error' logger
        LoggerConfig errorLogger = config.getLogger("error");
        assertNotNull(errorLogger, "Error logger should be defined");
        assertEquals("terminal", errorLogger.getOutput());
        assertEquals("fr.umontpellier.observability", errorLogger.getLog4jLogger());
    }

    @Test
    void testRulesAreConfigured() {
        assertNotNull(config.getRules(), "Rules list should not be null");
        assertFalse(config.getRules().isEmpty(), "Rules should be defined");

        // Check we have rules for products and users
        long productRules = config.getRules().stream()
                .filter(r -> r.getTarget().contains("ProductService"))
                .count();
        long userRules = config.getRules().stream()
                .filter(r -> r.getTarget().contains("UserService"))
                .count();

        assertTrue(productRules >= 4, "Should have at least 4 product rules, found: " + productRules);
        assertTrue(userRules >= 4, "Should have at least 4 user rules, found: " + userRules);
    }

    @Test
    void testProductGetAllRuleExists() {
        LoggingRule rule = config.findRule(PRODUCT_SERVICE + ".getAllProducts");
        assertNotNull(rule, "ProductService.getAllProducts rule should exist");
        assertEquals("INFO", rule.getCriticality());
        assertTrue(rule.triggersOnEntry(), "Should trigger OnEntry");
        assertEquals("service", rule.getLogger());
        assertEquals("Fetching all products", rule.getMessage());
    }

    @Test
    void testProductGetByIdRuleExists() {
        LoggingRule rule = config.findRule(PRODUCT_SERVICE + ".getProductById");
        assertNotNull(rule, "ProductService.getProductById rule should exist");
        assertEquals("INFO", rule.getCriticality());
        assertTrue(rule.triggersOnEntry(), "Should trigger OnEntry");
        assertTrue(rule.triggersOnException(), "Should trigger OnException");
    }

    @Test
    void testProductAddRuleExists() {
        LoggingRule rule = config.findRule(PRODUCT_SERVICE + ".addProduct");
        assertNotNull(rule, "ProductService.addProduct rule should exist");
        assertEquals("INFO", rule.getCriticality());
        assertTrue(rule.triggersOnEntry(), "Should trigger OnEntry");
        assertTrue(rule.triggersOnReturn(), "Should trigger OnReturn");
    }

    @Test
    void testProductDeleteRuleExists() {
        LoggingRule rule = config.findRule(PRODUCT_SERVICE + ".deleteProduct");
        assertNotNull(rule, "ProductService.deleteProduct rule should exist");
        assertEquals("INFO", rule.getCriticality());
        assertTrue(rule.triggersOnEntry(), "Should trigger OnEntry");
        assertTrue(rule.triggersOnReturn(), "Should trigger OnReturn");
    }

    @Test
    void testProductUpdateRuleExists() {
        LoggingRule rule = config.findRule(PRODUCT_SERVICE + ".updateProduct");
        assertNotNull(rule, "ProductService.updateProduct rule should exist");
        assertEquals("INFO", rule.getCriticality());
        assertTrue(rule.triggersOnEntry(), "Should trigger OnEntry");
        assertTrue(rule.triggersOnReturn(), "Should trigger OnReturn");
    }

    @Test
    void testUserCreateRuleExists() {
        LoggingRule rule = config.findRule(USER_SERVICE + ".createUser");
        assertNotNull(rule, "UserService.createUser rule should exist");
        assertEquals("INFO", rule.getCriticality());
        assertTrue(rule.triggersOnEntry(), "Should trigger OnEntry");
        assertTrue(rule.triggersOnReturn(), "Should trigger OnReturn");
    }

    @Test
    void testUserGetAllRuleExists() {
        LoggingRule rule = config.findRule(USER_SERVICE + ".getAllUsers");
        assertNotNull(rule, "UserService.getAllUsers rule should exist");
        assertEquals("INFO", rule.getCriticality());
        assertTrue(rule.triggersOnEntry(), "Should trigger OnEntry");
    }

    @Test
    void testUserGetByIdRuleExists() {
        LoggingRule rule = config.findRule(USER_SERVICE + ".getUserById");
        assertNotNull(rule, "UserService.getUserById rule should exist");
        assertEquals("INFO", rule.getCriticality());
        assertTrue(rule.triggersOnEntry(), "Should trigger OnEntry");
    }

    @Test
    void testUserGetByEmailRuleExists() {
        LoggingRule rule = config.findRule(USER_SERVICE + ".getUserByEmail");
        assertNotNull(rule, "UserService.getUserByEmail rule should exist");
        assertEquals("INFO", rule.getCriticality());
        assertTrue(rule.triggersOnEntry(), "Should trigger OnEntry");
    }

    @Test
    void testInjectLog4JCanInitialize() {
        // Test that InjectLog4J can be initialized without errors
        assertDoesNotThrow((org.junit.jupiter.api.function.Executable) InjectLog4J::initialize,
                "InjectLog4J should initialize successfully");

        // Verify the injector is available
        LogInjector injector = InjectLog4J.getInjector();
        assertNotNull(injector, "LogInjector should be available after initialization");
    }

    @Test
    void testRuleMatchingWithFullyQualifiedName() {
        // Test that fully qualified method names work
        assertNotNull(config.findRule(PRODUCT_SERVICE + ".getAllProducts"));
        assertNotNull(config.findRule(USER_SERVICE + ".createUser"));

        // Non-existent rules should return null
        assertNull(config.findRule("nonexistent.rule"));
        assertNull(config.findRule(PRODUCT_SERVICE + ".nonexistent"));
    }
}
