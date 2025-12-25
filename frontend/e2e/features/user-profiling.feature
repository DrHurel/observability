@functional @profiling @tp3
Feature: User Profiling Based on Behavior
  As an observability system
  I want to analyze user behavior and create profiles
  So that users can be classified as READ_HEAVY, WRITE_HEAVY, or EXPENSIVE_SEEKER

  Background:
    Given the application is running
    And the profiling system is active
    And I clean up all test profiles

  @critical @read-heavy
  Scenario: User classified as READ_HEAVY after mostly read operations
    Given a user "read.heavy@profiles.test" exists
    And the user has no previous profile data
    
    When user "read.heavy@profiles.test" performs the following operations:
      | operation   | entity  | count |
      | GET_ALL     | product | 15    |
      | GET_BY_ID   | product | 25    |
      | GET_BY_ID   | user    | 5     |
      | CREATE      | product | 2     |
      | UPDATE      | product | 1     |
    
    Then the user profile should be calculated
    And the profile type should be "READ_HEAVY"
    And the read operations count should be 45
    And the write operations count should be 3
    And the read ratio should be greater than 0.7

  @critical @write-heavy
  Scenario: User classified as WRITE_HEAVY after mostly write operations
    Given a user "write.heavy@profiles.test" exists
    And the user has no previous profile data
    
    When user "write.heavy@profiles.test" performs the following operations:
      | operation | entity  | count |
      | CREATE    | product | 20    |
      | UPDATE    | product | 15    |
      | DELETE    | product | 10    |
      | GET_ALL   | product | 5     |
      | GET_BY_ID | product | 3     |
    
    Then the user profile should be calculated
    And the profile type should be "WRITE_HEAVY"
    And the write operations count should be 45
    And the read operations count should be 8
    And the read ratio should be less than 0.3

  @critical @expensive-seeker
  Scenario: User classified as EXPENSIVE_SEEKER when viewing high-priced products
    Given a user "luxury.buyer@profiles.test" exists
    And the user has no previous profile data
    And the following products exist:
      | name                | price    |
      | Budget Phone        | 99.99    |
      | Mid-Range Laptop    | 599.99   |
      | Premium Laptop      | 1499.99  |
      | Luxury Watch        | 2999.99  |
      | Designer Bag        | 3500.00  |
      | Sports Car Model    | 150.00   |
    
    When user "luxury.buyer@profiles.test" views products with context:
      | product          | price    |
      | Premium Laptop   | 1499.99  |
      | Luxury Watch     | 2999.99  |
      | Designer Bag     | 3500.00  |
      | Premium Laptop   | 1499.99  |
      | Budget Phone     | 99.99    |
      | Luxury Watch     | 2999.99  |
      | Mid-Range Laptop | 599.99   |
      | Designer Bag     | 3500.00  |
      | Premium Laptop   | 1499.99  |
      | Sports Car Model | 150.00   |
    
    Then the user profile should be calculated
    And the profile type should be "EXPENSIVE_SEEKER"
    And the expensive product searches count should be greater than 3
    And the average product price viewed should be greater than 500

  @edge-case @balanced
  Scenario: User classified as BALANCED with mixed operations
    Given a user "balanced@profiles.test" exists
    And the user has no previous profile data
    
    When user "balanced@profiles.test" performs the following operations:
      | operation | entity  | count |
      | GET_ALL   | product | 10    |
      | GET_BY_ID | product | 5     |
      | CREATE    | product | 8     |
      | UPDATE    | product | 5     |
      | DELETE    | product | 2     |
    
    Then the user profile should be calculated
    And the profile type should be "BALANCED"
    And the read ratio should be between 0.3 and 0.7

  @complex @profile-evolution
  Scenario: User profile evolves over time based on behavior changes
    Given a user "evolving@profiles.test" exists
    And the user has no previous profile data
    
    # Phase 1: Initially a reader
    When user "evolving@profiles.test" performs the following operations:
      | operation | entity  | count |
      | GET_ALL   | product | 20    |
      | GET_BY_ID | product | 10    |
    Then the profile type should be "READ_HEAVY"
    
    # Phase 2: Starts writing more
    When user "evolving@profiles.test" performs the following operations:
      | operation | entity  | count |
      | CREATE    | product | 30    |
      | UPDATE    | product | 20    |
    Then the profile type should be "WRITE_HEAVY"
    
    # Phase 3: Balances out
    When user "evolving@profiles.test" performs the following operations:
      | operation | entity  | count |
      | GET_ALL   | product | 25    |
      | GET_BY_ID | product | 20    |
    Then the profile type should be "BALANCED"

  @complex @multi-user-comparison
  Scenario: Compare profiles across multiple users with different behaviors
    Given the following users exist:
      | email                     | name           |
      | researcher@test.com      | The Researcher |
      | creator@test.com         | The Creator    |
      | luxury.shopper@test.com  | Luxury Shopper |
      | casual.browser@test.com  | Casual Browser |
    And expensive products exist with prices above 1000
    
    When user "researcher@test.com" performs 50 read operations
    And user "creator@test.com" performs 50 write operations
    And user "luxury.shopper@test.com" views 30 expensive products
    And user "casual.browser@test.com" performs 15 reads and 15 writes
    
    Then the profile statistics should show:
      | profileType      | count |
      | READ_HEAVY       | 1     |
      | WRITE_HEAVY      | 1     |
      | EXPENSIVE_SEEKER | 1     |
      | BALANCED         | 1     |
    
    And the top read users should include "researcher@test.com"
    And the top write users should include "creator@test.com"
    And the top expensive seekers should include "luxury.shopper@test.com"

  @api @profile-retrieval
  Scenario: Retrieve user profiles through the API
    Given the following user profiles exist:
      | email                | profileType      | readOps | writeOps | expensiveSearches |
      | api.read@test.com    | READ_HEAVY       | 100     | 10       | 5                 |
      | api.write@test.com   | WRITE_HEAVY      | 20      | 150      | 3                 |
      | api.seeker@test.com  | EXPENSIVE_SEEKER | 50      | 20       | 40                |
    
    When I request the profiles API endpoint
    Then I should receive a list of all profiles
    And each profile should have the required fields:
      | field                   |
      | userId                  |
      | userEmail               |
      | profileType             |
      | readOperations          |
      | writeOperations         |
      | expensiveProductSearches|
      | averageProductPriceViewed|
      | recentActions           |
    
    When I request profiles by type "READ_HEAVY"
    Then I should only receive READ_HEAVY profiles
    And the profile for "api.read@test.com" should be in the list

  @logging @lps
  Scenario: Verify structured logging captures user actions for profiling
    Given a user "logged.user@test.com" exists
    And the log parser service is active
    
    When user "logged.user@test.com" performs a product search
    Then a structured log entry should be created with:
      | field      | value                    |
      | timestamp  | current time             |
      | userId     | the user's id            |
      | userEmail  | logged.user@test.com     |
      | actionType | READ                     |
      | entityType | PRODUCT                  |
    
    When the log is parsed by the LogParserService
    Then a UserAction should be extracted
    And the action should update the user's profile

  @integration @kafka
  Scenario: Profile updates are published to Kafka
    Given a user "kafka.user@test.com" exists
    And the Kafka topic "user-profiles" exists
    
    When user "kafka.user@test.com" performs 10 read operations
    Then a profile update event should be published to Kafka
    And the event should contain the updated profile data

  @statistics @admin
  Scenario: Admin views comprehensive profile statistics
    Given multiple users with various profiles exist
    And I am logged in as an admin
    
    When I navigate to the admin dashboard
    And I view the profile statistics section
    Then I should see:
      | statistic                  |
      | Total number of profiles   |
      | Profile type distribution  |
      | Average read operations    |
      | Average write operations   |
      | Top 5 read-heavy users     |
      | Top 5 write-heavy users    |
      | Top 5 expensive seekers    |
    
    And the statistics should be accurate and up-to-date
