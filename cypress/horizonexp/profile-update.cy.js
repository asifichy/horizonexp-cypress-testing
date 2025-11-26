describe('HorizonExp Profile Update Test', () => {
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

    it('Login and update profile information', () => {
        const profileData = {
            firstName: 'Asif',
            lastName: 'DevOps',
            phone: '+8801789876543',
            companyName: 'Flagship',
            companyWebsite: 'horizonexp.com'
        };

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

        // 1. Click on the profile icon/button on bottom left corner 'DevOps'
        cy.log('👤 Navigating to Profile');
        // The user mentioned 'DevOps' is the profile name.
        // We look for the profile section at the bottom left.
        // Based on the screenshot, it's a button with text "DevOps" and an image.
        cy.contains('button', 'DevOps').should('be.visible').click();
        humanWait(1000);

        // 2. Click on the 'My Profile' button
        cy.contains('My Profile').should('be.visible').click();
        humanWait(3000);

        // Verify we are on the profile page
        cy.url().should('include', '/profile');
        cy.contains('Your Account').should('be.visible');

        // 3. Upload profile icon
        cy.log('🖼️ Uploading Profile Icon');
        // "To upload e new profile icon, click on the Upload new button"
        // However, usually file inputs are hidden. We should check if we can attach directly to the input 
        // or if we need to click the button first.
        // Cypress `selectFile` works on the input element.
        // Let's try to find the file input.
        cy.get('input[type="file"]').first().selectFile('cypress/fixtures/profile_icon.jpg', { force: true });

        humanWait(2000);

        // 4. Input Form Data
        cy.log('📝 Updating Form Data');

        // Helper function for robust input
        const updateInput = (label, value) => {
            cy.contains('label', label)
                .parent()
                .find('input')
                .should('be.visible')
                .focus()
                .clear()
                .should('have.value', '') // Ensure it's cleared
                .type(value, { delay: testConfig.humanTypeDelay });
        };

        // First Name
        updateInput('First Name', profileData.firstName);
        humanWait(500);

        // Last Name
        updateInput('Last Name', profileData.lastName);
        humanWait(500);

        // Phone Number
        updateInput('Phone', profileData.phone);
        humanWait(500);

        // Company Name
        updateInput('Company Name', profileData.companyName);
        humanWait(500);

        // Company Website
        updateInput('Company Website', profileData.companyWebsite);
        humanWait(1000);

        // 5. Verify changes (Auto-save)
        cy.log('✅ Verifying Updates');

        cy.contains('label', 'First Name').parent().find('input').should('have.value', profileData.firstName);
        cy.contains('label', 'Last Name').parent().find('input').should('have.value', profileData.lastName);
        cy.contains('label', 'Phone').parent().find('input').should('have.value', profileData.phone);
        cy.contains('label', 'Company Name').parent().find('input').should('have.value', profileData.companyName);
        cy.contains('label', 'Company Website').parent().find('input').should('have.value', profileData.companyWebsite);

        humanWait(2000);
    });
});
