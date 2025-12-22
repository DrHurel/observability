const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

When('I click on the {string} button for {string}', async function (action, productName) {
    if (action === 'Edit') {
        await this.productListPage.clickEditProduct(productName);
    } else if (action === 'Delete') {
        await this.productListPage.clickDeleteProduct(productName);
    }

    await this.driver.sleep(500);
});

When('I confirm the deletion', async function () {
    await this.productListPage.confirmDelete();
    await this.driver.sleep(1000);
});

When('I cancel the deletion', async function () {
    await this.productListPage.cancelDelete();
    await this.driver.sleep(500);
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

    await this.productFormPage.fillForm(productData);
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
    await this.driver.sleep(2000);

    const url = await this.driver.getCurrentUrl();
    expect(url).to.include('/products');
    expect(url).to.not.include('/create');
    expect(url).to.not.include('/edit');
});

Then('I should see {string} in the products list', async function (productName) {
    await this.driver.sleep(1000);

    const isVisible = await this.productListPage.isProductVisible(productName);
    expect(isVisible).to.be.true;
});

Then('I should not see {string} in the products list', async function (productName) {
    await this.driver.sleep(1000);

    const isVisible = await this.productListPage.isProductVisible(productName);
    expect(isVisible).to.be.false;
});

Then('I should still see {string} in the products list', async function (productName) {
    await this.driver.sleep(500);

    const isVisible = await this.productListPage.isProductVisible(productName);
    expect(isVisible).to.be.true;
});

Then('I should see {int} products in the list', async function (count) {
    await this.driver.sleep(1000);

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
