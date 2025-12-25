package fr.umontpellier.injectlog4j.action;

/**
 * Interface for recording user actions for profiling purposes.
 * Implementations can store actions in various backends (Kafka, MongoDB, etc.).
 */
public interface ActionRecorder {

    /**
     * Record a user action.
     *
     * @param action the action to record
     */
    void recordAction(UserAction action);

    /**
     * Check if action recording is enabled.
     *
     * @return true if recording is enabled
     */
    boolean isEnabled();

    /**
     * Shutdown the recorder and release resources.
     */
    void shutdown();
}
