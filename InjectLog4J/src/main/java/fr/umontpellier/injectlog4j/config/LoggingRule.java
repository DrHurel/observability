package fr.umontpellier.injectlog4j.config;

import java.util.List;

/**
 * Represents a logging rule that defines when and how to inject logging.
 */
public class LoggingRule {

    private String target;
    private String criticality;
    private List<String> why;
    private String message;
    private String logger;

    public LoggingRule() {
        // Default constructor for YAML deserialization
    }

    public String getTarget() {
        return target;
    }

    public void setTarget(String target) {
        this.target = target;
    }

    public String getCriticality() {
        return criticality;
    }

    public void setCriticality(String criticality) {
        this.criticality = criticality;
    }

    public List<String> getWhy() {
        return why;
    }

    public void setWhy(List<String> why) {
        this.why = why;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getLogger() {
        return logger;
    }

    public void setLogger(String logger) {
        this.logger = logger;
    }

    /**
     * Check if this rule should trigger on method entry.
     */
    public boolean triggersOnEntry() {
        return why != null && why.contains("OnEntry");
    }

    /**
     * Check if this rule should trigger on method return.
     */
    public boolean triggersOnReturn() {
        return why != null && why.contains("OnReturn");
    }

    /**
     * Check if this rule should trigger on exception.
     */
    public boolean triggersOnException() {
        return why != null && why.contains("OnException");
    }

    @Override
    public String toString() {
        return "LoggingRule{" +
                "target='" + target + '\'' +
                ", criticality='" + criticality + '\'' +
                ", why=" + why +
                ", message='" + message + '\'' +
                ", logger='" + logger + '\'' +
                '}';
    }
}
