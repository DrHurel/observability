Feature: User Management
  As an administrator
  I want to manage users in the application
  So that I can create and view user information

  Background:
    Given the application is running
    And I am on the home page

  Scenario: View the home page
    Then I should see the application title "ShopTrack"
    And I should see the navigation menu
    And I should see navigation links for "Home" and "Marketplace"

  Scenario: Navigate to registration page
    When I click on the "Register" button
    Then I should be on the register page
    And I should see the page title "Register"

  Scenario: Register a new user successfully
    When I click on the "Register" button
    Then I should be on the register page
    When I fill in the registration form with:
      | field    | value              |
      | name     | John Doe           |
      | email    | john@example.com   |
      | password | SecurePass123!     |
    And I click on the "Register" submit button
    Then I should see a success message
    And I should be redirected to the login page

  Scenario: Validation errors when registering with invalid data
    When I click on the "Register" button
    Then I should be on the register page
    When I fill in the registration form with:
      | field    | value        |
      | name     |              |
      | email    | invalid-email|
      | password |              |
    And I click on the "Register" submit button
    Then I should see validation errors

  Scenario: Login after registration
    Given a user exists with email "alice@example.com" and password "AlicePass123!"
    When I click on the "Login" button
    Then I should be on the login page
    When I fill in the login form with:
      | field    | value             |
      | email    | alice@example.com |
      | password | AlicePass123!     |
    And I click on the "Login" submit button
    Then I should be logged in successfully
    And I should see user menu options

  Scenario: Access profile page when logged in
    Given I am logged in as "bob@example.com"
    When I navigate to the profiles page
    Then I should see the profiles page
