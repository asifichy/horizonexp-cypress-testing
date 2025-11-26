        // 4. Click on profile icon again to add new workspace
        cy.log('➕ Adding New Workspace');
        cy.get('button').filter(':has(img)').last().should('be.visible').click();
        humanWait(1000);

        // 5. Click 'Add new workspace'
        cy.contains('Add new workspace').should('be.visible').click();
        humanWait(1000);

        // 6. In the popup, type the new workspace name
        cy.log('📝 Creating New Workspace');
        // Wait for modal to appear
        cy.contains('New Workspace').should('be.visible');

        // Find the input field and type the workspace name
        cy.get('input')
            .filter(':visible')
            .last()
            .should('be.visible')
            .clear()
            .type(newWorkspaceName, { delay: testConfig.humanTypeDelay });
        humanWait(500);

        // 7. Click 'Create Workspace'
        cy.contains('button', 'Create Workspace').should('be.visible').click();
        humanWait(2000);

        // 8. After creating, the UI should show the new workspace
        // Verify the new workspace was created and we're now in it
        cy.log('🔄 Switching workspaces');

        // Wait to ensure we're in the new workspace
        humanWait(2000);

        const workspaceIconPath = 'cypress/fixtures/workspace_icon.jpg';
        const workspaceName = 'DevOps Testing';
        const newWorkspaceName = 'Automation WorkSpace 2';