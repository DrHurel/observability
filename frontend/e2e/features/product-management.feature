Feature: Product Management
  As a store manager
  I want to manage products in the application
  So that I can create, update, delete, and view product information

  Background:
    Given the application is running
    And I am on the home page

  Scenario: Navigate to products page
    When I click on the "Products" navigation link
    Then I should be on the products page
    And I should see the page title "Products"
    And I should see an "Add New Product" button

  Scenario: Create a new product successfully
    When I click on the "Products" navigation link
    And I click on the "Add New Product" button
    Then I should be on the product creation page
    When I fill in the product form with:
      | field           | value          |
      | name            | Test Product   |
      | price           | 99.99          |
      | expirationDate  | 2026-12-31     |
    And I click on the "Add Product" button
    Then I should see a success message "Product added successfully"
    And I should be redirected to the products page
    And I should see "Test Product" in the products list

  Scenario: Edit an existing product
    Given a product exists with name "Old Product" and price "50.00"
    When I click on the "Products" navigation link
    And I click on the "Edit" button for "Old Product"
    Then I should be on the product edit page
    When I update the product form with:
      | field | value       |
      | name  | New Product |
      | price | 75.50       |
    And I click on the "Update Product" button
    Then I should see a success message "Product updated successfully"
    And I should be redirected to the products page
    And I should see "New Product" in the products list
    And I should not see "Old Product" in the products list

  Scenario: Delete a product with confirmation
    Given a product exists with name "Product to Delete"
    When I click on the "Products" navigation link
    And I click on the "Delete" button for "Product to Delete"
    And I confirm the deletion
    Then I should see a success message "Product deleted successfully"
    And I should not see "Product to Delete" in the products list

  Scenario: Cancel product deletion
    Given a product exists with name "Product to Keep"
    When I click on the "Products" navigation link
    And I click on the "Delete" button for "Product to Keep"
    And I cancel the deletion
    Then I should still see "Product to Keep" in the products list

  Scenario: Validation errors when creating product with invalid data
    When I click on the "Products" navigation link
    And I click on the "Add New Product" button
    And I fill in the product form with:
      | field           | value |
      | name            |       |
      | price           | -10   |
      | expirationDate  |       |
    And I click on the "Add Product" button
    Then I should see validation error "Product name is required"
    And I should see validation error "Price must be greater than 0"
    And I should see validation error "Expiration date is required"

  Scenario: View all products
    Given products exist in the system:
      | name          | price  | expirationDate |
      | Product A     | 29.99  | 2026-06-30     |
      | Product B     | 49.99  | 2026-12-31     |
      | Product C     | 19.99  | 2026-03-15     |
    When I click on the "Products" navigation link
    Then I should see 3 products in the list
    And I should see "Product A" with price "$29.99"
    And I should see "Product B" with price "$49.99"
    And I should see "Product C" with price "$19.99"

  Scenario: Empty state when no products exist
    Given no products exist in the system
    When I click on the "Products" navigation link
    Then I should see the empty state message "No products found. Add your first product!"

  Scenario: View product details in card
    Given a product exists with name "Detailed Product" and price "99.99" and expiration "2026-12-31"
    When I click on the "Products" navigation link
    Then I should see the product card containing:
      | field      | value             |
      | name       | Detailed Product  |
      | price      | $99.99            |
      | expires    | 2026-12-31        |
