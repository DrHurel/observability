const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

class WebDriverManager {
    constructor() {
        this.driver = null;
    }

    async getDriver() {
        if (!this.driver) {
            const options = new chrome.Options();

            // Run headless in CI or when HEADLESS env var is set
            if (process.env.HEADLESS === 'true' || process.env.CI) {
                options.addArguments('--headless=new');
            }

            // Additional Chrome options for better stability
            options.addArguments('--no-sandbox');
            options.addArguments('--disable-dev-shm-usage');
            options.addArguments('--disable-gpu');
            options.addArguments('--window-size=1920,1080');
            options.addArguments('--disable-extensions');
            options.addArguments('--disable-popup-blocking');

            this.driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(options)
                .build();

            // Set implicit wait
            await this.driver.manage().setTimeouts({ implicit: 10000 });

            // Maximize window
            await this.driver.manage().window().maximize();
        }

        return this.driver;
    }

    async quitDriver() {
        if (this.driver) {
            await this.driver.quit();
            this.driver = null;
        }
    }

    async takeScreenshot(filename) {
        if (this.driver) {
            const screenshot = await this.driver.takeScreenshot();
            const fs = require('fs');
            const path = require('path');

            const screenshotDir = path.join(__dirname, '../screenshots');
            if (!fs.existsSync(screenshotDir)) {
                fs.mkdirSync(screenshotDir, { recursive: true });
            }

            const filepath = path.join(screenshotDir, `${filename}.png`);
            fs.writeFileSync(filepath, screenshot, 'base64');

            return filepath;
        }
    }
}

module.exports = new WebDriverManager();
