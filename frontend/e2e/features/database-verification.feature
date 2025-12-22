Feature: Database Content Verification
  As a tester
  I want to verify that data is correctly stored in the database
  So that I can ensure data persistence and integrity

  Background:
    Given the application is running
    And the database is accessible

  Scenario: Verify user is saved in database after creation
    Given I am on the user creation page
    When I fill in the user form with:
      | Field | Value                    |
      | Name  | Database Test User       |
      | Email | dbtest@example.com       |
    And I click on the "Create User" button
    Then I should see a success message
    And the user "dbtest@example.com" should exist in the database
    And the user "dbtest@example.com" should have name "Database Test User"

  Scenario: Verify product is saved in database after creation
    Given I am on the product creation page
    When I fill in the product form with:
      | Field       | Value              |
      | Name        | DB Test Product    |
      | Description | Test product for DB|
      | Price       | 99.99              |
    And I click on the "Create Product" button
    Then I should see a success message
    And the product "DB Test Product" should exist in the database
    And the product "DB Test Product" should have price "99.99"

  Scenario: Verify user list shows database content
    Given there are users in the database:
      | Name         | Email              |
      | User One     | user1@test.com     |
      | User Two     | user2@test.com     |
    When I navigate to the users page
    Then I should see "User One" in the user list
    And I should see "User Two" in the user list
    And the displayed users count should match database count

  Scenario: Verify product list shows database content
    Given there are products in the database:
      | Name      | Price  |
      | Product A | 10.00  |
      | Product B | 20.00  |
    When I navigate to the products page
    Then I should see "Product A" in the product list
    And I should see "Product B" in the product list
    And the displayed products count should match database count

  Scenario: Verify user data persistence after page reload
    Given I have created a user with email "persistent@test.com"
    When I reload the users page
    Then I should see the user "persistent@test.com" in the list
    And the user data in UI should match database content

  Scenario: Verify product update modifies database
    Given there is a product "Update Test Product" with price "50.00" in the database
    When I edit the product "Update Test Product"
    And I change the price to "75.00"
    And I submit the product form
    Then the product "Update Test Product" should have price "75.00" in the database

  Scenario: Verify data integrity after multiple operations
    Given I create a user with email "integrity@test.com"
    And I create a product with name "Integrity Product"
    When I navigate to the users page
    And I navigate to the products page
    Then the user "integrity@test.com" should still exist in the database
    And the product "Integrity Product" should still exist in the database
