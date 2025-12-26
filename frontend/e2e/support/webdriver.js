const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

class WebDriverManager {
    driver = null;



    async getDriver() {
        if (!this.driver) {
            const options = new chrome.Options();

            // Run headless by default (set HEADLESS=false to see browser)
            if (process.env.HEADLESS !== 'false') {
                options.addArguments('--headless=new');
            }

            // Additional Chrome options for better stability and speed
            options.addArguments('--no-sandbox');
            options.addArguments('--disable-dev-shm-usage');
            options.addArguments('--disable-gpu');
            options.addArguments('--window-size=1920,1080');
            options.addArguments('--disable-extensions');
            options.addArguments('--disable-popup-blocking');
            options.addArguments('--disable-background-networking');
            options.addArguments('--disable-sync');
            options.addArguments('--disable-translate');
            options.addArguments('--disable-infobars');
            options.addArguments('--disable-features=TranslateUI');
            options.addArguments('--blink-settings=imagesEnabled=false');

            this.driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(options)
                .build();

            // Set implicit wait (reduced for faster failures)
            await this.driver.manage().setTimeouts({ implicit: 3000 });

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
            const fs = require('node:fs');
            const path = require('node:path');

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
