package fr.umontpellier.injectlog4j.action;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * In-memory implementation of ActionRecorder.
 * Stores actions in memory for testing or small-scale use.
 * 
 * Thread-safe implementation using CopyOnWriteArrayList.
 */
public class InMemoryActionRecorder implements ActionRecorder {

    private static final Logger LOGGER = LogManager.getLogger(InMemoryActionRecorder.class);
    private static final int MAX_ACTIONS = 10000;

    private final CopyOnWriteArrayList<UserAction> actions;
    private final boolean enabled;

    public InMemoryActionRecorder() {
        this(true);
    }

    public InMemoryActionRecorder(boolean enabled) {
        this.actions = new CopyOnWriteArrayList<>();
        this.enabled = enabled;
        LOGGER.info("InMemoryActionRecorder initialized (enabled: {})", enabled);
    }

    @Override
    public void recordAction(UserAction action) {
        if (!enabled || action == null) {
            return;
        }

        // Keep list bounded
        if (actions.size() >= MAX_ACTIONS) {
            // Remove oldest 10% when full
            int removeCount = MAX_ACTIONS / 10;
            for (int i = 0; i < removeCount && !actions.isEmpty(); i++) {
                actions.remove(0);
            }
        }

        actions.add(action);
        LOGGER.debug("Recorded action: {}", action.toStructuredLog());
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    @Override
    public void shutdown() {
        actions.clear();
    }

    /**
     * Get all recorded actions.
     */
    public List<UserAction> getActions() {
        return new ArrayList<>(actions);
    }

    /**
     * Get actions for a specific user.
     */
    public List<UserAction> getActionsForUser(String userId) {
        List<UserAction> result = new ArrayList<>();
        for (UserAction action : actions) {
            if (userId != null && (userId.equals(action.getUserId()) || userId.equals(action.getUserEmail()))) {
                result.add(action);
            }
        }
        return result;
    }

    /**
     * Get action count.
     */
    public int getActionCount() {
        return actions.size();
    }

    /**
     * Clear all recorded actions.
     */
    public void clear() {
        actions.clear();
    }
}
