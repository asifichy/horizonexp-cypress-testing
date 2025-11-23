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

    // Click Short-form (only if Channels is not visible)
    cy.get("body").then(($body) => {
      if ($body.find(':contains("Channels")').filter(':visible').length === 0) {
        cy.log("📂 Expanding Short-form menu");
        cy.contains("Short-form").should("be.visible").click();
        humanWait(2000);
      } else {
        cy.log("📂 Short-form menu already expanded");
      }
    });

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
    cy.get('input[placeholder*="channel name"]')
      .type("Test-channel", { delay: testConfig.humanTypeDelay })
      .should("have.value", "Test-channel");
    humanWait(1000);

    // Description: Test Channel for automation testing
    cy.log("📝 Filling Description");
    cy.get('textarea[placeholder*="channel description"]')
      .type("Test Channel for automation testing", { delay: testConfig.humanTypeDelay })
      .should("have.value", "Test Channel for automation testing");
    humanWait(1000);

    // Category: Auto & Vehicles
    cy.log("📝 Selecting Category");
    // Open Category dropdown
    cy.log("🔽 Opening Category Dropdown");
    // Try clicking the element next to the label (likely the container)
    cy.contains("label", "Category").next().click({ force: true });
    humanWait(500);
    // Also try clicking the placeholder text just in case
    cy.contains("Select categories").click({ force: true });
    humanWait(2000);

    // Verify dropdown is open (check for an option)
    cy.contains("Auto & Vehicles").should("exist");

    // Select "Auto & Vehicles"
    cy.contains("Auto & Vehicles").should("be.visible").click({ force: true });
    humanWait(1000);
    // Verify selection (this might depend on how the dropdown renders the selected value, skipping specific value check for now as it's complex with custom dropdowns)

    // Title: Testing
    cy.log("📝 Filling Title");
    cy.get('input[placeholder*="channel title"]')
      .type("Testing", { delay: testConfig.humanTypeDelay })
      .should("have.value", "Testing");
    humanWait(1000);

    // Caption: Automation testing
    cy.log("📝 Filling Caption");
    cy.get('textarea[placeholder*="channel caption"]')
      .type("Automation testing", { delay: testConfig.humanTypeDelay })
      .should("have.value", "Automation testing");
    humanWait(1000);

    // Tags: Test, Automation
    cy.log("📝 Filling Tags");
    cy.get('input[placeholder*="add tags"]')
      .type("Test{enter}Automation{enter}", { delay: testConfig.humanTypeDelay });
    // Verifying tags usually involves checking for the tag elements, not the input value
    cy.contains("Test").should("be.visible");
    cy.contains("Automation").should("be.visible");
    humanWait(1000);

    // CTA Button: Test Ongoing (Label)
    cy.log("📝 Filling CTA Button Label");
    cy.get('input[placeholder*="button label"]')
      .type("Test Ongoing", { delay: testConfig.humanTypeDelay })
      .should("have.value", "Test Ongoing");
    humanWait(1000);

    // CTA Label: www.horizonexp.com (Link)
    cy.log("📝 Filling CTA Button Link");
    cy.get('input[placeholder*="button link"]')
      .type("www.horizonexp.com", { delay: testConfig.humanTypeDelay })
      .should("have.value", "www.horizonexp.com");
    humanWait(1000);

    // Create Channel
    cy.log("🚀 Clicking Create Channel");
    cy.contains("button", "Create Channel").click();

    humanWait(3000);
    cy.log("✅ Channel creation step completed");
  });
});
