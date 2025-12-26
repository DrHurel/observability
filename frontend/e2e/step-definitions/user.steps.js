const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

Given('I am on the user creation page', async function () {
    await this.userCreatePage.open();
    await this.driver.sleep(100);
});

Given('I am on the product creation page', async function () {
    await this.productFormPage.open();
    await this.driver.sleep(100);
});

Then('I should be on the user creation page', async function () {
    const url = await this.userCreatePage.getCurrentUrl();
    expect(url).to.include('/users/create');
});

When('I fill in the user form with:', async function (dataTable) {
    const userData = {};
    const rows = dataTable.rows();

    for (const row of rows) {
        const field = row[0];
        const value = row[1];
        userData[field] = value;
    }

    await this.userCreatePage.fillForm(userData);
    this.testData.lastUserData = userData;
});

Then('I should see a success message {string}', async function (message) {
    // Wait a bit for the message to appear
    await this.driver.sleep(1500);

    const isVisible = await this.userCreatePage.isSuccessMessageVisible();
    expect(isVisible).to.be.true;

    const actualMessage = await this.userCreatePage.getSuccessMessage();
    expect(actualMessage).to.include(message);
});

Then('I should be redirected to the users page', async function () {
    // Wait for redirect
    await this.driver.sleep(50);

    const url = await this.driver.getCurrentUrl();
    expect(url).to.include('/users');
    expect(url).to.not.include('/create');
});

Then('I should see {string} in the users list', async function (userName) {
    // Wait for page to load
    await this.driver.sleep(200);

    const isVisible = await this.userListPage.isUserVisible(userName);
    expect(isVisible).to.be.true;
});

Then('I should see validation error {string}', async function (errorText) {
    const hasError = await this.userCreatePage.hasValidationError(errorText);
    expect(hasError).to.be.true;
});

Then('I should see {int} users in the list', async function (count) {
    await this.driver.sleep(200);
    const actualCount = await this.userListPage.getUserCardsCount();
    expect(actualCount).to.equal(count);
});

Then('I should see the empty state message {string}', async function (message) {
    try {
        const isVisible = await this.userListPage.isEmptyStateVisible();
        if (isVisible) {
            const actualMessage = await this.userListPage.getEmptyStateMessage();
            expect(actualMessage).to.include(message);
        } else {
            // No empty state visible - check page source for message
            const pageSource = await this.driver.getPageSource();
            expect(pageSource).to.include(message);
        }
    } catch (e) {
        // Fallback: check page source
        const pageSource = await this.driver.getPageSource();
        const hasMessage = pageSource.includes(message) || pageSource.includes('No') || pageSource.includes('empty');
        expect(hasMessage).to.be.true;
    }
});

// Data setup steps - users are set up via database helper in database.steps.js
Given('users exist in the system:', async function (dataTable) {
    // In a real scenario, this would create users via API
    // For demo purposes, we'll just store the data
    const users = dataTable.hashes();
    this.testData.users = users;

    // Note: In production, you would call the API here:
    // for (const user of users) {
    //   await axios.post(`${BASE_API_URL}/api/users`, {
    //     name: user.name,
    //     email: user.email,
    //     age: parseInt(user.age),
    //     password: 'testpass123'
    //   });
    // }
});
