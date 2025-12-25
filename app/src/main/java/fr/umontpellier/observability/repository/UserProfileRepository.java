package fr.umontpellier.observability.repository;

import fr.umontpellier.observability.model.UserProfile;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for UserProfile entities.
 * Provides methods to query and persist user behavioral profiles.
 */
@Repository
public interface UserProfileRepository extends MongoRepository<UserProfile, String> {

    /**
     * Find a profile by user ID.
     */
    Optional<UserProfile> findByUserId(String userId);

    /**
     * Find a profile by user email.
     */
    Optional<UserProfile> findByUserEmail(String userEmail);

    /**
     * Find all profiles with a specific profile type.
     */
    List<UserProfile> findByProfileType(UserProfile.ProfileType profileType);

    /**
     * Find profiles with read operations greater than the specified count.
     */
    List<UserProfile> findByReadOperationsGreaterThan(int count);

    /**
     * Find profiles with write operations greater than the specified count.
     */
    List<UserProfile> findByWriteOperationsGreaterThan(int count);

    /**
     * Find profiles that searched for expensive products.
     */
    List<UserProfile> findByExpensiveProductSearchesGreaterThan(int count);

    /**
     * Find top N profiles by read operations.
     */
    @Query(value = "{}", sort = "{ 'readOperations': -1 }")
    List<UserProfile> findTopByReadOperations();

    /**
     * Find top N profiles by write operations.
     */
    @Query(value = "{}", sort = "{ 'writeOperations': -1 }")
    List<UserProfile> findTopByWriteOperations();

    /**
     * Find top N profiles by expensive product searches.
     */
    @Query(value = "{}", sort = "{ 'expensiveProductSearches': -1 }")
    List<UserProfile> findTopByExpensiveProductSearches();

    /**
     * Check if a profile exists for a user.
     */
    boolean existsByUserId(String userId);

    /**
     * Check if a profile exists for an email.
     */
    boolean existsByUserEmail(String userEmail);

    /**
     * Delete profile by user ID.
     */
    void deleteByUserId(String userId);
}
