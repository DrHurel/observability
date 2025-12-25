package fr.umontpellier.observability.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import fr.umontpellier.observability.model.UserAction;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for LogParserService.
 * Tests the log parsing functionality as per TP3 Exercise 1 Question 5:
 * - Parsing structured logs (JSON format)
 * - Parsing Log4j2 format logs
 * - Parsing InjectLog4J format logs
 * - Extracting user actions for profile construction
 */
@DisplayName("LogParserService Tests")
class LogParserServiceTest {

    private LogParserService logParserService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules(); // For Java 8 date/time support
        logParserService = new LogParserService(objectMapper);
    }

    @Nested
    @DisplayName("JSON Log Parsing Tests")
    class JsonLogParsingTests {

        @Test
        @DisplayName("Should parse valid JSON structured log")
        void shouldParseValidJsonStructuredLog() {
            // Given
            String jsonLog = """
                    {
                        "timestamp": "2025-12-25T10:30:00",
                        "user": {
                            "id": "user-123",
                            "email": "user@example.com",
                            "name": "John Doe"
                        },
                        "action": {
                            "operation": "GET_ALL",
                            "class": "ProductService",
                            "method": "getAllProducts"
                        },
                        "target": {
                            "entity": "PRODUCT"
                        },
                        "result": {
                            "successful": true
                        }
                    }
                    """;

            // When
            Optional<UserAction> result = logParserService.parseLogLine(jsonLog);

            // Then
            assertTrue(result.isPresent());
            UserAction action = result.get();
            assertEquals("user-123", action.getUserId());
            assertEquals("user@example.com", action.getUserEmail());
            assertEquals("John Doe", action.getUserName());
            assertEquals(UserAction.OperationType.GET_ALL, action.getOperationType());
            assertEquals(UserAction.EntityType.PRODUCT, action.getEntityType());
            assertTrue(action.isSuccessful());
        }

        @Test
        @DisplayName("Should parse JSON log with product context")
        void shouldParseJsonLogWithProductContext() {
            // Given
            String jsonLog = """
                    {
                        "timestamp": "2025-12-25T10:30:00",
                        "user": {
                            "email": "buyer@example.com"
                        },
                        "action": {
                            "operation": "GET_BY_ID"
                        },
                        "target": {
                            "entity": "PRODUCT",
                            "id": "prod-456"
                        },
                        "context": {
                            "productName": "Gaming Laptop",
                            "price": 1499.99
                        },
                        "result": {
                            "successful": true
                        }
                    }
                    """;

            // When
            Optional<UserAction> result = logParserService.parseLogLine(jsonLog);

            // Then
            assertTrue(result.isPresent());
            UserAction action = result.get();
            assertEquals("prod-456", action.getEntityId());
            assertEquals("Gaming Laptop", action.getProductName());
            assertEquals(1499.99, action.getProductPrice());
        }

        @Test
        @DisplayName("Should parse JSON log with error result")
        void shouldParseJsonLogWithErrorResult() {
            // Given
            String jsonLog = """
                    {
                        "timestamp": "2025-12-25T10:30:00",
                        "user": {
                            "id": "user-456"
                        },
                        "action": {
                            "operation": "DELETE"
                        },
                        "target": {
                            "entity": "PRODUCT",
                            "id": "nonexistent"
                        },
                        "result": {
                            "successful": false,
                            "error": "Product not found"
                        }
                    }
                    """;

            // When
            Optional<UserAction> result = logParserService.parseLogLine(jsonLog);

            // Then
            assertTrue(result.isPresent());
            UserAction action = result.get();
            assertFalse(action.isSuccessful());
            assertEquals("Product not found", action.getErrorMessage());
        }

        @Test
        @DisplayName("Should return empty for invalid JSON")
        void shouldReturnEmptyForInvalidJson() {
            // Given
            String invalidJson = "{ invalid json }";

            // When
            Optional<UserAction> result = logParserService.parseLogLine(invalidJson);

            // Then
            assertTrue(result.isEmpty());
        }
    }

    @Nested
    @DisplayName("Log4j2 Format Parsing Tests")
    class Log4j2FormatParsingTests {

        @Test
        @DisplayName("Should parse Log4j2 format log with product fetch")
        void shouldParseLog4j2FormatLogWithProductFetch() {
            // Given
            String log4jLog = "2025-12-25 10:30:00.123 [main] INFO fr.umontpellier.observability.service.ProductService - Fetching all products";

            // When
            Optional<UserAction> result = logParserService.parseLogLine(log4jLog);

            // Then
            assertTrue(result.isPresent());
            UserAction action = result.get();
            assertEquals(UserAction.EntityType.PRODUCT, action.getEntityType());
            assertEquals(UserAction.ActionType.READ, action.getActionType());
        }

        @Test
        @DisplayName("Should parse Log4j2 format log with user creation")
        void shouldParseLog4j2FormatLogWithUserCreation() {
            // Given
            String log4jLog = "2025-12-25 10:30:00.456 [http-nio-8080-exec-1] INFO fr.umontpellier.observability.service.UserService - Creating user: john@example.com";

            // When
            Optional<UserAction> result = logParserService.parseLogLine(log4jLog);

            // Then
            assertTrue(result.isPresent());
            UserAction action = result.get();
            assertEquals(UserAction.EntityType.USER, action.getEntityType());
            assertEquals(UserAction.ActionType.WRITE, action.getActionType());
        }

        @Test
        @DisplayName("Should parse Log4j2 format log with product update")
        void shouldParseLog4j2FormatLogWithProductUpdate() {
            // Given
            String log4jLog = "2025-12-25 10:30:00.789 [http-nio-8080-exec-2] INFO fr.umontpellier.observability.service.ProductService - Updating product by id: prod-123";

            // When
            Optional<UserAction> result = logParserService.parseLogLine(log4jLog);

            // Then
            assertTrue(result.isPresent());
            UserAction action = result.get();
            assertEquals(UserAction.EntityType.PRODUCT, action.getEntityType());
            assertEquals(UserAction.ActionType.WRITE, action.getActionType());
        }

        @Test
        @DisplayName("Should parse Log4j2 format log with product deletion")
        void shouldParseLog4j2FormatLogWithProductDeletion() {
            // Given
            String log4jLog = "2025-12-25 10:30:00.999 [http-nio-8080-exec-3] INFO fr.umontpellier.observability.service.ProductService - Deleting product by id: prod-456";

            // When
            Optional<UserAction> result = logParserService.parseLogLine(log4jLog);

            // Then
            assertTrue(result.isPresent());
            UserAction action = result.get();
            assertEquals(UserAction.EntityType.PRODUCT, action.getEntityType());
            assertEquals(UserAction.ActionType.WRITE, action.getActionType());
        }
    }

    @Nested
    @DisplayName("Empty and Null Input Tests")
    class EmptyAndNullInputTests {

        @ParameterizedTest(name = "Should return empty for input: {0}")
        @NullAndEmptySource
        @ValueSource(strings = { "   " })
        @DisplayName("Should return empty for null, empty, or blank input")
        void shouldReturnEmptyForInvalidInput(String input) {
            // When
            Optional<UserAction> result = logParserService.parseLogLine(input);

            // Then
            assertTrue(result.isEmpty());
        }
    }

    @Nested
    @DisplayName("Log Content Batch Parsing Tests")
    class LogContentBatchParsingTests {

        @Test
        @DisplayName("Should parse multiple log lines from content")
        void shouldParseMultipleLogLinesFromContent() {
            // Given
            String logContent = """
                    2025-12-25 10:30:00.123 [main] INFO fr.umontpellier.observability.service.ProductService - Fetching all products
                    2025-12-25 10:30:01.456 [main] INFO fr.umontpellier.observability.service.UserService - Creating user: test@example.com
                    2025-12-25 10:30:02.789 [main] INFO fr.umontpellier.observability.service.ProductService - Deleting product by id: prod-123
                    """;

            // When
            List<UserAction> actions = logParserService.parseLogContent(logContent);

            // Then
            assertFalse(actions.isEmpty());
            // Each parseable line should produce an action
        }

        @Test
        @DisplayName("Should skip unparseable lines in content")
        void shouldSkipUnparseableLinesInContent() {
            // Given
            String logContent = """
                    This is not a valid log line
                    Another invalid line
                    2025-12-25 10:30:00.123 [main] INFO fr.umontpellier.observability.service.ProductService - Fetching all products
                    Yet another invalid line
                    """;

            // When
            List<UserAction> actions = logParserService.parseLogContent(logContent);

            // Then
            // Should only have the one valid log line parsed
            assertTrue(actions.size() >= 1);
        }

        @Test
        @DisplayName("Should return empty list for empty content")
        void shouldReturnEmptyListForEmptyContent() {
            // When
            List<UserAction> actions = logParserService.parseLogContent("");

            // Then
            assertTrue(actions.isEmpty());
        }

        @Test
        @DisplayName("Should return empty list for null content")
        void shouldReturnEmptyListForNullContent() {
            // When
            List<UserAction> actions = logParserService.parseLogContent(null);

            // Then
            assertTrue(actions.isEmpty());
        }
    }

    @Nested
    @DisplayName("Operation Type Mapping Tests")
    class OperationTypeMappingTests {

        @Test
        @DisplayName("Should correctly identify READ operations")
        void shouldCorrectlyIdentifyReadOperations() {
            // Given - fetching operations
            String fetchLog = "2025-12-25 10:30:00.123 [main] INFO fr.umontpellier.observability.service.ProductService - Fetching product by id: prod-123";

            // When
            Optional<UserAction> result = logParserService.parseLogLine(fetchLog);

            // Then
            assertTrue(result.isPresent());
            assertEquals(UserAction.ActionType.READ, result.get().getActionType());
        }

        @Test
        @DisplayName("Should correctly identify WRITE operations for create")
        void shouldCorrectlyIdentifyWriteOperationsForCreate() {
            // Given - creating operation
            String createLog = "2025-12-25 10:30:00.123 [main] INFO fr.umontpellier.observability.service.ProductService - Adding product: New Product";

            // When
            Optional<UserAction> result = logParserService.parseLogLine(createLog);

            // Then
            assertTrue(result.isPresent());
            assertEquals(UserAction.ActionType.WRITE, result.get().getActionType());
        }
    }

    @Nested
    @DisplayName("User Info Extraction Tests")
    class UserInfoExtractionTests {

        @Test
        @DisplayName("Should extract userId from log message")
        void shouldExtractUserIdFromLogMessage() {
            // Given
            String logWithUserId = "2025-12-25 10:30:00.123 [main] INFO fr.umontpellier.observability.service.ProductService - Fetching products userId=user-123";

            // When
            Optional<UserAction> result = logParserService.parseLogLine(logWithUserId);

            // Then
            assertTrue(result.isPresent());
            assertEquals("user-123", result.get().getUserId());
        }

        @Test
        @DisplayName("Should extract userEmail from log message")
        void shouldExtractUserEmailFromLogMessage() {
            // Given
            String logWithEmail = "2025-12-25 10:30:00.123 [main] INFO fr.umontpellier.observability.service.ProductService - Fetching products userEmail=test@example.com";

            // When
            Optional<UserAction> result = logParserService.parseLogLine(logWithEmail);

            // Then
            assertTrue(result.isPresent());
            assertEquals("test@example.com", result.get().getUserEmail());
        }
    }

    @Nested
    @DisplayName("Product Price Extraction Tests")
    class ProductPriceExtractionTests {

        @Test
        @DisplayName("Should extract product price from log message")
        void shouldExtractProductPriceFromLogMessage() {
            // Given
            String logWithPrice = "2025-12-25 10:30:00.123 [main] INFO fr.umontpellier.observability.service.ProductService - Fetching product price=199.99";

            // When
            Optional<UserAction> result = logParserService.parseLogLine(logWithPrice);

            // Then
            assertTrue(result.isPresent());
            assertEquals(199.99, result.get().getProductPrice());
        }
    }
}
