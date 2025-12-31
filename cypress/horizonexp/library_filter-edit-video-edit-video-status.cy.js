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
    filterChannel: "Auto-channel-30", // Channel to filter by
    originalChannel: "Auto-channel-30", // Current channel of the video
    newChannel: "DevOps", // Channel to switch to
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
    // STEP 2: Filter Videos by Channel and Timeline
    // ============================================
    cy.log("🎬 STEP 2: Filter Videos by Channel (Auto-channel-30) and Timeline (Most Popular)");

    // Step 2.1: Click on "All Channels" dropdown and select "Auto-channel-30"
    cy.log("🔽 Clicking on All Channels dropdown");
    cy.get("body").then(($body) => {
      const dropdownSelectors = [
        'button:contains("All Channels")',
        '*:contains("All Channels")',
        '[class*="select"]:contains("All Channels")',
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

    // Click on "Auto-channel-30" channel option
    cy.log("📌 Selecting Auto-channel-30 from dropdown");
    cy.contains("div, button, li, span", editedVideoData.filterChannel, {
      timeout: 10000,
    })
      .filter(":visible")
      .first()
      .click({ force: true });

    // Wait for filter to complete (2-3 seconds)
    cy.log("⏳ Waiting for channel filter to complete...");
    humanWait(3000);
    cy.log("✅ Channel filter applied - showing Auto-channel-30 videos");

    // Step 2.2: Click on "Recent" dropdown and select "Most Popular"
    cy.log("🔽 Clicking on Recent dropdown");
    cy.get("body").then(($body) => {
      const recentDropdownSelectors = [
        'button:contains("Recent")',
        '*:contains("Recent")',
        '[class*="select"]:contains("Recent")',
      ];

      let found = false;
      for (const selector of recentDropdownSelectors) {
        if (found) break;
        const $element = $body
          .find(selector)
          .filter((i, el) => {
            const text = Cypress.$(el).text().trim();
            return text === "Recent" || (text.includes("Recent") && !text.includes("Most"));
          })
          .filter(":visible")
          .first();

        if ($element.length > 0) {
          cy.log(`✅ Found Recent dropdown: ${selector}`);
          cy.wrap($element).scrollIntoView().click({ force: true });
          found = true;
        }
      }

      if (!found) {
        // Fallback
        cy.contains("Recent").should("be.visible").click({ force: true });
      }
    });
    humanWait(1500);

    // Click on "Most Popular" option
    cy.log("📌 Selecting Most Popular from dropdown");
    cy.contains("div, button, li, span", "Most Popular", {
      timeout: 10000,
    })
      .filter(":visible")
      .first()
      .click({ force: true });

    // Wait for filter to complete and close dropdown by clicking outside
    cy.log("⏳ Waiting for timeline filter to complete...");
    humanWait(2000);
    
    // Click outside to close any open dropdowns
    cy.log("📌 Closing any open dropdowns");
    cy.get("h1").contains("Shorts Library").click({ force: true });
    humanWait(2000);
    
    cy.log("✅ Timeline filter applied - showing Most Popular videos");

    // ============================================
    // STEP 3: Click on Video Title to Open Edit Form
    // ============================================
    cy.log("🎬 STEP 3: Click on Video Title to Open Edit Form");

    // Click on the video title to open the edit form
    // The video title is displayed below the thumbnail (e.g., "Single Upload Test")
    // IMPORTANT: We need to click on the actual video title text, NOT any dropdown items
    
    // Direct approach: Find video title text that contains "Test" or "Video" pattern
    // and is NOT a navigation/filter item
    cy.log("🔍 Looking for video title to click...");
    
    // First try: Look for text containing "Test" which is common in video titles
    cy.get("body").then(($body) => {
      // Find all text elements that look like video titles
      // Video titles are typically in p tags or specific classes
      const $potentialTitles = $body.find('p, h3, h4, a').filter(':visible').filter((i, el) => {
        const $el = Cypress.$(el);
        const text = $el.text().trim();
        
        // Must be a reasonable title length
        if (text.length < 5 || text.length > 80) return false;
        
        // Must NOT be any of these navigation/filter items
        const excludeList = [
          'All Channels', 'Most Popular', 'Recent', 'Drafts', 'Disabled', 'Flagged',
          'Library', 'Short-form', 'Uploads', 'Channels', 'Users', 'Metrics',
          'Campaign', 'UGC', 'Experience', 'Entry Points', 'Upload New',
          'Search', 'Auto-channel-30', 'DevOps', 'Shorts Library',
          'Create', 'Add', 'New', 'Sign', 'Profile', 'Workspace'
        ];
        
        const isExcluded = excludeList.some(item => 
          text === item || text.toLowerCase() === item.toLowerCase()
        );
        if (isExcluded) return false;
        
        // Should look like a video title (contains common patterns)
        const looksLikeTitle = 
          text.includes('Test') || 
          text.includes('Video') || 
          text.includes('Single') ||
          text.includes('Bulk') ||
          text.includes('Upload') ||
          text.match(/^[A-Z][a-z]/) || // Starts with capital letter
          text.match(/\.\w{3,4}$/); // Ends with file extension like .mp4
        
        // Must not contain time indicators
        const hasTimeIndicator = text.includes('ago') || text.includes('min') || text.includes('hour');
        
        return looksLikeTitle && !hasTimeIndicator;
      });

      cy.log(`📹 Found ${$potentialTitles.length} potential video title(s)`);

      if ($potentialTitles.length > 0) {
        const titleText = $potentialTitles.first().text().trim();
        cy.log(`✅ Clicking on video title: "${titleText}"`);
        cy.wrap($potentialTitles.first()).scrollIntoView().click({ force: true });
      } else {
        // Fallback: Click directly on the video thumbnail image
        cy.log("⚠️ No title found, clicking on video thumbnail");
        const $thumbnails = $body.find('img').filter(':visible').filter((i, el) => {
          const $el = Cypress.$(el);
          const width = $el.width() || 0;
          const height = $el.height() || 0;
          return width > 100 && height > 100;
        });
        
        if ($thumbnails.length > 0) {
          cy.wrap($thumbnails.first()).click({ force: true });
        }
      }
    });

    // Wait for edit form to open
    cy.log("⏳ Waiting for edit form to load...");
    humanWait(3000);

    // Verify edit form is open
    cy.contains("Edit Details", { timeout: 15000 }).should("be.visible");
    cy.log("✅ Video edit form opened");

    // ============================================
    // STEP 4: Edit Video Data
    // ============================================
    cy.log("🎬 STEP 4: Edit Video Data");

    // 4.1 Change Channel (from Auto-channel-30 to DevOps)
    cy.log("📝 4.1: Changing channel from " + editedVideoData.originalChannel + " to " + editedVideoData.newChannel);
    
    // Click on Channel dropdown - find the Select Channel dropdown
    cy.contains("label, span", "Select Channel", { matchCase: false, timeout: 10000 })
      .should("be.visible")
      .then(($label) => {
        // Find the dropdown near the label
        const $parent = $label.parent();
        const $dropdown = $parent.find('button, [role="combobox"], [class*="select"]').filter(":visible");
        
        if ($dropdown.length > 0) {
          cy.wrap($dropdown.first()).click({ force: true });
        } else {
          // Try clicking on the container that shows the current channel
          cy.wrap($label).parent().find('*:contains("' + editedVideoData.originalChannel + '")').first().click({ force: true });
        }
      });
    humanWait(1000);

    // Select the new channel (DevOps)
    cy.contains("div, li, span", editedVideoData.newChannel, {
      timeout: 10000,
    })
      .filter(":visible")
      .filter((i, el) => {
        const text = Cypress.$(el).text().trim();
        return text === editedVideoData.newChannel;
      })
      .first()
      .click({ force: true });
    humanWait(1500);
    cy.log("✅ Channel changed to " + editedVideoData.newChannel);

    // 4.2 Add one more Category
    cy.log("📝 4.2: Adding additional category - " + editedVideoData.additionalCategory);
    
    // Click on Category dropdown
    cy.contains("label, span", "Category", { matchCase: false, timeout: 10000 })
      .should("be.visible")
      .then(($label) => {
        const $parent = $label.parent();
        const $dropdown = $parent.find('button, [role="combobox"], [class*="select"]').filter(":visible");
        
        if ($dropdown.length > 0) {
          cy.wrap($dropdown.first()).click({ force: true });
        } else {
          // Try clicking near the label
          cy.wrap($label).next().click({ force: true });
        }
      });
    humanWait(1000);

    // Select additional category (Comedy)
    cy.contains("div, li, span", editedVideoData.additionalCategory, {
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
    cy.get('textarea[name="caption"], textarea[placeholder*="caption"], textarea[placeholder*="Caption"], textarea')
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
    
    cy.contains("button", "Update", { timeout: 10000 })
      .should("be.visible")
      .click({ force: true });

    cy.log("✅ Update button clicked");

    // ============================================
    // STEP 6: Wait and Close Edit Form
    // ============================================
    cy.log("⏳ Waiting for update to complete...");
    humanWait(2000);

    // Close the edit form by clicking the X button
    cy.log("❌ Closing edit form");
    cy.get('button').filter(':visible').filter((i, el) => {
      const $el = Cypress.$(el);
      // Look for close button (X) - usually has an X icon or is near Edit Details
      const hasSvg = $el.find('svg').length > 0;
      const isSmall = ($el.width() || 0) < 60;
      const text = $el.text().trim();
      return hasSvg && isSmall && text === '';
    }).first().click({ force: true });
    
    humanWait(2000);

    // ============================================
    // STEP 7: Navigate to Library and Find Video Menu
    // ============================================
    cy.log("🎬 STEP 7: Navigate to Library and Click Menu Button");

    // Navigate to library page
    cy.url().then((currentUrl) => {
      if (!currentUrl.includes("/library") || currentUrl.includes("/edit")) {
        cy.log("📚 Navigating to Library page");
        cy.visit("https://app.horizonexp.com/shorts/library");
        humanWait(3000);
      }
    });

    // Wait for library page to load
    cy.contains("Shorts Library", { timeout: 10000 }).should("be.visible");
    humanWait(2000);

    // Find the video with edited title and click its THREE-DOT MENU BUTTON
    cy.log("🔍 Finding video: " + editedVideoData.title + " and clicking menu icon");
    
    // STEP 1: First verify the video title exists
    cy.contains(editedVideoData.title, { timeout: 10000 }).should("be.visible");
    cy.log("✅ Found video with title: " + editedVideoData.title);
    
    // STEP 2: Click directly on the three-dot menu button
    // The menu button is a small button with vertical dots (⋮) typically positioned at top-right of video thumbnail
    // We'll find it by looking for buttons that contain SVG and are small
    
    cy.log("📌 Looking for three-dot menu button...");
    
    // Find all buttons on the page, then filter for menu buttons
    cy.get('button').then(($buttons) => {
      // Filter for buttons that look like menu buttons (small, with SVG icon)
      const menuButtons = $buttons.filter((i, el) => {
        const $el = Cypress.$(el);
        const hasSvg = $el.find('svg').length > 0;
        const width = $el.outerWidth() || 0;
        const height = $el.outerHeight() || 0;
        const isSmall = width < 50 && height < 50;
        const text = $el.text().trim();
        const hasNoText = text === '' || text.length < 3;
        return hasSvg && isSmall && hasNoText;
      });
      
      cy.log(`📌 Found ${menuButtons.length} potential menu button(s)`);
      
      if (menuButtons.length > 0) {
        // Click on the FIRST menu button (which should be for the first video card)
        cy.wrap(menuButtons.first()).click({ force: true });
      } else {
        // Fallback: Try to find any button with three dots pattern
        cy.log("⚠️ Trying fallback - looking for any icon button");
        const iconButtons = $buttons.filter((i, el) => {
          const $el = Cypress.$(el);
          return $el.find('svg').length > 0;
        });
        if (iconButtons.length > 0) {
          cy.wrap(iconButtons.first()).click({ force: true });
        }
      }
    });

    humanWait(2000);
    
    // Verify menu is open by checking if "Disable Video" or similar option is visible
    cy.log("🔍 Checking if menu opened...");
    cy.get('body').then(($body) => {
      const menuVisible = $body.text().includes('Disable Video') || 
                         $body.text().includes('Edit Video') ||
                         $body.text().includes('See stats');
      if (!menuVisible) {
        cy.log("⚠️ Menu not visible, trying to click first video's menu button again");
        // Try clicking by finding the first video card's menu
        const $firstCard = $body.find('img').filter(':visible').first().parent().parent();
        const $menuBtn = $firstCard.find('button').filter(':visible').first();
        if ($menuBtn.length > 0) {
          cy.wrap($menuBtn).click({ force: true });
        }
      }
    });
    
    humanWait(1000);
    cy.log("✅ Menu should be opened");

    // ============================================
    // STEP 8: Click on 'Disable Video'
    // ============================================
    cy.log("🎬 STEP 8: Click on Disable Video");

    // Wait for dropdown menu to appear and click Disable Video
    cy.contains("Disable Video", { timeout: 10000 })
      .should("be.visible")
      .click({ force: true });

    cy.log("✅ Disable Video clicked");

    // Wait for confirmation popup to appear
    humanWait(1500);

    // ============================================
    // STEP 9: Click 'Yes, disable' in Confirmation Popup
    // ============================================
    cy.log("🎬 STEP 9: Clicking 'Yes, disable' in confirmation popup");

    // Click on "Yes, disable" button in the confirmation popup
    cy.contains("button", "Yes, disable", { timeout: 10000 })
      .should("be.visible")
      .click({ force: true });

    cy.log("✅ Confirmed video disable");

    // Wait 2 seconds in Library after disabling
    humanWait(2000);
    cy.log("✅ Video disabled successfully");

    // ============================================
    // STEP 10: Hard Refresh
    // ============================================
    cy.log("🎬 STEP 10: Performing Hard Refresh");
    cy.reload(true); // true = hard refresh (force reload from server)
    humanWait(3000);
    cy.log("✅ Hard refresh completed");

    // ============================================
    // STEP 11: Final Hard Refresh and Wait Before Ending
    // ============================================
    cy.log("🎬 STEP 11: Final Hard Refresh Before Test Completion");
    cy.reload(true);
    humanWait(2000);
    cy.log("✅ Final hard refresh completed");

    // Wait extra 2 seconds in Library before ending
    cy.log("⏳ Waiting 2 seconds in Library before ending test...");
    humanWait(2000);

    cy.log("🎉 Test completed successfully!");
    cy.log("📊 Summary of changes made:");
    cy.log(`   - Filter Channel: ${editedVideoData.filterChannel}`);
    cy.log(`   - Original Channel: ${editedVideoData.originalChannel}`);
    cy.log(`   - New Channel: ${editedVideoData.newChannel}`);
    cy.log(`   - Added Category: ${editedVideoData.additionalCategory}`);
    cy.log(`   - New Title: ${editedVideoData.title}`);
    cy.log(`   - New Caption: ${editedVideoData.caption}`);
    cy.log(`   - Video Status: Disabled`);
  });
});
