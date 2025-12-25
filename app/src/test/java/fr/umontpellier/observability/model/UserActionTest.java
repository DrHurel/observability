package fr.umontpellier.observability.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for UserAction model.
 * Tests the LPS (Log Processing Structure) builder pattern as per TP3 Exercise
 * 1 Question 5.
 */
@DisplayName("UserAction Model Tests")
class UserActionTest {

    @Nested
    @DisplayName("ActionType Tests")
    class ActionTypeTests {

        @Test
        @DisplayName("READ action type should have correct description")
        void readActionTypeShouldHaveCorrectDescription() {
            assertEquals("Read operation - fetching data",
                    UserAction.ActionType.READ.getDescription());
        }

        @Test
        @DisplayName("WRITE action type should have correct description")
        void writeActionTypeShouldHaveCorrectDescription() {
            assertEquals("Write operation - creating, updating, or deleting data",
                    UserAction.ActionType.WRITE.getDescription());
        }

        @Test
        @DisplayName("SEARCH action type should have correct description")
        void searchActionTypeShouldHaveCorrectDescription() {
            assertEquals("Search operation - querying for specific data",
                    UserAction.ActionType.SEARCH.getDescription());
        }
    }

    @Nested
    @DisplayName("OperationType Tests")
    class OperationTypeTests {

        @Test
        @DisplayName("GET_ALL should map to READ action type")
        void getAllShouldMapToReadActionType() {
            assertEquals(UserAction.ActionType.READ,
                    UserAction.OperationType.GET_ALL.toActionType());
        }

        @Test
        @DisplayName("GET_BY_ID should map to READ action type")
        void getByIdShouldMapToReadActionType() {
            assertEquals(UserAction.ActionType.READ,
                    UserAction.OperationType.GET_BY_ID.toActionType());
        }

        @Test
        @DisplayName("GET_BY_EMAIL should map to READ action type")
        void getByEmailShouldMapToReadActionType() {
            assertEquals(UserAction.ActionType.READ,
                    UserAction.OperationType.GET_BY_EMAIL.toActionType());
        }

        @Test
        @DisplayName("SEARCH should map to READ action type")
        void searchShouldMapToReadActionType() {
            assertEquals(UserAction.ActionType.READ,
                    UserAction.OperationType.SEARCH.toActionType());
        }

        @Test
        @DisplayName("CREATE should map to WRITE action type")
        void createShouldMapToWriteActionType() {
            assertEquals(UserAction.ActionType.WRITE,
                    UserAction.OperationType.CREATE.toActionType());
        }

        @Test
        @DisplayName("UPDATE should map to WRITE action type")
        void updateShouldMapToWriteActionType() {
            assertEquals(UserAction.ActionType.WRITE,
                    UserAction.OperationType.UPDATE.toActionType());
        }

        @Test
        @DisplayName("DELETE should map to WRITE action type")
        void deleteShouldMapToWriteActionType() {
            assertEquals(UserAction.ActionType.WRITE,
                    UserAction.OperationType.DELETE.toActionType());
        }
    }

    @Nested
    @DisplayName("EntityType Tests")
    class EntityTypeTests {

        @Test
        @DisplayName("USER entity type should exist")
        void userEntityTypeShouldExist() {
            assertNotNull(UserAction.EntityType.USER);
        }

        @Test
        @DisplayName("PRODUCT entity type should exist")
        void productEntityTypeShouldExist() {
            assertNotNull(UserAction.EntityType.PRODUCT);
        }
    }

    @Nested
    @DisplayName("LPS Builder Tests")
    class LPSBuilderTests {

        @Test
        @DisplayName("Should build UserAction with user info")
        void shouldBuildUserActionWithUserInfo() {
            // When
            UserAction action = UserAction.lpsBuilder()
                    .withUser("user-123", "user@example.com", "John Doe")
                    .build();

            // Then
            assertEquals("user-123", action.getUserId());
            assertEquals("user@example.com", action.getUserEmail());
            assertEquals("John Doe", action.getUserName());
        }

        @Test
        @DisplayName("Should build UserAction with action info")
        void shouldBuildUserActionWithActionInfo() {
            // When
            UserAction action = UserAction.lpsBuilder()
                    .withAction(UserAction.OperationType.GET_ALL, "ProductService", "getAllProducts")
                    .build();

            // Then
            assertEquals(UserAction.OperationType.GET_ALL, action.getOperationType());
            assertEquals(UserAction.ActionType.READ, action.getActionType());
            assertEquals("ProductService", action.getClassName());
            assertEquals("getAllProducts", action.getMethodName());
        }

        @Test
        @DisplayName("Should build UserAction with target info")
        void shouldBuildUserActionWithTargetInfo() {
            // When
            UserAction action = UserAction.lpsBuilder()
                    .withTarget(UserAction.EntityType.PRODUCT, "prod-456")
                    .build();

            // Then
            assertEquals(UserAction.EntityType.PRODUCT, action.getEntityType());
            assertEquals("prod-456", action.getEntityId());
        }

        @Test
        @DisplayName("Should build UserAction with product context")
        void shouldBuildUserActionWithProductContext() {
            // When
            UserAction action = UserAction.lpsBuilder()
                    .withProductContext("Laptop Pro", 999.99)
                    .build();

            // Then
            assertEquals("Laptop Pro", action.getProductName());
            assertEquals(999.99, action.getProductPrice());
        }

        @Test
        @DisplayName("Should build UserAction with result info")
        void shouldBuildUserActionWithResultInfo() {
            // When
            UserAction action = UserAction.lpsBuilder()
                    .withResult(true, "Operation completed successfully")
                    .build();

            // Then
            assertTrue(action.isSuccessful());
            assertEquals("Operation completed successfully", action.getDetails());
        }

        @Test
        @DisplayName("Should build UserAction with timestamp")
        void shouldBuildUserActionWithTimestamp() {
            // Given
            LocalDateTime timestamp = LocalDateTime.of(2025, 12, 25, 10, 30, 0);

            // When
            UserAction action = UserAction.lpsBuilder()
                    .withTimestamp(timestamp)
                    .build();

            // Then
            assertEquals(timestamp, action.getTimestamp());
        }

        @Test
        @DisplayName("Should build complete UserAction with all LPS components")
        void shouldBuildCompleteUserActionWithAllLPSComponents() {
            // Given
            LocalDateTime timestamp = LocalDateTime.now();

            // When
            UserAction action = UserAction.lpsBuilder()
                    .withTimestamp(timestamp)
                    .withUser("user-123", "user@example.com", "John Doe")
                    .withAction(UserAction.OperationType.GET_BY_ID, "ProductService", "getProductById")
                    .withTarget(UserAction.EntityType.PRODUCT, "prod-456")
                    .withProductContext("Gaming Laptop", 1499.99)
                    .withResult(true, "Product retrieved successfully")
                    .build();

            // Then - Verify LPS structure
            // Timestamp component
            assertEquals(timestamp, action.getTimestamp());

            // User component
            assertEquals("user-123", action.getUserId());
            assertEquals("user@example.com", action.getUserEmail());
            assertEquals("John Doe", action.getUserName());

            // Action component
            assertEquals(UserAction.OperationType.GET_BY_ID, action.getOperationType());
            assertEquals(UserAction.ActionType.READ, action.getActionType());
            assertEquals("ProductService", action.getClassName());
            assertEquals("getProductById", action.getMethodName());

            // Target component
            assertEquals(UserAction.EntityType.PRODUCT, action.getEntityType());
            assertEquals("prod-456", action.getEntityId());

            // Context component
            assertEquals("Gaming Laptop", action.getProductName());
            assertEquals(1499.99, action.getProductPrice());

            // Result component
            assertTrue(action.isSuccessful());
            assertEquals("Product retrieved successfully", action.getDetails());
        }
    }

    @Nested
    @DisplayName("Standard Builder Tests")
    class StandardBuilderTests {

        @Test
        @DisplayName("Should build UserAction with standard builder")
        void shouldBuildUserActionWithStandardBuilder() {
            // Given
            LocalDateTime timestamp = LocalDateTime.now();

            // When
            UserAction action = UserAction.builder()
                    .timestamp(timestamp)
                    .userId("user-789")
                    .userEmail("test@test.com")
                    .userName("Test User")
                    .actionType(UserAction.ActionType.WRITE)
                    .operationType(UserAction.OperationType.CREATE)
                    .entityType(UserAction.EntityType.PRODUCT)
                    .entityId("new-prod-1")
                    .productName("New Product")
                    .productPrice(49.99)
                    .successful(true)
                    .build();

            // Then
            assertEquals(timestamp, action.getTimestamp());
            assertEquals("user-789", action.getUserId());
            assertEquals("test@test.com", action.getUserEmail());
            assertEquals("Test User", action.getUserName());
            assertEquals(UserAction.ActionType.WRITE, action.getActionType());
            assertEquals(UserAction.OperationType.CREATE, action.getOperationType());
            assertEquals(UserAction.EntityType.PRODUCT, action.getEntityType());
            assertEquals("new-prod-1", action.getEntityId());
            assertEquals("New Product", action.getProductName());
            assertEquals(49.99, action.getProductPrice());
            assertTrue(action.isSuccessful());
        }
    }
}
