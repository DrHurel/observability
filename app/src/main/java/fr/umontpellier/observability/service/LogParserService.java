package fr.umontpellier.observability.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import fr.umontpellier.observability.model.UserAction;
import fr.umontpellier.observability.model.UserAction.ActionType;
import fr.umontpellier.observability.model.UserAction.EntityType;
import fr.umontpellier.observability.model.UserAction.OperationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service for parsing structured logs and extracting user actions.
 * 
 * Supports multiple log formats:
 * 1. JSON structured logs
 * 2. Standard Log4j2 pattern logs
 * 3. Custom InjectLog4J format
 * 
 * This service implements the LPS (Log Processing Structure) parsing mechanism
 * as described in the TP3 requirements.
 */
@Service
@RequiredArgsConstructor
@Log4j2
public class LogParserService {

    private final ObjectMapper objectMapper;

    // Patterns for parsing different log formats
    private static final Pattern LOG4J_PATTERN = Pattern.compile(
            "^(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\.\\d{3})\\s+\\[([^\\]]+)\\]\\s+(\\w+)\\s+([\\w.]+)\\s+-\\s+(.+)$");

    private static final Pattern INJECT_LOG_PATTERN = Pattern.compile(
            "^([\\d-]+T[\\d:.]+)\\s+\\[([\\w.]+)\\.([\\w]+)\\]\\s+(.+)$");

    private static final Pattern METHOD_CALL_PATTERN = Pattern.compile(
            "(Fetching|Creating|Updating|Deleting|Adding)\\s+(?:all\\s+)?(user|product)s?(?:\\s+by\\s+(id|email))?(?::\\s*(.+))?",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern USER_INFO_PATTERN = Pattern.compile(
            "userId[=:]\\s*([\\w-]+)|userEmail[=:]\\s*([\\w@.]+)|user[=:]\\s*\\{([^}]+)\\}",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern PRODUCT_PRICE_PATTERN = Pattern.compile(
            "price[=:]\\s*([\\d.]+)",
            Pattern.CASE_INSENSITIVE);

    private static final DateTimeFormatter LOG4J_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

    /**
     * Parse a single log line and extract user action.
     */
    public Optional<UserAction> parseLogLine(String logLine) {
        if (logLine == null || logLine.isBlank()) {
            return Optional.empty();
        }

        // Try JSON format first
        Optional<UserAction> jsonResult = parseJsonLog(logLine);
        if (jsonResult.isPresent()) {
            return jsonResult;
        }

        // Try Log4j2 format
        Optional<UserAction> log4jResult = parseLog4jLog(logLine);
        if (log4jResult.isPresent()) {
            return log4jResult;
        }

        // Try InjectLog4J format
        return parseInjectLog4jLog(logLine);
    }

    /**
     * Parse JSON structured logs.
     */
    private Optional<UserAction> parseJsonLog(String logLine) {
        if (!logLine.trim().startsWith("{")) {
            return Optional.empty();
        }

        try {
            JsonNode root = objectMapper.readTree(logLine);
            UserAction.LPSBuilder builder = UserAction.lpsBuilder();

            // Parse timestamp
            if (root.has("timestamp")) {
                builder.withTimestamp(parseTimestamp(root.get("timestamp").asText()));
            }

            // Parse user info
            if (root.has("user")) {
                JsonNode user = root.get("user");
                builder.withUser(
                        user.has("id") ? user.get("id").asText() : null,
                        user.has("email") ? user.get("email").asText() : null,
                        user.has("name") ? user.get("name").asText() : null);
            }

            // Parse action info
            if (root.has("action")) {
                JsonNode action = root.get("action");
                OperationType opType = parseOperationType(
                        action.has("operation") ? action.get("operation").asText() : null);
                builder.withAction(
                        opType,
                        action.has("class") ? action.get("class").asText() : null,
                        action.has("method") ? action.get("method").asText() : null);
            }

            // Parse target info
            if (root.has("target")) {
                JsonNode target = root.get("target");
                EntityType entityType = parseEntityType(
                        target.has("entity") ? target.get("entity").asText() : null);
                builder.withTarget(
                        entityType,
                        target.has("id") ? target.get("id").asText() : null);
            }

            // Parse context (product info)
            if (root.has("context")) {
                JsonNode context = root.get("context");
                builder.withProductContext(
                        context.has("productName") ? context.get("productName").asText() : null,
                        context.has("price") ? context.get("price").asDouble() : null);
            }

            // Parse result
            if (root.has("result")) {
                JsonNode result = root.get("result");
                builder.withResult(
                        !result.has("successful") || result.get("successful").asBoolean(),
                        result.has("details") ? result.get("details").asText() : null);
                if (result.has("error")) {
                    builder.withError(result.get("error").asText());
                }
            }

            return Optional.of(builder.build());

        } catch (JsonProcessingException e) {
            log.trace("Failed to parse as JSON: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Parse standard Log4j2 format logs.
     */
    private Optional<UserAction> parseLog4jLog(String logLine) {
        Matcher matcher = LOG4J_PATTERN.matcher(logLine);
        if (!matcher.matches()) {
            return Optional.empty();
        }

        String timestamp = matcher.group(1);
        String thread = matcher.group(2);
        String level = matcher.group(3);
        String logger = matcher.group(4);
        String message = matcher.group(5);

        return parseMessageToAction(timestamp, logger, message);
    }

    /**
     * Parse InjectLog4J format logs.
     */
    private Optional<UserAction> parseInjectLog4jLog(String logLine) {
        Matcher matcher = INJECT_LOG_PATTERN.matcher(logLine);
        if (!matcher.matches()) {
            return Optional.empty();
        }

        String timestamp = matcher.group(1);
        String className = matcher.group(2);
        String methodName = matcher.group(3);
        String message = matcher.group(4);

        UserAction.LPSBuilder builder = UserAction.lpsBuilder()
                .withTimestamp(parseTimestamp(timestamp));

        // Determine entity type and operation from class name
        EntityType entityType = className.toLowerCase().contains("product")
                ? EntityType.PRODUCT
                : EntityType.USER;

        OperationType opType = inferOperationFromMethod(methodName);
        builder.withAction(opType, className, methodName);
        builder.withTarget(entityType, extractEntityId(message));

        // Extract user info if present
        extractUserInfo(message, builder);

        // Extract product price if present
        extractProductPrice(message, builder);

        return Optional.of(builder.build());
    }

    /**
     * Parse a log message to extract action details.
     */
    private Optional<UserAction> parseMessageToAction(String timestamp, String logger, String message) {
        UserAction.LPSBuilder builder = UserAction.lpsBuilder()
                .withTimestamp(parseTimestamp(timestamp));

        Matcher methodMatcher = METHOD_CALL_PATTERN.matcher(message);
        if (methodMatcher.find()) {
            String action = methodMatcher.group(1);
            String entity = methodMatcher.group(2);
            String byField = methodMatcher.group(3);
            String details = methodMatcher.group(4);

            EntityType entityType = "product".equalsIgnoreCase(entity)
                    ? EntityType.PRODUCT
                    : EntityType.USER;

            OperationType opType = inferOperationFromAction(action, byField);
            builder.withAction(opType, logger, action.toLowerCase() + entity);
            builder.withTarget(entityType, details != null ? details.trim() : null);
        } else {
            // Try to infer from logger name
            EntityType entityType = logger.toLowerCase().contains("product")
                    ? EntityType.PRODUCT
                    : EntityType.USER;
            OperationType opType = inferOperationFromMessage(message);
            builder.withAction(opType, logger, null);
            builder.withTarget(entityType, extractEntityId(message));
        }

        // Extract additional info
        extractUserInfo(message, builder);
        extractProductPrice(message, builder);

        return Optional.of(builder.build());
    }

    /**
     * Parse multiple log lines.
     */
    public List<UserAction> parseLogLines(List<String> logLines) {
        List<UserAction> actions = new ArrayList<>();
        for (String line : logLines) {
            parseLogLine(line).ifPresent(actions::add);
        }
        return actions;
    }

    /**
     * Parse log content (multi-line string).
     */
    public List<UserAction> parseLogContent(String logContent) {
        if (logContent == null || logContent.isBlank()) {
            return List.of();
        }
        return parseLogLines(List.of(logContent.split("\\R")));
    }

    // Helper methods

    private LocalDateTime parseTimestamp(String timestamp) {
        if (timestamp == null) {
            return LocalDateTime.now();
        }
        try {
            return LocalDateTime.parse(timestamp, LOG4J_DATE_FORMAT);
        } catch (DateTimeParseException e) {
            try {
                return LocalDateTime.parse(timestamp);
            } catch (DateTimeParseException e2) {
                return LocalDateTime.now();
            }
        }
    }

    private OperationType parseOperationType(String opString) {
        if (opString == null) {
            return OperationType.GET_ALL;
        }
        try {
            return OperationType.valueOf(opString.toUpperCase());
        } catch (IllegalArgumentException e) {
            return OperationType.GET_ALL;
        }
    }

    private EntityType parseEntityType(String entityString) {
        if (entityString == null) {
            return EntityType.USER;
        }
        try {
            return EntityType.valueOf(entityString.toUpperCase());
        } catch (IllegalArgumentException e) {
            return entityString.toLowerCase().contains("product")
                    ? EntityType.PRODUCT
                    : EntityType.USER;
        }
    }

    private OperationType inferOperationFromMethod(String methodName) {
        if (methodName == null) {
            return OperationType.GET_ALL;
        }
        String lower = methodName.toLowerCase();
        if (lower.contains("getall") || lower.equals("findall")) {
            return OperationType.GET_ALL;
        } else if (lower.contains("getbyid") || lower.contains("findbyid")) {
            return OperationType.GET_BY_ID;
        } else if (lower.contains("getbyemail") || lower.contains("findbyemail")) {
            return OperationType.GET_BY_EMAIL;
        } else if (lower.contains("create") || lower.contains("add") || lower.contains("save")) {
            return OperationType.CREATE;
        } else if (lower.contains("update")) {
            return OperationType.UPDATE;
        } else if (lower.contains("delete") || lower.contains("remove")) {
            return OperationType.DELETE;
        } else if (lower.contains("search") || lower.contains("find")) {
            return OperationType.SEARCH;
        }
        return OperationType.GET_ALL;
    }

    private OperationType inferOperationFromAction(String action, String byField) {
        if (action == null) {
            return OperationType.GET_ALL;
        }
        String lower = action.toLowerCase();
        if (lower.contains("fetch") || lower.contains("get")) {
            if ("id".equalsIgnoreCase(byField)) {
                return OperationType.GET_BY_ID;
            } else if ("email".equalsIgnoreCase(byField)) {
                return OperationType.GET_BY_EMAIL;
            }
            return OperationType.GET_ALL;
        } else if (lower.contains("creat") || lower.contains("add")) {
            return OperationType.CREATE;
        } else if (lower.contains("updat")) {
            return OperationType.UPDATE;
        } else if (lower.contains("delet")) {
            return OperationType.DELETE;
        }
        return OperationType.GET_ALL;
    }

    private OperationType inferOperationFromMessage(String message) {
        if (message == null) {
            return OperationType.GET_ALL;
        }
        String lower = message.toLowerCase();
        if (lower.contains("created") || lower.contains("creating") || lower.contains("added")) {
            return OperationType.CREATE;
        } else if (lower.contains("updated") || lower.contains("updating")) {
            return OperationType.UPDATE;
        } else if (lower.contains("deleted") || lower.contains("deleting")) {
            return OperationType.DELETE;
        } else if (lower.contains("by id")) {
            return OperationType.GET_BY_ID;
        } else if (lower.contains("by email")) {
            return OperationType.GET_BY_EMAIL;
        } else if (lower.contains("all")) {
            return OperationType.GET_ALL;
        }
        return OperationType.GET_ALL;
    }

    private String extractEntityId(String message) {
        if (message == null) {
            return null;
        }
        // Try to find an ID pattern (UUID or alphanumeric)
        Pattern idPattern = Pattern.compile(
                "id[=:]\\s*([\\w-]+)|\\b([a-f0-9]{24})\\b|\\b([a-f0-9-]{36})\\b",
                Pattern.CASE_INSENSITIVE);
        Matcher matcher = idPattern.matcher(message);
        if (matcher.find()) {
            for (int i = 1; i <= matcher.groupCount(); i++) {
                if (matcher.group(i) != null) {
                    return matcher.group(i);
                }
            }
        }
        return null;
    }

    private void extractUserInfo(String message, UserAction.LPSBuilder builder) {
        Matcher matcher = USER_INFO_PATTERN.matcher(message);
        if (matcher.find()) {
            String userId = matcher.group(1);
            String userEmail = matcher.group(2);
            String userJson = matcher.group(3);

            if (userId != null || userEmail != null) {
                builder.withUser(userId, userEmail, null);
            } else if (userJson != null) {
                // Parse user JSON object
                Matcher emailInJson = Pattern.compile("email[=:]\\s*([\\w@.]+)").matcher(userJson);
                Matcher idInJson = Pattern.compile("id[=:]\\s*([\\w-]+)").matcher(userJson);
                builder.withUser(
                        idInJson.find() ? idInJson.group(1) : null,
                        emailInJson.find() ? emailInJson.group(1) : null,
                        null);
            }
        }
    }

    private void extractProductPrice(String message, UserAction.LPSBuilder builder) {
        Matcher matcher = PRODUCT_PRICE_PATTERN.matcher(message);
        if (matcher.find()) {
            try {
                double price = Double.parseDouble(matcher.group(1));
                builder.withProductContext(null, price);
            } catch (NumberFormatException e) {
                // Ignore invalid price
            }
        }
    }
}
