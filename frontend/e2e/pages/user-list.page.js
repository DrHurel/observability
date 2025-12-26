const { By } = require('selenium-webdriver');
const BasePage = require('./base.page');

class UserListPage extends BasePage {
    constructor(driver) {
        super(driver);

        this.locators = {
            pageTitle: By.css('.profiles-header h2, .header h2, h1'),
            createButton: By.css('a[href="/register"]'),
            userCards: By.css('.profile-card, .user-card'),
            emptyState: By.css('.empty-state, .no-profiles'),
            loading: By.css('.loading'),
            error: By.css('.error'),
            navBar: By.css('.navbar'),
            footer: By.css('.footer')
        };
    }

    async open() {
        await this.navigate('/profiles');
    }

    async getPageTitle() {
        return await this.getText(this.locators.pageTitle);
    }

    async clickCreateUser() {
        await this.click(this.locators.createButton);
    }

    async getUserCardsCount() {
        const cards = await this.findElements(this.locators.userCards);
        return cards.length;
    }

    async isUserVisible(userName) {
        const locator = By.xpath(`//div[@class="user-card"]//h3[contains(text(), "${userName}")]`);
        return await this.isDisplayed(locator);
    }

    async getUserCardByName(userName) {
        const locator = By.xpath(`//div[@class="user-card"]//h3[contains(text(), "${userName}")]`);
        return await this.findElement(locator);
    }

    async isEmptyStateVisible() {
        return await this.isDisplayed(this.locators.emptyState);
    }

    async getEmptyStateMessage() {
        return await this.getText(this.locators.emptyState);
    }

    async isLoadingVisible() {
        return await this.isDisplayed(this.locators.loading);
    }

    async isErrorVisible() {
        return await this.isDisplayed(this.locators.error);
    }

    async getErrorMessage() {
        return await this.getText(this.locators.error);
    }

    async getAllUserRows() {
        return await this.findElements(this.locators.userCards);
    }

    async getAllUserCards() {
        return await this.findElements(this.locators.userCards);
    }
}

module.exports = UserListPage;
