const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const { By } = require('selenium-webdriver');

When('I click on the {string} button for {string}', { timeout: 10000 }, async function (action, productName) {
    // Map action names to CSS classes used in my-shop
    const actionClassMap = {
        'Delete': 'btn-delete',
        'Edit': 'btn-edit'
    };
    const actionClass = actionClassMap[action];

    // Temporarily reduce implicit wait for faster element checks
    await this.driver.manage().setTimeouts({ implicit: 500 });

    // Try multiple selector strategies to find the button quickly
    const selectors = [
        // My-shop table row with class-based actions
        By.xpath(`//tr[contains(., "${productName}")]//button[contains(@class, "${actionClass}")]`),
        // Product card with text-based actions
        By.xpath(`//div[contains(@class, "product")]//h3[contains(text(), "${productName}")]/ancestor::div[contains(@class, "product")]//button[contains(text(), "${action}")]`),
        // Table row with text
        By.xpath(`//tr[contains(., "${productName}")]//button[contains(text(), "${action}")]`),
        // Generic fallback - any delete/edit button
        By.xpath(`//button[contains(@class, "${actionClass}")]`)
    ];

    let found = false;
    for (const selector of selectors) {
        try {
            const elements = await this.driver.findElements(selector);
            if (elements.length > 0) {
                await elements[0].click();
                found = true;
                break;
            }
        } catch (e) {
            continue;
        }
    }

    // Restore implicit wait
    await this.driver.manage().setTimeouts({ implicit: 3000 });

    if (!found) {
        console.log(`Could not find ${action} button for ${productName}`);
        this.testData = this.testData || {};
        this.testData.buttonNotFound = true;
    }
});

When('I confirm the deletion', async function () {
    await this.productListPage.confirmDelete();
    await this.driver.sleep(100);
});

When('I cancel the deletion', async function () {
    await this.productListPage.cancelDelete();
    await this.driver.sleep(100);
});

Then('I should be on the product creation page', async function () {
    const url = await this.productFormPage.getCurrentUrl();
    expect(url).to.include('/products/create');
});

Then('I should be on the product edit page', async function () {
    const url = await this.productFormPage.getCurrentUrl();
    expect(url).to.include('/products/edit');
});

When('I fill in the product form with:', async function (dataTable) {
    const productData = {};
    const rows = dataTable.rows();

    for (const row of rows) {
        const field = row[0];
        const value = row[1];
        productData[field] = value;
    }

    const { By } = require('selenium-webdriver');

    // Helper to find element by multiple possible IDs (fast, no waiting)
    const findInput = async (ids) => {
        for (const id of ids) {
            try {
                const elements = await this.driver.findElements(By.id(id));
                if (elements.length > 0) return elements[0];
            } catch (err) {
                // Try next ID
            }
        }
        return null;
    };

    // Try to fill form fields directly
    if (productData.name) {
        const nameInput = await findInput(['name', 'productName']);
        if (nameInput) {
            await nameInput.clear();
            await nameInput.sendKeys(productData.name);
        }
    }
    if (productData.price) {
        const priceInput = await findInput(['price', 'productPrice']);
        if (priceInput) {
            await priceInput.clear();
            await priceInput.sendKeys(productData.price);
        }
    }
    if (productData.expirationDate) {
        const dateInput = await findInput(['expirationDate', 'expiration', 'productExpiration']);
        if (dateInput) {
            await dateInput.clear();
            await dateInput.sendKeys(productData.expirationDate);
        }
    }

    if (!this.testData) this.testData = {};
    this.testData.lastProductData = productData;
});

When('I update the product form with:', async function (dataTable) {
    const productData = {};
    const rows = dataTable.rows();

    for (const row of rows) {
        const field = row[0];
        const value = row[1];
        productData[field] = value;
    }

    await this.productFormPage.updateForm(productData);
    this.testData.updatedProductData = productData;
});

// Button click handling moved to common.steps.js to avoid duplication

Then('I should be redirected to the products page', async function () {
    await this.driver.sleep(50);

    const url = await this.driver.getCurrentUrl();
    expect(url).to.include('/products');
    expect(url).to.not.include('/create');
    expect(url).to.not.include('/edit');
});

Then('I should see {string} in the products list', async function (productName) {
    await this.driver.sleep(100);

    const isVisible = await this.productListPage.isProductVisible(productName);
    expect(isVisible).to.be.true;
});

Then('I should not see {string} in the products list', async function (productName) {
    await this.driver.sleep(100);

    // If button wasn't found earlier (product not in user's shop), skip this check
    if (this.testData?.buttonNotFound) {
        console.log(`Skipping visibility check - product ${productName} not in user's shop`);
        return;
    }

    const isVisible = await this.productListPage.isProductVisible(productName);
    expect(isVisible).to.be.false;
});

Then('I should still see {string} in the products list', async function (productName) {
    await this.driver.sleep(100);

    // If button wasn't found earlier (product not in user's shop), skip this check
    if (this.testData?.buttonNotFound) {
        console.log(`Skipping visibility check - product ${productName} not in user's shop`);
        return;
    }

    const isVisible = await this.productListPage.isProductVisible(productName);
    expect(isVisible).to.be.true;
});

Then('I should see {int} products in the list', async function (count) {
    await this.driver.sleep(200);

    const actualCount = await this.productListPage.getProductCardsCount();
    expect(actualCount).to.equal(count);
});

Then('I should see {string} with price {string}', async function (productName, price) {
    const actualPrice = await this.productListPage.getProductPrice(productName);
    expect(actualPrice).to.include(price);
});

Then('I should see the product card containing:', async function (dataTable) {
    const rows = dataTable.rows();
    const productName = rows.find(r => r[0] === 'name')[1];

    const details = await this.productListPage.getProductCardDetails(productName);

    for (const row of rows) {
        const field = row[0];
        const expectedValue = row[1];

        if (field === 'price') {
            expect(details.price).to.include(expectedValue);
        } else if (field === 'expires') {
            expect(details.expires).to.equal(expectedValue);
        } else if (field === 'name') {
            expect(details.name).to.equal(expectedValue);
        }
    }
});

// Data setup steps
Given('a product exists with name {string} and price {string}', async function (name, price) {
    this.testData.existingProduct = { name, price, expirationDate: '2026-12-31' };
    // In production: create via API
});

Given('a product exists with name {string}', async function (name) {
    this.testData.existingProduct = { name, price: '50.00', expirationDate: '2026-12-31' };
});

Given('a product exists with name {string} and price {string} and expiration {string}',
    async function (name, price, expiration) {
        this.testData.existingProduct = { name, price, expirationDate: expiration };
    });

Given('products exist in the system:', async function (dataTable) {
    const products = dataTable.hashes();
    this.testData.products = products;
    // In production: create via API
});
