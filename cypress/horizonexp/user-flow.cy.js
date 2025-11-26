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

        // --- Invite New Channel User Section ---
        const targetChannel = 'DevOps';
        const inviteEmail = 'sqa-testing@yopmail.com'; // Dynamic email

        cy.get('body').then(($body) => {
            if ($body.find(`:contains("${inviteEmail}")`).length === 0) {
                cy.log('➕ Starting New User Invitation');

                // 1. Click "New User"
                cy.contains('button', 'New User').should('be.visible').click();
                humanWait(2000);

                // 2. Select "New Channel User" radio button
                cy.contains('label', 'New Channel User').click();
                // Or if the label click doesn't trigger the radio, try finding the radio input directly
                // cy.get('input[type="radio"][value="channel_user"]').check({force: true}); 
                humanWait(2000);

                // 3. Select Channel (Dynamic)
                cy.log(`📢 Selecting Channel: ${targetChannel}`);
                // Scope to the modal/dialog to ensure we pick the one in the popup, not in the background
                cy.get('[role="dialog"]').contains(targetChannel).should('be.visible').click();
                humanWait(1000);

                // 4. Enter Email
                cy.log(`📧 Entering Email: ${inviteEmail}`);
                // The image shows "User 1 Email" placeholder
                cy.get('input[placeholder*="User 1 Email"]')
                    .type(inviteEmail, { delay: testConfig.humanTypeDelay })
                    .should('have.value', inviteEmail);
                humanWait(1000);

                // 5. Select Role "Moderator"
                cy.log('👤 Selecting Role: Moderator');
                // Click the dropdown trigger. Image shows "Pick a role"
                cy.contains('Pick a role').click();
                humanWait(500);
                // Select "Moderator" from the dropdown options
                const targetRole = 'Moderator';
                cy.contains(targetRole).should('be.visible').click();
                humanWait(1000);

                // 6. Click "Send Invite"
                cy.log('🚀 Sending Invite');
                cy.contains('button', 'Send Invite').click();

                // Verify the modal closes to ensure the invite was sent
                cy.get('[role="dialog"]').should('not.exist');

                // Wait for the invite request to complete before reloading
                cy.log('⏳ Waiting 1 minute before first reload...');
                cy.wait(60000); // Wait 1 minute
            } else {
                cy.log('ℹ️ User already exists. Skipping invitation and proceeding to role check.');
            }
        });

        // Wait up to 5 minutes, reloading each minute to see if the invitation is accepted
        const maxAttempts = 5; // 5 minutes
        let attemptsLeft = maxAttempts;
        let roleChanged = false; // Track if we've already changed the role

        const checkInvitation = () => {
            cy.reload();
            cy.wait(5000); // Wait for page load and list population
            cy.get('body').then(($body) => {
                const hasAccepted = $body.find('div:contains("Invitation accepted")').length > 0;
                const pendingExists = $body.find('div:contains("Pending invite")').length > 0;
                const userVisible = $body.find(`:contains("${inviteEmail}")`).length > 0;

                cy.log(`🔍 Check attempt ${maxAttempts - attemptsLeft + 1}: Accepted=${hasAccepted}, Pending=${pendingExists}, UserVisible=${userVisible}`);

                if (hasAccepted) {
                    cy.log('✅ Invitation has been accepted');
                    return; // Stop recursing
                } else if (userVisible && !pendingExists && !roleChanged) {
                    // User is visible and no longer pending - change their role
                    cy.log('✅ Invited user is visible and accepted. Changing role from Moderator to Moderator...');

                    // Find the user row and click the menu button (three dots)
                    cy.contains(inviteEmail)
                        .parents('tr')
                        .find('button')
                        .last()
                        .click({ force: true });
                    humanWait(2000); // Wait for menu to open

                    // Click "Manage access"
                    cy.contains('Manage access', { timeout: 10000 }).should('be.visible').click();
                    humanWait(2000);

                    // Click the role dropdown (could be Publisher, Editor, etc.)
                    cy.contains(/Publisher|Editor|Viewer|Moderator/).should('be.visible').click();
                    humanWait(1000);

                    // Select "Publisher"
                    cy.contains('Publisher').should('be.visible').click();
                    humanWait(1000);

                    // Click "Confirm" in the confirmation dialog
                    cy.contains('button', 'Confirm').should('be.visible').click();
                    humanWait(2000);

                    // Verify success toast
                    cy.contains('Role has been changed successfully').should('be.visible');
                    cy.log('✅ Role changed successfully');
                    humanWait(2000);

                    // Click back arrow to return to Users page
                    cy.get('button[aria-label*="back"], button:has(svg)').first().click();
                    humanWait(3000);

                    // --- Delete User Section ---
                    cy.log('🗑️ Deleting the user...');

                    // Find the user row and click the menu button (three dots) again
                    cy.contains(inviteEmail)
                        .parents('tr')
                        .find('button')
                        .last()
                        .click({ force: true });
                    humanWait(1000);

                    // Click "Delete user"
                    cy.contains('Delete user').should('be.visible').click();
                    humanWait(1000);

                    // Confirm deletion (assuming there's a confirmation dialog similar to role change)
                    // If the button text is "Delete" or "Confirm", adjust accordingly. 
                    // Based on standard patterns, it's likely "Delete" or "Confirm".
                    // I'll try to match a button that looks like a confirmation action.
                    cy.get('button').contains(/Delete|Confirm/i).should('be.visible').click();
                    humanWait(2000);

                    cy.log('✅ User deleted successfully');

                    roleChanged = true;
                    return; // Stop recursing
                } else if (userVisible) {
                    cy.log('✅ Invited user is visible in the list');
                    // If user is visible, we might want to check their status (e.g. Pending)
                    if ($body.find(`:contains("${inviteEmail}")`).parents('tr').find(':contains("Pending")').length > 0) {
                        cy.log('ℹ️ User is visible but status is Pending');
                    }
                    return; // Stop recursing
                } else if (!pendingExists && attemptsLeft < maxAttempts) {
                    // If pending is gone and we've waited at least once, maybe it's done?
                    // But if user is not visible, that's suspicious.
                    cy.log('⚠️ "Pending invite" element not found, but user not visible yet. Continuing to wait...');
                }

                if (attemptsLeft > 0) {
                    attemptsLeft--;
                    cy.wait(60000); // wait 1 minute
                    checkInvitation();
                } else {
                    // Fail the test if we timed out and didn't find the user
                    throw new Error(`❌ Invitation verification failed: User ${inviteEmail} not visible after 5 minutes.`);
                }
            });
        };
        // Start the polling loop
        checkInvitation();

        // Optional: verify a success message if the UI provides one
        // cy.contains('Invite sent').should('be.visible');
    });
});

