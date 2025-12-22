const { Given, When, Then, Before, After, setDefaultTimeout } = require('@cucumber/cucumber');
const webDriverManager = require('../support/webdriver');
const DatabaseHelper = require('../support/database');

// Import page objects
const HomePage = require('../pages/home.page');
const UserListPage = require('../pages/user-list.page');
const UserCreatePage = require('../pages/user-create.page');
const ProductListPage = require('../pages/product-list.page');
const ProductFormPage = require('../pages/product-form.page');
const NavigationComponent = require('../pages/navigation.component');

// Set default timeout to 30 seconds
setDefaultTimeout(30 * 1000);

Before(async function () {
    this.driver = await webDriverManager.getDriver();
    this.dbHelper = new DatabaseHelper();

    // Initialize page objects
    this.homePage = new HomePage(this.driver);
    this.userListPage = new UserListPage(this.driver);
    this.userCreatePage = new UserCreatePage(this.driver);
    this.productListPage = new ProductListPage(this.driver);
    this.productFormPage = new ProductFormPage(this.driver);
    this.navigation = new NavigationComponent(this.driver);
});

After(async function (scenario) {
    // Take screenshot on failure
    if (scenario.result.status === 'failed') {
        const screenshotName = `${scenario.pickle.name.replace(/\s+/g, '_')}_${Date.now()}`;
        await webDriverManager.takeScreenshot(screenshotName);
    }

    // Clean up test data if created during the scenario
    if (this.testData && this.testData.createdUsers) {
        for (const user of this.testData.createdUsers) {
            try {
                if (user.id) {
                    await this.dbHelper.deleteUser(user.id);
                }
            } catch (error) {
                // Ignore cleanup errors
            }
        }
    }

    if (this.testData && this.testData.createdProducts) {
        for (const product of this.testData.createdProducts) {
            try {
                if (product.id) {
                    await this.dbHelper.deleteProduct(product.id);
                }
            } catch (error) {
                // Ignore cleanup errors
            }
        }
    }

    // Don't quit driver here to reuse between scenarios
    // It will be quit at the end of all scenarios
});

// World object to share data between steps
const { setWorldConstructor } = require('@cucumber/cucumber');

class CustomWorld {
    constructor() {
        this.testData = {};
    }
}

setWorldConstructor(CustomWorld);
