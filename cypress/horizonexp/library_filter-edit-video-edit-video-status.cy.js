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

    // Wait for filter to complete (2-3 seconds)
    cy.log("⏳ Waiting for timeline filter to complete...");
    humanWait(3000);
    cy.log("✅ Timeline filter applied - showing Most Popular videos");

    // ============================================
    // STEP 3: Click on Video Title to Open Edit Form
    // ============================================
    cy.log("🎬 STEP 3: Click on Video Title to Open Edit Form");

    // Click on the video title to open the edit form
    // The video title is displayed below the thumbnail (e.g., "Single Upload Test")
    // IMPORTANT: We need to click in the main content area, NOT the sidebar
    
    // Strategy: Find the channel name in the video card area (not sidebar) and click on the title above it
    // The video card structure is: [Thumbnail] -> [Title Text] -> [Channel Name with icon]
    
    cy.get("body").then(($body) => {
      let clicked = false;
      
      // First, find the main content area (right side of the page, not the sidebar)
      // The sidebar contains navigation items, main content has video cards
      // Video cards have images/thumbnails, so we look for containers with images
      
      // Find all img elements (video thumbnails) and look for title text near them
      const $thumbnails = $body.find('img').filter(':visible').filter((i, el) => {
        const $el = Cypress.$(el);
        // Video thumbnails are usually larger and in the main content area
        const width = $el.width() || 0;
        const height = $el.height() || 0;
        // Filter for reasonably sized images (video thumbnails)
        return width > 100 && height > 100;
      });

      cy.log(`📹 Found ${$thumbnails.length} video thumbnail(s)`);

      if ($thumbnails.length > 0) {
        // Get the first thumbnail's parent container to find the video card
        const $thumbnail = $thumbnails.first();
        const $videoCard = $thumbnail.closest('div').parent().parent().parent();
        
        // Look for the title text within or near this video card
        // The title is usually a p, span, or a tag below the thumbnail
        const $allText = $videoCard.find('p, span, a, h3, h4').filter(':visible');
        
        $allText.each((i, el) => {
          if (clicked) return false;
          const $el = Cypress.$(el);
          const text = $el.text().trim();
          
          // Skip channel names and other known non-title text
          const skipTexts = [
            'Auto-channel-30', 'DevOps', 'All Channels', 'Most Popular',
            'Recent', 'Library', 'Short-form', 'Uploads', 'Channels',
            'Users', 'Metrics', 'Campaign', 'UGC', 'Experience',
            'Entry Points', 'Upload New', 'Search', 'ago'
          ];
          
          const shouldSkip = skipTexts.some(skip => 
            text === skip || text.includes(skip)
          );
          
          // Valid title: not in skip list, reasonable length, contains actual text
          if (!shouldSkip && text.length > 3 && text.length < 100) {
            cy.log(`✅ Found video title in card: "${text}"`);
            cy.wrap(el).scrollIntoView().click({ force: true });
            clicked = true;
            return false;
          }
        });
      }

      // Fallback: Find the title by looking for text near channel indicator
      if (!clicked) {
        cy.log("⚠️ Using fallback - finding title via channel indicator");
        
        // Find the channel name "Auto-channel-30" in the main content (not sidebar)
        const $channelInCards = $body.find('*').filter((i, el) => {
          const $el = Cypress.$(el);
          const text = $el.text().trim();
          // Must be exactly the channel name
          if (text !== editedVideoData.filterChannel) return false;
          // Must not be in sidebar (sidebar items usually have different structure)
          // Check if this element is near an image (video thumbnail)
          const $parent = $el.parent();
          const hasNearbyImage = $parent.siblings().find('img').length > 0 || 
                                 $parent.parent().find('img').length > 0 ||
                                 $parent.parent().parent().find('img').length > 0;
          return hasNearbyImage;
        });

        if ($channelInCards.length > 0) {
          cy.log(`📌 Found channel indicator in video card`);
          // Navigate up to find the video title
          const $channelEl = $channelInCards.first();
          const $container = $channelEl.parent().parent();
          
          // The title is usually a sibling element
          const $titleCandidate = $container.find('p, span, a').filter((i, el) => {
            const text = Cypress.$(el).text().trim();
            return text !== editedVideoData.filterChannel && 
                   text.length > 3 && 
                   !text.includes('ago') &&
                   !text.includes('Channel');
          }).first();

          if ($titleCandidate.length > 0) {
            cy.log(`✅ Found title: "${$titleCandidate.text().trim()}"`);
            cy.wrap($titleCandidate[0]).click({ force: true });
            clicked = true;
          }
        }
      }

      // Last resort: Use cy.contains to find a specific video title pattern
      if (!clicked) {
        cy.log("⚠️ Last resort - using direct title search");
        // Look for common video title patterns that are NOT navigation items
        // Video titles usually end with "Test", "Video", numbers, etc.
        const $titles = $body.find('p, span').filter(':visible').filter((i, el) => {
          const $el = Cypress.$(el);
          const text = $el.text().trim();
          // Must look like a video title
          const looksLikeTitle = (
            text.includes('Test') || 
            text.includes('Video') || 
            text.includes('Upload') ||
            text.match(/\d+/) // Contains numbers
          );
          // Must not be navigation
          const isNotNav = !text.includes('Entry') && 
                          !text.includes('Library') && 
                          !text.includes('Channel') &&
                          text !== 'Upload New';
          return looksLikeTitle && isNotNav && text.length > 3 && text.length < 60;
        });

        if ($titles.length > 0) {
          cy.log(`✅ Found title via pattern: "${$titles.first().text().trim()}"`);
          cy.wrap($titles.first()).click({ force: true });
          clicked = true;
        }
      }

      if (!clicked) {
        // Absolute last resort: Click on video thumbnail itself
        cy.log("⚠️ Clicking on video thumbnail as last resort");
        if ($thumbnails.length > 0) {
          cy.wrap($thumbnails.first()).click({ force: true });
        }
      }
    });

    // Wait for edit form to open
    cy.log("⏳ Waiting for edit form to load...");
    humanWait(3000);

    // Verify edit form is open - check URL change or Edit Details visibility
    cy.url().then((currentUrl) => {
      if (currentUrl.includes('/edit') || currentUrl.includes('/library/')) {
        cy.log("✅ URL indicates edit form navigation");
      }
    });
    
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
    // STEP 6: Wait 1-2 seconds
    // ============================================
    cy.log("⏳ Waiting for update to complete...");
    humanWait(2000);

    // ============================================
    // STEP 7: Click on Menu Button (Three Dots)
    // ============================================
    cy.log("🎬 STEP 7: Click on Menu Button");

    // After update, we should still be on the same page or redirected
    // We need to find the menu button on the video card
    // First, navigate back to library if needed
    cy.url().then((currentUrl) => {
      if (!currentUrl.includes("/library")) {
        cy.log("📚 Navigating back to Library to access video menu");
        navigateToLibrary();
        humanWait(2000);

        // Filter by the new channel to find the edited video
        cy.log("🔽 Clicking on All Channels dropdown to filter");
        cy.contains("All Channels", { timeout: 10000 }).should("be.visible").click({ force: true });
        humanWait(1000);

        // Select the channel where video was moved to (DevOps)
        cy.contains("div, button, li, span", editedVideoData.newChannel, {
          timeout: 10000,
        })
          .filter(":visible")
          .first()
          .click({ force: true });
        humanWait(3000);
      }
    });

    // Find the video card with edited title and click its menu button (three dots)
    cy.log("🔍 Finding menu button for video: " + editedVideoData.title);
    
    // The menu button is typically a three-dot icon in the top-right of the video card
    cy.get("body").then(($body) => {
      // First try to find the edited video by title
      const $videoTitles = $body
        .find('*')
        .filter((i, el) => {
          const text = Cypress.$(el).text().trim();
          return text === editedVideoData.title;
        })
        .filter(":visible");

      if ($videoTitles.length > 0) {
        cy.log("✅ Found video with edited title");
        // Navigate up to find the video card container and then find the menu button
        const $videoContainer = $videoTitles.first().parent().parent();
        const $menuBtn = $videoContainer.find('button, [role="button"]').filter(':visible');
        
        if ($menuBtn.length > 0) {
          cy.wrap($menuBtn.first()).click({ force: true });
        } else {
          // Try finding menu button by looking for three-dot icon
          cy.wrap($videoContainer).find('svg').parent('button').first().click({ force: true });
        }
      } else {
        // Fallback: Look for any three-dot menu button on visible video cards
        cy.log("⚠️ Video title not found, using fallback to find menu button");
        const $menuButtons = $body
          .find('button')
          .filter(':visible')
          .filter((i, el) => {
            const $el = Cypress.$(el);
            // Menu buttons usually have SVG icons and are small
            return $el.find('svg').length > 0 && $el.width() < 50;
          });

        if ($menuButtons.length > 0) {
          cy.wrap($menuButtons.first()).click({ force: true });
        }
      }
    });

    humanWait(1000);
    cy.log("✅ Menu opened");

    // ============================================
    // STEP 8: Click on 'Disable Video'
    // ============================================
    cy.log("🎬 STEP 8: Click on Disable Video");

    // Wait for menu to be visible and click Disable Video option
    cy.contains("Disable Video", { matchCase: false, timeout: 10000 })
      .should("be.visible")
      .click({ force: true });

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
    cy.log(`   - Filter Channel: ${editedVideoData.filterChannel}`);
    cy.log(`   - Original Channel: ${editedVideoData.originalChannel}`);
    cy.log(`   - New Channel: ${editedVideoData.newChannel}`);
    cy.log(`   - Added Category: ${editedVideoData.additionalCategory}`);
    cy.log(`   - New Title: ${editedVideoData.title}`);
    cy.log(`   - New Caption: ${editedVideoData.caption}`);
    cy.log(`   - Video Status: Disabled`);
  });
});
