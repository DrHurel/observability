package fr.umontpellier.observability.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for UserProfile model.
 * Tests the user profiling functionality as per TP3 Exercise 1 Question 3:
 * - READ_HEAVY profile: users who mostly perform read operations
 * - WRITE_HEAVY profile: users who mostly perform write operations
 * - EXPENSIVE_SEEKER profile: users who search for expensive products
 * - BALANCED profile: users with mixed activity patterns
 */
@DisplayName("UserProfile Model Tests")
class UserProfileTest {

    private UserProfile profile;

    @BeforeEach
    void setUp() {
        profile = UserProfile.builder()
                .userId("user-123")
                .userName("Test User")
                .userEmail("test@example.com")
                .expensiveThreshold(100.0)
                .profileType(UserProfile.ProfileType.BALANCED)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("Profile Type Calculation Tests")
    class ProfileTypeCalculationTests {

        @Test
        @DisplayName("Should classify as READ_HEAVY when read ratio > 0.7")
        void shouldClassifyAsReadHeavyWhenMostlyReads() {
            // Given: 8 reads, 2 writes = 80% reads
            for (int i = 0; i < 8; i++) {
                profile.incrementReadOperations();
            }
            for (int i = 0; i < 2; i++) {
                profile.incrementWriteOperations();
            }

            // When
            profile.calculateProfileType();

            // Then
            assertEquals(UserProfile.ProfileType.READ_HEAVY, profile.getProfileType());
        }

        @Test
        @DisplayName("Should classify as WRITE_HEAVY when read ratio < 0.3")
        void shouldClassifyAsWriteHeavyWhenMostlyWrites() {
            // Given: 2 reads, 8 writes = 20% reads
            for (int i = 0; i < 2; i++) {
                profile.incrementReadOperations();
            }
            for (int i = 0; i < 8; i++) {
                profile.incrementWriteOperations();
            }

            // When
            profile.calculateProfileType();

            // Then
            assertEquals(UserProfile.ProfileType.WRITE_HEAVY, profile.getProfileType());
        }

        @Test
        @DisplayName("Should classify as EXPENSIVE_SEEKER when expensive ratio > 0.3")
        void shouldClassifyAsExpensiveSeekerWhenMostlyExpensiveProducts() {
            // Given: 10 operations with 4 expensive product views (40%)
            for (int i = 0; i < 10; i++) {
                profile.incrementReadOperations();
            }
            // Record 4 expensive products (price > threshold of 100)
            for (int i = 0; i < 4; i++) {
                profile.recordProductPriceViewed(150.0);
            }

            // When
            profile.calculateProfileType();

            // Then
            assertEquals(UserProfile.ProfileType.EXPENSIVE_SEEKER, profile.getProfileType());
        }

        @Test
        @DisplayName("Should classify as BALANCED when mixed activity")
        void shouldClassifyAsBalancedWhenMixedActivity() {
            // Given: 5 reads, 5 writes = 50% reads
            for (int i = 0; i < 5; i++) {
                profile.incrementReadOperations();
            }
            for (int i = 0; i < 5; i++) {
                profile.incrementWriteOperations();
            }

            // When
            profile.calculateProfileType();

            // Then
            assertEquals(UserProfile.ProfileType.BALANCED, profile.getProfileType());
        }

        @Test
        @DisplayName("Should remain BALANCED when no operations")
        void shouldRemainBalancedWhenNoOperations() {
            // When
            profile.calculateProfileType();

            // Then
            assertEquals(UserProfile.ProfileType.BALANCED, profile.getProfileType());
        }
    }

    @Nested
    @DisplayName("Operation Tracking Tests")
    class OperationTrackingTests {

        @Test
        @DisplayName("Should increment read operations correctly")
        void shouldIncrementReadOperations() {
            // When
            profile.incrementReadOperations();
            profile.incrementReadOperations();
            profile.incrementReadOperations();

            // Then
            assertEquals(3, profile.getReadOperations());
        }

        @Test
        @DisplayName("Should increment write operations correctly")
        void shouldIncrementWriteOperations() {
            // When
            profile.incrementWriteOperations();
            profile.incrementWriteOperations();

            // Then
            assertEquals(2, profile.getWriteOperations());
        }

        @Test
        @DisplayName("Should update lastActivityAt on operations")
        void shouldUpdateLastActivityAtOnOperations() {
            // Given
            LocalDateTime before = LocalDateTime.now().minusSeconds(1);

            // When
            profile.incrementReadOperations();

            // Then
            assertNotNull(profile.getLastActivityAt());
            assertTrue(profile.getLastActivityAt().isAfter(before));
        }
    }

    @Nested
    @DisplayName("Product Price Tracking Tests")
    class ProductPriceTrackingTests {

        @Test
        @DisplayName("Should track expensive product searches above threshold")
        void shouldTrackExpensiveProductSearches() {
            // Given: threshold is 100.0
            profile.incrementReadOperations(); // Need at least one operation

            // When: view products with different prices
            profile.recordProductPriceViewed(50.0); // Not expensive
            profile.recordProductPriceViewed(150.0); // Expensive
            profile.recordProductPriceViewed(200.0); // Expensive

            // Then
            assertEquals(2, profile.getExpensiveProductSearches());
        }

        @Test
        @DisplayName("Should track max product price viewed")
        void shouldTrackMaxProductPriceViewed() {
            // When
            profile.recordProductPriceViewed(50.0);
            profile.recordProductPriceViewed(200.0);
            profile.recordProductPriceViewed(100.0);

            // Then
            assertEquals(200.0, profile.getMaxProductPriceViewed());
        }

        @Test
        @DisplayName("Should calculate average product price viewed")
        void shouldCalculateAverageProductPriceViewed() {
            // Given
            profile.incrementReadOperations();
            profile.incrementReadOperations();
            profile.incrementReadOperations();

            // When: view products with prices 100, 200, 300 = avg 200
            profile.recordProductPriceViewed(100.0);
            profile.recordProductPriceViewed(200.0);
            profile.recordProductPriceViewed(300.0);

            // Then: average should be calculated
            assertTrue(profile.getAverageProductPriceViewed() > 0);
        }
    }

    @Nested
    @DisplayName("Action History Tests")
    class ActionHistoryTests {

        @Test
        @DisplayName("Should add actions to recent actions list")
        void shouldAddActionsToRecentActionsList() {
            // Given
            UserProfile.ProfileAction action = UserProfile.ProfileAction.builder()
                    .actionType("READ")
                    .operationType("GET_ALL")
                    .targetEntity("PRODUCT")
                    .timestamp(LocalDateTime.now())
                    .build();

            // When
            profile.addAction(action);

            // Then
            assertEquals(1, profile.getRecentActions().size());
            assertEquals("READ", profile.getRecentActions().get(0).getActionType());
        }

        @Test
        @DisplayName("Should limit recent actions to 100")
        void shouldLimitRecentActionsTo100() {
            // When: add 120 actions
            for (int i = 0; i < 120; i++) {
                UserProfile.ProfileAction action = UserProfile.ProfileAction.builder()
                        .actionType("READ")
                        .operationType("GET_BY_ID")
                        .targetId(String.valueOf(i))
                        .timestamp(LocalDateTime.now())
                        .build();
                profile.addAction(action);
            }

            // Then: should only keep last 100
            assertEquals(100, profile.getRecentActions().size());
        }
    }

    @Nested
    @DisplayName("Builder Tests")
    class BuilderTests {

        @Test
        @DisplayName("Should build profile with all fields")
        void shouldBuildProfileWithAllFields() {
            // Given
            LocalDateTime now = LocalDateTime.now();

            // When
            UserProfile built = UserProfile.builder()
                    .id("profile-1")
                    .userId("user-1")
                    .userName("John Doe")
                    .userEmail("john@example.com")
                    .readOperations(10)
                    .writeOperations(5)
                    .expensiveProductSearches(3)
                    .expensiveThreshold(150.0)
                    .profileType(UserProfile.ProfileType.READ_HEAVY)
                    .averageProductPriceViewed(75.5)
                    .maxProductPriceViewed(200.0)
                    .createdAt(now)
                    .updatedAt(now)
                    .lastActivityAt(now)
                    .build();

            // Then
            assertEquals("profile-1", built.getId());
            assertEquals("user-1", built.getUserId());
            assertEquals("John Doe", built.getUserName());
            assertEquals("john@example.com", built.getUserEmail());
            assertEquals(10, built.getReadOperations());
            assertEquals(5, built.getWriteOperations());
            assertEquals(3, built.getExpensiveProductSearches());
            assertEquals(150.0, built.getExpensiveThreshold());
            assertEquals(UserProfile.ProfileType.READ_HEAVY, built.getProfileType());
        }

        @Test
        @DisplayName("Should build ProfileAction with all fields")
        void shouldBuildProfileActionWithAllFields() {
            // Given
            LocalDateTime timestamp = LocalDateTime.now();

            // When
            UserProfile.ProfileAction action = UserProfile.ProfileAction.builder()
                    .actionType("WRITE")
                    .operationType("CREATE")
                    .targetEntity("PRODUCT")
                    .targetId("prod-123")
                    .productPrice(99.99)
                    .timestamp(timestamp)
                    .details("Created new product")
                    .build();

            // Then
            assertEquals("WRITE", action.getActionType());
            assertEquals("CREATE", action.getOperationType());
            assertEquals("PRODUCT", action.getTargetEntity());
            assertEquals("prod-123", action.getTargetId());
            assertEquals(99.99, action.getProductPrice());
            assertEquals(timestamp, action.getTimestamp());
            assertEquals("Created new product", action.getDetails());
        }
    }

    @Nested
    @DisplayName("Summary Tests")
    class SummaryTests {

        @Test
        @DisplayName("Should generate correct summary string")
        void shouldGenerateCorrectSummary() {
            // Given
            profile.incrementReadOperations();
            profile.incrementReadOperations();
            profile.incrementWriteOperations();
            profile.recordProductPriceViewed(150.0);
            profile.calculateProfileType();

            // When
            String summary = profile.getSummary();

            // Then
            assertNotNull(summary);
            assertTrue(summary.contains("test@example.com"));
            assertTrue(summary.contains("reads=2"));
            assertTrue(summary.contains("writes=1"));
        }
    }
}
