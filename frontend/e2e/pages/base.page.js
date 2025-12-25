const { By, until } = require('selenium-webdriver');

class BasePage {
    constructor(driver) {
        this.driver = driver;
        this.baseUrl = process.env.BASE_URL || 'http://localhost:4200';
    }

    async navigate(path = '') {
        await this.driver.get(`${this.baseUrl}${path}`);
        await this.waitForPageLoad();
    }

    async waitForPageLoad() {
        await this.driver.wait(
            until.elementLocated(By.css('app-root')),
            10000
        );
    }

    async findElement(locator) {
        return await this.driver.wait(
            until.elementLocated(locator),
            10000
        );
    }

    async findElements(locator) {
        return await this.driver.findElements(locator);
    }

    async click(locator) {
        const element = await this.findElement(locator);
        await this.driver.wait(until.elementIsVisible(element), 5000);
        await this.driver.wait(until.elementIsEnabled(element), 5000);
        await element.click();
    }

    async type(locator, text) {
        const element = await this.findElement(locator);
        await element.clear();
        await element.sendKeys(text);
    }

    async getText(locator) {
        const element = await this.findElement(locator);
        return await element.getText();
    }

    async isDisplayed(locator) {
        try {
            const element = await this.findElement(locator);
            return await element.isDisplayed();
        } catch (error) {
            console.log(`Element not found or not displayed: ${error.message}`);
            return false;
        }
    }

    async waitForElement(locator, timeout = 10000) {
        return await this.driver.wait(
            until.elementLocated(locator),
            timeout
        );
    }

    async waitForText(locator, text, timeout = 10000) {
        await this.driver.wait(async () => {
            const element = await this.findElement(locator);
            const elementText = await element.getText();
            return elementText.includes(text);
        }, timeout);
    }

    async getCurrentUrl() {
        return await this.driver.getCurrentUrl();
    }

    async scrollToElement(locator) {
        const element = await this.findElement(locator);
        await this.driver.executeScript('arguments[0].scrollIntoView(true);', element);
    }

    async acceptAlert() {
        await this.driver.wait(until.alertIsPresent(), 5000);
        const alert = await this.driver.switchTo().alert();
        await alert.accept();
    }

    async dismissAlert() {
        await this.driver.wait(until.alertIsPresent(), 5000);
        const alert = await this.driver.switchTo().alert();
        await alert.dismiss();
    }

    async getAlertText() {
        await this.driver.wait(until.alertIsPresent(), 5000);
        const alert = await this.driver.switchTo().alert();
        return await alert.getText();
    }
}

module.exports = BasePage;
