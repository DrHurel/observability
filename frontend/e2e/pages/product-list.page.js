const { By } = require('selenium-webdriver');
const BasePage = require('./base.page');

class ProductListPage extends BasePage {
    constructor(driver) {
        super(driver);

        this.locators = {
            pageTitle: By.css('.header h2'),
            createButton: By.css('a[href="/products/create"]'),
            productCards: By.css('.product-card'),
            emptyState: By.css('.empty-state'),
            loading: By.css('.loading'),
            error: By.css('.error'),
            success: By.css('.success')
        };
    }

    async open() {
        await this.navigate('/products');
    }

    async getPageTitle() {
        return await this.getText(this.locators.pageTitle);
    }

    async clickCreateProduct() {
        await this.click(this.locators.createButton);
    }

    async getProductCardsCount() {
        const cards = await this.findElements(this.locators.productCards);
        return cards.length;
    }

    async isProductVisible(productName) {
        const locator = By.xpath(`//div[@class="product-card"]//h3[contains(text(), "${productName}")]`);
        return await this.isDisplayed(locator);
    }

    async getProductPrice(productName) {
        const locator = By.xpath(
            `//div[@class="product-card"]//h3[contains(text(), "${productName}")]/following-sibling::div[@class="product-info"]//p[contains(text(), "Price:")]`
        );
        const text = await this.getText(locator);
        return text.replace('Price:', '').trim();
    }

    async clickEditProduct(productName) {
        const locator = By.xpath(
            `//div[@class="product-card"]//h3[contains(text(), "${productName}")]/following-sibling::div[@class="product-actions"]//a[contains(text(), "Edit")]`
        );
        await this.click(locator);
    }

    async clickDeleteProduct(productName) {
        const locator = By.xpath(
            `//div[@class="product-card"]//h3[contains(text(), "${productName}")]/following-sibling::div[@class="product-actions"]//button[contains(text(), "Delete")]`
        );
        await this.click(locator);
    }

    async confirmDelete() {
        await this.acceptAlert();
    }

    async cancelDelete() {
        await this.dismissAlert();
    }

    async isEmptyStateVisible() {
        return await this.isDisplayed(this.locators.emptyState);
    }

    async getEmptyStateMessage() {
        return await this.getText(this.locators.emptyState);
    }

    async isSuccessMessageVisible() {
        return await this.isDisplayed(this.locators.success);
    }

    async getSuccessMessage() {
        return await this.getText(this.locators.success);
    }

    async isErrorVisible() {
        return await this.isDisplayed(this.locators.error);
    }

    async getProductCardDetails(productName) {
        const cardLocator = By.xpath(
            `//div[@class="product-card"]//h3[contains(text(), "${productName}")]/ancestor::div[@class="product-card"]`
        );
        const card = await this.findElement(cardLocator);
        const text = await card.getText();

        const details = {};
        const lines = text.split('\n');

        for (const line of lines) {
            if (line.includes('Price:')) {
                details.price = line.split('Price:')[1].trim();
            } else if (line.includes('Expires:')) {
                details.expires = line.split('Expires:')[1].trim();
            } else if (line.includes('ID:')) {
                details.id = line.split('ID:')[1].trim();
            }
        }

        details.name = productName;
        return details;
    }
}

module.exports = ProductListPage;
