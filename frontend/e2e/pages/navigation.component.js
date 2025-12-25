const { By } = require('selenium-webdriver');
const BasePage = require('./base.page');

class NavigationComponent extends BasePage {
    constructor(driver) {
        super(driver);

        this.locators = {
            navbar: By.css('.navbar'),
            navBrand: By.css('.nav-brand'),
            navLinks: By.css('.nav-links'),
            homeLink: By.xpath('//a[contains(text(), "Home")]'),
            marketplaceLink: By.xpath('//a[contains(text(), "Marketplace")]'),
            loginBtn: By.css('.btn-login'),
            registerBtn: By.css('.btn-register'),
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

    async clickMarketplace() {
        await this.click(this.locators.marketplaceLink);
    }

    async goToProducts() {
        await this.click(this.locators.marketplaceLink);
        await this.driver.sleep(500);
    }

    async clickLogin() {
        await this.click(this.locators.loginBtn);
    }

    async clickRegister() {
        await this.click(this.locators.registerBtn);
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
