// HorizonExp User Flow Test - Minimal

describe('HorizonExp User Flow Test', () => {
    const testConfig = {
        baseUrl: 'https://app.horizonexp.com/signin',
        userEmail: 'asifniloy2017@gmail.com',
        userPassword: 'devops_test$sqa@flagship',
        humanDelay: 2000,
        humanTypeDelay: 100,
    };

    const humanWait = (customDelay = testConfig.humanDelay) => {
        cy.wait(customDelay);
    };

    beforeEach(() => {
        cy.viewport(1920, 1080);
    });

    it('Login and navigate to Users page', () => {
        cy.log('🔐 Starting Login');
        cy.visit(testConfig.baseUrl);
        humanWait();

        // Email
        cy.get('input[type="email"], input[name="email"]')
            .first()
            .should('be.visible')
            .clear()
            .type(testConfig.userEmail, { delay: testConfig.humanTypeDelay });
        humanWait(1000);

        // Password
        cy.get('input[type="password"], input[name="password"]')
            .first()
            .should('be.visible')
            .clear()
            .type(testConfig.userPassword, { delay: testConfig.humanTypeDelay });
        humanWait(1000);

        // Submit
        cy.get('button[type="submit"], input[type="submit"]')
            .not(':contains("Google")')
            .first()
            .click();

        // Verify login success
        cy.url({ timeout: 30000 }).should('include', 'app.horizonexp.com');
        humanWait(3000);

        // Expand Short-form menu if needed
        cy.get('body').then(($body) => {
            if ($body.find(':contains("Short-form")').filter(':visible').length === 0) {
                cy.log('📂 Expanding Short-form menu');
                cy.contains('Short-form').should('be.visible').click();
                humanWait(2000);
            }
        });

        // Click Users
        cy.contains('Users').should('be.visible').click();
        humanWait(3000);

        // Verify we are on Users page
        cy.contains('Users').should('be.visible');
    });
});
