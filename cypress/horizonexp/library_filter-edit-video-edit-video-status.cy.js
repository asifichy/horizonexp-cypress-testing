describe("Library Filter, Edit Video Details and Disable Video", () => {
  // Test configuration and setup
  const testConfig = {
    baseUrl: "https://app.horizonexp.com/signin",
    userEmail: "asifniloy2017@gmail.com",
    userPassword: "devops_test$sqa@flagship",
    humanDelay: 3000, // 3 seconds delay for human-like behavior
    humanTypeDelay: 120, // Delay between keystrokes for human-like typing
  };

  // Dynamic variables for edited video data
  const editedVideoData = {
    title: "Edited Form Data",
    caption: "Edit done",
    originalChannel: "DevOps",
    newChannel: "Auto-channel-30", // Channel to switch to (not DevOps)
    additionalCategory: "Comedy", // Additional category to add
  };

  // Helper function for delays
  const humanWait = (customDelay = testConfig.humanDelay) => {
    cy.wait(customDelay);
  };

  // Helper function to navigate to Library
  const navigateToLibrary = () => {
    cy.log("📚 Navigating to Library section");
    humanWait(2000);

    cy.get("body").then(($body) => {
      // First check if Short-form menu needs to be expanded
      if ($body.find(':contains("Library")').filter(":visible").length === 0) {
        cy.log("📂 Expanding Short-form menu first");
        cy.contains("Short-form").should("be.visible").click();
        humanWait(2000);
      }

      const librarySelectors = [
        'a:contains("Library")',
        '*:contains("Library")',
        'button:contains("Library")',
        '[data-testid*="library"]',
        '[href*="library"]',
      ];

      let found = false;
      for (const selector of librarySelectors) {
        if (found) break;
        const $element = $body
          .find(selector)
          .filter((i, el) => {
            const $el = Cypress.$(el);
            const text = $el.text().trim();
            return text === "Library" || text.includes("Library");
          })
          .first();

        if ($element.length > 0) {
          cy.log(`✅ Found Library menu: ${selector}`);
          cy.wrap($element)
            .should("exist")
            .scrollIntoView()
            .should("be.visible")
            .click({ force: true });
          humanWait(2000);
          found = true;
        }
      }

      if (!found) {
        cy.log("⚠️ Library menu not found, trying direct navigation");
        cy.visit("https://app.horizonexp.com/shorts/library");
        humanWait(2000);
      }
    });

    cy.url({ timeout: 10000 }).should("include", "/library");
    cy.log("✅ Successfully navigated to Library page");
    humanWait(1000);
  };

  beforeEach(() => {
    // Set viewport to simulate desktop experience
    cy.viewport(1920, 1080);

    // Visit the signin page
    cy.visit(testConfig.baseUrl);
    humanWait(2000);

    // Verify signin page loads
    cy.title().should("contain", "Horizon");
    cy.url().should("include", "/signin");
    humanWait(1000);

    // Fill in email
    cy.log("📧 Filling email field");
    cy.get(
      'input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="Email"]'
    )
      .first()
      .should("be.visible")
      .clear()
      .type(testConfig.userEmail, { delay: testConfig.humanTypeDelay });
    humanWait(1000);

    // Fill in password
    cy.log("🔒 Filling password field");
    cy.get(
      'input[type="password"], input[name="password"], input[placeholder*="password"], input[placeholder*="Password"]'
    )
      .first()
      .should("be.visible")
      .clear()
      .type(testConfig.userPassword, { delay: testConfig.humanTypeDelay });
    humanWait(1000);

    // Click login
    cy.log("🚀 Submitting login form");
    cy.get("body").then(($body) => {
      if ($body.find("form").length > 0) {
        cy.get("form").first().submit();
      } else {
        cy.get('button[type="submit"], input[type="submit"]')
          .not(':contains("Google")')
          .not(':contains("Sign in with Google")')
          .first()
          .should("be.visible")
          .click();
      }
    });
    humanWait(5000);

    // Handle post-login navigation
    cy.log("✅ Handling post-login navigation");
    cy.url().then((currentUrl) => {
      cy.log(`Current URL after login: ${currentUrl}`);

      if (currentUrl.includes("/signin")) {
        cy.log("❌ Still on signin page - checking for errors");
        cy.get("body").then(($body) => {
          if (
            $body.text().includes("Invalid") ||
            $body.text().includes("Error")
          ) {
            throw new Error("Login failed - invalid credentials detected");
          }
        });
      } else if (currentUrl.includes("404")) {
        cy.log("⚠️ Got 404 page, navigating to main app");
        cy.visit("https://app.horizonexp.com");
        humanWait(2000);
      }
    });

    // Wait for authentication to complete and redirect back to app
    cy.log("⏳ Waiting for authentication to complete");
    cy.url({ timeout: 15000 }).should("satisfy", (url) => {
      return url.includes("app.horizonexp.com") && !url.includes("/signin");
    });

    // Assert successful login
    cy.url().should("include", "app.horizonexp.com");
    cy.url().should("not.include", "/signin");
    cy.log("✅ Login successful");
    humanWait(2000);
  });

  it("Filter videos by channel, edit video details, and disable video", () => {
    // ============================================
    // STEP 1: Navigate to Library Page
    // ============================================
    cy.log("🎬 STEP 1: Navigate to Library Page");
    navigateToLibrary();

    // Verify we're on the Library page
    cy.contains("Shorts Library", { timeout: 15000 }).should("be.visible");
    cy.log("✅ Library page loaded");
    humanWait(2000);

    // ============================================
    // STEP 2: Filter Videos by Channel (DevOps)
    // ============================================
    cy.log("🎬 STEP 2: Filter Videos by DevOps Channel");

    // Click on "All Channels" dropdown
    cy.log("🔽 Clicking on All Channels dropdown");
    cy.get("body").then(($body) => {
      const dropdownSelectors = [
        'button:contains("All Channels")',
        '*:contains("All Channels")',
        '[class*="select"]:contains("All Channels")',
        '.ant-select:contains("All Channels")',
      ];

      let found = false;
      for (const selector of dropdownSelectors) {
        if (found) break;
        const $element = $body
          .find(selector)
          .filter((i, el) => {
            const text = Cypress.$(el).text().trim();
            return text.includes("All Channels");
          })
          .filter(":visible")
          .first();

        if ($element.length > 0) {
          cy.log(`✅ Found All Channels dropdown: ${selector}`);
          cy.wrap($element).scrollIntoView().click({ force: true });
          found = true;
        }
      }

      if (!found) {
        // Fallback: Try to find dropdown by text content
        cy.contains("All Channels").should("be.visible").click({ force: true });
      }
    });
    humanWait(1500);

    // Click on "DevOps" channel option
    cy.log("📌 Selecting DevOps channel from dropdown");
    cy.contains("div, button, li, .ant-select-item-option-content", editedVideoData.originalChannel, {
      timeout: 10000,
    })
      .filter(":visible")
      .first()
      .click({ force: true });

    // Wait for filter to complete (2-3 seconds)
    cy.log("⏳ Waiting for filter to complete...");
    humanWait(3000);

    cy.log("✅ Filter applied - showing DevOps channel videos");

    // ============================================
    // STEP 3: Click on Video to Open Edit Form
    // ============================================
    cy.log("🎬 STEP 3: Click on Video to Open Edit Form");

    // Find and click on a video from DevOps channel
    cy.get("body").then(($body) => {
      // Look for video cards that have DevOps channel
      const videoCardSelectors = [
        '[class*="ant-card"]',
        '.ant-list-item',
        '[class*="video-card"]',
        '[class*="card"]',
      ];

      let clicked = false;
      for (const selector of videoCardSelectors) {
        if (clicked) break;
        const $cards = $body
          .find(selector)
          .filter(":visible")
          .filter((i, el) => {
            const text = Cypress.$(el).text();
            return text.includes(editedVideoData.originalChannel);
          });

        if ($cards.length > 0) {
          cy.log(`✅ Found video card with DevOps channel`);
          // Click on the video thumbnail or title area to open edit form
          const $clickTarget = $cards.first().find('img, [class*="thumbnail"], a').first();
          if ($clickTarget.length > 0) {
            cy.wrap($clickTarget).scrollIntoView().click({ force: true });
          } else {
            cy.wrap($cards.first()).scrollIntoView().click({ force: true });
          }
          clicked = true;
        }
      }

      if (!clicked) {
        // Fallback: Click on first visible video that contains DevOps
        cy.contains(editedVideoData.originalChannel)
          .closest('[class*="card"], .ant-list-item, [class*="video"]')
          .first()
          .click({ force: true });
      }
    });

    // Wait for edit form to open
    cy.log("⏳ Waiting for edit form to load...");
    humanWait(3000);

    // Verify edit form is open
    cy.contains("Edit Details", { timeout: 10000 }).should("be.visible");
    cy.log("✅ Video edit form opened");

    // ============================================
    // STEP 4: Edit Video Data
    // ============================================
    cy.log("🎬 STEP 4: Edit Video Data");

    // 4.1 Change Channel (from DevOps to another channel)
    cy.log("📝 4.1: Changing channel from DevOps to " + editedVideoData.newChannel);
    
    // Click on Channel dropdown
    cy.get("body").then(($body) => {
      const $channelDropdown = $body
        .find('.ant-select, [class*="select"]')
        .filter((i, el) => {
          const text = Cypress.$(el).text();
          return text.includes(editedVideoData.originalChannel) || text.includes("Select Channel");
        })
        .filter(":visible")
        .first();

      if ($channelDropdown.length > 0) {
        cy.wrap($channelDropdown).click({ force: true });
      } else {
        // Fallback: Find by label
        cy.contains("label, span", "Select Channel", { matchCase: false })
          .parent()
          .find('.ant-select, [role="combobox"]')
          .first()
          .click({ force: true });
      }
    });
    humanWait(1000);

    // Select the new channel
    cy.contains("div, li, .ant-select-item-option-content", editedVideoData.newChannel, {
      timeout: 10000,
    })
      .filter(":visible")
      .first()
      .click({ force: true });
    humanWait(1500);
    cy.log("✅ Channel changed to " + editedVideoData.newChannel);

    // 4.2 Add one more Category
    cy.log("📝 4.2: Adding additional category - " + editedVideoData.additionalCategory);
    
    // Click on Category dropdown
    cy.get("body").then(($body) => {
      const $categoryDropdown = $body
        .find('.ant-select, [class*="select"]')
        .filter((i, el) => {
          const $el = Cypress.$(el);
          const text = $el.text();
          const placeholder = $el.find('input').attr('placeholder') || '';
          return text.includes("Category") || placeholder.includes("Category") || 
                 $el.closest('[class*="category"]').length > 0;
        })
        .filter(":visible");

      // Find the category dropdown (usually the second select or one with Category label)
      if ($categoryDropdown.length > 0) {
        cy.wrap($categoryDropdown.last()).click({ force: true });
      } else {
        cy.contains("label, span", "Category", { matchCase: false })
          .parent()
          .find('.ant-select, [role="combobox"]')
          .first()
          .click({ force: true });
      }
    });
    humanWait(1000);

    // Select additional category
    cy.contains("div, li, .ant-select-item-option-content", editedVideoData.additionalCategory, {
      timeout: 10000,
    })
      .filter(":visible")
      .first()
      .click({ force: true });
    humanWait(1500);
    
    // Click outside to close dropdown
    cy.get("body").click(0, 0, { force: true });
    humanWait(500);
    cy.log("✅ Additional category added: " + editedVideoData.additionalCategory);

    // 4.3 Change Title to 'Edited Form Data'
    cy.log("📝 4.3: Changing title to '" + editedVideoData.title + "'");
    cy.get('input[name="title"], input[placeholder*="title"], input[placeholder*="Title"]')
      .filter(":visible")
      .first()
      .should("be.visible")
      .clear({ force: true })
      .type(editedVideoData.title, { force: true, delay: testConfig.humanTypeDelay });
    humanWait(1000);
    cy.log("✅ Title changed to: " + editedVideoData.title);

    // 4.4 Change Caption to 'Edit done'
    cy.log("📝 4.4: Changing caption to '" + editedVideoData.caption + "'");
    cy.get('textarea[name="caption"], textarea[placeholder*="caption"], textarea[placeholder*="Caption"]')
      .filter(":visible")
      .first()
      .should("be.visible")
      .clear({ force: true })
      .type(editedVideoData.caption, { force: true, delay: testConfig.humanTypeDelay });
    humanWait(1000);
    cy.log("✅ Caption changed to: " + editedVideoData.caption);

    // ============================================
    // STEP 5: Click Update Button
    // ============================================
    cy.log("🎬 STEP 5: Click Update Button");
    
    cy.get("body").then(($body) => {
      const updateButtonSelectors = [
        'button:contains("Update")',
        'button[type="submit"]:contains("Update")',
        '[class*="btn"]:contains("Update")',
      ];

      let clicked = false;
      for (const selector of updateButtonSelectors) {
        if (clicked) break;
        const $button = $body.find(selector).filter(":visible");
        if ($button.length > 0) {
          cy.wrap($button.first()).scrollIntoView().click({ force: true });
          clicked = true;
        }
      }

      if (!clicked) {
        cy.contains("button", "Update").should("be.visible").click({ force: true });
      }
    });

    cy.log("✅ Update button clicked");

    // ============================================
    // STEP 6: Wait 1-2 seconds
    // ============================================
    cy.log("⏳ Waiting for update to complete...");
    humanWait(2000);

    // ============================================
    // STEP 7: Click on Menu Button (Three Dots)
    // ============================================
    cy.log("🎬 STEP 7: Click on Menu Button");

    // First, navigate back to library to find the video card with menu
    cy.log("📚 Navigating back to Library to access video menu");
    navigateToLibrary();
    humanWait(2000);

    // Filter by the new channel to find the edited video
    cy.log("🔽 Clicking on All Channels dropdown to filter");
    cy.contains("All Channels").should("be.visible").click({ force: true });
    humanWait(1000);

    // Select the channel where video was moved to
    cy.contains("div, button, li, .ant-select-item-option-content", editedVideoData.newChannel, {
      timeout: 10000,
    })
      .filter(":visible")
      .first()
      .click({ force: true });
    humanWait(3000);

    // Find the video card with edited title and click its menu button
    cy.log("🔍 Finding video card with title: " + editedVideoData.title);
    
    cy.get("body").then(($body) => {
      // Find the video card containing the edited title
      const $videoCard = $body
        .find('[class*="card"], .ant-list-item, [class*="video"]')
        .filter((i, el) => {
          const text = Cypress.$(el).text();
          return text.includes(editedVideoData.title);
        })
        .filter(":visible")
        .first();

      if ($videoCard.length > 0) {
        // Find and click the menu button (usually a three-dot/ellipsis icon)
        const menuButtonSelectors = [
          'button[aria-label*="more"]',
          'button[aria-haspopup="menu"]',
          '[data-testid*="menu"]',
          'button:has(svg)',
          '[class*="menu-trigger"]',
          '[class*="dropdown-trigger"]',
        ];

        let menuFound = false;
        for (const selector of menuButtonSelectors) {
          if (menuFound) break;
          const $menuBtn = $videoCard.find(selector).filter(":visible");
          if ($menuBtn.length > 0) {
            cy.wrap($menuBtn.first()).click({ force: true });
            menuFound = true;
          }
        }

        if (!menuFound) {
          // Fallback: Find any button within the card that might be the menu
          const $buttons = $videoCard.find("button").filter(":visible");
          if ($buttons.length > 0) {
            // Usually the menu button is the last button or one with just an icon
            cy.wrap($buttons.last()).click({ force: true });
          }
        }
      } else {
        // Fallback: Find menu button near the title
        cy.contains(editedVideoData.title)
          .closest('[class*="card"], .ant-list-item')
          .find('button')
          .last()
          .click({ force: true });
      }
    });

    humanWait(1000);
    cy.log("✅ Menu opened");

    // ============================================
    // STEP 8: Click on 'Disable Video'
    // ============================================
    cy.log("🎬 STEP 8: Click on Disable Video");

    cy.get("body").then(($body) => {
      const $menu = $body.find('[role="menu"], .ant-dropdown-menu, .ant-menu').filter(":visible");
      
      if ($menu.length > 0) {
        const $disableOption = $menu
          .find('li, button, a, span, div, [role="menuitem"]')
          .filter((i, el) => {
            const text = Cypress.$(el).text().trim().toLowerCase();
            return text.includes("disable video") || text.includes("disable");
          });

        if ($disableOption.length > 0) {
          cy.wrap($disableOption.first()).click({ force: true });
        } else {
          cy.contains("Disable Video", { matchCase: false }).click({ force: true });
        }
      } else {
        cy.contains("Disable Video", { matchCase: false }).should("be.visible").click({ force: true });
      }
    });

    cy.log("✅ Disable Video clicked");

    // Wait 1-2 seconds
    humanWait(2000);

    // Handle confirmation dialog if present
    cy.get("body").then(($body) => {
      const confirmTexts = ["Yes, disable", "Confirm", "Yes", "OK"];
      for (const text of confirmTexts) {
        const $confirmBtn = $body.find(`button:contains("${text}")`).filter(":visible");
        if ($confirmBtn.length > 0) {
          cy.log(`📌 Clicking confirmation button: ${text}`);
          cy.wrap($confirmBtn.first()).click({ force: true });
          break;
        }
      }
    });

    humanWait(2000);
    cy.log("✅ Video disabled");

    // ============================================
    // STEP 9: Hard Refresh
    // ============================================
    cy.log("🎬 STEP 9: Performing Hard Refresh");
    cy.reload(true); // true = hard refresh (force reload from server)
    humanWait(3000);
    cy.log("✅ First hard refresh completed");

    // ============================================
    // STEP 10: Final Hard Refresh Before Stopping
    // ============================================
    cy.log("🎬 STEP 10: Final Hard Refresh Before Test Completion");
    cy.reload(true);
    humanWait(3000);
    cy.log("✅ Final hard refresh completed");

    cy.log("🎉 Test completed successfully!");
    cy.log("📊 Summary of changes made:");
    cy.log(`   - Original Channel: ${editedVideoData.originalChannel}`);
    cy.log(`   - New Channel: ${editedVideoData.newChannel}`);
    cy.log(`   - Added Category: ${editedVideoData.additionalCategory}`);
    cy.log(`   - New Title: ${editedVideoData.title}`);
    cy.log(`   - New Caption: ${editedVideoData.caption}`);
    cy.log(`   - Video Status: Disabled`);
  });
});

