const { Given, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const DatabaseHelper = require('../support/database');

const dbHelper = new DatabaseHelper();

Given('the database is accessible', async function () {
    const isConnected = await dbHelper.checkDatabaseConnection();
    expect(isConnected).to.be.true;
});

Given('there are users in the database:', async function (dataTable) {
    const rows = dataTable.rows();
    for (const [name, email] of rows) {
        await dbHelper.createUser({ name, email });
    }
    // Store for cleanup
    if (!this.testData) this.testData = {};
    if (!this.testData.createdUsers) this.testData.createdUsers = [];
    this.testData.createdUsers.push(...rows.map(([name, email]) => ({ name, email })));
});

Given('there are products in the database:', async function (dataTable) {
    const rows = dataTable.rows();
    for (const [name, price] of rows) {
        await dbHelper.createProduct({
            name,
            price: parseFloat(price),
            description: `Test product: ${name}`
        });
    }
    // Store for cleanup
    if (!this.testData) this.testData = {};
    if (!this.testData.createdProducts) this.testData.createdProducts = [];
    this.testData.createdProducts.push(...rows.map(([name, price]) => ({ name, price })));
});

Given('I have created a user with email {string}', async function (email) {
    const user = await dbHelper.createUser({
        name: 'Test User',
        email: email
    });

    if (!this.testData) this.testData = {};
    if (!this.testData.createdUsers) this.testData.createdUsers = [];
    this.testData.createdUsers.push(user);
});

Given('there is a product {string} with price {string} in the database', async function (name, price) {
    const product = await dbHelper.createProduct({
        name: name,
        price: parseFloat(price),
        description: `Test product: ${name}`
    });

    if (!this.testData) this.testData = {};
    if (!this.testData.createdProducts) this.testData.createdProducts = [];
    this.testData.createdProducts.push(product);
});

Given('I create a user with email {string}', async function (email) {
    const user = await dbHelper.createUser({
        name: 'Test User',
        email: email
    });

    if (!this.testData) this.testData = {};
    if (!this.testData.createdUsers) this.testData.createdUsers = [];
    this.testData.createdUsers.push(user);
});

Given('I create a product with name {string}', async function (name) {
    const product = await dbHelper.createProduct({
        name: name,
        price: 10.00,
        description: `Test product: ${name}`
    });

    if (!this.testData) this.testData = {};
    if (!this.testData.createdProducts) this.testData.createdProducts = [];
    this.testData.createdProducts.push(product);
});

Then('the user {string} should exist in the database', async function (email) {
    const user = await dbHelper.waitForUser(email);
    expect(user).to.not.be.null;
    expect(user.email).to.equal(email);
});

Then('the user {string} should have name {string}', async function (email, expectedName) {
    const user = await dbHelper.getUserByEmail(email);
    expect(user).to.not.be.null;
    expect(user.name).to.equal(expectedName);
});

Then('the product {string} should exist in the database', async function (name) {
    const product = await dbHelper.waitForProduct(name);
    expect(product).to.not.be.null;
    expect(product.name).to.equal(name);
});

Then('the product {string} should have price {string}', async function (name, expectedPrice) {
    const product = await dbHelper.getProductByName(name);
    expect(product).to.not.be.null;
    expect(parseFloat(product.price)).to.equal(parseFloat(expectedPrice));
});

Then('the displayed users count should match database count', async function () {
    const dbCount = await dbHelper.getUserCount();
    const displayedUsers = await this.userListPage.getAllUserRows();
    expect(displayedUsers.length).to.equal(dbCount);
});

Then('the displayed products count should match database count', async function () {
    const dbCount = await dbHelper.getProductCount();
    const displayedProducts = await this.productListPage.getAllProductRows();
    expect(displayedProducts.length).to.equal(dbCount);
});

Then('I should see the user {string} in the list', async function (email) {
    const userRows = await this.userListPage.getAllUserRows();
    const foundUser = userRows.find(row => row.getText().then(text => text.includes(email)));
    expect(foundUser).to.not.be.undefined;
});

Then('the user data in UI should match database content', async function () {
    const userRows = await this.userListPage.getAllUserRows();
    const dbUsers = await dbHelper.getAllUsers();
    expect(userRows.length).to.equal(dbUsers.length);
});

Then('the user {string} should still exist in the database', async function (email) {
    const user = await dbHelper.getUserByEmail(email);
    expect(user).to.not.be.null;
    expect(user.email).to.equal(email);
});

Then('the product {string} should still exist in the database', async function (name) {
    const product = await dbHelper.getProductByName(name);
    expect(product).to.not.be.null;
    expect(product.name).to.equal(name);
});

Then('the product {string} should have price {string} in the database', async function (name, expectedPrice) {
    // Wait a bit for the update to propagate
    await new Promise(resolve => setTimeout(resolve, 1000));
    const product = await dbHelper.getProductByName(name);
    expect(product).to.not.be.null;
    expect(parseFloat(product.price)).to.equal(parseFloat(expectedPrice));
});
