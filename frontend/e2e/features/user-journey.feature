@functional @e2e @user-journey
Feature: Complete User Journey
  As a new customer
  I want to complete a full shopping experience
  So that I can browse, compare, and purchase products

  Background:
    Given the application is running
    And the database is clean for testing

  @smoke @registration
  Scenario Outline: New user registration with various valid data
    Given I am on the registration page
    When I register with the following details:
      | name     | <name>     |
      | email    | <email>    |
      | age      | <age>      |
      | password | <password> |
    Then I should be registered successfully
    And I should be redirected to the login page
    And I should see a welcome message containing "<name>"

    Examples:
      | name           | email                    | age | password        |
      | John Doe       | john.doe@example.com     | 25  | SecurePass123!  |
      | Alice Johnson  | alice.j@testmail.org     | 35  | MyP@ssw0rd2025  |
      | Bob Smith      | bob_smith@company.net    | 42  | Complex#Pass99  |
      | Marie Dupont   | marie.dupont@email.fr    | 28  | Fr@nc3P@ss!     |

  @critical @complete-journey
  Scenario: Complete end-to-end shopping journey for a new user
    # Step 1: Registration
    Given I am on the registration page
    When I register with the following details:
      | name     | E2E Test User          |
      | email    | e2e.test@journey.com   |
      | age      | 30                     |
      | password | JourneyTest2025!       |
    Then I should be registered successfully

    # Step 2: Login
    When I navigate to the login page
    And I login with email "e2e.test@journey.com" and password "JourneyTest2025!"
    Then I should be logged in successfully
    And I should see the user dashboard

    # Step 3: Browse products
    When I navigate to the marketplace
    Then I should see a list of available products
    And I should see product categories

    # Step 4: Search and filter products
    When I search for products with keyword "laptop"
    Then I should see filtered product results
    When I apply price filter from "500" to "2000"
    Then I should see products within the price range

    # Step 5: View product details
    When I click on the first product in the list
    Then I should see the product details page
    And I should see the product name
    And I should see the product price
    And I should see the product expiration date

    # Step 6: Add to cart (simulated by viewing)
    When I view multiple products in sequence:
      | product_index |
      | 1             |
      | 2             |
      | 3             |
    Then my browsing history should be recorded

    # Step 7: Logout
    When I logout from the application
    Then I should be redirected to the home page
    And I should see the login button

  @complex @multi-user
  Scenario: Multiple users interacting with the same product
    # Create first user
    Given a user exists with:
      | name  | Buyer One           |
      | email | buyer1@market.com   |
    And a user exists with:
      | name  | Buyer Two           |
      | email | buyer2@market.com   |
    And a product exists with:
      | name            | Shared Interest Product |
      | price           | 299.99                  |
      | expirationDate  | 2026-12-31              |

    # First user views the product
    When user "buyer1@market.com" logs in
    And user navigates to marketplace
    And user views product "Shared Interest Product"
    Then the product view should be recorded for user "buyer1@market.com"

    # Second user also views the same product
    When user "buyer1@market.com" logs out
    And user "buyer2@market.com" logs in
    And user navigates to marketplace
    And user views product "Shared Interest Product"
    Then the product view should be recorded for user "buyer2@market.com"

    # Verify both users have interaction history
    When I check the product interaction history
    Then both users should have viewed the product

  @edge-case @concurrent
  Scenario: Handling concurrent product updates
    Given a product exists with:
      | name   | Concurrent Test Product |
      | price  | 100.00                  |
    And I am logged in as an admin user
    When I open the product edit page in two browser tabs
    And I update the price to "150.00" in the first tab
    And I update the price to "200.00" in the second tab
    Then the final price should reflect the last update
    And the product update history should show both attempts

  @regression @session
  Scenario: User session management across multiple pages
    Given I am logged in as user "session.test@example.com"
    When I navigate through the following pages:
      | page        |
      | home        |
      | marketplace |
      | my-shop     |
      | profiles    |
      | admin       |
    Then my session should remain active on all pages
    And my user information should be consistent across all pages
    When I am inactive for 5 seconds
    Then my session should still be valid
    When I close and reopen the browser
    Then I should need to login again

  @performance @load
  Scenario: Rapid navigation stress test
    Given I am on the home page
    When I rapidly navigate between pages 10 times:
      | from        | to          |
      | home        | marketplace |
      | marketplace | my-shop     |
      | my-shop     | profiles    |
      | profiles    | home        |
    Then the application should remain responsive
    And no JavaScript errors should be present
    And all page transitions should complete within 3 seconds

  @data-integrity @validation
  Scenario: Form validation across the application
    Given I am on the registration page
    # Test empty form submission
    When I submit the form without filling any fields
    Then I should see validation errors for all required fields

    # Test invalid email format
    When I fill the email field with "invalid-email"
    And I submit the form
    Then I should see an email format validation error

    # Test password strength
    When I fill the password field with "weak"
    And I submit the form
    Then I should see a password strength validation error

    # Test age validation
    When I fill the age field with "-5"
    And I submit the form
    Then I should see an age validation error

    # Test successful submission with valid data
    When I fill all fields with valid data:
      | name     | Valid User             |
      | email    | valid@example.com      |
      | age      | 25                     |
      | password | ValidP@ssw0rd!         |
    And I submit the form
    Then I should be registered successfully
