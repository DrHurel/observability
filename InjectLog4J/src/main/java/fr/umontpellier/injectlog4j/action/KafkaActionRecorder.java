package fr.umontpellier.injectlog4j.action;

import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.serialization.StringSerializer;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.Properties;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Kafka-based implementation of ActionRecorder.
 * Records user actions to a Kafka topic for downstream processing.
 * 
 * Uses an asynchronous queue to avoid blocking the main application thread.
 */
public class KafkaActionRecorder implements ActionRecorder {

    private static final Logger LOGGER = LogManager.getLogger(KafkaActionRecorder.class);
    private static final String DEFAULT_TOPIC = "action-logs";
    private static final int QUEUE_CAPACITY = 10000;

    private final String topic;
    private final KafkaProducer<String, String> producer;
    private final BlockingQueue<UserAction> actionQueue;
    private final Thread workerThread;
    private final AtomicBoolean running;
    private final boolean enabled;

    /**
     * Create a Kafka action recorder with default settings.
     */
    public KafkaActionRecorder(String bootstrapServers) {
        this(bootstrapServers, DEFAULT_TOPIC);
    }

    /**
     * Create a Kafka action recorder with custom topic.
     */
    public KafkaActionRecorder(String bootstrapServers, String topic) {
        this.topic = topic;
        this.actionQueue = new LinkedBlockingQueue<>(QUEUE_CAPACITY);
        this.running = new AtomicBoolean(true);

        boolean producerCreated = false;
        KafkaProducer<String, String> tempProducer = null;

        if (bootstrapServers != null && !bootstrapServers.isEmpty()) {
            try {
                Properties props = new Properties();
                props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
                props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
                props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
                props.put(ProducerConfig.ACKS_CONFIG, "1");
                props.put(ProducerConfig.RETRIES_CONFIG, 3);
                props.put(ProducerConfig.LINGER_MS_CONFIG, 10);
                props.put(ProducerConfig.BATCH_SIZE_CONFIG, 16384);

                tempProducer = new KafkaProducer<>(props);
                producerCreated = true;
                LOGGER.info("KafkaActionRecorder initialized with topic: {}", topic);
            } catch (Exception e) {
                LOGGER.warn("Failed to create Kafka producer for action recording: {}", e.getMessage());
            }
        }

        this.producer = tempProducer;
        this.enabled = producerCreated;

        // Start worker thread
        this.workerThread = new Thread(this::processQueue, "action-recorder-worker");
        this.workerThread.setDaemon(true);
        if (enabled) {
            this.workerThread.start();
        }
    }

    @Override
    public void recordAction(UserAction action) {
        if (!enabled || action == null) {
            return;
        }

        // Non-blocking add to queue
        if (!actionQueue.offer(action)) {
            LOGGER.debug("Action queue full, dropping action");
        }
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    @Override
    public void shutdown() {
        running.set(false);

        if (workerThread != null) {
            workerThread.interrupt();
            try {
                workerThread.join(5000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        if (producer != null) {
            try {
                producer.close();
            } catch (Exception e) {
                LOGGER.debug("Error closing Kafka producer: {}", e.getMessage());
            }
        }
    }

    private void processQueue() {
        while (running.get()) {
            try {
                UserAction action = actionQueue.poll(100, TimeUnit.MILLISECONDS);
                if (action != null) {
                    sendToKafka(action);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                LOGGER.debug("Error processing action: {}", e.getMessage());
            }
        }

        // Drain remaining actions
        UserAction action;
        while ((action = actionQueue.poll()) != null) {
            sendToKafka(action);
        }
    }

    private void sendToKafka(UserAction action) {
        try {
            String key = action.getUserEmail() != null ? action.getUserEmail()
                    : action.getUserId() != null ? action.getUserId() : "anonymous";
            String value = action.toStructuredLog();

            ProducerRecord<String, String> record = new ProducerRecord<>(topic, key, value);
            producer.send(record, (metadata, exception) -> {
                if (exception != null) {
                    LOGGER.debug("Failed to send action to Kafka: {}", exception.getMessage());
                }
            });
        } catch (Exception e) {
            LOGGER.debug("Error sending action to Kafka: {}", e.getMessage());
        }
    }
}
