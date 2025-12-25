@functional @tracing @observability @tp3
Feature: Distributed Tracing and Observability
  As a DevOps engineer
  I want to trace user requests across the entire system
  So that I can monitor and debug distributed transactions

  Background:
    Given the observability stack is running
    And OpenTelemetry collector is configured
    And Jaeger is accessible on port 16686
    And Grafana is accessible on port 3000

  @critical @trace-propagation
  Scenario: Trace context propagates from frontend to backend
    Given I am on the products page
    When I click on a product to view details
    Then a trace should be created with a unique trace ID
    And the trace should contain spans for:
      | service    | operation                    |
      | frontend   | HTTP GET /products/:id       |
      | backend    | ProductController.getById    |
      | backend    | ProductRepository.findById   |
      | mongodb    | find products                |
    And all spans should share the same trace ID
    And the span hierarchy should be correct

  @critical @trace-context-headers
  Scenario: W3C Trace Context headers are properly set
    Given I am on the home page
    When I perform a product search with term "laptop"
    Then the HTTP request should include headers:
      | header       | format                           |
      | traceparent  | 00-{trace-id}-{span-id}-{flags}  |
      | tracestate   | optional vendor info             |
    And the trace ID should be 32 hex characters
    And the span ID should be 16 hex characters

  @complex @full-transaction-trace
  Scenario: Complete e-commerce transaction is fully traced
    Given I am logged in as "trace.test@example.com"
    And I have an empty cart
    
    When I perform the following actions:
      | step | action                          |
      | 1    | Browse product catalog          |
      | 2    | Filter products by category     |
      | 3    | View product details            |
      | 4    | Add product to cart             |
      | 5    | View shopping cart              |
      | 6    | Update cart quantity            |
      | 7    | Proceed to checkout             |
      | 8    | Enter shipping information      |
      | 9    | Review order                    |
      | 10   | Confirm purchase                |
    
    Then each action should generate a trace
    And traces should be visible in Jaeger UI
    And the checkout trace should contain at least 15 spans
    And the trace duration should be recorded accurately

  @kafka @async-tracing
  Scenario: Asynchronous Kafka events maintain trace context
    Given a user "kafka.trace@example.com" is logged in
    When the user creates a new product
    Then a trace should be created for the product creation
    And a Kafka message should be sent to topic "product-events"
    And the Kafka message should include trace context headers
    
    When the message is consumed by a subscriber
    Then a child span should be created
    And it should be linked to the original trace

  @error-tracing @exceptions
  Scenario: Errors are properly captured in traces
    Given I am on the products page
    When I attempt to view a non-existent product with ID "invalid-id-999"
    Then a trace should be created for the failed request
    And the trace should contain an error span with:
      | attribute     | value                      |
      | error         | true                       |
      | error.type    | ProductNotFoundException   |
      | http.status   | 404                        |
    And the error details should be visible in Jaeger

  @performance @latency
  Scenario: High latency operations are identified in traces
    Given I am monitoring the system
    When I generate 100 concurrent product requests
    Then traces should be created for all requests
    And I should be able to identify:
      | metric                      |
      | Average response time       |
      | 95th percentile latency     |
      | 99th percentile latency     |
      | Slowest operations          |
    And operations exceeding 500ms should be flagged

  @grafana @dashboards
  Scenario: Grafana dashboards show trace metrics
    Given Grafana is running with provisioned dashboards
    And traces have been generated in the last hour
    
    When I open the Grafana dashboard
    Then I should see the following panels:
      | panel                        |
      | Request Rate                 |
      | Error Rate                   |
      | Request Duration             |
      | Service Dependencies         |
      | Top Slow Endpoints           |
    
    When I filter by service "observability-app"
    Then the panels should update to show filtered data

  @complex @cross-service-correlation
  Scenario: Correlate logs with traces using trace ID
    Given I am logged in as "correlation@example.com"
    
    When I perform a product update operation
    Then a trace should be generated with a unique trace ID
    And the application logs should include the trace ID
    And I should be able to:
      | action                                           |
      | Search logs by trace ID                          |
      | View the corresponding trace in Jaeger           |
      | See all log entries related to the transaction   |
      | Correlate frontend and backend logs              |

  @sampling @performance
  Scenario: Trace sampling works correctly under load
    Given the system is configured with 10% sampling rate
    When I generate 1000 requests
    Then approximately 100 traces should be recorded
    And critical error traces should always be captured
    And the sampling decision should be consistent across spans

  @baggage @context-propagation
  Scenario: Baggage items propagate across services
    Given I am logged in as "baggage.test@example.com"
    And a baggage item "user-tier" is set to "premium"
    
    When I make a request that goes through multiple services
    Then the baggage item should be present in all spans
    And downstream services should be able to read the baggage

  @complex @multi-tab-tracing
  Scenario: Independent traces for concurrent browser tabs
    Given I open the application in two browser tabs
    And I am logged in as the same user in both tabs
    
    When I perform action "view products" in tab 1
    And I perform action "create product" in tab 2 concurrently
    Then two separate traces should be created
    And each trace should have its own unique trace ID
    And the traces should not be incorrectly merged

  @jaeger-ui @verification
  Scenario: Verify trace details in Jaeger UI
    Given a trace has been generated for a product creation
    
    When I navigate to Jaeger UI
    And I search for traces by service "observability-app"
    And I filter by operation "ProductController.create"
    Then I should see the trace in the results
    
    When I click on the trace
    Then I should see the span details including:
      | detail              |
      | Duration            |
      | Start time          |
      | Tags                |
      | Logs                |
      | Process info        |
      | References          |
    
    And I should be able to expand child spans
    And I should see the span timeline visualization

  @logs @structured-logging
  Scenario: Structured logs include trace context automatically
    Given the Log4j2 configuration includes trace context
    
    When I perform any API operation
    Then the application logs should include:
      | field       | description                    |
      | traceId     | The current trace ID           |
      | spanId      | The current span ID            |
      | timestamp   | ISO 8601 formatted timestamp   |
      | level       | Log level (INFO, DEBUG, etc.)  |
      | message     | The log message                |
      | service     | The service name               |
    
    And the log format should be valid JSON
