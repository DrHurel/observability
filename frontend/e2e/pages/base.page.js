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

        // Close any open modals first
        await this.closeModals();

        // Try normal click first, fall back to JavaScript click if intercepted
        try {
            await element.click();
        } catch (error) {
            if (error.name === 'ElementClickInterceptedError') {
                // Wait a bit and try JavaScript click
                await this.driver.sleep(100);
                await this.driver.executeScript('arguments[0].click();', element);
            } else {
                throw error;
            }
        }
    }

    async closeModals() {
        try {
            // Try to close any open modals by clicking close buttons or overlay
            const closeButtons = await this.driver.findElements(By.css('.modal-close, .close-btn, .btn-close, [data-dismiss="modal"]'));
            for (const btn of closeButtons) {
                try {
                    if (await btn.isDisplayed()) {
                        await btn.click();
                        await this.driver.sleep(50);
                    }
                } catch (e) { /* ignore */ }
            }

            // Also try pressing Escape to close modals
            const body = await this.driver.findElement(By.css('body'));
            await body.sendKeys('\uE00C'); // Escape key
        } catch (e) { /* ignore */ }
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
        try {
            await this.driver.wait(until.alertIsPresent(), 2000);
            const alert = await this.driver.switchTo().alert();
            await alert.accept();
        } catch (e) {
            // No browser alert - try clicking confirm button in modal
            try {
                const confirmBtn = await this.driver.findElement(By.css('.confirm-btn, .btn-confirm, button.btn-primary, button[type="submit"]'));
                await confirmBtn.click();
            } catch (e2) {
                console.log('No alert or confirm modal found');
            }
        }
    }

    async dismissAlert() {
        try {
            await this.driver.wait(until.alertIsPresent(), 2000);
            const alert = await this.driver.switchTo().alert();
            await alert.dismiss();
        } catch (e) {
            // No browser alert - try clicking cancel button in modal
            try {
                const cancelBtn = await this.driver.findElement(By.css('.cancel-btn, .btn-cancel, button.btn-secondary'));
                await cancelBtn.click();
            } catch (e2) {
                console.log('No alert or cancel modal found');
            }
        }
    }

    async getAlertText() {
        try {
            await this.driver.wait(until.alertIsPresent(), 2000);
            const alert = await this.driver.switchTo().alert();
            return await alert.getText();
        } catch (e) {
            return '';
        }
    }
}

module.exports = BasePage;
