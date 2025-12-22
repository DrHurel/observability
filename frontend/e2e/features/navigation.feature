Feature: Application Navigation and UI
  As a user
  I want to navigate through the application
  So that I can access different features

  Background:
    Given the application is running

  Scenario: Home page displays all features
    When I navigate to the home page
    Then I should see the hero section with title "Observability Application"
    And I should see 3 feature cards
    And I should see the feature card for "User Management"
    And I should see the feature card for "Product Management"
    And I should see the feature card for "Monitoring"

  Scenario: Navigation bar is always visible
    When I navigate to the home page
    Then I should see the navigation bar
    When I scroll down the page
    Then the navigation bar should remain visible

  Scenario: Active navigation link highlighting
    When I navigate to the home page
    Then the "Home" navigation link should be active
    When I click on the "Users" navigation link
    Then the "Users" navigation link should be active
    And the "Home" navigation link should not be active
    When I click on the "Products" navigation link
    Then the "Products" navigation link should be active
    And the "Users" navigation link should not be active

  Scenario: Navigate using feature cards
    When I navigate to the home page
    And I click on "View Users" in the User Management card
    Then I should be on the users page
    When I navigate to the home page
    And I click on "View Products" in the Product Management card
    Then I should be on the products page

  Scenario: Footer is displayed on all pages
    When I navigate to the home page
    Then I should see the footer with text "© 2025 Observability Application"
    When I navigate to the users page
    Then I should see the footer
    When I navigate to the products page
    Then I should see the footer

  Scenario: Responsive navigation menu
    Given I am using a mobile device
    When I navigate to the home page
    Then the navigation should adapt to mobile layout

  Scenario: External links to monitoring tools
    When I navigate to the home page
    And I click on "Open Grafana" in the Monitoring card
    Then a new tab should open with Grafana URL

  Scenario: Quick navigation from home to create pages
    When I navigate to the home page
    And I click on "Create User" in the User Management card
    Then I should be on the user creation page
    When I navigate to the home page
    And I click on "Add Product" in the Product Management card
    Then I should be on the product creation page
