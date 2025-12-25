@functional @shopping @e2e @tp3
Feature: Complete Shopping Workflow
  As a customer
  I want to browse, search, and purchase products
  So that I can complete my shopping experience

  Background:
    Given the application is running
    And the database is seeded with test products
    And I am on the home page

  @critical @product-catalog
  Scenario: Browse the complete product catalog
    When I navigate to the products page
    Then I should see a list of products
    And each product should display:
      | field        |
      | name         |
      | description  |
      | price        |
      | image        |
    And the products should be paginated
    And I should see the total product count

  @search @filtering
  Scenario Outline: Search and filter products with various criteria
    Given I am on the products page
    When I search for products with "<searchTerm>"
    Then I should see products matching "<searchTerm>"
    And the search should complete within 2 seconds
    And the result count should be greater than 0

    Examples:
      | searchTerm      |
      | laptop          |
      | phone           |
      | wireless        |
      | premium edition |
      | 2024            |

  @critical @product-details
  Scenario: View detailed product information
    Given I am on the products page
    And there is a product named "Test Laptop Pro 2024"
    
    When I click on the product "Test Laptop Pro 2024"
    Then I should see the product detail page
    And I should see:
      | element           | content                       |
      | title             | Test Laptop Pro 2024          |
      | description       | detailed product description  |
      | price             | formatted price               |
      | availability      | In Stock or Out of Stock      |
      | specifications    | product specifications        |
      | related products  | similar products              |

  @cart @add-to-cart
  Scenario: Add multiple products to shopping cart
    Given I am logged in as "shopper@test.com"
    And my cart is empty
    
    When I add the following products to my cart:
      | product            | quantity |
      | Test Laptop Pro    | 1        |
      | Wireless Mouse     | 2        |
      | USB-C Hub          | 1        |
    
    Then my cart should contain 3 different products
    And the cart total quantity should be 4 items
    And the cart total should be calculated correctly

  @cart @update-quantity
  Scenario: Update product quantities in cart
    Given I am logged in as "cart.update@test.com"
    And I have the following items in my cart:
      | product         | quantity | price  |
      | Test Product A  | 1        | 99.99  |
      | Test Product B  | 2        | 49.99  |
    
    When I update the quantity of "Test Product A" to 3
    Then the cart should show 3 units of "Test Product A"
    And the subtotal for "Test Product A" should be 299.97
    And the cart total should be updated accordingly
    
    When I remove "Test Product B" from the cart
    Then "Test Product B" should not be in the cart
    And the cart total should reflect the removal

  @checkout @complete-flow
  Scenario: Complete checkout process from cart to order confirmation
    Given I am logged in as "checkout@test.com"
    And I have products in my cart with total value 250.00
    
    When I proceed to checkout
    Then I should see the checkout page
    And I should see my cart summary
    
    When I fill in shipping information:
      | field        | value                      |
      | fullName     | Test Customer              |
      | address      | 123 Test Street            |
      | city         | Test City                  |
      | postalCode   | 12345                      |
      | country      | France                     |
      | phone        | +33 1 23 45 67 89          |
    And I click "Continue to Payment"
    
    Then I should see the payment page
    When I select payment method "Credit Card"
    And I fill in payment details:
      | field      | value                |
      | cardNumber | 4111111111111111     |
      | expiry     | 12/25                |
      | cvv        | 123                  |
      | cardName   | Test Customer        |
    And I click "Review Order"
    
    Then I should see the order review page
    And I should see all order details
    When I confirm the order
    
    Then I should see the order confirmation page
    And I should receive an order confirmation number
    And my cart should be empty

  @complex @wishlist
  Scenario: Manage wishlist and move items to cart
    Given I am logged in as "wishlist@test.com"
    And I have an empty wishlist
    
    When I add the following products to my wishlist:
      | product              |
      | Premium Headphones   |
      | Smart Watch Pro      |
      | Bluetooth Speaker    |
    
    Then my wishlist should contain 3 items
    And each item should show "Add to Cart" option
    
    When I move "Premium Headphones" to cart
    Then my cart should contain "Premium Headphones"
    And my wishlist should contain 2 items
    
    When I remove "Smart Watch Pro" from wishlist
    Then my wishlist should contain 1 item

  @complex @price-tracking
  Scenario: Track product prices for user profiling
    Given I am logged in as "price.tracker@test.com"
    And my user profile is fresh
    And the following products exist:
      | name              | price    |
      | Budget Item       | 29.99    |
      | Standard Item     | 149.99   |
      | Premium Item      | 599.99   |
      | Luxury Item       | 1299.99  |
      | Ultra Luxury      | 2499.99  |
    
    When I view the following products in order:
      | product        |
      | Luxury Item    |
      | Ultra Luxury   |
      | Premium Item   |
      | Luxury Item    |
      | Ultra Luxury   |
    
    Then my average viewed product price should be above 1000
    And my profile should trend towards "EXPENSIVE_SEEKER"

  @validation @required-fields
  Scenario: Validate required fields during checkout
    Given I am logged in as "validation@test.com"
    And I have products in my cart
    
    When I proceed to checkout
    And I try to continue without filling shipping information
    Then I should see validation errors for:
      | field       | error                        |
      | fullName    | Full name is required        |
      | address     | Address is required          |
      | city        | City is required             |
      | postalCode  | Postal code is required      |
      | country     | Country is required          |
    
    When I fill in only the full name
    And I try to continue
    Then I should still see errors for other required fields

  @edge-case @out-of-stock
  Scenario: Handle out-of-stock products gracefully
    Given I am logged in as "stock.test@test.com"
    And there is a product "Limited Edition Widget" with 1 unit in stock
    
    When another user purchases the last "Limited Edition Widget"
    And I try to add "Limited Edition Widget" to my cart
    Then I should see an out-of-stock message
    And the product should not be added to my cart
    And I should be offered to add it to my wishlist

  @concurrent @cart-integrity
  Scenario: Cart maintains integrity during concurrent modifications
    Given I am logged in as "concurrent@test.com"
    And I have "Product A" in my cart
    
    When I open the cart in two browser tabs
    And I update quantity to 5 in tab 1
    And I remove the product in tab 2
    And I refresh both tabs
    
    Then both tabs should show the same cart state
    And the cart should be consistent

  @complex @order-history
  Scenario: View and track order history
    Given I am logged in as "history@test.com"
    And I have completed orders in my history:
      | orderNumber | date       | total   | status     |
      | ORD-001     | 2024-01-15 | 299.99  | Delivered  |
      | ORD-002     | 2024-02-20 | 149.50  | Shipped    |
      | ORD-003     | 2024-03-10 | 599.00  | Processing |
    
    When I navigate to my order history
    Then I should see all 3 orders
    And orders should be sorted by date descending
    
    When I click on order "ORD-002"
    Then I should see the order details
    And I should see tracking information
    And I should have option to contact support

  @performance @load-time
  Scenario: Product pages load within acceptable time limits
    Given I am on the products page
    When I navigate through the following pages:
      | page               | maxLoadTime |
      | Product listing    | 2 seconds   |
      | Product detail     | 1.5 seconds |
      | Shopping cart      | 1 second    |
      | Checkout           | 2 seconds   |
    Then all pages should load within their time limits
    And no console errors should occur

  @mobile @responsive
  Scenario: Shopping workflow works on mobile devices
    Given I am using a mobile viewport of 375x667
    And I am on the products page
    
    Then the page should be responsive
    And the navigation menu should be collapsed
    
    When I tap the menu icon
    Then the navigation should expand
    
    When I search for "laptop"
    And I tap on a product
    And I add it to cart
    And I proceed to checkout
    Then all steps should work on mobile viewport
    And touch targets should be appropriately sized
