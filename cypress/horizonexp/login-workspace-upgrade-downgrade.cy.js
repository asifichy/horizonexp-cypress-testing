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

    // 1. Click on the profile icon/button on bottom left corner 'DevOps'
    cy.log("👤 Navigating to Profile");
    // Click on the profile button at the bottom left.
    // Using a generic selector: find the last button that contains an image (avatar).
    cy.get("button").filter(":has(img)").last().should("be.visible").click();
    humanWait(1000);

    // 2. Click on the 'My Profile' button
    cy.contains("My Profile").should("be.visible").click();
    humanWait(3000);

    // Verify we are on the profile page
    cy.url().should("include", "/profile");
    cy.contains("Your Account").should("be.visible");

    // 3. Upload profile icon
    cy.log("🖼️ Uploading Profile Icon");
    // "To upload e new profile icon, click on the Upload new button"
    // However, usually file inputs are hidden. We should check if we can attach directly to the input
    // or if we need to click the button first.
    // Cypress `selectFile` works on the input element.
    // Let's try to find the file input.
    cy.get('input[type="file"]')
      .first()
      .selectFile("cypress/fixtures/profile_icon.jpg", { force: true });

    humanWait(2000);

    // 4. Input Form Data
    cy.log("📝 Updating Form Data");

    // Helper function for robust input
    const updateInput = (label, value) => {
      cy.contains("label", label)
        .parent()
        .find("input")
        .should("be.visible")
        .focus() // Focus first
        .clear()
        .wait(500) // Increased wait for UI to settle after clear
        .should("have.value", "") // Ensure it's cleared
        .type(value, { delay: testConfig.humanTypeDelay });
    };

    // First Name
    updateInput("First Name", profileData.firstName);
    humanWait(500);

    // Last Name
    updateInput("Last Name", profileData.lastName);
    humanWait(500);

    // Phone Number
    updateInput("Phone", profileData.phone);
    humanWait(500);

    // Company Name
    updateInput("Company Name", profileData.companyName);
    humanWait(500);

    // Company Website
    updateInput("Company Website", profileData.companyWebsite);
    humanWait(1000);

    // 5. Verify changes (Auto-save)
    cy.log("✅ Verifying Updates");

    cy.contains("label", "First Name")
      .parent()
      .find("input")
      .should("have.value", profileData.firstName);
    cy.contains("label", "Last Name")
      .parent()
      .find("input")
      .should("have.value", profileData.lastName);
    cy.contains("label", "Phone")
      .parent()
      .find("input")
      .should("have.value", profileData.phone);
    cy.contains("label", "Company Name")
      .parent()
      .find("input")
      .should("have.value", profileData.companyName);
    cy.contains("label", "Company Website")
      .parent()
      .find("input")
      .should("have.value", profileData.companyWebsite);

    humanWait(2000);

    // --- Apps & Websites Section ---
    cy.log("🌐 Starting Apps & Websites Section");

    // 1. Click on 'Apps & Websites'
    cy.contains("Apps & Websites").should("be.visible").click();
    humanWait(2000);

    // 2. Click on 'Add New' button
    // Wait for the button to be visible. There might be a "No websites or apps added" state.
    cy.contains("button", "Add New").should("be.visible").click();
    humanWait(1000);

    // 3. Fill in the modal
    cy.log("📝 Filling New Asset Modal");

    // Variables
    const assetName = "SQA Testing";
    const websiteDomain = "demo.horizonexp.com";

    // Select 'Website' radio button
    // The image shows "Website" as a radio option.
    // It might be a label wrapping a radio or a custom div.
    // Let's try finding the label containing "Website" and clicking it.
    cy.contains("label", "Website").should("be.visible").click();
    humanWait(500);

    // Asset Name
    // "Enter a name for your asset" placeholder or label "Asset Name"
    cy.contains("label", "Asset Name")
      .parent()
      .find("input")
      .should("be.visible")
      .focus()
      .type(assetName, { delay: testConfig.humanTypeDelay });
    humanWait(500);

    // Website Domain
    // "Example: https://www.company.com" placeholder or label "Website Domain"
    cy.contains("label", "Website Domain")
      .parent()
      .find("input")
      .should("be.visible")
      .focus()
      .type(websiteDomain, { delay: testConfig.humanTypeDelay });
    humanWait(500);

    // 4. Click 'Add to my account'
    cy.contains("button", "Add to my account").should("be.visible").click();

    // Verify success or modal close
    humanWait(3000);
    cy.log("✅ Apps & Websites added");

    // 5. Delete the added website
    cy.log("🗑️ Deleting the website");

    // Locate the card containing the asset name and find the menu button
    // We assume the menu button is within the same container as the asset name
    cy.contains(assetName).should("be.visible");

    // Find the menu button (three dots) associated with this asset
    // We look for the asset name, go up to its parent (header/row), and find the button
    cy.contains(assetName).parent().find("button").first().click();

    humanWait(1000);

    // Click 'Delete' from the dropdown/menu
    cy.contains("Delete").should("be.visible").click();

    // Handle confirmation dialog
    cy.log("⚠️ Handling Deletion Confirmation");

    // Wait for the modal to appear
    // The modal text says "Are you sure you want to delete?"
    cy.contains("Are you sure you want to delete?").should("be.visible");

    // Type the asset name into the input field
    // The modal requires typing the asset name to confirm deletion
    // Wait a moment for the modal to fully render
    humanWait(500);

    // Find the input field - it appears after the confirmation text
    // Use a very simple selector to find any visible input
    cy.get("input")
      .filter(":visible")
      .last()
      .should("be.visible")
      .clear()
      .type(assetName, { delay: testConfig.humanTypeDelay });

    humanWait(1000);

    // Click the final 'Delete' button in the modal
    // It's likely a red button or similar.
    // We can look for the button inside the modal.
    // Using the text "Delete" again might find the previous menu item if not careful,
    // but the menu should be gone or the modal button is distinct.
    // Let's scope to the modal if possible, or use a more specific selector if needed.
    // Based on the image, it's a button with text "Delete".
    cy.get("button").contains("Delete").should("be.visible").click();

    humanWait(2000);

    // Verify deletion
    cy.contains(assetName).should("not.exist");
    cy.log("✅ Website deleted successfully");

    // --- Workspace & Billing Section ---
    cy.log("🏢 Starting Workspace & Billing Section");

    // Variables
    const workspaceIconPath = "cypress/fixtures/workspace_icon.jpg";
    const workspaceName = "DevOps Testing";

    // 1. Click on 'Workspace & Billing' tab
    cy.contains("Workspace & Billing").should("be.visible").click();
    humanWait(2000);

    // 2. Upload workspace icon
    cy.log("🖼️ Uploading Workspace Icon");
    // Directly find and use the file input for workspace icon
    // The 'Upload new' button likely has a file input associated with it
    cy.get('input[type="file"]')
      .first() // Use first since we're on Workspace & Billing page
      .selectFile(workspaceIconPath, { force: true });
    humanWait(2000);

    // 3. Update workspace name
    cy.log("✏️ Updating Workspace Name");
    cy.contains("label", "Workspace Name")
      .parent()
      .find("input")
      .should("be.visible")
      .clear()
      .wait(200)
      .type(workspaceName, { delay: testConfig.humanTypeDelay });
    humanWait(1000);

    // 4. Click on profile icon to switch workspace
    cy.log("🔄 Switching Workspaces");
    cy.get("button").filter(":has(img)").last().should("be.visible").click();
    humanWait(1000);

    // 5. Switch to 'Automation Space' (or similar existing workspace)
    // Using a variable for dynamic workspace name
    const switchToWorkspace = "Automation Space";

    // First, try to find the workspace. If not visible, click Show more
    cy.get("body").then(($body) => {
      // Check if 'Show more' button exists and the workspace is not immediately visible
      if ($body.find(':contains("Show more")').length > 0) {
        // Try to find workspace in current view
        const workspaceVisible = $body.text().includes(switchToWorkspace);
        if (!workspaceVisible) {
          // Click 'Show more' to reveal hidden workspaces
          cy.contains("Show more").should("be.visible").click();
          humanWait(500);
        }
      }
    });

    // Now click on the workspace (it should be visible now)
    cy.contains(switchToWorkspace).should("be.visible").click();
    humanWait(2000);

    // 6. Click on profile icon again to switch back to original workspace
    cy.get("button").filter(":has(img)").last().should("be.visible").click();
    humanWait(1000);

    // 7. Switch back to 'DevOps Testing' workspace
    cy.get("body").then(($body) => {
      if ($body.text().includes(workspaceName)) {
        // Workspace is visible, click it directly
        cy.contains(workspaceName).should("be.visible").click();
      } else {
        // Workspace is not visible, need to click 'Show more'
        cy.contains("Show more").should("be.visible").click();
        humanWait(500);
        // Now click on the workspace
        cy.contains(workspaceName).should("be.visible").click();
      }
    });
    humanWait(2000);

    cy.log("✅ Workspace management completed successfully");
  });
});
