const { By } = require('selenium-webdriver');
const BasePage = require('./base.page');

class UserCreatePage extends BasePage {
    constructor(driver) {
        super(driver);

        this.locators = {
            pageTitle: By.css('.container h2'),
            nameInput: By.id('name'),
            emailInput: By.id('email'),
            ageInput: By.id('age'),
            passwordInput: By.id('password'),
            submitButton: By.css('button[type="submit"]'),
            cancelButton: By.css('button[type="button"]'),
            successMessage: By.css('.success-message'),
            errorMessage: By.css('.error-message'),
            validationErrors: By.css('.error-text')
        };
    }

    async open() {
        await this.navigate('/users/create');
    }

    async getPageTitle() {
        return await this.getText(this.locators.pageTitle);
    }

    async fillName(name) {
        await this.type(this.locators.nameInput, name);
    }

    async fillEmail(email) {
        await this.type(this.locators.emailInput, email);
    }

    async fillAge(age) {
        await this.type(this.locators.ageInput, age);
    }

    async fillPassword(password) {
        await this.type(this.locators.passwordInput, password);
    }

    async fillForm(userData) {
        if (userData.name !== undefined) await this.fillName(userData.name);
        if (userData.email !== undefined) await this.fillEmail(userData.email);
        if (userData.age !== undefined) await this.fillAge(userData.age);
        if (userData.password !== undefined) await this.fillPassword(userData.password);
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
            errors.push(text);
        }
        return errors;
    }

    async hasValidationError(errorText) {
        const errors = await this.getValidationErrors();
        return errors.some(error => error.includes(errorText));
    }
}

module.exports = UserCreatePage;
