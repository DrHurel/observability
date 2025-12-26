const { By } = require('selenium-webdriver');
const BasePage = require('./base.page');

class ProductFormPage extends BasePage {
    constructor(driver) {
        super(driver);

        this.locators = {
            pageTitle: By.css('.container h2'),
            nameInput: By.id('name'),
            priceInput: By.id('price'),
            expirationDateInput: By.id('expirationDate'),
            submitButton: By.css('button[type="submit"]'),
            cancelButton: By.css('button[type="button"]'),
            successMessage: By.css('.success-message'),
            errorMessage: By.css('.error-message'),
            validationErrors: By.css('.error-text')
        };
    }

    async open() {
        await this.navigate('/sell');
    }

    async openCreate() {
        await this.navigate('/sell');
    }

    async openEdit(productId) {
        await this.navigate(`/products/edit/${productId}`);
    }

    async getPageTitle() {
        return await this.getText(this.locators.pageTitle);
    }

    async fillName(name) {
        await this.type(this.locators.nameInput, name);
    }

    async fillPrice(price) {
        await this.type(this.locators.priceInput, price);
    }

    async fillExpirationDate(date) {
        await this.type(this.locators.expirationDateInput, date);
    }

    async fillForm(productData) {
        if (productData.name !== undefined) await this.fillName(productData.name);
        if (productData.price !== undefined) await this.fillPrice(productData.price);
        if (productData.expirationDate !== undefined) await this.fillExpirationDate(productData.expirationDate);
    }

    async updateForm(productData) {
        // Clear and fill for updates
        if (productData.name !== undefined) {
            const nameInput = await this.findElement(this.locators.nameInput);
            await nameInput.clear();
            await this.fillName(productData.name);
        }
        if (productData.price !== undefined) {
            const priceInput = await this.findElement(this.locators.priceInput);
            await priceInput.clear();
            await this.fillPrice(productData.price);
        }
        if (productData.expirationDate !== undefined) {
            const dateInput = await this.findElement(this.locators.expirationDateInput);
            await dateInput.clear();
            await this.fillExpirationDate(productData.expirationDate);
        }
    }

    async clickSubmit() {
        await this.click(this.locators.submitButton);
    }

    async clickCancel() {
        await this.click(this.locators.cancelButton);
    }

    async isSuccessMessageVisible() {
        return await this.isDisplayed(this.locators.successMessage);
    }

    async getSuccessMessage() {
        return await this.getText(this.locators.successMessage);
    }

    async isErrorMessageVisible() {
        return await this.isDisplayed(this.locators.errorMessage);
    }

    async getErrorMessage() {
        return await this.getText(this.locators.errorMessage);
    }

    async getValidationErrors() {
        const elements = await this.findElements(this.locators.validationErrors);
        const errors = [];
        for (const element of elements) {
            const text = await element.getText();
            if (text) errors.push(text);
        }
        return errors;
    }

    async hasValidationError(errorText) {
        const errors = await this.getValidationErrors();
        return errors.some(error => error.includes(errorText));
    }
}

module.exports = ProductFormPage;
