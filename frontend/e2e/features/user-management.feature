Feature: User Management
  As an administrator
  I want to manage users in the application
  So that I can create and view user information

  Background:
    Given the application is running
    And I am on the home page

  Scenario: View the home page
    Then I should see the application title "Observability Application"
    And I should see the navigation menu
    And I should see navigation links for "Home", "Users", and "Products"

  Scenario: Navigate to users page
    When I click on the "Users" navigation link
    Then I should be on the users page
    And I should see the page title "Users"
    And I should see a "Create New User" button

  Scenario: Create a new user successfully
    When I click on the "Users" navigation link
    And I click on the "Create New User" button
    Then I should be on the user creation page
    When I fill in the user form with:
      | field    | value              |
      | name     | John Doe           |
      | email    | john@example.com   |
      | age      | 30                 |
      | password | SecurePass123      |
    And I click on the "Create User" button
    Then I should see a success message "User created successfully"
    And I should be redirected to the users page
    And I should see "John Doe" in the users list

  Scenario: Validation errors when creating user with invalid data
    When I click on the "Users" navigation link
    And I click on the "Create New User" button
    And I fill in the user form with:
      | field    | value        |
      | name     |              |
      | email    | invalid-email|
      | age      | -5           |
      | password |              |
    And I click on the "Create User" button
    Then I should see validation error "Name is required"
    And I should see validation error "Valid email is required"
    And I should see validation error "Age must be 0 or greater"
    And I should see validation error "Password is required"

  Scenario: View all users
    Given users exist in the system:
      | name        | email              | age |
      | Alice Smith | alice@example.com  | 25  |
      | Bob Johnson | bob@example.com    | 35  |
    When I click on the "Users" navigation link
    Then I should see 2 users in the list
    And I should see "Alice Smith" in the users list
    And I should see "Bob Johnson" in the users list

  Scenario: Empty state when no users exist
    Given no users exist in the system
    When I click on the "Users" navigation link
    Then I should see the empty state message "No users found. Create your first user!"
