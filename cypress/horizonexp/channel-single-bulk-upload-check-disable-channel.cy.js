describe("Merged Test: Channel Create -> Edit -> Single Upload -> Bulk Upload -> Disable", () => {
  // Test configuration and setup
  const testConfig = {
    baseUrl: "https://app.horizonexp.com/signin",
    userEmail: "asifniloy2017@gmail.com",
    userPassword: "devops_test$sqa@flagship",
    humanDelay: 3000, // 3 seconds delay for human-like behavior
    humanTypeDelay: 120, // Delay between keystrokes for human-like typing
    singleUploadFile: {
      path: "C:\\Users\\user\\Downloads\\SPAM\\6.mp4",
      fileName: "6.mp4",
    },
    bulkUploadFiles: [
      { path: "C:\\Users\\user\\Downloads\\SPAM\\0.mp4", fileName: "0.mp4" },
      { path: "C:\\Users\\user\\Downloads\\SPAM\\1.mp4", fileName: "1.mp4" },
      { path: "C:\\Users\\user\\Downloads\\SPAM\\2.mp4", fileName: "2.mp4" },
      { path: "C:\\Users\\user\\Downloads\\SPAM\\3.mp4", fileName: "3.mp4" },
      { path: "C:\\Users\\user\\Downloads\\SPAM\\4.mp4", fileName: "4.mp4" },
    ],
    csvFilePath: "C:\\Users\\user\\Downloads\\Sample.csv",
  };

  // Store metadata captured from API responses
  let capturedMetadata = {
    thumbnailurl: null,
    videourl: null,
    previewurl: null,
  };
  let publishRequestTriggered = false;

  // Helper function for delays
  const humanWait = (customDelay = testConfig.humanDelay) => {
    cy.wait(customDelay);
  };

  // Helper to select a specific option from a dropdown identified by its label text
  const selectDropdownOption = (labelText, optionText) => {
    cy.log(`🔽 Selecting "${optionText}" for dropdown "${labelText}"`);

    // Strategy: Prioritize 'label' tag as it's more specific to forms
    const findLabel = () => {
      return cy.get("body").then(($body) => {
        const $labels = $body.find(`label:contains("${labelText}")`).filter(":visible");
        if ($labels.length > 0) {
          return cy.wrap($labels.first());
        }
        return cy.contains("label, span", labelText, { matchCase: false, timeout: 20000 })
          .filter(":visible")
          .first();
      });
    };

    findLabel().then(($label) => {
        cy.log(`Found label: ${$label.prop("tagName")} with text "${$label.text()}"`);
        
        const $container =
          $label.closest(".ant-space-item, .ant-form-item, .ant-row, form div")
            .length > 0
            ? $label
                .closest(".ant-space-item, .ant-form-item, .ant-row, form div")
                .first()
            : $label.parent();

        cy.log(`Found container: ${$container.prop("tagName")} class="${$container.attr("class")}"`);

        let $button = $container
          .find(
            'button, [role="button"], [role="combobox"], .ant-select-selector, .ant-select'
          )
          .filter(":visible")
          .first();

        if (!$button || $button.length === 0) {
          cy.log("Button not found in container, checking next siblings");
          $button = $label
            .nextAll(
              'button, [role="button"], [role="combobox"], .ant-select-selector, .ant-select'
            )
            .filter(":visible")
            .first();
        }

        if (!$button || $button.length === 0) {
           cy.log("Button not found in siblings, checking parent's find");
           $button = $label.parent().find('.ant-select-selector, [role="combobox"]').filter(":visible").first();
        }

        // Fallback: Try to find by ID if label-based search failed to find trigger
        if (!$button || $button.length === 0) {
           cy.log("Trigger not found via label, trying ID-based search");
           const idSelectors = [
             `#${labelText.toLowerCase()}`,
             `#${labelText.toLowerCase()}Id`,
             `[id*="${labelText.toLowerCase()}"]`
           ];
           for (const selector of idSelectors) {
             const $candidate = Cypress.$("body").find(selector).filter(":visible");
             if ($candidate.length > 0) {
               // If it's an input, find its parent selector
               if ($candidate.is("input")) {
                 $button = $candidate.closest('.ant-select-selector, .ant-select');
                 if (!$button.length) $button = $candidate.parent();
               } else {
                 $button = $candidate;
               }
               if ($button.length > 0) break;
             }
           }
        }

        if (!$button || $button.length === 0) {
          throw new Error(
            `Unable to locate dropdown trigger button for "${labelText}"`
          );
        }
        
        cy.log(`Found trigger: ${$button.prop("tagName")} class="${$button.attr("class")}"`);

        cy.wrap($button).scrollIntoView().click({ force: true });

        humanWait(1000);

        cy.contains("div, button, li, .ant-select-item-option-content", optionText, { timeout: 10000 })
          .filter(":visible")
          .first()
          .click({ force: true });
      });
  };

  // Helper function to navigate to Uploads section
  const navigateToUploads = () => {
    cy.log("📱 Navigating to Shorts Uploads section");

    cy.get("body").should("be.visible");
    humanWait(2000);

    // Step 1: Click on "Short-form" menu item in the sidebar
    cy.log("📱 Step 1: Clicking on Short-form menu");

    cy.get("body").then(($body) => {
      const shortFormSelectors = [
        'a:contains("Short-form")',
        'button:contains("Short-form")',
        '*:contains("Short-form")',
        '[data-testid*="short-form"]',
        '[data-testid*="short"]',
      ];

      let found = false;
      for (const selector of shortFormSelectors) {
        if (found) break;
        const $element = $body.find(selector).first();
        if ($element.length > 0) {
          cy.log(`✅ Found Short-form menu: ${selector}`);
          cy.wrap($element)
            .should("exist")
            .scrollIntoView()
            .should("be.visible")
            .click({ force: true });
          humanWait(2000);
          found = true;
        }
      }
    });

    // Step 2: Click on "Uploads" under Short-form
    cy.log("📤 Step 2: Clicking on Uploads menu");
    cy.get("body").then(($body) => {
      const uploadsSelectors = [
        'a:contains("Uploads")',
        '*:contains("Uploads")',
        'button:contains("Uploads")',
        '[data-testid*="upload"]',
        '[href*="uploads"]',
      ];

      let found = false;
      for (const selector of uploadsSelectors) {
        if (found) break;
        const $element = $body
          .find(selector)
          .filter((i, el) => {
            const $el = Cypress.$(el);
            const text = $el.text().trim();
            return text === "Uploads" || text.includes("Uploads");
          })
          .first();

        if ($element.length > 0) {
          cy.log(`✅ Found Uploads menu: ${selector}`);
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
        cy.log("⚠️ Uploads menu not found, trying direct navigation");
        cy.visit("https://app.horizonexp.com/shorts/uploads");
        humanWait(2000);
      }
    });

    // Verify we're on the uploads page
    cy.url({ timeout: 10000 }).should("include", "/shorts/uploads");
    cy.log("✅ Successfully navigated to Shorts Uploads page");
    humanWait(1000);
  };

  // Helper function to verify video details in Library
  const verifyVideoDetails = (expectedData) => {
    const { title, caption, ctaLabel, ctaLink } = expectedData || {};

    cy.log(`🔍 Verifying video details for: "${title || "Unknown"}"`);

    if (title) {
      // Find by title and click the element itself (it's an anchor tag <a.flex...>)
      cy.contains(title, { timeout: 10000 })
        .should("be.visible")
        .scrollIntoView()
        .click({ force: true });
    } else {
      // Fallback: Click on the first video card
      cy.get('[class*="ant-card"], .ant-list-item, [class*="video-card"]')
        .filter(":visible")
        .first()
        .scrollIntoView()
        .click({ force: true });
    }

    // Wait for 2-3 seconds as requested
    cy.log("⏳ Waiting 3 seconds in details view");
    humanWait(3000);

    // Verify Title (Input value)
    if (title) {
      cy.log("🔍 Checking Title value");
      cy.get('input[name="title"], input[placeholder*="Title"]')
        .should("be.visible")
        .and("have.value", title);
    }

    // Verify Caption (Textarea value)
    if (caption) {
      cy.log("🔍 Checking Caption value");
      cy.get('textarea[name="caption"], textarea[placeholder*="Caption"]')
        .should("be.visible")
        .and("have.value", caption);
    }

    // Verify CTA Label
    if (ctaLabel) {
      cy.log("🔍 Checking CTA Label value");
      cy.get(
        'input[placeholder*="Button label"], input[placeholder*="button label"], input[name*="ctaLabel"], input[name*="cta_label"]'
      )
        .filter(":visible")
        .not('[type="hidden"]')
        .first()
        .should("be.visible")
        .and("have.value", ctaLabel);
    }

    // Verify CTA Link
    if (ctaLink) {
      cy.log("🔍 Checking CTA Link value");
      cy.get(
        'input[placeholder*="Button link"], input[placeholder*="button link"], input[name*="ctaLink"], input[name*="cta_link"]'
      )
        .filter(":visible")
        .not('[type="hidden"]')
        .last()
        .should("be.visible")
        .and("have.value", ctaLink);
    }

    cy.log("✅ Video details verified");

    cy.log("❌ Closing details view via cross icon");

    // Strategy: Look for "Edit Details" and find the close button near it, or look for generic close button
    cy.get("body").then(($body) => {
      // 1. Try finding close button near "Edit Details"
      const $editDetails = $body.find(':contains("Edit Details")').last();
      if ($editDetails.length > 0) {
        const $closeBtn = $editDetails
          .parent()
          .find('button, [role="button"]')
          .filter((i, el) => {
            return (
              Cypress.$(el).find("svg").length > 0 ||
              Cypress.$(el).text().includes("x")
            );
          });

        if ($closeBtn.length > 0) {
          cy.wrap($closeBtn.first()).click({ force: true });
          return;
        }
      }

      // 2. Try generic close button (Ant Design drawer close, or aria-label)
      const $genericClose = $body.find(
        'button[aria-label="Close"], .ant-drawer-close, .ant-modal-close'
      );
      if ($genericClose.length > 0 && $genericClose.is(":visible")) {
        cy.wrap($genericClose.first()).click({ force: true });
        return;
      }

      // 3. Fallback to ESC
      cy.log("⚠️ Close button not found, using ESC fallback");
      cy.get("body").type("{esc}");
    });

    humanWait(1000);
  };

  // Helper function to navigate to Library
  const navigateToLibrary = () => {
    cy.log("📚 Navigating to Library section");
    humanWait(2000);

    cy.get("body").then(($body) => {
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

  // Helper function to open the batch card menu located next to the Ready to publish button
  const openBatchActionsMenu = () => {
    cy.log("📋 Opening menu for batch Ready to publish card");
    const totalUploads = testConfig.bulkUploadFiles.length;

    const visibleMenuExists = () =>
      Cypress.$(
        '[role="menu"]:visible, .ant-dropdown:visible, .ant-menu:visible'
      ).length > 0;

    const clickCandidate = ($btn, reason) => {
      if (!$btn || !$btn.length) {
        return false;
      }
      cy.log(`✅ Found menu trigger (${reason})`);
      cy.wrap($btn).scrollIntoView().should("be.visible");
      humanWait(300);
      cy.wrap($btn).click({ force: true });
      humanWait(300);
      cy.get("body").then(($body) => {
        if (!visibleMenuExists()) {
          cy.log("↪️ Menu not visible after click, retrying once more");
          cy.wrap($btn).click({ force: true });
        }
      });
      return true;
    };

    cy.contains('button, a, [role="button"]', "Ready to publish", {
      matchCase: false,
      timeout: 60000,
    })
      .filter(":visible")
      .then(($buttons) => {
        if (!$buttons.length) {
          cy.screenshot("error-ready-button-not-found");
          throw new Error(
            'Unable to locate any "Ready to publish" button on the page.'
          );
        }

        // Filter for batch card
        const uploadCardSelector =
          '[class*="ant-card"], .ant-list-item, .ant-space-item, .ant-row, [class*="card"], [class*="upload"]';
        const $batchButtons = $buttons.filter((i, el) => {
          const $el = Cypress.$(el);
          const cardText = (
            $el.closest(uploadCardSelector).text() || ""
          ).toLowerCase();
          return (
            cardText.includes("batch") ||
            cardText.includes(`${totalUploads} content`) ||
            cardText.includes(`${totalUploads} out of`) ||
            cardText.includes("0 published")
          );
        });

        const $targetButton = $batchButtons.length
          ? $batchButtons.first()
          : $buttons.first();
        const $card = $targetButton.closest(uploadCardSelector);
        const readyRect = $targetButton[0].getBoundingClientRect();

        const cardMenuSelectors = [
          'button[aria-label*="more"]',
          'button[aria-haspopup="menu"]',
          'button[aria-label*="options"]',
          '[data-testid*="menu"] button',
          '[data-testid*="more"] button',
          '[data-test*="menu"]',
          'button:contains("⋯")',
          'button:contains("...")',
          'button:contains("•••")',
        ];

        const searchWithinCard = () => {
          if (!$card.length) {
            return false;
          }
          for (const selector of cardMenuSelectors) {
            const $candidate = $card
              .find(selector)
              .filter(":visible")
              .not($targetButton);
            if ($candidate.length) {
              return clickCandidate(
                $candidate.first(),
                `card selector ${selector}`
              );
            }
          }
          return false;
        };

        if (searchWithinCard()) {
          return;
        }

        // Fallback: Try to find a button with SVG near the ready button
        const $parent = $targetButton.parent();
        const $siblings = $parent.find("button").not($targetButton);
        if ($siblings.length > 0) {
          clickCandidate($siblings.last(), "sibling button");
          return;
        }

        cy.screenshot("menu-button-not-found-batch");
        throw new Error(
          "Unable to locate menu button near batch Ready to publish button."
        );
      });
  };

  beforeEach(() => {
    // Set viewport to simulate desktop experience
    cy.viewport(1920, 1080);

    // Reset captured metadata
    capturedMetadata = {
      thumbnailurl: null,
      videourl: null,
      previewurl: null,
    };
    publishRequestTriggered = false;

    // Intercept network requests to capture upload metadata
    const extractMetadata = (body) => {
      try {
        let responseBody = body;
        if (typeof body === "string") {
          try {
            responseBody = JSON.parse(body);
          } catch (e) {
            return;
          }
        }
        // ... (metadata extraction logic same as before)
      } catch (e) {
        cy.log(`⚠️ Error extracting metadata: ${e.message}`);
      }
    };

    // Intercept upload requests
    cy.intercept("POST", "**/upload**", (req) => {
      req.continue((res) => {
        if (res.body) {
          cy.log("📡 Upload API response intercepted");
          extractMetadata(res.body);
        }
      });
    }).as("uploadRequest");

    cy.intercept("POST", "**/api/**/upload**", (req) => {
      req.continue((res) => {
        if (res.body) {
          cy.log("📡 Upload API response intercepted (alt endpoint)");
          extractMetadata(res.body);
        }
      });
    }).as("uploadRequestAlt");

    // Intercept publish requests
    cy.intercept("POST", "**/publish**", (req) => {
      req.continue((res) => {
        if (res.body) {
          cy.log("📡 Publish API response intercepted");
          extractMetadata(res.body);
        }
      });
      publishRequestTriggered = true;
    }).as("publishRequest");

    cy.intercept("POST", "**/api/**/publish**", (req) => {
      req.continue((res) => {
        if (res.body) {
          cy.log("📡 Publish API response intercepted (alt endpoint)");
          extractMetadata(res.body);
        }
      });
      publishRequestTriggered = true;
    }).as("publishRequestAlt");

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

      if (currentUrl.includes("accounts.google.com")) {
        cy.log("⚠️ Redirected to Google OAuth - handling OAuth flow");
        humanWait(2000);
        // ... (OAuth handling logic same as before)
      } else if (currentUrl.includes("/signin")) {
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

  it("executes the full workflow: Create Channel -> Edit -> Single Upload -> Bulk Upload -> Disable Channel", () => {
    // Generate a unique channel name for this test run
    const channelName = `Channel-${Date.now()}`;
    // const updatedTitle = `${channelName}-Edited`;
    const updatedTitle = "Auto-channel-30";
    const updatedDescription = "Auto-channel description";

    // ============================================
    // STEP 1: CHANNEL CREATION
    // ============================================
    cy.log("🎬 STEP 1: Creating New Channel");

    // --- Navigation Section ---
    cy.log("📱 Navigating to Short-form -> Channels");

    // Click Short-form (only if Channels is not visible)
    cy.get("body").then(($body) => {
      if ($body.find(':contains("Channels")').filter(":visible").length === 0) {
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

    // Click Create New
    cy.contains("button", "Create New").should("be.visible").click();
    humanWait(2000);

    // Verify Create New Channel form
    cy.contains("Create New Channel").should("be.visible");

    // Upload Channel Icon
    cy.log("📸 Uploading Channel Icon");
    cy.get('input[type="file"]').selectFile(
      "cypress/fixtures/channel-icon.jpg",
      {
        force: true,
      }
    );
    humanWait(2000);

    // Fill Form
    cy.log("📝 Filling Name");
    cy.get('input[placeholder*="channel name"]')
      .type(channelName, { delay: testConfig.humanTypeDelay })
      .should("have.value", channelName);
    humanWait(1000);

    cy.log("📝 Filling Description");
    cy.get('textarea[placeholder*="channel description"]')
      .type("Test Channel for automation testing", {
        delay: testConfig.humanTypeDelay,
      })
      .should("have.value", "Test Channel for automation testing");
    humanWait(1000);

    cy.log("📝 Selecting Category");
    cy.contains("label", "Category").next().click({ force: true });
    humanWait(500);
    cy.contains("Select categories").click({ force: true });
    humanWait(2000);
    cy.contains("Auto & Vehicles").should("be.visible").click({ force: true });
    humanWait(1000);
    cy.contains("label", "Title").click({ force: true }); // Close dropdown
    humanWait(500);

    cy.log("📝 Filling Title");
    cy.get('input[placeholder*="channel title"]')
      .type("Testing", { delay: testConfig.humanTypeDelay, force: true })
      .should("have.value", "Testing");
    humanWait(1000);

    cy.log("📝 Filling CTA Button Label");
    cy.get('input[placeholder*="button label"]')
      .type("Test Ongoing", { delay: testConfig.humanTypeDelay })
      .should("have.value", "Test Ongoing");
    humanWait(1000);

    cy.log("📝 Filling CTA Button Link");
    cy.get('input[placeholder*="button link"]')
      .type("www.horizonexp.com", { delay: testConfig.humanTypeDelay })
      .should("have.value", "www.horizonexp.com");
    humanWait(1000);

    cy.log("🚀 Clicking Create Channel");
    cy.contains("button", "Create Channel").click();
    humanWait(3000);
    cy.reload();
    humanWait(2000);

    // ============================================
    // STEP 2: CHANNEL EDIT
    // ============================================
    cy.log("🎬 STEP 2: Editing Channel");

    cy.contains("Shorts Channels").should("be.visible");
    humanWait(2000);

    cy.log(`🔍 Locating '${channelName}' and opening menu`);
    cy.contains(channelName)
      .parentsUntil("body")
      .filter((i, el) => Cypress.$(el).find("button").length > 0)
      .first()
      .find("button")
      .last()
      .click({ force: true });
    humanWait(1000);

    cy.contains("Edit channel").should("be.visible").click();
    humanWait(2000);

    cy.contains("Edit Channel").should("be.visible");

    cy.log("📝 Updating Title");
    cy.get('input[placeholder*="channel name"]')
      .clear()
      .type(updatedTitle, { delay: testConfig.humanTypeDelay })
      .should("have.value", updatedTitle);
    humanWait(1000);

    cy.log("📝 Updating Description");
    cy.get('textarea[placeholder*="channel description"]')
      .clear()
      .type(updatedDescription, { delay: testConfig.humanTypeDelay })
      .should("have.value", updatedDescription);
    humanWait(1000);

    cy.log("🚀 Clicking Update Channel");
    cy.contains("button", "Update Channel").click();
    humanWait(3000);
    cy.reload();
    humanWait(2000);

    // ============================================
    // STEP 3: SINGLE FILE UPLOAD
    // ============================================
    cy.log("🎬 STEP 3: Single File Upload");

    navigateToUploads();

    cy.log("➕ Clicking Upload New button");
    humanWait(1000);

    // Exact button selection logic from reference
    const uploadButtonSelectors = [
      'button:contains("Upload New")',
      '[data-testid*="upload"]',
      'button[class*="bg-blue"], button[class*="primary"]',
      'a:contains("Upload New")',
      '*:contains("Upload New")',
    ];

    cy.get("body").then(($body) => {
      let buttonFound = false;
      for (const selector of uploadButtonSelectors) {
        if ($body.find(selector).length > 0 && !buttonFound) {
          cy.log(`➕ Found Upload New button: ${selector}`);
          cy.get(selector).first().should("be.visible").click();
          buttonFound = true;
          break;
        }
      }

      if (!buttonFound) {
        cy.get("button, a").filter(':contains("Upload")').first().click();
      }
    });
    humanWait(2000);

    cy.log("📹 Starting single file upload process");
    humanWait(1000);

    cy.get("body").then(($body) => {
      const $fileInputs = $body.find('input[type="file"]');

      const chooseableInputs = $fileInputs.filter((_, el) => {
        const accept = (el.getAttribute("accept") || "").toLowerCase();

        if (accept.includes("csv")) {
          return false;
        }

        if (
          accept.includes("video") ||
          accept.includes("mp4") ||
          accept.includes("quicktime")
        ) {
          return true;
        }

        const dataTestId = (el.getAttribute("data-testid") || "").toLowerCase();
        if (dataTestId.includes("video") || dataTestId.includes("upload")) {
          return true;
        }

        return accept.trim() === "";
      });

      if (chooseableInputs.length > 0) {
        cy.log(
          `✅ Using file input for upload (matching ${chooseableInputs.length} candidate(s))`
        );
        cy.wrap(chooseableInputs.first()).selectFile(
          testConfig.singleUploadFile.path,
          { force: true }
        );
      } else {
        cy.log("🎯 Using drag-drop upload method");
        const uploadAreaSelectors = [
          ".upload-area",
          ".drop-zone",
          '[data-testid="upload-area"]',
          ".file-drop-zone",
          ".upload-container",
        ];

        let uploadAreaFound = false;
        uploadAreaSelectors.forEach((selector) => {
          if (!uploadAreaFound && $body.find(selector).length > 0) {
            cy.get(selector).selectFile(testConfig.singleUploadFile.path, {
              action: "drag-drop",
            });
            uploadAreaFound = true;
          }
        });

        if (!uploadAreaFound) {
          const genericSelectors = '[class*="upload"], [id*="upload"]';
          if ($body.find(genericSelectors).length > 0) {
            cy.get(genericSelectors)
              .first()
              .selectFile(testConfig.singleUploadFile.path, { force: true });
          } else {
            throw new Error(
              "Unable to locate a suitable file input or drag-drop area for video upload."
            );
          }
        }
      }
    });
    humanWait(2000);

    // Wait for upload to complete
    cy.log("⏳ Verifying file selection and upload progress");

    cy.get("body", { timeout: 30000 }).should("satisfy", ($body) => {
      if (!$body || $body.length === 0) return false;
      const text = $body.text() || "";
      return (
        text.includes("uploaded") ||
        text.includes("Video #") ||
        text.includes("Ready to publish") ||
        text.includes("100%") ||
        text.includes("out of") ||
        text.includes("content")
      );
    });

    // Click upload submit button if needed
    cy.get("body").then(($body) => {
      const submitButtonSelectors = [
        'button:contains("Upload")',
        'button:contains("Submit")',
        'button:contains("Start Upload")',
        '[data-testid="upload-submit"]',
      ];

      for (const selector of submitButtonSelectors) {
        if ($body.find(selector).length > 0) {
          cy.log("🚀 Clicking upload submit button");
          humanWait(1000);
          cy.get(selector).first().click({ force: true });
          break;
        }
      }
    });
    humanWait(2000);

    // Assert upload status/success indicator
    cy.log("⏳ Waiting for upload to complete");
    cy.get("body", { timeout: 60000 }).should("satisfy", ($body) => {
      if (!$body || $body.length === 0) return false;

      const bodyText = $body.text() || "";
      const completionIndicators = [
        "100%",
        "Upload complete",
        "Upload successful",
        "Ready to publish",
        "Successfully uploaded",
        "uploaded (100%)",
      ];

      if (
        completionIndicators.some((indicator) => bodyText.includes(indicator))
      ) {
        return true;
      }

      const progressBar = $body.find(
        '[role="progressbar"], .progress-bar, [class*="progress"]'
      );
      if (progressBar.length > 0) {
        const progressValue =
          progressBar.attr("aria-valuenow") || progressBar.attr("value") || "";
        const progressText = progressBar.text() || "";

        if (
          progressValue === "100" ||
          progressValue === "100%" ||
          progressText.includes("100%")
        ) {
          return true;
        }

        cy.log(
          `📊 Progress: ${progressValue || progressText || "checking..."}`
        );
        return false;
      }

      return true;
    });

    cy.log("✅ Single file upload completed");
    cy.contains("body", "Ready to publish", { timeout: 30000 }).should("exist");
    humanWait(3000);

    // Click "Ready to Publish" with retry logic
    cy.log("📝 Clicking Ready to publish button");

    const clickReadyToPublish = () => {
      cy.get("body").then(($body) => {
        // Priority 1: Button or Link with exact text
        const $interactive = $body
          .find('button, a, [role="button"]')
          .filter(':contains("Ready to publish")')
          .filter(":visible");
        if ($interactive.length > 0) {
          cy.log(
            `Found ${$interactive.length} interactive elements, clicking first`
          );
          cy.wrap($interactive.first()).scrollIntoView().click({ force: true });
          return;
        }

        // Priority 2: Any element with text
        const $any = $body
          .find('*:contains("Ready to publish")')
          .filter(":visible");
        if ($any.length > 0) {
          cy.log("Clicking generic element with text");
          cy.wrap($any.last()).scrollIntoView().click({ force: true });
        }
      });
    };

    clickReadyToPublish();
    humanWait(3000);

    // Retry logic: Check if URL changed, if not, try clicking again
    cy.location("pathname").then((pathname) => {
      if (!pathname.includes("/publish")) {
        cy.log("⚠️ Navigation failed, retrying click...");
        clickReadyToPublish();
        humanWait(3000);
      }
    });

    // Wait for publish form to load
    cy.log("⏳ Waiting for publish form to load");
    cy.location("pathname", { timeout: 45000 }).should((pathname) => {
      expect(pathname).to.match(/\/shorts\/upload\/[^/]+\/publish$/);
    });

    cy.contains(/select channel/i, { timeout: 30000 }).should("be.visible");
    cy.contains(/select categories/i).should("be.visible");
    cy.log("✅ Form loaded");
    humanWait(2000);

    // Fill publish form
    cy.log("📝 Filling publish form");

    // IMPORTANT: Select the newly created channel
    selectDropdownOption("Channel", updatedTitle);
    humanWait(2000);

    // Verify channel was selected
    cy.get("body").then(($body) => {
      if ($body.text().includes("Channel is required")) {
        cy.log("⚠️ Channel not selected, retrying...");
        selectDropdownOption("Channel", updatedTitle);
        humanWait(2000);
      }
    });

    // Fill Category dropdown (REQUIRED)
    selectDropdownOption("Category", "Auto & Vehicles");
    humanWait(2000);

    // Verify category was selected
    cy.get("body").then(($body) => {
      const bodyText = $body.text() || "";
      if (
        bodyText.includes("Minimum 1 category is required") ||
        bodyText.includes("Category is required")
      ) {
        cy.log("⚠️ Category not selected, retrying...");
        selectDropdownOption("Category", "Auto & Vehicles");
        humanWait(2000);
      }
    });

    // Fill form fields
    cy.log("🔍 Filling form fields");
    cy.get('input[placeholder*="title"], input[name="title"]')
      .filter(":visible")
      .first()
      .should("be.visible")
      .clear({ force: true })
      .type("Single Upload Test", {
        force: true,
        delay: testConfig.humanTypeDelay,
      });
    humanWait(1000);

    cy.get(
      'textarea[placeholder*="caption"], textarea[name="caption"], input[placeholder*="caption"]'
    )
      .filter(":visible")
      .first()
      .should("be.visible")
      .clear({ force: true })
      .type("Single upload caption", {
        force: true,
        delay: testConfig.humanTypeDelay,
      });
    humanWait(1000);

    cy.get('input[placeholder*="tag"], input[name="tags"]')
      .filter(":visible")
      .first()
      .should("be.visible")
      .clear({ force: true })
      .type("single{enter}", {
        force: true,
        delay: testConfig.humanTypeDelay,
      });
    humanWait(1000);

    cy.get(
      'input[placeholder*="button label"], input[name*="cta"], input[placeholder*="Button label"]'
    )
      .filter(":visible")
      .first()
      .should("be.visible")
      .clear({ force: true })
      .type("Learn More", { force: true, delay: testConfig.humanTypeDelay });
    humanWait(1000);

    cy.get(
      'input[placeholder*="button link"], input[name*="cta"], input[placeholder*="Button link"]'
    )
      .filter(":visible")
      .last()
      .should("be.visible")
      .clear({ force: true })
      .type("https://example.com", {
        force: true,
        delay: testConfig.humanTypeDelay,
      });
    humanWait(2000);

    // Click "Publish"
    cy.log("🚀 Clicking Publish button");
    cy.get("body").then(($body) => {
      const selectors = [
        'button:contains("Publish")',
        'button[class*="bg-blue"]',
        'button[type="submit"]',
      ];

      for (const selector of selectors) {
        if ($body.find(selector).length > 0) {
          cy.get(selector).first().should("be.visible").click({ force: true });
          break;
        }
      }
    });
    humanWait(3000);

    // Assert publish success message / status
    cy.log("⏳ Waiting for publishing to complete");

    cy.then(() => {
      if (publishRequestTriggered) {
        return cy.wait("@publishRequest", { timeout: 30000 }).then(() => {
          cy.log("📡 Publish API response received");
        });
      }
      cy.log(
        "ℹ️ No publish request was intercepted; continuing without waiting on alias"
      );
    });

    humanWait(3000);

    cy.url().then((currentUrl) => {
      cy.get("body", { timeout: 20000 }).should("satisfy", ($body) => {
        if (!$body || $body.length === 0) return false;

        const bodyText = $body.text() || "";
        return (
          bodyText.includes("Published") ||
          bodyText.includes("Success") ||
          bodyText.includes("published") ||
          currentUrl.includes("/uploads")
        );
      });
    });

    cy.log("✅ Single file publishing completed");
    cy.contains("body", /published|success/i, { timeout: 20000 }).should(
      "exist"
    );

    // ============================================
    // STEP 4: VERIFY SINGLE UPLOAD
    // ============================================
    cy.log("🎬 STEP 4: Verify Single Upload in Library");
    navigateToLibrary();
    verifyVideoDetails({
      title: "Single Upload Test",
      caption: "Single upload caption",
      ctaLabel: "Learn More",
      ctaLink: "https://example.com",
    });

    // Return to Library page after verification
    cy.log("🔙 Returning to Library page after verification");
    cy.url().then((currentUrl) => {
      if (!currentUrl.includes("/library")) {
        navigateToLibrary();
      } else {
        cy.log("✅ Already on Library page");
        humanWait(1000);
      }
    });

    // ============================================
    // STEP 5: BULK UPLOAD
    // ============================================
    cy.log("🎬 STEP 5: Bulk Upload");
    navigateToUploads();

    cy.log("➕ Clicking Upload New button");
    humanWait(1000);

    // Exact button selection logic from reference (Repeated for bulk)
    cy.get("body").then(($body) => {
      let buttonFound = false;
      for (const selector of uploadButtonSelectors) {
        if ($body.find(selector).length > 0 && !buttonFound) {
          cy.log(`➕ Found Upload New button: ${selector}`);
          cy.get(selector).first().should("be.visible").click();
          buttonFound = true;
          break;
        }
      }

      if (!buttonFound) {
        cy.get("button, a").filter(':contains("Upload")').first().click();
      }
    });
    humanWait(2000);

    cy.log("📹 Selecting multiple files");
    const filesToUpload = testConfig.bulkUploadFiles.map((f) => f.path);

    // Wait for upload area to appear (Retry logic)
    cy.get("body")
      .find(
        'input[type="file"], .upload-area, .drop-zone, [class*="upload"], [id*="upload"]'
      )
      .should("exist");

    // ROBUST UPLOAD LOGIC FROM REFERENCE (Adapted for bulk)
    cy.get("body").then(($body) => {
      const $fileInputs = $body.find('input[type="file"]');

      const chooseableInputs = $fileInputs.filter((_, el) => {
        const accept = (el.getAttribute("accept") || "").toLowerCase();
        if (accept.includes("csv")) return false;
        if (
          accept.includes("video") ||
          accept.includes("mp4") ||
          accept.includes("quicktime")
        )
          return true;
        const dataTestId = (el.getAttribute("data-testid") || "").toLowerCase();
        if (dataTestId.includes("video") || dataTestId.includes("upload"))
          return true;
        return accept.trim() === "";
      });

      if (chooseableInputs.length > 0) {
        cy.wrap(chooseableInputs.first()).selectFile(filesToUpload, {
          force: true,
        });
      } else {
        // Fallback to generic upload area
        cy.get('[class*="upload"], [class*="drop"]')
          .first()
          .selectFile(filesToUpload, { action: "drag-drop" });
      }
    });
    humanWait(5000);

    cy.log("⏳ Waiting for batch to be ready");
    cy.get("body", { timeout: 120000 }).should(($body) => {
      const text = $body.text();
      expect(text).to.match(/batch|content|ready/i);
    });

    // Wait for "Ready to publish" on batch card
    cy.contains('button, a, [role="button"]', "Ready to publish", {
      timeout: 60000,
    }).should("be.visible");

    // Open menu for batch card
    openBatchActionsMenu();

    // Click "Import CSV metadata"
    cy.log("📥 Clicking Import CSV metadata");
    cy.contains("Import CSV metadata").click({ force: true });
    humanWait(2000);

    // Upload CSV
    cy.log("📄 Uploading CSV");
    cy.get('input[type="file"]')
      .last()
      .selectFile(testConfig.csvFilePath, { force: true });
    humanWait(2000);

    // Click Import
    cy.contains("button", "Import").click({ force: true });
    humanWait(3000);

    // Click "Ready to publish" for the batch
    cy.log("📝 Clicking Ready to publish for batch");
    cy.contains('button, a, [role="button"]', "Ready to publish")
      .first()
      .click({ force: true });
    humanWait(3000);

    // Fill Batch Publish Form
    cy.log("📝 Filling batch publish form");
    // Select the newly created channel
    selectDropdownOption("Channel", updatedTitle);
    humanWait(2000);
    selectDropdownOption("Category", "Auto & Vehicles");
    humanWait(2000);

    cy.log("🚀 Clicking Publish Batch");
    cy.contains("button", "Publish").click({ force: true });
    humanWait(5000);

    cy.contains("body", /published|success/i, { timeout: 30000 }).should(
      "exist"
    );

    // ============================================
    // STEP 6: VERIFY BULK UPLOAD
    // ============================================
    cy.log("🎬 STEP 6: Verify Bulk Upload in Library");
    navigateToLibrary();
    // Just verify navigation for now, specific video verification might be complex with bulk
    cy.url().should("include", "/library");
    humanWait(2000);

    // ============================================
    // STEP 7: DISABLE CHANNEL
    // ============================================
    cy.log("🎬 STEP 7: Disable Channel");

    // Navigate to Channels
    cy.log("📱 Navigating to Short-form -> Channels");
    cy.get("body").then(($body) => {
      if ($body.find(':contains("Channels")').filter(":visible").length === 0) {
        cy.contains("Short-form").click();
        humanWait(1000);
      }
    });
    cy.contains("Channels").click();
    humanWait(3000);

    cy.log(`🔍 Locating '${updatedTitle}' and opening menu to disable`);
    cy.contains(updatedTitle)
      .parentsUntil("body")
      .filter((i, el) => Cypress.$(el).find("button").length > 0)
      .first()
      .find("button")
      .last()
      .click({ force: true });
    humanWait(1000);

    cy.contains("Disable channel").should("be.visible").click();
    humanWait(2000);
    cy.contains("Yes, disable").should("be.visible").click();
    humanWait(2000);
    cy.reload();
    humanWait(2000);

    cy.log("✅ Full workflow completed successfully");
  });
});
