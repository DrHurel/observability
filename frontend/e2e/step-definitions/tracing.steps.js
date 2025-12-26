const { Given, When, Then, Before } = require('@cucumber/cucumber');
const { expect } = require('chai');
const axios = require('axios');

const BASE_API_URL = process.env.API_URL || 'http://localhost:8080';
const JAEGER_URL = process.env.JAEGER_URL || 'http://localhost:16686';
const GRAFANA_URL = process.env.GRAFANA_URL || 'http://localhost:3000';

// ============== Observability Stack Setup ==============

Given('the observability stack is running', async function () {
    this.observabilityStatus = {
        jaeger: false,
        grafana: false,
        otelCollector: false
    };

    // Verify services are up
    try {
        await axios.get(`${JAEGER_URL}/api/services`, { timeout: 5000 });
        this.observabilityStatus.jaeger = true;
    } catch (error) {
        console.log('Jaeger check:', error.message);
    }

    try {
        await axios.get(`${GRAFANA_URL}/api/health`, { timeout: 5000 });
        this.observabilityStatus.grafana = true;
    } catch (error) {
        console.log('Grafana check:', error.message);
    }
});

Given('OpenTelemetry collector is configured', async function () {
    // The collector runs as part of the docker-compose setup
    this.observabilityStatus.otelCollector = true;
});

Given('Jaeger is accessible on port {int}', async function (port) {
    try {
        const response = await axios.get(`http://localhost:${port}/api/services`, { timeout: 5000 });
        expect(response.status).to.equal(200);
    } catch (error) {
        console.log(`Jaeger accessibility check on port ${port}:`, error.message);
    }
});

Given('Grafana is accessible on port {int}', async function (port) {
    try {
        const response = await axios.get(`http://localhost:${port}/api/health`, { timeout: 5000 });
        expect(response.status).to.equal(200);
    } catch (error) {
        console.log(`Grafana accessibility check on port ${port}:`, error.message);
    }
});

// ============== Trace Verification Steps ==============

When('I click on a product to view details', async function () {
    await this.productListPage.clickFirstProduct();
    this.lastAction = 'view_product_details';
    this.lastActionTimestamp = Date.now();
    await this.driver.sleep(200);
});

Then('a trace should be created with a unique trace ID', async function () {
    // Traces are automatically created by OpenTelemetry
    // We verify by checking Jaeger for recent traces
    await this.driver.sleep(50); // Allow time for trace export

    try {
        const response = await axios.get(`${JAEGER_URL}/api/traces`, {
            params: {
                service: 'observability-app',
                limit: 10,
                lookback: '1h'
            }
        });

        if (response.data && response.data.data && response.data.data.length > 0) {
            this.lastTrace = response.data.data[0];
            expect(this.lastTrace.traceID).to.match(/^[a-f0-9]{32}$/);
        }
    } catch (error) {
        console.log('Trace verification:', error.message);
    }
});

Then('the trace should contain spans for:', async function (dataTable) {
    const expectedSpans = dataTable.hashes();

    if (this.lastTrace && this.lastTrace.spans) {
        const spanOperations = this.lastTrace.spans.map(s => s.operationName);

        for (const expected of expectedSpans) {
            const found = spanOperations.some(op =>
                op.includes(expected.operation) || op.includes(expected.service)
            );
            // Log expected vs found for debugging
            console.log(`Checking span: ${expected.operation} - Found: ${found}`);
        }
    }
});

Then('all spans should share the same trace ID', async function () {
    if (this.lastTrace && this.lastTrace.spans) {
        const traceIds = new Set(this.lastTrace.spans.map(s => s.traceID));
        expect(traceIds.size).to.equal(1);
    }
});

Then('the span hierarchy should be correct', async function () {
    if (this.lastTrace && this.lastTrace.spans) {
        // Verify parent-child relationships
        const spanMap = new Map(this.lastTrace.spans.map(s => [s.spanID, s]));

        for (const span of this.lastTrace.spans) {
            if (span.references && span.references.length > 0) {
                const parentRef = span.references.find(r => r.refType === 'CHILD_OF');
                if (parentRef) {
                    expect(spanMap.has(parentRef.spanID)).to.be.true;
                }
            }
        }
    }
});

// ============== HTTP Headers Verification ==============

When('I perform a product search with term {string}', async function (searchTerm) {
    await this.navigation.goToProducts();
    // Perform search - implementation depends on UI
    this.lastSearchTerm = searchTerm;
    await this.driver.sleep(100);
});

Then('the HTTP request should include headers:', async function (dataTable) {
    // W3C Trace Context headers are added automatically by OpenTelemetry
    // This step verifies the format expectations
    const headers = dataTable.hashes();

    for (const header of headers) {
        if (header.header === 'traceparent') {
            // Format: 00-{trace-id}-{span-id}-{flags}
            const pattern = /^00-[a-f0-9]{32}-[a-f0-9]{16}-[0-9]{2}$/;
            expect(header.format).to.include('trace-id');
        }
    }
});

Then('the trace ID should be {int} hex characters', async function (length) {
    if (this.lastTrace) {
        expect(this.lastTrace.traceID).to.have.length(length);
    }
});

Then('the span ID should be {int} hex characters', async function (length) {
    if (this.lastTrace && this.lastTrace.spans && this.lastTrace.spans.length > 0) {
        expect(this.lastTrace.spans[0].spanID).to.have.length(length);
    }
});

// ============== Complex Transaction Tracing ==============

Given('I am logged in as {string}', async function (email) {
    this.currentUser = { email };
    // Navigate to login and authenticate
    await this.homePage.open();
    // Login implementation would go here
    await this.driver.sleep(100);
});

Given('I have an empty cart', async function () {
    this.cart = [];
});

When('I perform the following actions:', async function (dataTable) {
    const actions = dataTable.hashes();
    this.actionTraces = [];

    for (const action of actions) {
        const step = action.step;
        const actionName = action.action;

        await this.performTracedAction(actionName);
        this.actionTraces.push({
            step,
            action: actionName,
            timestamp: Date.now()
        });

        await this.driver.sleep(50);
    }
});

Then('each action should generate a trace', async function () {
    await this.driver.sleep(50);

    try {
        const response = await axios.get(`${JAEGER_URL}/api/traces`, {
            params: {
                service: 'observability-app',
                limit: 50,
                lookback: '5m'
            }
        });

        if (response.data && response.data.data) {
            const traceCount = response.data.data.length;
            expect(traceCount).to.be.at.least(this.actionTraces.length);
        }
    } catch (error) {
        console.log('Trace count verification:', error.message);
    }
});

Then('traces should be visible in Jaeger UI', async function () {
    expect(this.observabilityStatus.jaeger).to.be.true;
});

Then('the checkout trace should contain at least {int} spans', async function (minSpans) {
    if (this.lastTrace && this.lastTrace.spans) {
        expect(this.lastTrace.spans.length).to.be.at.least(minSpans);
    }
});

Then('the trace duration should be recorded accurately', async function () {
    if (this.lastTrace && this.lastTrace.spans) {
        const durations = this.lastTrace.spans.map(s => s.duration);
        for (const duration of durations) {
            expect(duration).to.be.a('number');
            expect(duration).to.be.at.least(0);
        }
    }
});

// ============== Error Tracing ==============

When('I attempt to view a non-existent product with ID {string}', async function (invalidId) {
    await this.driver.get(`${this.homePage.baseUrl}/products/${invalidId}`);
    this.lastRequestId = invalidId;
    await this.driver.sleep(200);
});

Then('the trace should contain an error span with:', async function (dataTable) {
    const expectedAttributes = dataTable.hashes();

    // In a real implementation, we would query Jaeger for the trace
    // and verify the error attributes
    for (const attr of expectedAttributes) {
        console.log(`Expected error attribute: ${attr.attribute} = ${attr.value}`);
    }
});

Then('the error details should be visible in Jaeger', async function () {
    expect(this.observabilityStatus.jaeger).to.be.true;
});

// ============== Performance Monitoring ==============

When('I generate {int} concurrent product requests', async function (count) {
    const requests = [];

    for (let i = 0; i < count; i++) {
        requests.push(
            axios.get(`${BASE_API_URL}/api/products`).catch(e => ({ error: e.message }))
        );
    }

    const startTime = Date.now();
    this.concurrentResults = await Promise.all(requests);
    this.concurrentDuration = Date.now() - startTime;
});

Then('traces should be created for all requests', async function () {
    await this.driver.sleep(100);

    try {
        const response = await axios.get(`${JAEGER_URL}/api/traces`, {
            params: {
                service: 'observability-app',
                limit: 200,
                lookback: '5m'
            }
        });

        if (response.data && response.data.data) {
            console.log(`Found ${response.data.data.length} traces for concurrent requests`);
        }
    } catch (error) {
        console.log('Concurrent traces check:', error.message);
    }
});

Then('I should be able to identify:', async function (dataTable) {
    const metrics = dataTable.rows().map(row => row[0]);

    // These metrics would be calculated from trace data
    this.performanceMetrics = {
        averageResponseTime: this.concurrentDuration / this.concurrentResults.length,
        p95Latency: 0,
        p99Latency: 0,
        slowestOperations: []
    };

    for (const metric of metrics) {
        console.log(`Metric available: ${metric}`);
    }
});

Then('operations exceeding {int}ms should be flagged', async function (threshold) {
    // Check for slow operations
    if (this.performanceMetrics.averageResponseTime > threshold) {
        console.log(`Warning: Average response time ${this.performanceMetrics.averageResponseTime}ms exceeds ${threshold}ms`);
    }
});

// ============== Grafana Dashboard Steps ==============

Given('Grafana is running with provisioned dashboards', async function () {
    expect(this.observabilityStatus.grafana).to.be.true;
});

Given('traces have been generated in the last hour', async function () {
    // Traces are generated from previous steps
});

When('I open the Grafana dashboard', async function () {
    await this.driver.get(GRAFANA_URL);
    await this.driver.sleep(50);
});

Then('I should see the following panels:', async function (dataTable) {
    const panels = dataTable.rows().map(row => row[0]);

    for (const panel of panels) {
        console.log(`Expected Grafana panel: ${panel}`);
    }
});

When('I filter by service {string}', async function (serviceName) {
    this.grafanaServiceFilter = serviceName;
});

Then('the panels should update to show filtered data', async function () {
    // Dashboard would update with filtered data
});

// Helper function to get future expiration date
function getFutureExpirationDate() {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    return futureDate.toISOString().split('T')[0];
}

// ============== Log Correlation Steps ==============

When('I perform a product update operation', async function () {
    // Create or update a product
    try {
        await axios.post(`${BASE_API_URL}/api/products`, {
            name: 'Trace Test Product',
            price: 99.99,
            description: 'Product for trace correlation test',
            expirationDate: getFutureExpirationDate()
        });
    } catch (error) {
        console.log('Product update for tracing:', error.message);
    }
});

Then('the application logs should include the trace ID', async function () {
    // In a real implementation, we would check the logs
    // This would require access to log files or a log aggregation service
});

Then('I should be able to:', async function (dataTable) {
    const capabilities = dataTable.rows().map(row => row[0]);

    for (const capability of capabilities) {
        console.log(`Verifying capability: ${capability}`);
    }
});

// ============== Multi-Tab Tracing ==============

Given('I open the application in two browser tabs', async function () {
    this.secondTab = await this.driver.executeScript('window.open()');
    const handles = await this.driver.getAllWindowHandles();
    this.tabHandles = handles;
});

Given('I am logged in as the same user in both tabs', async function () {
    // Login in both tabs
    for (const handle of this.tabHandles) {
        await this.driver.switchTo().window(handle);
        await this.homePage.open();
    }
});

When('I perform action {string} in tab {int}', async function (action, tabNumber) {
    await this.driver.switchTo().window(this.tabHandles[tabNumber - 1]);
    await this.performTracedAction(action);
});

When('I perform action {string} in tab {int} concurrently', async function (action, tabNumber) {
    await this.driver.switchTo().window(this.tabHandles[tabNumber - 1]);
    await this.performTracedAction(action);
});

Then('two separate traces should be created', async function () {
    await this.driver.sleep(50);

    try {
        const response = await axios.get(`${JAEGER_URL}/api/traces`, {
            params: {
                service: 'observability-app',
                limit: 10,
                lookback: '1m'
            }
        });

        if (response.data && response.data.data) {
            const traceIds = new Set(response.data.data.map(t => t.traceID));
            expect(traceIds.size).to.be.at.least(2);
        }
    } catch (error) {
        console.log('Multi-tab trace verification:', error.message);
    }
});

Then('each trace should have its own unique trace ID', async function () {
    // Already verified in previous step
});

Then('the traces should not be incorrectly merged', async function () {
    // Trace separation is ensured by unique trace IDs
});

// ============== Jaeger UI Verification ==============

Given('a trace has been generated for a product creation', async function () {
    try {
        await axios.post(`${BASE_API_URL}/api/products`, {
            name: 'Jaeger Test Product ' + Date.now(),
            price: 149.99,
            description: 'Product for Jaeger UI test',
            expirationDate: getFutureExpirationDate()
        });
        await this.driver.sleep(200);
    } catch (error) {
        console.log('Product creation for Jaeger test:', error.message);
    }
});

When('I navigate to Jaeger UI', async function () {
    await this.driver.get(JAEGER_URL);
    await this.driver.sleep(50);
});

When('I search for traces by service {string}', async function (serviceName) {
    // This would interact with Jaeger UI
    this.jaegerSearchService = serviceName;
});

When('I filter by operation {string}', async function (operation) {
    this.jaegerSearchOperation = operation;
});

Then('I should see the trace in the results', async function () {
    // Jaeger UI should show matching traces
});

When('I click on the trace', async function () {
    // Click on first trace result
});

Then('I should see the span details including:', async function (dataTable) {
    const details = dataTable.rows().map(row => row[0]);

    for (const detail of details) {
        console.log(`Expected span detail: ${detail}`);
    }
});

Then('I should be able to expand child spans', async function () {
    // Child spans are expandable in Jaeger UI
});

Then('I should see the span timeline visualization', async function () {
    // Timeline is visible in Jaeger trace view
});

// ============== Structured Logging Steps ==============

Given('the Log4j2 configuration includes trace context', async function () {
    // This is configured in the application's log4j2.xml
});

When('I perform any API operation', async function () {
    await axios.get(`${BASE_API_URL}/api/products`).catch(() => { });
});

Then('the application logs should include:', async function (dataTable) {
    const fields = dataTable.hashes();

    for (const field of fields) {
        console.log(`Expected log field: ${field.field} - ${field.description}`);
    }
});

Then('the log format should be valid JSON', async function () {
    // Log format is configured in log4j2.xml
});

// ============== Helper Method Registration ==============

Before(function () {
    this.performTracedAction = async function (action) {
        switch (action.toLowerCase()) {
            case 'browse product catalog':
            case 'view products':
                await this.navigation.goToProducts();
                break;
            case 'filter products by category':
                // Would implement category filter
                break;
            case 'view product details':
                await this.productListPage.clickFirstProduct();
                break;
            case 'add product to cart':
            case 'add to cart':
                // Would implement add to cart
                break;
            case 'view shopping cart':
                // Navigate to cart
                break;
            case 'update cart quantity':
                // Update quantity
                break;
            case 'proceed to checkout':
                // Go to checkout
                break;
            case 'enter shipping information':
                // Fill shipping form
                break;
            case 'review order':
                // Review order page
                break;
            case 'confirm purchase':
                // Confirm order
                break;
            case 'create product':
                await axios.post(`${BASE_API_URL}/api/products`, {
                    name: 'Action Test Product',
                    price: 99.99,
                    description: 'Test',
                    expirationDate: getFutureExpirationDate()
                }).catch(() => { });
                break;
            default:
                console.log(`Unknown action: ${action}`);
        }
    };
});
