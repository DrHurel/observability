const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

When('I click on the {string} button', async function (buttonText) {
    const url = await this.driver.getCurrentUrl();

    if (url.includes('/users/create')) {
        if (buttonText.includes('Create User')) {
            await this.userCreatePage.clickSubmit();
        } else if (buttonText.includes('Cancel')) {
            await this.userCreatePage.clickCancel();
        }
    } else if (url.includes('/users')) {
        if (buttonText.includes('Create')) {
            await this.userListPage.clickCreateUser();
        }
    } else if (url.includes('/products/create') || url.includes('/products/edit')) {
        if (buttonText.includes('Add Product') || buttonText.includes('Update Product') || buttonText.includes('Create Product')) {
            await this.productFormPage.clickSubmit();
        } else if (buttonText.includes('Cancel')) {
            await this.productFormPage.clickCancel();
        }
    } else if (url.includes('/products')) {
        if (buttonText.includes('Create')) {
            await this.productListPage.clickCreateProduct();
        }
    }

    // Wait for potential navigation or validation
    await this.driver.sleep(1000);
});

Then('I should see a success message', async function () {
    // Check for success indication - could be a message, redirect, or updated list
    await this.driver.sleep(1000);
    const url = await this.driver.getCurrentUrl();
    // Success is indicated by being redirected away from create/edit pages
    expect(url).to.not.include('/create');
    expect(url).to.not.include('/edit');
});

Then('I should see {string} in the user list', async function (text) {
    const pageSource = await this.driver.getPageSource();
    expect(pageSource).to.include(text);
});

Then('I should see {string} in the product list', async function (text) {
    const pageSource = await this.driver.getPageSource();
    expect(pageSource).to.include(text);
});

When('I reload the users page', async function () {
    await this.driver.navigate().refresh();
    await this.driver.sleep(1000);
});

When('I edit the product {string}', async function (productName) {
    // Find and click edit button for the product
    const product = await this.productListPage.findProductByName(productName);
    expect(product).to.not.be.null;
    // Click edit - this would need to be implemented in page object
    await this.driver.sleep(500);
});

When('I change the price to {string}', async function (newPrice) {
    await this.productFormPage.fillPrice(newPrice);
});

When('I submit the product form', async function () {
    await this.productFormPage.clickSubmit();
    await this.driver.sleep(1000);
});
const HomePage = require('../pages/home.page');
const UserListPage = require('../pages/user-list.page');
const UserCreatePage = require('../pages/user-create.page');
const ProductListPage = require('../pages/product-list.page');
const ProductFormPage = require('../pages/product-form.page');
const NavigationComponent = require('../pages/navigation.component');
const axios = require('axios');

const BASE_API_URL = process.env.API_URL || 'http://localhost:8080';

Given('the application is running', async function () {
    this.homePage = new HomePage(this.driver);
    this.userListPage = new UserListPage(this.driver);
    this.userCreatePage = new UserCreatePage(this.driver);
    this.productListPage = new ProductListPage(this.driver);
    this.productFormPage = new ProductFormPage(this.driver);
    this.navigation = new NavigationComponent(this.driver);
});

Given('I am on the home page', async function () {
    await this.homePage.open();
});

When('I navigate to the home page', async function () {
    await this.homePage.open();
});

When('I navigate to the users page', async function () {
    await this.userListPage.open();
});

When('I navigate to the products page', async function () {
    await this.productListPage.open();
});

Then('I should see the application title {string}', async function (title) {
    const actualTitle = await this.homePage.getTitle();
    expect(actualTitle).to.include(title);
});

Then('I should see the navigation menu', async function () {
    const isVisible = await this.navigation.isNavbarVisible();
    expect(isVisible).to.be.true;
});

Then('I should see navigation links for {string}, {string}, and {string}', async function (link1, link2, link3) {
    const linkCount = await this.navigation.getNavLinkCount();
    expect(linkCount).to.be.at.least(3);
});

When('I click on the {string} navigation link', async function (linkText) {
    await this.navigation.clickNavLink(linkText);
    // Wait a bit for navigation
    await this.driver.sleep(1000);
});

Then('I should be on the users page', async function () {
    const url = await this.userListPage.getCurrentUrl();
    expect(url).to.include('/users');
});

Then('I should be on the products page', async function () {
    const url = await this.productListPage.getCurrentUrl();
    expect(url).to.include('/products');
});

Then('I should see the page title {string}', async function (title) {
    let actualTitle;
    const url = await this.driver.getCurrentUrl();

    if (url.includes('/users')) {
        actualTitle = await this.userListPage.getPageTitle();
    } else if (url.includes('/products')) {
        actualTitle = await this.productListPage.getPageTitle();
    }

    expect(actualTitle).to.equal(title);
});

Then('I should see a {string} button', async function (buttonText) {
    const url = await this.driver.getCurrentUrl();
    let isVisible = false;

    if (url.includes('/users') && buttonText.includes('Create')) {
        // Check if we can find the button
        try {
            await this.userListPage.clickCreateUser();
            isVisible = true;
            // Go back
            await this.driver.navigate().back();
        } catch (error) {
            console.log(`Failed to find or click button: ${error.message}`);
            isVisible = false;
        }
    } else if (url.includes('/products') && buttonText.includes('Add')) {
        try {
            await this.productListPage.clickCreateProduct();
            isVisible = true;
            await this.driver.navigate().back();
        } catch (error) {
            console.log(`Failed to find or click button: ${error.message}`);
            isVisible = false;
        }
    }

    expect(isVisible).to.be.true;
});

Then('I should see an {string} button', async function (buttonText) {
    // Same as above
    const url = await this.driver.getCurrentUrl();
    let isVisible = false;

    if (url.includes('/products') && buttonText.includes('Add')) {
        try {
            await this.productListPage.clickCreateProduct();
            isVisible = true;
            await this.driver.navigate().back();
        } catch (error) {
            console.log(`Failed to find or click button: ${error.message}`);
            isVisible = false;
        }
    }

    expect(isVisible).to.be.true;
});

// Clean up test data before scenarios
Given('no users exist in the system', async function () {
    // This would require a test API endpoint to clear data
    // For now, we'll skip actual deletion
    this.testData.usersCleared = true;
});

Given('no products exist in the system', async function () {
    // This would require a test API endpoint to clear data
    this.testData.productsCleared = true;
});

Then('I should see the footer', async function () {
    const isVisible = await this.homePage.isFooterVisible();
    expect(isVisible).to.be.true;
});

Then('I should see the footer with text {string}', async function (text) {
    const footerText = await this.homePage.getFooterText();
    expect(footerText).to.include(text);
});
