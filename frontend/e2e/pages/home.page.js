const { By } = require('selenium-webdriver');
const BasePage = require('./base.page');

class HomePage extends BasePage {
    constructor(driver) {
        super(driver);

        // Locators
        this.locators = {
            heroTitle: By.css('.hero h1'),
            subtitle: By.css('.hero .subtitle'),
            featureCards: By.css('.feature-card'),
            userManagementCard: By.xpath('//h2[contains(text(), "User Management")]/ancestor::div[@class="feature-card"]'),
            productManagementCard: By.xpath('//h2[contains(text(), "Product Management")]/ancestor::div[@class="feature-card"]'),
            monitoringCard: By.xpath('//h2[contains(text(), "Monitoring")]/ancestor::div[@class="feature-card"]'),
            viewUsersButton: By.xpath('//a[contains(text(), "View Users")]'),
            createUserButton: By.xpath('//a[contains(text(), "Create User")]'),
            viewProductsButton: By.xpath('//a[contains(text(), "View Products")]'),
            addProductButton: By.xpath('//a[contains(text(), "Add Product")]'),
            openGrafanaButton: By.xpath('//a[contains(text(), "Open Grafana")]'),
            techTags: By.css('.tech-tags .tag'),
            apiEndpoints: By.css('.api-section'),
            footer: By.css('.footer')
        };
    }

    async open() {
        await this.navigate('/');
    }

    async getTitle() {
        return await this.getText(this.locators.heroTitle);
    }

    async getSubtitle() {
        return await this.getText(this.locators.subtitle);
    }

    async getFeatureCardsCount() {
        const cards = await this.findElements(this.locators.featureCards);
        return cards.length;
    }

    async isFeatureCardVisible(cardName) {
        let locator;
        if (cardName === 'User Management') {
            locator = this.locators.userManagementCard;
        } else if (cardName === 'Product Management') {
            locator = this.locators.productManagementCard;
        } else if (cardName === 'Monitoring') {
            locator = this.locators.monitoringCard;
        }

        return await this.isDisplayed(locator);
    }

    async clickViewUsers() {
        await this.click(this.locators.viewUsersButton);
    }

    async clickCreateUser() {
        await this.click(this.locators.createUserButton);
    }

    async clickViewProducts() {
        await this.click(this.locators.viewProductsButton);
    }

    async clickAddProduct() {
        await this.click(this.locators.addProductButton);
    }

    async clickOpenGrafana() {
        const originalWindow = await this.driver.getWindowHandle();
        await this.click(this.locators.openGrafanaButton);

        // Wait for new tab
        await this.driver.wait(async () => {
            const handles = await this.driver.getAllWindowHandles();
            return handles.length > 1;
        }, 5000);

        // Switch back to original window
        await this.driver.switchTo().window(originalWindow);
    }

    async isFooterVisible() {
        return await this.isDisplayed(this.locators.footer);
    }

    async getFooterText() {
        return await this.getText(this.locators.footer);
    }
}

module.exports = HomePage;
