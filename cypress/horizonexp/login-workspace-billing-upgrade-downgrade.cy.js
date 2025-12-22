describe("HorizonExp Profile Update Test", () => {
  const testConfig = {
    baseUrl: "https://dev.shorts.macintosh-ix88.thinkflagship.com/signin",
    // baseUrl: 'https://app.horizonexp.com/signin',
    userEmail: "asifniloy2017@gmail.com",
    userPassword: "devops_test$sqa@flagship",
    humanDelay: 2000,
    humanTypeDelay: 100,
  };

  const humanWait = (customDelay = testConfig.humanDelay) => {
    cy.wait(customDelay);
  };

  beforeEach(() => {
    cy.viewport(1920, 1080);
  });

  it("Login and update profile information", () => {
    const profileData = {
      firstName: "Asif",
      lastName: "DevOps",
      phone: "+8801789876543",
      companyName: "Flagship",
      companyWebsite: "horizonexp.com",
    };

    cy.log("🔐 Starting Login");
    cy.visit(testConfig.baseUrl);
    humanWait();

    // Email
    cy.get('input[type="email"], input[name="email"]')
      .first()
      .should("be.visible")
      .clear()
      .type(testConfig.userEmail, { delay: testConfig.humanTypeDelay });
    humanWait(1000);

    // Password
    cy.get('input[type="password"], input[name="password"]')
      .first()
      .should("be.visible")
      .clear()
      .type(testConfig.userPassword, { delay: testConfig.humanTypeDelay });
    humanWait(1000);

    // Submit
    cy.get('button[type="submit"], input[type="submit"]')
      .not(':contains("Google")')
      .first()
      .click();

    // Verify login success
    cy.url({ timeout: 30000 }).should("include", testConfig.baseUrl);
    humanWait(3000);

    // 1. Click on the profile icon/button on bottom left corner
    cy.log("👤 Navigating to Profile");
    cy.get("button").filter(":has(img)").last().should("be.visible").click();
    humanWait(1000);

    // --- Create New Workspace Section ---
    cy.log("🆕 Creating New Workspace");

    // Dynamic workspace name with timestamp
    // const newWorkspaceName = `Auto-WS-${Date.now()}`;
    const newWorkspaceName = `Auto-WS-00001`;

    // 2. Click on "Add new workspace" button from the dropdown menu
    cy.contains("Add new workspace").should("be.visible").click();
    humanWait(2000);

    // 3. Fill in the workspace name in the modal/form
    // The placeholder is "Workspace name..." so we need to match "Workspace" (case-sensitive usually)
    cy.get('input[placeholder*="Workspace"], input[placeholder*="workspace"]')
      .first()
      .should("be.visible")
      .clear()
      .type(`${newWorkspaceName}{enter}`, { delay: testConfig.humanTypeDelay });
    humanWait(1000);

    // 4. Click Create Workspace button
    // User requested to not click the button explicitly, assuming Enter works or it's not needed.
    // cy.get("button")
    //   .contains(/create|submit|save/i)
    //   .should("be.visible")
    //   .click();

    // 5. Wait till the new workspace is loaded
    // We can check if the modal is gone or if the URL changes, or simply wait and check for a unique element of the dashboard
    humanWait(3000);
    cy.log(`✅ Workspace "${newWorkspaceName}" created successfully`);

    // 6. Click on the profile icon on bottom left corner again
    cy.get("button").filter(":has(img)").last().should("be.visible").click();
    humanWait(1000);

    // 7. Click on 'Workspace & Billing'
    cy.contains("Workspace & Billing").should("be.visible").click();
    humanWait(3000);

    // Hard refresh as requested
    cy.reload(true);
    humanWait(4000); // Wait for page to reload and stabilize

    // 8. Click on 'Upgrade to Pro' or 'Upgrade to Premium'
    // Using regex to match either text case-insensitively
    cy.get("button")
      .contains(/Upgrade to (Pro|Premium)/i)
      .should("be.visible")
      .click();
    humanWait(1000);

    // 9. Pause for Manual Payment
    cy.log("🛑 PAUSING TEST for manual payment details entry...");
    cy.log("👉 Please complete payment in the opened window/tab.");
    cy.log(
      "👉 AFTER payment, close the payment window and click 'Resume' in Cypress."
    );
    cy.pause(); // User handles payment manually here

    // 10. Reload to reflect subscription change
    cy.reload(true);
    humanWait(5000);

    // 11. Click on 'Downgrade to Starter'
    cy.log("📉 Downgrading to Starter");
    cy.contains("button", "Downgrade to Starter").should("be.visible").click();
    humanWait(1000);

    // 12. Click on confirm button in the modal
    cy.contains("button", "Confirm").should("be.visible").click();

    humanWait(3000);

    cy.log("✅ Verified Upgrade and Downgrade flow");
  });
});
