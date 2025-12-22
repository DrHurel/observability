const { By } = require('selenium-webdriver');
const BasePage = require('./base.page');

class NavigationComponent extends BasePage {
    constructor(driver) {
        super(driver);

        this.locators = {
            navbar: By.css('.navbar'),
            navBrand: By.css('.nav-brand'),
            navLinks: By.css('.nav-links'),
            homeLink: By.xpath('//a[contains(text(), "Home") and contains(@class, "")]'),
            usersLink: By.xpath('//a[contains(text(), "Users") and @routerLink="/users"]'),
            productsLink: By.xpath('//a[contains(text(), "Products") and @routerLink="/products"]'),
            activeLink: By.css('.nav-links a.active')
        };
    }

    async isNavbarVisible() {
        return await this.isDisplayed(this.locators.navbar);
    }

    async getBrandText() {
        return await this.getText(this.locators.navBrand);
    }

    async clickHome() {
        await this.click(this.locators.homeLink);
    }

    async clickUsers() {
        await this.click(this.locators.usersLink);
    }

    async clickProducts() {
        await this.click(this.locators.productsLink);
    }

    async clickNavLink(linkText) {
        const locator = By.xpath(`//nav//a[contains(text(), "${linkText}")]`);
        await this.click(locator);
    }

    async isLinkActive(linkText) {
        const locator = By.xpath(`//nav//a[contains(text(), "${linkText}") and contains(@class, "active")]`);
        return await this.isDisplayed(locator);
    }

    async getActiveLinkText() {
        return await this.getText(this.locators.activeLink);
    }

    async getNavLinkCount() {
        const links = await this.findElements(By.css('.nav-links a'));
        return links.length;
    }

    async scrollPage(pixels) {
        await this.driver.executeScript(`window.scrollBy(0, ${pixels})`);
    }

    async isNavbarSticky() {
        const navbar = await this.findElement(this.locators.navbar);
        const position = await navbar.getCssValue('position');
        return position === 'sticky' || position === 'fixed';
    }
}

module.exports = NavigationComponent;
