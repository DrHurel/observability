module.exports = {
    default: {
        require: ['e2e/step-definitions/**/*.js', 'e2e/support/**/*.js'],
        paths: ['e2e/features/**/*.feature'],
        format: [
            'progress-bar',
            'html:e2e/reports/cucumber-report.html',
            'json:e2e/reports/cucumber-report.json',
            'junit:e2e/reports/cucumber-report.xml'
        ],
        formatOptions: {
            snippetInterface: 'async-await'
        }
    }
};
