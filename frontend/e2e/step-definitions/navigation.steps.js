const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

Then('I should see the navigation bar', async function () {
    const isVisible = await this.navigation.isVisible();
    expect(isVisible).to.be.true;
});

When('I scroll down the page', async function () {
    await this.navigation.scrollPage(500);
    await this.driver.sleep(500);
});

Then('the navigation bar should remain visible', async function () {
    const isVisible = await this.navigation.isNavbarVisible();
    expect(isVisible).to.be.true;
});

Then('the {string} navigation link should be active', async function (linkText) {
    const isActive = await this.navigation.isLinkActive(linkText);
    expect(isActive).to.be.true;
});

Then('the {string} navigation link should not be active', async function (linkText) {
    const isActive = await this.navigation.isLinkActive(linkText);
    expect(isActive).to.be.false;
});

Then('I should see the hero section with title {string}', async function (title) {
    const actualTitle = await this.homePage.getTitle();
    expect(actualTitle).to.include(title);
});

Then('I should see {int} feature cards', async function (count) {
    const actualCount = await this.homePage.getFeatureCardsCount();
    expect(actualCount).to.be.at.least(count);
});

Then('I should see the feature card for {string}', async function (cardName) {
    const isVisible = await this.homePage.isFeatureCardVisible(cardName);
    expect(isVisible).to.be.true;
});

When('I click on {string} in the User Management card', async function (linkText) {
    if (linkText === 'View Users') {
        await this.homePage.clickViewUsers();
    } else if (linkText === 'Create User') {
        await this.homePage.clickCreateUser();
    }

    await this.driver.sleep(1000);
});

When('I click on {string} in the Product Management card', async function (linkText) {
    if (linkText === 'View Products') {
        await this.homePage.clickViewProducts();
    } else if (linkText === 'Add Product') {
        await this.homePage.clickAddProduct();
    }

    await this.driver.sleep(1000);
});

When('I click on {string} in the Monitoring card', async function (linkText) {
    if (linkText === 'Open Grafana') {
        await this.homePage.clickOpenGrafana();
    }
});

Then('a new tab should open with Grafana URL', async function () {
    const handles = await this.driver.getAllWindowHandles();
    expect(handles.length).to.be.greaterThan(1);

    // Close the new tab and switch back
    await this.driver.switchTo().window(handles[1]);
    await this.driver.close();
    await this.driver.switchTo().window(handles[0]);
});

Given('I am using a mobile device', async function () {
    await this.driver.manage().window().setRect({ width: 375, height: 667 });
});

Then('the navigation should adapt to mobile layout', async function () {
    const isVisible = await this.navigation.isNavbarVisible();
    expect(isVisible).to.be.true;
    // Additional mobile-specific checks could be added
});
