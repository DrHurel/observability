package fr.umontpellier.injectlog4j.action;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

/**
 * Factory for creating ActionRecorder instances based on configuration.
 */
public class ActionRecorderFactory {

    private static final Logger LOGGER = LogManager.getLogger(ActionRecorderFactory.class);

    private ActionRecorderFactory() {
        // Utility class
    }

    /**
     * Create an ActionRecorder based on the type.
     *
     * @param type   the recorder type ("kafka", "memory", or null for disabled)
     * @param config configuration string (e.g., bootstrap servers for Kafka)
     * @return the ActionRecorder instance
     */
    public static ActionRecorder create(String type, String config) {
        if (type == null || type.isEmpty() || "none".equalsIgnoreCase(type)) {
            return new NoOpActionRecorder();
        }

        return switch (type.toLowerCase()) {
            case "kafka" -> createKafkaRecorder(config);
            case "memory", "inmemory" -> new InMemoryActionRecorder();
            default -> {
                LOGGER.warn("Unknown action recorder type: {}, using no-op recorder", type);
                yield new NoOpActionRecorder();
            }
        };
    }

    private static ActionRecorder createKafkaRecorder(String config) {
        if (config == null || config.isEmpty()) {
            config = System.getenv("KAFKA_BOOTSTRAP_SERVERS");
            if (config == null || config.isEmpty()) {
                config = System.getProperty("kafka.bootstrap.servers", "localhost:9092");
            }
        }

        String topic = System.getenv("ACTION_LOG_TOPIC");
        if (topic == null || topic.isEmpty()) {
            topic = System.getProperty("action.log.topic", "action-logs");
        }

        return new KafkaActionRecorder(config, topic);
    }

    /**
     * No-op implementation for when action recording is disabled.
     */
    private static class NoOpActionRecorder implements ActionRecorder {
        @Override
        public void recordAction(UserAction action) {
            // Do nothing
        }

        @Override
        public boolean isEnabled() {
            return false;
        }

        @Override
        public void shutdown() {
            // Do nothing
        }
    }
}
