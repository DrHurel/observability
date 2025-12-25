Feature: Product Management
  As a seller
  I want to manage products in the marketplace
  So that I can create, update, delete, and view product information

  Background:
    Given the application is running
    And I am on the home page

  Scenario: Navigate to marketplace page
    When I click on the "Marketplace" navigation link
    Then I should be on the marketplace page
    And I should see the page title "Marketplace"

  Scenario: Navigate to sell page to add product
    Given I am logged in as a seller
    When I navigate to the sell page
    Then I should be on the sell page
    And I should see the product creation form

  Scenario: Create a new product successfully
    Given I am logged in as a seller
    When I navigate to the sell page
    When I fill in the product form with:
      | field           | value          |
      | name            | Test Product   |
      | price           | 99.99          |
      | expirationDate  | 2026-12-31     |
    And I click on the "Add Product" button
    Then I should see a success message
    And I should see "Test Product" in the products list

  Scenario: Edit an existing product
    Given I am logged in as a seller
    And a product exists with name "Old Product" and price "50.00"
    When I navigate to my shop page
    And I click on the "Edit" button for "Old Product"
    Then I should be on the product edit page
    When I update the product form with:
      | field | value       |
      | name  | New Product |
      | price | 75.50       |
    And I click on the "Update Product" button
    Then I should see a success message
    And I should see "New Product" in the products list
    And I should not see "Old Product" in the products list

  Scenario: Delete a product with confirmation
    Given I am logged in as a seller
    And a product exists with name "Product to Delete"
    When I navigate to my shop page
    And I click on the "Delete" button for "Product to Delete"
    And I confirm the deletion
    Then I should see a success message
    And I should not see "Product to Delete" in the products list

  Scenario: Cancel product deletion
    Given I am logged in as a seller
    And a product exists with name "Product to Keep"
    When I navigate to my shop page
    And I click on the "Delete" button for "Product to Keep"
    And I cancel the deletion
    Then I should still see "Product to Keep" in the products list

  Scenario: Validation errors when creating product with invalid data
    Given I am logged in as a seller
    When I navigate to the sell page
    And I fill in the product form with:
      | field           | value |
      | name            |       |
      | price           | -10   |
      | expirationDate  |       |
    And I click on the "Add Product" button
    Then I should see validation errors for required fields

  Scenario: View all products in marketplace
    Given products exist in the system:
      | name          | price  | expirationDate |
      | Product A     | 29.99  | 2026-06-30     |
      | Product B     | 49.99  | 2026-12-31     |
      | Product C     | 19.99  | 2026-03-15     |
    When I click on the "Marketplace" navigation link
    Then I should see products in the marketplace
    And I should see "Product A" in the marketplace
    And I should see "Product B" in the marketplace
    And I should see "Product C" in the marketplace

  Scenario: Empty state when no products exist
    Given no products exist in the system
    When I click on the "Marketplace" navigation link
    Then I should see the empty state message "No products yet"

  Scenario: View product details
    Given a product exists with name "Detailed Product" and price "99.99" and expiration "2026-12-31"
    When I click on the "Marketplace" navigation link
    And I click on the product "Detailed Product"
    Then I should see the product details
    And I should see the price "99.99"
