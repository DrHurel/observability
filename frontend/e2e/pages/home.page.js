const { By } = require('selenium-webdriver');
const BasePage = require('./base.page');

class HomePage extends BasePage {
    constructor(driver) {
        super(driver);

        // Locators - Updated for ShopTrack
        this.locators = {
            heroTitle: By.css('.hero h1'),
            subtitle: By.css('.hero .subtitle'),
            featureCards: By.css('.feature-card'),
            browseCard: By.xpath('//h2[contains(text(), "Browse")]/ancestor::div[contains(@class, "feature-card")]'),
            sellCard: By.xpath('//h2[contains(text(), "Sell")]/ancestor::div[contains(@class, "feature-card")]'),
            profilingCard: By.xpath('//h2[contains(text(), "User Profiling")]/ancestor::div[contains(@class, "feature-card")]'),
            analyticsCard: By.xpath('//h2[contains(text(), "Analytics")]/ancestor::div[contains(@class, "feature-card")]'),
            goToMarketplaceButton: By.xpath('//a[contains(text(), "Go to Marketplace")]'),
            startSellingButton: By.xpath('//a[contains(text(), "Start Selling")]'),
            viewProfilesButton: By.xpath('//a[contains(text(), "View Profiles")]'),
            openGrafanaButton: By.xpath('//a[contains(text(), "Open Grafana")]'),
            getStartedButton: By.xpath('//a[contains(text(), "Get Started")]'),
            signInButton: By.xpath('//a[contains(text(), "Sign In")]'),
            techTags: By.css('.tech-tags .tag'),
            statsBar: By.css('.stats-bar'),
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
        if (cardName === 'Browse & Buy' || cardName === 'Browse') {
            locator = this.locators.browseCard;
        } else if (cardName === 'Sell Your Items' || cardName === 'Sell') {
            locator = this.locators.sellCard;
        } else if (cardName === 'User Profiling' || cardName === 'Profiling') {
            locator = this.locators.profilingCard;
        } else if (cardName === 'Analytics & Monitoring' || cardName === 'Analytics') {
            locator = this.locators.analyticsCard;
        } else {
            // Generic search
            locator = By.xpath(`//h2[contains(text(), "${cardName}")]/ancestor::div[contains(@class, "feature-card")]`);
        }

        return await this.isDisplayed(locator);
    }

    async clickGoToMarketplace() {
        await this.click(this.locators.goToMarketplaceButton);
    }

    async clickStartSelling() {
        await this.click(this.locators.startSellingButton);
    }

    async clickViewProfiles() {
        await this.click(this.locators.viewProfilesButton);
    }

    async clickGetStarted() {
        await this.click(this.locators.getStartedButton);
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
