package fr.umontpellier.injectlog4j.config;

import java.util.List;
import java.util.Map;

/**
 * Root configuration class that maps to the logging.rules.yaml file.
 */
public class LoggingRulesConfig {

    private Map<String, LoggerConfig> loggers;
    private List<LoggingRule> rules;

    public LoggingRulesConfig() {
        // Default constructor for YAML deserialization
    }

    public Map<String, LoggerConfig> getLoggers() {
        return loggers;
    }

    public void setLoggers(Map<String, LoggerConfig> loggers) {
        this.loggers = loggers;
    }

    public List<LoggingRule> getRules() {
        return rules;
    }

    public void setRules(List<LoggingRule> rules) {
        this.rules = rules;
    }

    /**
     * Get a logger configuration by name.
     * 
     * @param name the logger name
     * @return the logger configuration, or null if not found
     */
    public LoggerConfig getLogger(String name) {
        return loggers != null ? loggers.get(name) : null;
    }

    /**
     * Find a rule that matches the given target.
     * 
     * @param target the target to match (e.g., method.id or fully qualified name)
     * @return the matching rule, or null if not found
     */
    public LoggingRule findRule(String target) {
        if (rules == null) {
            return null;
        }

        for (LoggingRule rule : rules) {
            if (matchesTarget(rule.getTarget(), target)) {
                return rule;
            }
        }
        return null;
    }

    /**
     * Check if a rule target pattern matches a given target.
     * Supports wildcards (*) for pattern matching.
     */
    private boolean matchesTarget(String pattern, String target) {
        if (pattern == null || target == null) {
            return false;
        }

        // Exact match
        if (pattern.equals(target)) {
            return true;
        }

        // Wildcard matching
        if (pattern.contains("*")) {
            String regex = pattern.replace(".", "\\.").replace("*", ".*");
            return target.matches(regex);
        }

        return false;
    }

    @Override
    public String toString() {
        return "LoggingRulesConfig{" +
                "loggers=" + loggers +
                ", rules=" + rules +
                '}';
    }
}
