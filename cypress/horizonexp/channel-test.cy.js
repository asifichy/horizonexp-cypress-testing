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

    // Upload Channel Icon
    cy.log("📸 Uploading Channel Icon");
    cy.get('input[type="file"]').selectFile("cypress/fixtures/channel-icon.jpg", {
      force: true,
    });
    humanWait(2000);

    // Fill Form
    // Name: Test-channel
    cy.log("📝 Filling Name");
    cy.get('input[placeholder*="channel name"]')
      .type("Automation-Channels11", { delay: testConfig.humanTypeDelay })
      .should("have.value", "Automation-Channels11");
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

    // Close dropdown by clicking on the Title label or body
    cy.contains("label", "Title").click({ force: true });
    humanWait(500);

    // Title: Testing
    cy.log("📝 Filling Title");
    cy.get('input[placeholder*="channel title"]')
      .type("Testing", { delay: testConfig.humanTypeDelay, force: true })
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
    // Refresh to ensure the newly created channel appears
    cy.reload();
    humanWait(2000);

    // --- Edit Channel Section ---
    cy.log("✏️ Starting Edit Channel");

    // Verify we are back on Channels page
    cy.contains("Shorts Channels").should("be.visible");
    humanWait(2000);

    // Locate the created channel and click the three-dot menu
    cy.log("🔍 Locating 'Automation-Channels' and opening menu");
    humanWait(3000); // Wait for list to refresh as per user instruction

    // Find the channel name, then traverse up to the row (closest container with a button), then find the menu button
    cy.contains("Automation-Channels")
      .parentsUntil("body")
      .filter((i, el) => Cypress.$(el).find("button").length > 0)
      .first()
      .find("button")
      .last()
      .click({ force: true });

    // If it's not a table (tr), we might need a different strategy. Let's try a more generic approach if the above is too specific to tables.
    // Alternative: Find the container that has the text and then find the menu button.
    // Based on the image, it looks like a list/table. Let's try to find the menu button relative to the text.

    // Fallback/More robust selector logic if the structure is div-based:
    // cy.contains("Automation-Channel").parent().find('button').click(); 

    // Let's stick to a slightly more generic approach first, assuming the menu button is near the text.
    // Actually, the user said "Click on the menu icon (three dot)".

    humanWait(1000);

    // Click "Edit channel"
    cy.contains("Edit channel").should("be.visible").click();
    humanWait(2000);

    // Verify Edit Channel page
    cy.contains("Edit Channel").should("be.visible"); // Assuming the header says "Edit Channel" or similar

    // Update Title
    cy.log("📝 Updating Title");
    cy.get('input[placeholder*="channel name"]') // Assuming same placeholder or name
      .clear()
      .type("Channel Auto", { delay: testConfig.humanTypeDelay })
      .should("have.value", "Channel Auto");
    humanWait(1000);

    // Update Description
    cy.log("📝 Updating Description");
    cy.get('textarea[placeholder*="channel description"]')
      .clear()
      .type("Updated Description", { delay: testConfig.humanTypeDelay })
      .should("have.value", "Updated Description");
    humanWait(1000);

    // Update Channel
    cy.log("🚀 Clicking Update Channel");
    cy.contains("button", "Update Channel").click(); // Assuming button text is "Update Channel" or "Save"
    // If it's "Save", we might need to adjust. Let's assume "Update" or "Save" based on common patterns, user said "Update Channel".

    humanWait(3000);

    // Verify redirection to Channels page
    cy.contains("Shorts Channels").should("be.visible");
    cy.log("✅ Channel edit step completed");
    // Refresh to ensure latest state
    cy.reload();
    humanWait(2000);

    // Locate the channel again and open menu to disable
    cy.log("🔍 Locating 'Automation-Channels11' and opening menu to disable");
    cy.contains("Automation-Channels11")
      .parentsUntil("body")
      .filter((i, el) => Cypress.$(el).find("button").length > 0)
      .first()
      .find("button")
      .last()
      .click({ force: true });
    humanWait(1000);

    // Click Disable button (assuming button text 'Disable')
    cy.contains("Disable").should("be.visible").click();
    humanWait(2000);

    // Refresh after disabling
    cy.reload();
    humanWait(2000);
    cy.log("✅ Channel disabled and page refreshed");
  });
});
