Feature: Application Navigation and UI
  As a user
  I want to navigate through the application
  So that I can access different features

  Background:
    Given the application is running

  Scenario: Home page displays all features
    When I navigate to the home page
    Then I should see the hero section with title "ShopTrack"
    And I should see 4 feature cards
    And I should see the feature card for "Browse & Buy"
    And I should see the feature card for "Sell Your Items"
    And I should see the feature card for "User Profiling"

  Scenario: Navigation bar is always visible
    When I navigate to the home page
    Then I should see the navigation bar
    When I scroll down the page
    Then the navigation bar should remain visible

  Scenario: Active navigation link highlighting
    When I navigate to the home page
    Then the "Home" navigation link should be active
    When I click on the "Marketplace" navigation link
    Then the "Marketplace" navigation link should be active
    And the "Home" navigation link should not be active

  Scenario: Navigate using feature cards
    When I navigate to the home page
    And I click on "Go to Marketplace" in the Browse & Buy card
    Then I should be on the marketplace page
    When I navigate to the home page
    And I click on "View Profiles" in the User Profiling card
    Then I should be on the profiles page

  Scenario: Footer is displayed on all pages
    When I navigate to the home page
    Then I should see the footer with text "© 2025 ShopTrack"
    When I navigate to the marketplace page
    Then I should see the footer
    When I navigate to the profiles page
    Then I should see the footer

  Scenario: Responsive navigation menu
    Given I am using a mobile device
    When I navigate to the home page
    Then the navigation should adapt to mobile layout

  Scenario: External links to monitoring tools
    When I navigate to the home page
    And I click on "Open Grafana" in the Analytics card
    Then a new tab should open with Grafana URL

  Scenario: Quick navigation from home to sell page
    When I navigate to the home page
    And I click on "Start Selling" in the Sell Your Items card
    Then I should be on the sell page
    When I navigate to the home page
    And I click on "Get Started" button
    Then I should be on the register page
