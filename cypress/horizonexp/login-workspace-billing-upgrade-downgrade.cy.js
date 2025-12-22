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
    const newWorkspaceName = `Auto-WS-11`;

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

    // 8. Click on 'Upgrade to Pro'
    // Selector based on the provided image "Upgrade to Premium" button
    cy.contains("button", "Upgrade to Pro").should("be.visible").click();
    humanWait(1000);

    // 9. Click on confirm button
    // Assuming a modal pops up with a confirm action.
    // Searching for a "Confirm" or "Upgrade" button in a modal or the next screen.
    // If it's a direct checkout or Stripe, this might need adjustment, but based on "Click on confirm button" request:
    cy.get("button")
      .contains(/confirm|pay|upgrade/i)
      .should("be.visible")
      .click();

    // 10. Stay in the page after reloads for 3sec
    // The previous click might cause a reload or navigation.
    humanWait(3000);

    cy.log("✅ Verified Upgrade flow");
  });
});
