const { By } = require('selenium-webdriver');
const BasePage = require('./base.page');

class ProductListPage extends BasePage {
    constructor(driver) {
        super(driver);

        this.locators = {
            pageTitle: By.css('.shop-header h2, .header h2, h1'),
            createButton: By.css('a[href="/sell"]'),
            productCards: By.css('.product-card'),
            emptyState: By.css('.empty-state, .no-products'),
            loading: By.css('.loading'),
            error: By.css('.error'),
            success: By.css('.success'),
            shopGrid: By.css('.shop-grid')
        };
    }

    async open() {
        await this.navigate('/shop');
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
        // Check both product card format and table row format
        const locators = [
            By.xpath(`//div[contains(@class, "product-card")]//h3[contains(text(), "${productName}")]`),
            By.xpath(`//tr[contains(., "${productName}")]`),
            By.xpath(`//*[contains(text(), "${productName}")]`)
        ];

        for (const locator of locators) {
            try {
                const elements = await this.driver.findElements(locator);
                if (elements.length > 0) {
                    return true;
                }
            } catch (e) {
                continue;
            }
        }
        return false;
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

    async clickFirstProduct() {
        const firstCard = By.css('.product-card:first-child h3');
        await this.click(firstCard);
    }

    async clickProductByName(productName) {
        const locator = By.xpath(`//div[@class="product-card"]//h3[contains(text(), "${productName}")]`);
        await this.click(locator);
    }

    async getAllProductCards() {
        return await this.findElements(this.locators.productCards);
    }

    async getAllProductRows() {
        return await this.findElements(this.locators.productCards);
    }

    async findProductByName(productName) {
        const locator = By.xpath(`//div[contains(@class, "product-card")]//h3[contains(text(), "${productName}")]`);
        try {
            return await this.findElement(locator);
        } catch (error) {
            return null;
        }
    }

    async searchProducts(searchTerm) {
        const searchInput = By.css('input[type="search"], input[placeholder*="search" i], .search-input');
        try {
            await this.type(searchInput, searchTerm);
            await this.driver.sleep(100);
        } catch (error) {
            console.log('Search input not found, trying alternative method');
        }
    }

    async filterByCategory(category) {
        const categoryFilter = By.xpath(`//select[contains(@class, 'category')]|//button[contains(text(), "${category}")]`);
        try {
            await this.click(categoryFilter);
        } catch (error) {
            console.log('Category filter not found');
        }
    }

    async sortBy(sortOption) {
        const sortDropdown = By.css('select[name="sort"], .sort-dropdown');
        try {
            await this.click(sortDropdown);
            const option = By.xpath(`//option[contains(text(), "${sortOption}")]`);
            await this.click(option);
        } catch (error) {
            console.log('Sort dropdown not found');
        }
    }
}

module.exports = ProductListPage;
