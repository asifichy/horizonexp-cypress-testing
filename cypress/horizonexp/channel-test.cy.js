describe("HorizonExp Channel Test", () => {
  // Test configuration
  const testConfig = {
    baseUrl: "https://app.horizonexp.com/signin",
    userEmail: "asifniloy2017@gmail.com",
    userPassword: "devops_test$sqa@flagship",
    humanDelay: 2000,
    humanTypeDelay: 100,
  };

  // Helper function for delays
  const humanWait = (customDelay = testConfig.humanDelay) => {
    cy.wait(customDelay);
  };

  beforeEach(() => {
    cy.viewport(1920, 1080);
  });

  it("Should create a new channel successfully", () => {
    // --- Login Section ---
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

    // Wait for login to complete
    cy.url({ timeout: 30000 }).should("include", "app.horizonexp.com");
    humanWait(3000);

    // --- Navigation Section ---
    cy.log("📱 Navigating to Short-form -> Channels");

    // Click Short-form
    cy.contains("Short-form").should("be.visible").click();
    humanWait(2000);

    // Click Channels
    cy.contains("Channels").should("be.visible").click();
    humanWait(3000);

    // Verify we are on Channels page
    cy.contains("Shorts Channels").should("be.visible");

    // --- Create Channel Section ---
    cy.log("➕ Creating New Channel");

    // Click Create New
    cy.contains("button", "Create New").should("be.visible").click();
    humanWait(2000);

    // Verify Create New Channel form
    cy.contains("Create New Channel").should("be.visible");

    // Fill Form
    // Name: Test-channel
    cy.log("📝 Filling Name");
    cy.get('input[placeholder*="channel name"]').type("Test-channel", {
      delay: testConfig.humanTypeDelay,
    });
    humanWait(1000);

    // Description: Test Channel for automation testing
    cy.log("📝 Filling Description");
    cy.get('textarea[placeholder*="channel description"]').type(
      "Test Channel for automation testing",
      { delay: testConfig.humanTypeDelay }
    );
    humanWait(1000);

    // Category: Auto & Vehicles
    cy.log("📝 Selecting Category");
    // Open Category dropdown
    cy.contains("label", "Category").parent().click({ force: true });
    humanWait(1000);

    // Select "Auto & Vehicles" - Handling the specific UI with "Select" button
    cy.get("body").then(($body) => {
      if ($body.find('button:contains("Select")').length > 0) {
        // If the UI has "Select" buttons next to categories (as seen in screenshot)
        cy.contains("div, li", "Auto & Vehicles")
          .find('button:contains("Select")')
          .click({ force: true });
      } else {
        // Standard dropdown fallback
        cy.contains("Auto & Vehicles").click({ force: true });
      }
    });
    humanWait(1000);

    // Title: Testing
    cy.log("📝 Filling Title");
    cy.get('input[placeholder*="channel title"]').type("Testing", {
      delay: testConfig.humanTypeDelay,
    });
    humanWait(1000);

    // Caption: Automation testing
    cy.log("📝 Filling Caption");
    cy.get('textarea[placeholder*="channel caption"]').type(
      "Automation testing",
      { delay: testConfig.humanTypeDelay }
    );
    humanWait(1000);

    // Tags: Test, Automation
    cy.log("📝 Filling Tags");
    cy.get('input[placeholder*="add tags"]').type(
      "Test{enter}Automation{enter}",
      { delay: testConfig.humanTypeDelay }
    );
    humanWait(1000);

    // CTA Button: Test Ongoing (Label)
    cy.log("📝 Filling CTA Button Label");
    cy.get('input[placeholder*="button label"]').type("Test Ongoing", {
      delay: testConfig.humanTypeDelay,
    });
    humanWait(1000);

    // CTA Label: www.horizonexp.com (Link)
    cy.log("📝 Filling CTA Button Link");
    cy.get('input[placeholder*="button link"]').type("www.horizonexp.com", {
      delay: testConfig.humanTypeDelay,
    });
    humanWait(1000);

    // Create Channel
    cy.log("🚀 Clicking Create Channel");
    cy.contains("button", "Create Channel").click();

    humanWait(3000);
    cy.log("✅ Channel creation step completed");
  });
});
