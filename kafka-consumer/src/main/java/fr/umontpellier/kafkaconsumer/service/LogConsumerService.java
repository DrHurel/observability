package fr.umontpellier.kafkaconsumer.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Kafka consumer service that reads events from Kafka
 * and inserts them into ClickHouse for observability dashboards.
 */
@Service
@Slf4j
public class LogConsumerService {

    @Value("${clickhouse.url}")
    private String clickhouseUrl;

    @Value("${clickhouse.username:default}")
    private String clickhouseUsername;

    @Value("${clickhouse.password:}")
    private String clickhousePassword;

    private volatile Connection connection;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AtomicLong userEventIdCounter = new AtomicLong(1);
    private final AtomicLong productEventIdCounter = new AtomicLong(1);
    private final AtomicBoolean isConnecting = new AtomicBoolean(false);

    private static final Pattern LOG_PATTERN = Pattern.compile(
            "^(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\.\\d{3})\\s+\\[([^\\]]+)\\]\\s+(\\w+)\\s+([\\w.]+)\\s+-\\s+(.+)$");

    private static final DateTimeFormatter LOG_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

    @PostConstruct
    public void init() {
        connectToClickHouse();
    }

    private synchronized void connectToClickHouse() {
        if (isConnecting.get()) {
            return;
        }
        isConnecting.set(true);

        int maxRetries = 30;
        int retryCount = 0;
        int baseDelayMs = 2000;

        while (retryCount < maxRetries) {
            try {
                if (connection != null && !connection.isClosed()) {
                    isConnecting.set(false);
                    return;
                }
                connection = DriverManager.getConnection(clickhouseUrl, clickhouseUsername, clickhousePassword);
                log.info("Connected to ClickHouse for log ingestion");
                initializeCounters();
                isConnecting.set(false);
                return;
            } catch (SQLException e) {
                retryCount++;
                int delayMs = Math.min(baseDelayMs * retryCount, 30000);
                log.warn("Failed to connect to ClickHouse (attempt {}/{}): {}. Retrying in {}ms...",
                        retryCount, maxRetries, e.getMessage(), delayMs);
                if (retryCount < maxRetries) {
                    try {
                        Thread.sleep(delayMs);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        isConnecting.set(false);
                        return;
                    }
                }
            }
        }
        log.error("Failed to connect to ClickHouse after {} attempts. Will retry via scheduled task.", maxRetries);
        isConnecting.set(false);
    }

    /**
     * Periodically check and restore ClickHouse connection if needed.
     */
    @Scheduled(fixedDelay = 30000, initialDelay = 60000)
    public void checkAndRestoreConnection() {
        try {
            if (connection == null || connection.isClosed()) {
                log.info("ClickHouse connection lost, attempting to reconnect...");
                connectToClickHouse();
            }
        } catch (SQLException e) {
            log.warn("Error checking ClickHouse connection: {}", e.getMessage());
            connectToClickHouse();
        }
    }

    private boolean isConnectionValid() {
        try {
            return connection != null && !connection.isClosed();
        } catch (SQLException e) {
            return false;
        }
    }

    private void initializeCounters() {
        try (PreparedStatement stmt = connection.prepareStatement("SELECT max(id) FROM observability.user_events")) {
            var rs = stmt.executeQuery();
            if (rs.next()) {
                userEventIdCounter.set(rs.getLong(1) + 1);
            }
        } catch (SQLException e) {
            log.debug("Could not initialize user event counter: {}", e.getMessage());
        }
        try (PreparedStatement stmt = connection.prepareStatement("SELECT max(id) FROM observability.product_events")) {
            var rs = stmt.executeQuery();
            if (rs.next()) {
                productEventIdCounter.set(rs.getLong(1) + 1);
            }
        } catch (SQLException e) {
            log.debug("Could not initialize product event counter: {}", e.getMessage());
        }
    }

    @PreDestroy
    public void cleanup() {
        if (connection != null) {
            try {
                connection.close();
                log.info("ClickHouse connection closed");
            } catch (SQLException e) {
                log.error("Error closing ClickHouse connection: {}", e.getMessage());
            }
        }
    }

    @KafkaListener(topics = "application-logs", groupId = "kafka-consumer-service")
    public void consumeLog(String logMessage) {
        if (logMessage == null || logMessage.isBlank()) {
            return;
        }

        try {
            LogEntry entry = parseLogEntry(logMessage);
            if (entry != null) {
                insertLog(entry);
            }
        } catch (Exception e) {
            log.debug("Failed to process log message: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "user-events", groupId = "kafka-consumer-service")
    public void consumeUserEvent(String message) {
        if (message == null || message.isBlank())
            return;

        try {
            if (message.startsWith("{")) {
                JsonNode json = objectMapper.readTree(message);
                insertUserEvent(
                        json.path("event_type").asText("UNKNOWN"),
                        json.path("user_id").asText(""),
                        json.path("user_name").asText(""),
                        json.path("user_email").asText(""));
            } else {
                String eventType = message.contains("created") ? "USER_CREATED" : "USER_EVENT";
                String userId = message.replaceAll(".*:\\s*", "").trim();
                insertUserEvent(eventType, userId, "", "");
            }
            logToClickHouse("INFO", "fr.umontpellier.observability.events.user", message, "kafka-consumer");
            log.debug("Processed user event: {}", message);
        } catch (Exception e) {
            log.debug("Failed to process user event: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "product-events", groupId = "kafka-consumer-service")
    public void consumeProductEvent(String message) {
        if (message == null || message.isBlank())
            return;

        try {
            if (message.startsWith("{")) {
                JsonNode json = objectMapper.readTree(message);
                insertProductEvent(
                        json.path("event_type").asText("UNKNOWN"),
                        json.path("product_id").asText(""),
                        json.path("product_name").asText(""),
                        json.path("product_price").asDouble(0.0));
            } else {
                String eventType = "PRODUCT_EVENT";
                if (message.contains("added"))
                    eventType = "PRODUCT_ADDED";
                else if (message.contains("updated"))
                    eventType = "PRODUCT_UPDATED";
                else if (message.contains("deleted"))
                    eventType = "PRODUCT_DELETED";
                String productId = message.replaceAll(".*:\\s*", "").trim();
                insertProductEvent(eventType, productId, "", 0.0);
            }
            logToClickHouse("INFO", "fr.umontpellier.observability.events.product", message, "kafka-consumer");
            log.debug("Processed product event: {}", message);
        } catch (Exception e) {
            log.debug("Failed to process product event: {}", e.getMessage());
        }
    }

    private void insertUserEvent(String eventType, String userId, String userName, String userEmail) {
        if (!isConnectionValid()) {
            log.debug("ClickHouse connection not available, skipping user event insert");
            return;
        }

        String sql = "INSERT INTO observability.user_events (id, timestamp, event_type, user_id, user_name, user_email, details) VALUES (?, now(), ?, ?, ?, ?, ?)";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, userEventIdCounter.getAndIncrement());
            stmt.setString(2, eventType);
            stmt.setLong(3, parseId(userId));
            stmt.setString(4, userName);
            stmt.setString(5, userEmail);
            stmt.setString(6, "");
            stmt.executeUpdate();
        } catch (SQLException e) {
            log.debug("Failed to insert user event: {}", e.getMessage());
        }
    }

    private void insertProductEvent(String eventType, String productId, String productName, double price) {
        if (!isConnectionValid()) {
            log.debug("ClickHouse connection not available, skipping product event insert");
            return;
        }

        String sql = "INSERT INTO observability.product_events (id, timestamp, event_type, product_id, product_name, product_price, details) VALUES (?, now(), ?, ?, ?, ?, ?)";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, productEventIdCounter.getAndIncrement());
            stmt.setString(2, eventType);
            stmt.setLong(3, parseId(productId));
            stmt.setString(4, productName);
            stmt.setDouble(5, price);
            stmt.setString(6, "");
            stmt.executeUpdate();
        } catch (SQLException e) {
            log.debug("Failed to insert product event: {}", e.getMessage());
        }
    }

    private long parseId(String id) {
        try {
            return Long.parseLong(id);
        } catch (NumberFormatException e) {
            return Math.abs(id.hashCode());
        }
    }

    public void logToClickHouse(String level, String logger, String message, String thread) {
        LogEntry entry = new LogEntry(LocalDateTime.now(), level, logger, message, thread);
        insertLog(entry);
    }

    private LogEntry parseLogEntry(String logMessage) {
        Matcher matcher = LOG_PATTERN.matcher(logMessage.trim());

        if (matcher.matches()) {
            String timestamp = matcher.group(1);
            String thread = matcher.group(2);
            String level = matcher.group(3);
            String logger = matcher.group(4);
            String message = matcher.group(5);

            LocalDateTime dateTime;
            try {
                dateTime = LocalDateTime.parse(timestamp, LOG_DATE_FORMAT);
            } catch (Exception e) {
                dateTime = LocalDateTime.now();
            }

            return new LogEntry(dateTime, level, logger, message, thread);
        }

        return new LogEntry(LocalDateTime.now(), "INFO", "unknown", logMessage, "unknown");
    }

    private void insertLog(LogEntry entry) {
        if (!isConnectionValid()) {
            log.debug("ClickHouse connection not available, skipping log insert");
            return;
        }

        String sql = "INSERT INTO default.application_logs (timestamp, level, logger, message, thread) VALUES (?, ?, ?, ?, ?)";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setObject(1, java.sql.Timestamp.valueOf(entry.timestamp()));
            stmt.setString(2, entry.level());
            stmt.setString(3, entry.logger());
            stmt.setString(4, entry.message());
            stmt.setString(5, entry.thread());
            stmt.executeUpdate();
        } catch (SQLException e) {
            log.debug("Failed to insert log into ClickHouse: {}", e.getMessage());
        }
    }

    private record LogEntry(LocalDateTime timestamp, String level, String logger, String message, String thread) {
    }
}
