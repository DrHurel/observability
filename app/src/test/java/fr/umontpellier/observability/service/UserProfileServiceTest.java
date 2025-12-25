package fr.umontpellier.observability.service;

import fr.umontpellier.observability.model.UserAction;
import fr.umontpellier.observability.model.UserAction.EntityType;
import fr.umontpellier.observability.model.UserAction.OperationType;
import fr.umontpellier.observability.model.UserProfile;
import fr.umontpellier.observability.model.UserProfile.ProfileType;
import fr.umontpellier.observability.repository.UserProfileRepository;
import fr.umontpellier.observability.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for UserProfileService.
 * Tests the user profiling functionality as per TP3 Exercise 1 Question 3:
 * - Recording user actions
 * - Classifying users into profile types
 * - Retrieving profiles by type (READ_HEAVY, WRITE_HEAVY, EXPENSIVE_SEEKER)
 * - Computing profile statistics
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserProfileService Tests")
@SuppressWarnings("null") // Suppress null-safety warnings for Mockito matchers
class UserProfileServiceTest {

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private LogParserService logParserService;

    @Mock
    private KafkaTemplate<String, String> kafkaTemplate;

    @InjectMocks
    private UserProfileService userProfileService;

    @Captor
    private ArgumentCaptor<UserProfile> profileCaptor;

    private UserProfile testProfile;

    @BeforeEach
    void setUp() {
        testProfile = UserProfile.builder()
                .id("profile-1")
                .userId("user-123")
                .userName("Test User")
                .userEmail("test@example.com")
                .expensiveThreshold(100.0)
                .profileType(ProfileType.BALANCED)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("Record Action Tests")
    class RecordActionTests {

        @Test
        @DisplayName("Should record READ action and increment read operations")
        void shouldRecordReadActionAndIncrementReadOperations() {
            // Given
            UserAction action = UserAction.lpsBuilder()
                    .withUser("user-123", "test@example.com", "Test User")
                    .withAction(OperationType.GET_ALL, "ProductService", "getAllProducts")
                    .withTarget(EntityType.PRODUCT, null)
                    .build();

            when(userProfileRepository.findByUserId("user-123")).thenReturn(Optional.of(testProfile));
            when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(i -> i.getArgument(0));

            // When
            userProfileService.recordAction(action);

            // Then
            verify(userProfileRepository).save(profileCaptor.capture());
            UserProfile savedProfile = profileCaptor.getValue();
            assertEquals(1, savedProfile.getReadOperations());
        }

        @Test
        @DisplayName("Should record WRITE action and increment write operations")
        void shouldRecordWriteActionAndIncrementWriteOperations() {
            // Given
            UserAction action = UserAction.lpsBuilder()
                    .withUser("user-123", "test@example.com", "Test User")
                    .withAction(OperationType.CREATE, "ProductService", "addProduct")
                    .withTarget(EntityType.PRODUCT, "prod-456")
                    .build();

            when(userProfileRepository.findByUserId("user-123")).thenReturn(Optional.of(testProfile));
            when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(i -> i.getArgument(0));

            // When
            userProfileService.recordAction(action);

            // Then
            verify(userProfileRepository).save(profileCaptor.capture());
            UserProfile savedProfile = profileCaptor.getValue();
            assertEquals(1, savedProfile.getWriteOperations());
        }

        @Test
        @DisplayName("Should track expensive product when price exceeds threshold")
        void shouldTrackExpensiveProductWhenPriceExceedsThreshold() {
            // Given
            testProfile.setExpensiveThreshold(100.0);
            UserAction action = UserAction.lpsBuilder()
                    .withUser("user-123", "test@example.com", "Test User")
                    .withAction(OperationType.GET_BY_ID, "ProductService", "getProductById")
                    .withTarget(EntityType.PRODUCT, "prod-789")
                    .withProductContext("Expensive Laptop", 1500.0)
                    .build();

            when(userProfileRepository.findByUserId("user-123")).thenReturn(Optional.of(testProfile));
            when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(i -> i.getArgument(0));

            // When
            userProfileService.recordAction(action);

            // Then
            verify(userProfileRepository).save(profileCaptor.capture());
            UserProfile savedProfile = profileCaptor.getValue();
            assertEquals(1, savedProfile.getExpensiveProductSearches());
            assertEquals(1500.0, savedProfile.getMaxProductPriceViewed());
        }

        @Test
        @DisplayName("Should create new profile if user does not have one")
        void shouldCreateNewProfileIfUserDoesNotHaveOne() {
            // Given - Use only email (no userId) to ensure findByUserEmail is called
            UserAction action = UserAction.lpsBuilder()
                    .withUser(null, "new@example.com", "New User")
                    .withAction(OperationType.GET_ALL, "ProductService", "getAllProducts")
                    .withTarget(EntityType.PRODUCT, null)
                    .build();

            when(userProfileRepository.findByUserEmail("new@example.com")).thenReturn(Optional.empty());
            when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(i -> i.getArgument(0));

            // When
            userProfileService.recordAction(action);

            // Then
            verify(userProfileRepository, atLeastOnce()).save(profileCaptor.capture());
            List<UserProfile> savedProfiles = profileCaptor.getAllValues();
            // New profile should be created with the email
            assertNotNull(savedProfiles.get(0).getUserEmail());
            assertEquals("new@example.com", savedProfiles.get(0).getUserEmail());
        }

        @Test
        @DisplayName("Should not record action when user context is null")
        void shouldNotRecordActionWhenUserContextIsNull() {
            // Given
            UserAction action = UserAction.lpsBuilder()
                    .withAction(OperationType.GET_ALL, "ProductService", "getAllProducts")
                    .withTarget(EntityType.PRODUCT, null)
                    .build();
            // No user info set

            // When
            userProfileService.recordAction(action);

            // Then
            verify(userProfileRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should handle null action gracefully")
        void shouldHandleNullActionGracefully() {
            // When
            userProfileService.recordAction((UserAction) null);

            // Then
            verify(userProfileRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Get Profile Tests")
    class GetProfileTests {

        @Test
        @DisplayName("Should get profile by user ID")
        void shouldGetProfileByUserId() {
            // Given
            when(userProfileRepository.findByUserId("user-123")).thenReturn(Optional.of(testProfile));

            // When
            Optional<UserProfile> result = userProfileService.getProfileByUserId("user-123");

            // Then
            assertTrue(result.isPresent());
            assertEquals("user-123", result.get().getUserId());
        }

        @Test
        @DisplayName("Should get profile by email")
        void shouldGetProfileByEmail() {
            // Given
            when(userProfileRepository.findByUserEmail("test@example.com")).thenReturn(Optional.of(testProfile));

            // When
            Optional<UserProfile> result = userProfileService.getProfileByEmail("test@example.com");

            // Then
            assertTrue(result.isPresent());
            assertEquals("test@example.com", result.get().getUserEmail());
        }

        @Test
        @DisplayName("Should return empty when profile not found")
        void shouldReturnEmptyWhenProfileNotFound() {
            // Given
            when(userProfileRepository.findByUserId("nonexistent")).thenReturn(Optional.empty());

            // When
            Optional<UserProfile> result = userProfileService.getProfileByUserId("nonexistent");

            // Then
            assertTrue(result.isEmpty());
        }
    }

    @Nested
    @DisplayName("Get Profiles By Type Tests")
    class GetProfilesByTypeTests {

        @Test
        @DisplayName("Should get READ_HEAVY profiles")
        void shouldGetReadHeavyProfiles() {
            // Given
            UserProfile readHeavyProfile = UserProfile.builder()
                    .userId("reader-1")
                    .profileType(ProfileType.READ_HEAVY)
                    .readOperations(100)
                    .writeOperations(10)
                    .build();

            when(userProfileRepository.findByProfileType(ProfileType.READ_HEAVY))
                    .thenReturn(List.of(readHeavyProfile));

            // When
            List<UserProfile> result = userProfileService.getReadHeavyUsers();

            // Then
            assertEquals(1, result.size());
            assertEquals(ProfileType.READ_HEAVY, result.get(0).getProfileType());
        }

        @Test
        @DisplayName("Should get WRITE_HEAVY profiles")
        void shouldGetWriteHeavyProfiles() {
            // Given
            UserProfile writeHeavyProfile = UserProfile.builder()
                    .userId("writer-1")
                    .profileType(ProfileType.WRITE_HEAVY)
                    .readOperations(10)
                    .writeOperations(100)
                    .build();

            when(userProfileRepository.findByProfileType(ProfileType.WRITE_HEAVY))
                    .thenReturn(List.of(writeHeavyProfile));

            // When
            List<UserProfile> result = userProfileService.getWriteHeavyUsers();

            // Then
            assertEquals(1, result.size());
            assertEquals(ProfileType.WRITE_HEAVY, result.get(0).getProfileType());
        }

        @Test
        @DisplayName("Should get EXPENSIVE_SEEKER profiles")
        void shouldGetExpensiveSeekerProfiles() {
            // Given
            UserProfile expensiveSeekerProfile = UserProfile.builder()
                    .userId("seeker-1")
                    .profileType(ProfileType.EXPENSIVE_SEEKER)
                    .expensiveProductSearches(50)
                    .averageProductPriceViewed(500.0)
                    .build();

            when(userProfileRepository.findByProfileType(ProfileType.EXPENSIVE_SEEKER))
                    .thenReturn(List.of(expensiveSeekerProfile));

            // When
            List<UserProfile> result = userProfileService.getExpensiveProductSeekers();

            // Then
            assertEquals(1, result.size());
            assertEquals(ProfileType.EXPENSIVE_SEEKER, result.get(0).getProfileType());
        }

        @Test
        @DisplayName("Should get profiles by any type")
        void shouldGetProfilesByAnyType() {
            // Given
            when(userProfileRepository.findByProfileType(ProfileType.BALANCED))
                    .thenReturn(List.of(testProfile));

            // When
            List<UserProfile> result = userProfileService.getProfilesByType(ProfileType.BALANCED);

            // Then
            assertEquals(1, result.size());
        }
    }

    @Nested
    @DisplayName("Profile Statistics Tests")
    class ProfileStatisticsTests {

        @Test
        @DisplayName("Should compute profile statistics")
        void shouldComputeProfileStatistics() {
            // Given
            UserProfile profile1 = UserProfile.builder()
                    .userId("user-1")
                    .profileType(ProfileType.READ_HEAVY)
                    .readOperations(100)
                    .writeOperations(10)
                    .expensiveProductSearches(5)
                    .build();

            UserProfile profile2 = UserProfile.builder()
                    .userId("user-2")
                    .profileType(ProfileType.WRITE_HEAVY)
                    .readOperations(20)
                    .writeOperations(80)
                    .expensiveProductSearches(15)
                    .build();

            when(userProfileRepository.findAll()).thenReturn(Arrays.asList(profile1, profile2));

            // When
            Map<String, Object> stats = userProfileService.getProfileStatistics();

            // Then
            assertEquals(2, stats.get("totalProfiles"));
            assertNotNull(stats.get("profileTypeDistribution"));
            assertNotNull(stats.get("averageReadOperations"));
            assertNotNull(stats.get("averageWriteOperations"));
            assertNotNull(stats.get("averageExpensiveSearches"));
            assertNotNull(stats.get("topReadUsers"));
            assertNotNull(stats.get("topWriteUsers"));
            assertNotNull(stats.get("topExpensiveSeekers"));
        }

        @Test
        @DisplayName("Should return empty statistics when no profiles")
        void shouldReturnEmptyStatisticsWhenNoProfiles() {
            // Given
            when(userProfileRepository.findAll()).thenReturn(List.of());

            // When
            Map<String, Object> stats = userProfileService.getProfileStatistics();

            // Then
            assertEquals(0, stats.get("totalProfiles"));
        }
    }

    @Nested
    @DisplayName("Process Logs Tests")
    class ProcessLogsTests {

        @Test
        @DisplayName("Should process log content and update profiles")
        void shouldProcessLogContentAndUpdateProfiles() {
            // Given
            String logContent = "Some log content";
            UserAction action = UserAction.lpsBuilder()
                    .withUser("user-123", "test@example.com", "Test User")
                    .withAction(OperationType.GET_ALL, "ProductService", "getAllProducts")
                    .build();

            when(logParserService.parseLogContent(logContent)).thenReturn(List.of(action));
            when(userProfileRepository.findByUserId("user-123")).thenReturn(Optional.of(testProfile));
            when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(i -> i.getArgument(0));

            // When
            int processed = userProfileService.processLogs(logContent);

            // Then
            assertEquals(1, processed);
            verify(userProfileRepository).save(any(UserProfile.class));
        }

        @Test
        @DisplayName("Should return zero when no actions found in logs")
        void shouldReturnZeroWhenNoActionsFoundInLogs() {
            // Given
            String logContent = "Invalid log content";
            when(logParserService.parseLogContent(logContent)).thenReturn(List.of());

            // When
            int processed = userProfileService.processLogs(logContent);

            // Then
            assertEquals(0, processed);
            verify(userProfileRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Direct Action Recording Tests")
    class DirectActionRecordingTests {

        @Test
        @DisplayName("Should record action directly from service call")
        void shouldRecordActionDirectlyFromServiceCall() {
            // Given
            when(userProfileRepository.findByUserId("user-123")).thenReturn(Optional.of(testProfile));
            when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(i -> i.getArgument(0));

            // When
            userProfileService.recordAction(
                    "user-123",
                    "test@example.com",
                    "Test User",
                    OperationType.GET_BY_ID,
                    EntityType.PRODUCT,
                    "prod-456",
                    299.99,
                    "Gaming Mouse");

            // Then
            verify(userProfileRepository).save(profileCaptor.capture());
            UserProfile savedProfile = profileCaptor.getValue();
            assertEquals(1, savedProfile.getReadOperations());
        }
    }
}
