package fr.umontpellier.injectlog4j.formatter;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Formats log messages by replacing placeholders with actual values.
 * 
 * Supported placeholders:
 * - {{time}} - Current timestamp
 * - {{message}} - The log message
 * - {{value}} - Return value or exception
 * - {{method}} - Method name
 * - {{class}} - Class name
 * - {{args}} - Method arguments
 * - {{exception}} - Exception message (if any)
 */
public class MessageFormatter {

    private static final Pattern PLACEHOLDER_PATTERN = Pattern.compile("\\{\\{(\\w+)\\}\\}");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

    private static final String KEY_MESSAGE = "message";
    private static final String KEY_VALUE = "value";
    private static final String KEY_METHOD = "method";
    private static final String KEY_CLASS = "class";
    private static final String KEY_EXCEPTION = "exception";

    private final String format;

    public MessageFormatter(String format) {
        this.format = format != null ? format : "{{time}} {{message}}";
    }

    /**
     * Format a message with the given context values.
     * 
     * @param context map of placeholder names to values
     * @return the formatted message
     */
    public String format(Map<String, Object> context) {
        if (format == null) {
            return context.getOrDefault(KEY_MESSAGE, "").toString();
        }

        StringBuffer result = new StringBuffer();
        Matcher matcher = PLACEHOLDER_PATTERN.matcher(format);

        while (matcher.find()) {
            String placeholder = matcher.group(1);
            String replacement = getReplacementValue(placeholder, context);
            matcher.appendReplacement(result, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(result);

        return result.toString();
    }

    /**
     * Format the message content (which may contain placeholders) with the context.
     */
    private String formatMessageContent(String message, Map<String, Object> context) {
        if (message == null) {
            return "";
        }
        StringBuffer result = new StringBuffer();
        Matcher matcher = PLACEHOLDER_PATTERN.matcher(message);

        while (matcher.find()) {
            String placeholder = matcher.group(1);
            String replacement = getSimpleReplacementValue(placeholder, context);
            matcher.appendReplacement(result, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(result);

        return result.toString();
    }

    /**
     * Get replacement value without recursion (for message content formatting).
     */
    private String getSimpleReplacementValue(String placeholder, Map<String, Object> context) {
        return switch (placeholder) {
            case "time" -> LocalDateTime.now().format(TIME_FORMATTER);
            case KEY_VALUE -> formatValue(context.get(KEY_VALUE));
            case KEY_METHOD -> String.valueOf(context.getOrDefault(KEY_METHOD, ""));
            case KEY_CLASS -> String.valueOf(context.getOrDefault(KEY_CLASS, ""));
            case "args" -> formatArgs(context.get("args"));
            case KEY_EXCEPTION -> formatException(context.get(KEY_EXCEPTION));
            default -> context.containsKey(placeholder)
                    ? String.valueOf(context.get(placeholder))
                    : "{{" + placeholder + "}}";
        };
    }

    private String getReplacementValue(String placeholder, Map<String, Object> context) {
        return switch (placeholder) {
            case "time" -> LocalDateTime.now().format(TIME_FORMATTER);
            case KEY_MESSAGE -> formatMessageContent(
                    String.valueOf(context.getOrDefault(KEY_MESSAGE, "")), context);
            case KEY_VALUE -> formatValue(context.get(KEY_VALUE));
            case KEY_METHOD -> String.valueOf(context.getOrDefault(KEY_METHOD, ""));
            case KEY_CLASS -> String.valueOf(context.getOrDefault(KEY_CLASS, ""));
            case "args" -> formatArgs(context.get("args"));
            case KEY_EXCEPTION -> formatException(context.get(KEY_EXCEPTION));
            default -> context.containsKey(placeholder)
                    ? String.valueOf(context.get(placeholder))
                    : "{{" + placeholder + "}}";
        };
    }

    private String formatValue(Object value) {
        if (value == null) {
            return "null";
        }
        return value.toString();
    }

    private String formatArgs(Object args) {
        if (args == null) {
            return "[]";
        }
        if (args instanceof Object[] arr) {
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                if (i > 0)
                    sb.append(", ");
                sb.append(arr[i]);
            }
            sb.append("]");
            return sb.toString();
        }
        return String.valueOf(args);
    }

    private String formatException(Object exception) {
        if (exception == null) {
            return "";
        }
        if (exception instanceof Throwable t) {
            return t.getClass().getName() + ": " + t.getMessage();
        }
        return String.valueOf(exception);
    }
}
