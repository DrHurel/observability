package fr.umontpellier.injectlog4j.output;

import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.serialization.StringSerializer;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.Properties;

/**
 * Log output that sends messages to Kafka.
 */
public class KafkaOutput implements LogOutput {

    private static final Logger LOGGER = LogManager.getLogger(KafkaOutput.class);

    private final KafkaProducer<String, String> producer;
    private final String topic;

    public KafkaOutput(String bootstrapServers, String topic) {
        this.topic = topic;

        Properties props = new Properties();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        props.put(ProducerConfig.ACKS_CONFIG, "1");
        props.put(ProducerConfig.RETRIES_CONFIG, 3);

        this.producer = new KafkaProducer<>(props);
    }

    public KafkaOutput(String bootstrapServers) {
        this(bootstrapServers, "logs");
    }

    @Override
    public void log(String level, String message) {
        String key = level;
        String logMessage = message;

        ProducerRecord<String, String> producerRecord = new ProducerRecord<>(topic, key, logMessage);
        producer.send(producerRecord, (metadata, exception) -> {
            if (exception != null) {
                LOGGER.error("Failed to send log to Kafka: {}", exception.getMessage());
            }
        });
    }

    @Override
    public void close() {
        if (producer != null) {
            producer.flush();
            producer.close();
        }
    }
}
