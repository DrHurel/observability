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

// Set default timeout to 15 seconds (optimized for speed)
setDefaultTimeout(15 * 1000);

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

async function cleanupUsers(testData, dbHelper) {
    if (!testData?.createdUsers) return;

    for (const user of testData.createdUsers) {
        try {
            if (user.id) {
                await dbHelper.deleteUser(user.id);
            }
        } catch (error) {
            console.warn(`Failed to cleanup user ${user.id}:`, error.message);
        }
    }
}

async function cleanupProducts(testData, dbHelper) {
    if (!testData?.createdProducts) return;

    for (const product of testData.createdProducts) {
        try {
            if (product.id) {
                await dbHelper.deleteProduct(product.id);
            }
        } catch (error) {
            console.warn(`Failed to cleanup product ${product.id}:`, error.message);
        }
    }
}

After(async function (scenario) {
    // Take screenshot on failure
    if (scenario.result.status === 'failed') {
        const screenshotName = `${scenario.pickle.name.replaceAll(/\s+/g, '_')}_${Date.now()}`;
        await webDriverManager.takeScreenshot(screenshotName);
    }

    // Clean up test data if created during the scenario
    await cleanupUsers(this.testData, this.dbHelper);
    await cleanupProducts(this.testData, this.dbHelper);

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
