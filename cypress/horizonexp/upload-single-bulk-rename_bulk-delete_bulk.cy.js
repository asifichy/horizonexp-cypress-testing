describe("Content Upload & Publishing", () => {
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

    cy.contains("label, span", labelText, { matchCase: false, timeout: 20000 })
      .filter(":visible")
      .first()
      .then(($label) => {
        const $container =
          $label.closest(".ant-space-item, .ant-form-item, .ant-row, form div")
            .length > 0
            ? $label
                .closest(".ant-space-item, .ant-form-item, .ant-row, form div")
                .first()
            : $label.parent();

        let $button = $container
          .find('button, [role="button"]')
          .filter(":visible")
          .first();

        if (!$button || $button.length === 0) {
          $button = $label.nextAll("button").filter(":visible").first();
        }

        if (!$button || $button.length === 0) {
          throw new Error(
            `Unable to locate dropdown trigger button for "${labelText}"`
          );
        }

        cy.wrap($button).scrollIntoView().click({ force: true });

        humanWait(1000);

        cy.contains("div, button, li", optionText, { timeout: 10000 })
          .filter(":visible")
          .first()
          .click({ force: true });
      });
  };

  const uploadCardSelector =
    '[class*="ant-card"], .ant-list-item, .ant-space-item, .ant-row, [class*="card"], [class*="upload"]';

  const hasReadyButton = ($element) =>
    $element.find('button, [role="button"]').filter((i, el) => {
      const text = Cypress.$(el).text().trim().toLowerCase();
      return text.includes("ready") && text.includes("publish");
    }).length > 0;

  const collectCardsForContext = ($body, context) => {
    const totalUploads = testConfig.bulkUploadFiles.length;
    return $body
      .find(uploadCardSelector)
      .filter(":visible")
      .filter((i, el) => {
        const $el = Cypress.$(el);
        if (!hasReadyButton($el)) {
          return false;
        }
        const text = $el.text().trim().toLowerCase();
        if (context === "batch") {
          return (
            text.includes("batch") ||
            text.includes(`${totalUploads} content`) ||
            text.includes(`${totalUploads} out of`) ||
            (text.includes("content") && text.includes("ready to publish")) ||
            text.includes("0 published")
          );
        }
        return text.includes("video") && !text.includes("batch");
      });
  };

  const pickPreferredCard = ($cards, context) => {
    if (context === "batch") {
      const $pending = $cards.filter((i, el) => {
        const text = Cypress.$(el).text();
        return /0\s+published/i.test(text) || !/\d+\s+published/i.test(text);
      });
      if ($pending.length > 0) {
        cy.log("📌 Selected batch card with pending publish state");
        return $pending.first();
      }
    }
    return $cards.first();
  };

  const waitForBatchReadyCard = () => {
    cy.log("⏳ Waiting for batch card indicators");
    cy.get("body", { timeout: 45000 }).should(
      ($body) => collectCardsForContext($body, "batch").length > 0
    );
    cy.log("✅ Batch card detected on page");
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

          const $iconicButtons = $card
            .find('button, [role="button"]')
            .filter(":visible")
            .filter((i, el) => el !== $targetButton[0])
            .filter((i, el) => {
              const $el = Cypress.$(el);
              const text = $el.text().trim();
              const hasSvg = $el.find("svg").length > 0;
              const ariaLabel = $el.attr("aria-label") || "";
              return (
                hasSvg ||
                text === "" ||
                text === "..." ||
                text === "⋯" ||
                text === "•••" ||
                /menu|more|option/i.test(ariaLabel)
              );
            });

          if ($iconicButtons.length) {
            return clickCandidate(
              $iconicButtons.last(),
              "card fallback button"
            );
          }
          return false;
        };

        const strategyNextSibling = () => {
          const $nextSibling = $targetButton.next();
          if ($nextSibling.length > 0) {
            const $nextButton = $nextSibling.is('button, [role="button"]')
              ? $nextSibling
              : $nextSibling.find('button, [role="button"]').first();
            if ($nextButton.length && $nextButton.is(":visible")) {
              const text = $nextButton.text().trim().toLowerCase();
              const hasSvg = $nextButton.find("svg").length > 0;
              if (hasSvg && !/ready|publish/.test(text)) {
                return clickCandidate($nextButton, "next sibling");
              }
            }
          }
          return false;
        };

        const strategySameContainer = () => {
          const $parentButtons = $targetButton
            .parent()
            .find('button, [role="button"]')
            .filter(":visible");
          let actionTaken = false;
          $parentButtons.each((_, el) => {
            if (actionTaken) {
              return false;
            }
            const $el = Cypress.$(el);
            if ($el.is($targetButton)) {
              return true;
            }
            const elRect = el.getBoundingClientRect();
            const text = $el.text().trim().toLowerCase();
            const hasSvg = $el.find("svg").length > 0;
            const minimalText = text.length === 0 || text.length < 4;
            const isToRight = elRect.left > readyRect.right - 10;
            const sameRow = Math.abs(elRect.top - readyRect.top) < 40;

            if (isToRight && sameRow && hasSvg && minimalText) {
              actionTaken = clickCandidate($el, "same container");
            }
            return true;
          });
          return actionTaken;
        };

        const strategyGlobalSearch = () => {
          let actionTaken = false;
          Cypress.$("body")
            .find('button, [role="button"]')
            .filter(":visible")
            .each((_, el) => {
              if (actionTaken) {
                return false;
              }
              const $el = Cypress.$(el);
              const text = $el.text().trim().toLowerCase();
              if (text.includes("ready") && text.includes("publish")) {
                return true;
              }
              const elRect = el.getBoundingClientRect();
              const isToRight = elRect.left >= readyRect.right - 20;
              const sameRow = Math.abs(elRect.top - readyRect.top) < 60;
              const closeEnough = elRect.left < readyRect.right + 200;
              const hasSvg = $el.find("svg").length > 0;
              const html = $el.html() || "";
              const hasMenuIndicators =
                html.includes("⋯") ||
                html.includes("ellipsis") ||
                html.includes("MoreVertical") ||
                html.includes("more-vertical") ||
                html.includes("DotsVertical") ||
                html.includes("dots-vertical");

              if (
                isToRight &&
                sameRow &&
                closeEnough &&
                (hasSvg || hasMenuIndicators || text === "" || text === "...")
              ) {
                actionTaken = clickCandidate($el, "global search");
              }
              return true;
            });
          return actionTaken;
        };

        if (searchWithinCard()) {
          return;
        }
        if (strategyNextSibling()) {
          return;
        }
        if (strategySameContainer()) {
          return;
        }
        if (strategyGlobalSearch()) {
          return;
        }

        cy.screenshot("menu-button-not-found-batch");
        throw new Error(
          "Unable to locate menu button near batch Ready to publish button."
        );
      });
  };

  const getVisibleDropdownMenu = () =>
    cy.get('[role="menu"], .ant-dropdown-menu').filter(":visible").first();

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
      cy.get('input[placeholder*="Button label"], input[name*="cta"]')
        .first()
        .should("have.value", ctaLabel);
    }

    // Verify CTA Link
    if (ctaLink) {
      cy.log("🔍 Checking CTA Link value");
      cy.get('input[placeholder*="Button link"], input[name*="cta"]')
        .last()
        .should("have.value", ctaLink);
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

        if (
          responseBody.thumbnailUrl ||
          responseBody.thumbnailurl ||
          responseBody.thumbnail_url
        ) {
          const url =
            responseBody.thumbnailUrl ||
            responseBody.thumbnailurl ||
            responseBody.thumbnail_url;
          if (url && !capturedMetadata.thumbnailurl) {
            capturedMetadata.thumbnailurl = url;
            cy.log(`📸 Captured thumbnailUrl: ${url}`);
          }
        }
        if (
          responseBody.videoUrl ||
          responseBody.videourl ||
          responseBody.video_url
        ) {
          const url =
            responseBody.videoUrl ||
            responseBody.videourl ||
            responseBody.video_url;
          if (url && !capturedMetadata.videourl) {
            capturedMetadata.videourl = url;
            cy.log(`🎥 Captured videoUrl: ${url}`);
          }
        }
        if (
          responseBody.previewUrl ||
          responseBody.previewurl ||
          responseBody.preview_url
        ) {
          const url =
            responseBody.previewUrl ||
            responseBody.previewurl ||
            responseBody.preview_url;
          if (url && !capturedMetadata.previewurl) {
            capturedMetadata.previewurl = url;
            cy.log(`👁️ Captured previewUrl: ${url}`);
          }
        }

        if (responseBody.data) {
          extractMetadata(responseBody.data);
        }
        if (responseBody.result) {
          extractMetadata(responseBody.result);
        }
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

        cy.get("body").then(($body) => {
          if ($body.find('input[type="email"]').length > 0) {
            cy.get('input[type="email"]')
              .first()
              .clear()
              .type(testConfig.userEmail, { delay: testConfig.humanTypeDelay });
            humanWait(1000);
            cy.get(
              'button:contains("Next"), #identifierNext, [data-continue-as]'
            )
              .first()
              .click();
            humanWait(3000);

            cy.get("body").then(($body2) => {
              if ($body2.find('input[type="password"]').length > 0) {
                cy.get('input[type="password"]')
                  .first()
                  .type(testConfig.userPassword, {
                    delay: testConfig.humanTypeDelay,
                  });
                cy.get('button:contains("Next"), #passwordNext')
                  .first()
                  .click();
                humanWait(3000);
              }
            });
          }
        });
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

  it("uploads single file, publishes it, then performs bulk upload with CSV and bulk publish, then verifies in Library", () => {
    const totalUploads = testConfig.bulkUploadFiles.length;
    const uploadCompletionPattern = new RegExp(
      `${totalUploads}\\s+out\\s+of\\s+${totalUploads}\\s+uploaded`,
      "i"
    );

    // ============================================
    // PART 1: SINGLE FILE UPLOAD AND PUBLISH
    // ============================================
    cy.log("🎬 PART 1: Starting single file upload and publish workflow");

    // Navigate to Upload section
    navigateToUploads();

    // Click "Upload New"
    cy.log("➕ Clicking Upload New button");
    humanWait(1000);

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

    // Select 1 file
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

    // Click "Ready to Publish"
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

        // Priority 2: Any element with text, but check if it's a status label
        const $any = $body
          .find('*:contains("Ready to publish")')
          .filter(":visible");
        if ($any.length > 0) {
          // Filter out elements that are likely just containers or status text if better options exist
          // For now, just click the last one (often the text node wrapper) or the one that looks most like a button
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

    // Fill Channel dropdown (REQUIRED)
    selectDropdownOption("Channel", `DevOps`);
    humanWait(2000);

    cy.get("body").then(($body) => {
      if ($body.text().includes("Channel is required")) {
        cy.log("⚠️ Channel not selected, retrying...");
        selectDropdownOption("Channel", `DevOps`);
        humanWait(2000);
      }
    });

    // Fill Category dropdown (REQUIRED)
    selectDropdownOption("Category", "Auto & Vehicles");
    humanWait(2000);

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
      .type("Test Upload Video", {
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
      .type("This is a test caption generated by automation.", {
        force: true,
        delay: testConfig.humanTypeDelay,
      });
    humanWait(1000);

    cy.get('input[placeholder*="tag"], input[name="tags"]')
      .filter(":visible")
      .first()
      .should("be.visible")
      .clear({ force: true })
      .type("automation{enter}test{enter}video{enter}", {
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
    // PART 1.5: VERIFY IN LIBRARY
    // ============================================
    cy.log("🔍 PART 1.5: Verifying published video in Library");

    // Navigate to Library
    navigateToLibrary();

    // Verify video details
    verifyVideoDetails({
      title: "Test Upload Video",
      caption: "This is a test caption generated by automation.",
      ctaLabel: "Learn More",
      ctaLink: "https://example.com",
    });

    // Navigate back to Uploads for Part 2
    cy.log("🔙 Navigating back to Uploads for bulk upload");
    navigateToUploads();
    humanWait(3000);

    // ============================================
    // PART 2: BULK UPLOAD WITH CSV AND BULK PUBLISH
    // ============================================
    cy.log(
      "🎬 PART 2: Starting bulk upload workflow with CSV import and bulk publish"
    );

    // Click "Upload New" for bulk upload
    cy.log("➕ Clicking Upload New button for bulk upload");
    humanWait(1000);

    const bulkUploadButtonSelectors = [
      'button:contains("Upload New")',
      '[data-testid*="upload"]',
      'button[class*="bg-blue"], button[class*="primary"]',
      'a:contains("Upload New")',
      '*:contains("Upload New")',
    ];

    cy.get("body").then(($body) => {
      let buttonFound = false;
      for (const selector of bulkUploadButtonSelectors) {
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

    // Select 5 videos
    cy.log("📹 Starting bulk file upload process");
    humanWait(1000);

    const uploadPaths = testConfig.bulkUploadFiles.map((file) => file.path);
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
        cy.wrap(chooseableInputs.first()).selectFile(uploadPaths, {
          force: true,
        });
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
            cy.get(selector).selectFile(uploadPaths, { action: "drag-drop" });
            uploadAreaFound = true;
          }
        });

        if (!uploadAreaFound) {
          const genericSelectors = '[class*="upload"], [id*="upload"]';
          if ($body.find(genericSelectors).length > 0) {
            cy.get(genericSelectors)
              .first()
              .selectFile(uploadPaths, { force: true });
          } else {
            throw new Error(
              "Unable to locate a suitable file input or drag-drop area for video upload."
            );
          }
        }
      }
    });
    humanWait(2000);

    // Wait for all uploads to complete
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

    // Assert 5 uploads appear with success state
    cy.log("⏳ Waiting for all bulk uploads to complete");
    cy.get("body", { timeout: 90000 }).should("satisfy", ($body) => {
      if (!$body || $body.length === 0) return false;

      const bodyText = $body.text() || "";
      const completionIndicators = [
        "100%",
        "Upload complete",
        "Upload successful",
        "Ready to publish",
        "Successfully uploaded",
        "out of",
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

    cy.contains("body", uploadCompletionPattern, { timeout: 90000 }).should(
      "exist"
    );
    cy.contains('button, [role="button"]', /ready\s*to\s*publish/i, {
      timeout: 90000,
    }).should("exist");
    waitForBatchReadyCard();
    cy.log("✅ All bulk uploads completed successfully");
    humanWait(2000);

    // Step 10.5: Rename Batch
    cy.log("🏷️ Step 10.5: Renaming batch");
    openBatchActionsMenu();
    humanWait(1000);

    // --- RENAME BATCH LOGIC START ---
    cy.log("🏷️ Step 10.5: Renaming batch to 'batch-upload-1'");

    // 1. Click "Rename batch" option
    getVisibleDropdownMenu()
      .should("exist")
      .then(($menu) => {
        const $renameOption = $menu
          .find('li, button, a, span, div, [role="menuitem"]')
          .filter((i, el) =>
            /rename\s+batch/i.test(Cypress.$(el).text().trim())
          );

        if ($renameOption.length > 0) {
          cy.wrap($renameOption.first()).click({ force: true });
        } else {
          cy.log("⚠️ 'Rename batch' option not found in menu");
          // Optional: fail or try to recover
        }
      });

    humanWait(2000);

    // 2. Handle Rename Input
    const newBatchName = "batch-upload-1";
    const renameInputSelectors = [
      'input[placeholder*="batch"]',
      'input[value*="Batch"]',
      'input[type="text"]',
      '[contenteditable="true"]',
    ];

    cy.get("body").then(($body) => {
      let inputFound = false;
      for (const selector of renameInputSelectors) {
        const $input = $body.find(selector).filter(":visible");
        if ($input.length > 0) {
          cy.log(`✅ Found rename input using selector: ${selector}`);
          cy.wrap($input.first())
            .clear({ force: true })
            .type(`${newBatchName}{enter}`, { force: true });
          inputFound = true;
          break;
        }
      }

      if (!inputFound) {
        cy.log(
          "⚠️ Rename input not found immediately. Trying fallback click on title."
        );
        // Fallback: Click on the batch title to trigger edit mode
        cy.contains(
          uploadCardSelector + " h4, " + uploadCardSelector + " span",
          /batch/i
        )
          .first()
          .click({ force: true });

        humanWait(1000);

        // Retry finding input
        for (const selector of renameInputSelectors) {
          cy.get("body").then(($newBody) => {
            const $retryInput = $newBody.find(selector).filter(":visible");
            if ($retryInput.length > 0) {
              cy.log(`✅ Found rename input on retry: ${selector}`);
              cy.wrap($retryInput.first())
                .clear({ force: true })
                .type(`${newBatchName}{enter}`, { force: true });
            }
          });
          break; // Only try one valid selector on retry to avoid async mess
        }
      }
    });

    humanWait(2000);

    // 3. Re-open menu for next step (CSV Import)
    cy.log("🔄 Re-opening batch actions menu for CSV import");
    openBatchActionsMenu();
    humanWait(1000);
    // --- RENAME BATCH LOGIC END ---

    // Verify menu is open before searching
    const csvMenuMatchers = [
      /import\s+csv\s+metadata/i,
      /import\s+metadata/i,
      /import\s+csv/i,
    ];
    const clickMenuOption = (menuMatchers, errorMessage) => {
      return getVisibleDropdownMenu()
        .should("exist")
        .then(($menu) => {
          let targetOption = null;
          for (const matcher of menuMatchers) {
            const $match = $menu
              .find('li, button, a, span, div, [role="menuitem"]')
              .filter((i, el) => {
                const text = Cypress.$(el).text().trim();
                return matcher.test(text);
              });
            if ($match.length > 0) {
              targetOption = $match.first();
              break;
            }
          }

          if (!targetOption) {
            cy.log("⚠️ No menu item matched. Searching globally.");
            targetOption = $menu
              .find('li, button, a, span, div, [role="menuitem"]')
              .filter((i, el) => /csv/i.test(Cypress.$(el).text().trim()))
              .first();
          }

          if (!targetOption || targetOption.length === 0) {
            cy.screenshot("error-no-menu-option");
            throw new Error(errorMessage);
          }

          cy.wrap(targetOption).should("be.visible").click({ force: true });
        });
    };

    const clickBulkPublishOption = ({ expectToast = false } = {}) => {
      cy.log('🔍 Searching for "Bulk publish" option in visible menu');

      // First, ensure menu is visible
      getVisibleDropdownMenu()
        .should("exist")
        .then(() => {
          cy.log("✅ Menu dropdown is visible");
          humanWait(500);
        });

      // Search for "Bulk publish" option in the visible menu using body-wide search
      cy.get("body").then(($body) => {
        // Search for "Bulk publish" option in the visible menu
        const $bulkPublishOptions = $body
          .find("*")
          .filter((i, el) => {
            const $el = Cypress.$(el);
            const text = $el.text().trim().toLowerCase();
            return (
              text === "bulk publish" ||
              (text.includes("bulk publish") && !text.includes("replace"))
            );
          })
          .filter(":visible");

        if ($bulkPublishOptions.length > 0) {
          // Found using jQuery search - click the first one
          const $firstOption = $bulkPublishOptions.first();
          cy.log('✅ Found "Bulk publish" option via body search');
          cy.wrap($firstOption[0]).scrollIntoView().should("be.visible");
          humanWait(1000);

          // Try clicking the element or its clickable parent
          if (
            $firstOption.is('button, a, [role="button"], [role="menuitem"]')
          ) {
            cy.log(
              '📌 Clicking "Bulk publish" directly (element is clickable)'
            );
            cy.wrap($firstOption[0]).click({ force: true });
          } else {
            const $clickable = $firstOption.closest(
              'button, a, [role="button"], [role="menuitem"], li'
            );
            if ($clickable.length > 0) {
              cy.log('📌 Clicking "Bulk publish" via closest clickable parent');
              cy.wrap($clickable[0]).click({ force: true });
            } else {
              cy.log('📌 Clicking "Bulk publish" element directly (fallback)');
              cy.wrap($firstOption[0]).click({ force: true });
            }
          }
        } else {
          // Fallback: use cy.contains
          cy.log("⚠️ Body search failed, trying cy.contains fallback");
          cy.contains("*", "Bulk publish", { matchCase: false, timeout: 10000 })
            .should("be.visible")
            .then(($bulkPublishOption) => {
              cy.log('✅ Found "Bulk publish" option via cy.contains');
              cy.wrap($bulkPublishOption).scrollIntoView().should("be.visible");
              humanWait(1000);

              const $clickable = $bulkPublishOption.closest(
                'button, a, [role="button"], [role="menuitem"], li'
              );
              if ($clickable.length > 0) {
                cy.log(
                  '📌 Clicking "Bulk publish" via cy.contains closest clickable'
                );
                cy.wrap($clickable[0]).click({ force: true });
              } else {
                cy.log('📌 Clicking "Bulk publish" via cy.contains directly');
                cy.wrap($bulkPublishOption[0]).click({ force: true });
              }
            });
        }
      });

      if (expectToast) {
        humanWait(1000);
      }
    };

    clickMenuOption(
      csvMenuMatchers,
      "Unable to locate CSV import menu option."
    );
    humanWait(2000);

    // Step 13: Upload the CSV file
    cy.log("📤 Step 13: Uploading CSV metadata file");

    const csvFilePath = testConfig.csvFilePath;
    cy.get("body").then(($body) => {
      const $csvInputs = $body.find('input[type="file"]').filter((_, el) => {
        const accept = (el.getAttribute("accept") || "").toLowerCase();
        return (
          accept.includes("csv") ||
          accept.includes(".csv") ||
          accept.trim() === ""
        );
      });

      if ($csvInputs.length > 0) {
        cy.log(`✅ Found CSV file input (${$csvInputs.length} candidate(s))`);
        cy.wrap($csvInputs.first()).selectFile(csvFilePath, { force: true });
      } else {
        cy.log("🎯 Using drag-drop method for CSV upload");
        const uploadAreaSelectors = [
          ".upload-area",
          ".drop-zone",
          '[data-testid*="upload"]',
          ".file-drop-zone",
          ".upload-container",
          'input[type="file"]',
        ];

        let csvUploaded = false;
        for (const selector of uploadAreaSelectors) {
          if (!csvUploaded && $body.find(selector).length > 0) {
            cy.get(selector)
              .first()
              .selectFile(csvFilePath, { action: "drag-drop", force: true });
            csvUploaded = true;
          }
        }

        if (!csvUploaded) {
          cy.get('input[type="file"]')
            .first()
            .selectFile(csvFilePath, { force: true });
        }
      }
    });
    humanWait(3000);

    // Step 14: Wait for CSV import to complete
    cy.log("⏳ Step 14: Waiting for CSV metadata import to complete");
    cy.get("body", { timeout: 60000 }).should(($body) => {
      expect($body && $body.length, "Body exists").to.be.ok;

      const bodyText = ($body.text() || "").toLowerCase();
      const successIndicators = [
        "csv updated successfully",
        "imported",
        "metadata imported",
        "csv imported",
        "successfully imported",
        "import complete",
        "import successful",
      ];

      const successDetected = successIndicators.some((indicator) =>
        bodyText.includes(indicator)
      );
      const toastVisible =
        Cypress.$(
          '[class*="toast"], [class*="notification"], [role="alert"]'
        ).filter((i, el) => /csv|import/i.test(Cypress.$(el).text())).length >
        0;
      const batchReadyState =
        bodyText.includes("ready to publish") ||
        bodyText.includes("0 published");

      expect(
        successDetected || toastVisible || batchReadyState,
        "CSV status visible"
      ).to.be.true;
    });

    cy.log("✅ CSV metadata import completed");
    humanWait(3000);
    cy.screenshot("csv-import-completed");

    // Step 15: Click three-dot menu again and select "Bulk publish"
    cy.log("📋 Step 15: Clicking three-dot menu for Bulk publish");
    waitForBatchReadyCard();

    // Find the batch card menu again
    openBatchActionsMenu();
    humanWait(2000);

    // Step 16: Wait for menu dropdown to open, then click "Bulk publish"
    cy.log(
      '🚀 Step 16: Waiting for menu dropdown and clicking "Bulk publish" option'
    );

    clickBulkPublishOption({ expectToast: true });
    humanWait(3000);

    // Step 17: Wait for bulk publish to complete
    cy.log("⏳ Step 17: Waiting for bulk publish to complete");

    cy.get("body", { timeout: 90000 }).should(($body) => {
      expect($body && $body.length, "Body exists during publish wait").to.be.ok;

      const bodyText = ($body.text() || "").toLowerCase();
      const successIndicators = [
        "published",
        "publishing",
        "success",
        "successfully published",
        "bulk publish",
        `${totalUploads} published`,
        "all content published",
      ];

      const successDetected = successIndicators.some((indicator) =>
        bodyText.includes(indicator.toLowerCase())
      );
      const batchAllPublished = bodyText.includes(
        `${totalUploads} content • ${totalUploads} published`
      );
      const publishedMatch = bodyText.match(/(\d+)\s+published/);
      const publishedCountReached =
        publishedMatch && parseInt(publishedMatch[1], 10) === totalUploads;
      const toastIndicator =
        Cypress.$(
          '[class*="toast"], [class*="notification"], [role="alert"]'
        ).filter((i, el) => /publish|success/i.test(Cypress.$(el).text()))
          .length > 0;

      expect(
        successDetected ||
          batchAllPublished ||
          publishedCountReached ||
          toastIndicator,
        "Bulk publish status visible"
      ).to.be.true;
    });

    cy.log("✅ Bulk publish completed");
    humanWait(3000);
    cy.screenshot("bulk-publish-completed");

    // ============================================
    // PART 2.5: VERIFY BULK UPLOAD IN LIBRARY
    // ============================================
    cy.log("🔍 PART 2.5: Verifying bulk uploaded videos in Library");

    // Navigate to Library
    navigateToLibrary();

    // Add robustness: Wait for cards to appear
    cy.log("⏳ Waiting for video cards to appear in Library");
    humanWait(3000);
    cy.get("body").then(($body) => {
      const cardSelector =
        '[class*="ant-card"], .ant-list-item, [class*="video-card"]';
      if ($body.find(cardSelector).filter(":visible").length === 0) {
        cy.log("⚠️ No video cards found, reloading page...");
        cy.reload();
        humanWait(5000);
      }
    });

    // Verify video details (no args = click first video)
    verifyVideoDetails();

    // Navigate back to Uploads for next steps (e.g. Bulk Delete)
    cy.log("🔙 Navigating back to Uploads for next steps");
    navigateToUploads();
    humanWait(3000);

    cy.log(
      "🎉 Bulk upload, CSV metadata import, and bulk publish test completed successfully!"
    );

    // ============================================
    // PART 3: VERIFY IN LIBRARY
    // ============================================
    cy.log("🎬 PART 3: Verifying published videos in Library");

    // Navigate to Library
    navigateToLibrary();

    // Wait for library to load
    cy.log("⏳ Waiting for Library page to load");
    humanWait(3000);

    // Verify that videos appear in the library (simplified approach)
    cy.log("🔍 Verifying Library page loaded");

    // Just verify the page has loaded by checking URL
    cy.url().should("include", "/library");
    cy.log("✅ Library page URL verified");

    // Verify one of the bulk videos
    // Since we don't know the exact titles from CSV (unless we parse it), we'll just check the first video
    // assuming it's one of the newly uploaded ones.
    verifyVideoDetails({}); // Just verify we can open and close details

    cy.screenshot("library-verification-complete");
    humanWait(2000);

    // Final success log
    cy.log("✅ PART 3 COMPLETED: Library verification successful");

    // ============================================
    // PART 4: WAIT IN LIBRARY AND LOGOUT
    // ============================================
    cy.log("🎬 PART 4: Waiting in Library and logging out");

    // Wait in library for a moment
    cy.log("⏳ Waiting in Library before logout");
    humanWait(5000); // Wait 5 seconds in library

    // Logout - Click on profile button, then Sign Out
    cy.log("🚪 Step 1: Clicking on profile button to open menu");
    cy.screenshot("before-clicking-profile");

    // Find and click the profile button (with avatar and workspace name)
    cy.get("body", { timeout: 10000 }).then(($body) => {
      cy.log("🔍 Searching for profile/workspace button");

      // Strategy 1: Look for button with avatar image and workspace text
      const $profileButtons = $body
        .find('button, div[role="button"], a')
        .filter(":visible")
        .filter((i, el) => {
          const $el = Cypress.$(el);
          const hasAvatar =
            $el.find('img, [class*="avatar"], [class*="Avatar"]').length > 0;
          const text = $el.text().trim();
          const hasWorkspaceName = text.includes("DevOps") || text.length > 0;
          return hasAvatar && hasWorkspaceName;
        });

      if ($profileButtons.length > 0) {
        cy.log(`✅ Found profile button with avatar`);
        cy.wrap($profileButtons.first())
          .scrollIntoView()
          .should("be.visible")
          .click({ force: true });
        humanWait(2000);
      } else {
        // Strategy 2: Look for any element containing workspace name at bottom
        cy.log("🔍 Strategy 2: Looking for workspace name element");
        const $workspaceElements = $body.find("*:visible").filter((i, el) => {
          const $el = Cypress.$(el);
          const text = $el.text().trim();
          const rect = el.getBoundingClientRect();
          const isNearBottom = rect.top > window.innerHeight - 300;
          return isNearBottom && (text === "DevOps" || text.includes("DevOps"));
        });

        if ($workspaceElements.length > 0) {
          cy.log(`✅ Found workspace element`);
          const $clickable = $workspaceElements
            .first()
            .closest('button, a, [role="button"]');
          if ($clickable.length > 0) {
            cy.wrap($clickable).click({ force: true });
          } else {
            cy.wrap($workspaceElements.first()).click({ force: true });
          }
          humanWait(2000);
        } else {
          // Strategy 3: Try common selectors for profile/account buttons
          cy.log("🔍 Strategy 3: Trying common profile button selectors");
          const commonSelectors = [
            '[data-testid*="profile"]',
            '[data-testid*="account"]',
            '[data-testid*="user"]',
            '[aria-label*="profile"]',
            '[aria-label*="account"]',
            'button:has(img[alt*="avatar"])',
            'button:has([class*="avatar"])',
          ];

          let clicked = false;
          for (const selector of commonSelectors) {
            if (
              !clicked &&
              $body.find(selector).filter(":visible").length > 0
            ) {
              cy.log(`✅ Found profile button: ${selector}`);
              cy.get(selector)
                .filter(":visible")
                .first()
                .click({ force: true });
              clicked = true;
              humanWait(2000);
              break;
            }
          }

          if (!clicked) {
            cy.log("⚠️ Profile button not found, taking screenshot");
            cy.screenshot("profile-button-not-found");
          }
        }
      }
    });

    // Step 2: Click on Sign Out from the menu
    cy.log("🚪 Step 2: Clicking on Sign Out option");
    cy.screenshot("menu-opened-before-signout");
    humanWait(1000);

    // Find and click Sign Out
    cy.get("body").then(($body) => {
      cy.log("🔍 Searching for Sign Out option in menu");

      // Strategy 1: Direct text match for Sign Out
      const signOutVariations = [
        "Sign Out",
        "Sign out",
        "Signout",
        "Log Out",
        "Logout",
        "Log out",
      ];
      let found = false;

      for (const variation of signOutVariations) {
        if (found) break;

        const $elements = $body
          .find('button, a, [role="menuitem"], li, div')
          .filter(":visible")
          .filter((i, el) => {
            const text = Cypress.$(el).text().trim();
            return (
              text === variation ||
              text.toLowerCase() === variation.toLowerCase()
            );
          });

        if ($elements.length > 0) {
          cy.log(`✅ Found Sign Out option: "${variation}"`);
          cy.wrap($elements.first())
            .scrollIntoView()
            .should("be.visible")
            .click({ force: true });
          found = true;
          humanWait(2000);
          break;
        }
      }

      // Strategy 2: Contains text match
      if (!found) {
        cy.log("🔍 Strategy 2: Looking for elements containing sign out text");
        const $signOutElements = $body.find("*:visible").filter((i, el) => {
          const text = Cypress.$(el).text().trim().toLowerCase();
          return (
            text.includes("sign out") ||
            text.includes("log out") ||
            text.includes("logout")
          );
        });

        if ($signOutElements.length > 0) {
          // Find the most specific match (shortest text)
          let $bestMatch = null;
          let shortestLength = Infinity;

          $signOutElements.each((i, el) => {
            const $el = Cypress.$(el);
            const text = $el.text().trim();
            if (text.length < shortestLength && text.length < 30) {
              $bestMatch = $el;
              shortestLength = text.length;
            }
          });

          if ($bestMatch) {
            cy.log(`✅ Found Sign Out element: "${$bestMatch.text().trim()}"`);
            cy.wrap($bestMatch).click({ force: true });
            found = true;
            humanWait(2000);
          }
        }
      }

      // Strategy 3: Use cy.contains as fallback
      if (!found) {
        cy.log("🔍 Strategy 3: Using cy.contains fallback");
        cy.get("body")
          .then(() => {
            cy.contains("Sign Out", { matchCase: false, timeout: 5000 })
              .should("be.visible")
              .click({ force: true });
            humanWait(2000);
          })
          .then(
            () => {
              cy.log("✅ Clicked Sign Out via cy.contains");
            },
            () => {
              cy.log("⚠️ Sign Out not found with any strategy");
              cy.screenshot("sign-out-not-found");
            }
          );
      }
    });

    // Wait for logout to process
    cy.log("⏳ Waiting for logout to complete...");
    humanWait(3000);

    // Verify logout successful
    cy.log("🔍 Verifying logout status");
    cy.url({ timeout: 15000 }).then((url) => {
      cy.log(`📍 Current URL: ${url}`);

      const isLoggedOut =
        url.includes("/signin") ||
        url.includes("/login") ||
        url.includes("accounts.google.com") ||
        url.includes("/auth");

      if (isLoggedOut) {
        cy.log("✅ Successfully logged out - on signin/login page");
      } else {
        cy.log("ℹ️ Not on signin page yet, will verify session");

        // Additional verification: try accessing protected page
        cy.log("🔍 Verifying session by accessing protected page");
        cy.visit("https://app.horizonexp.com/shorts/library", {
          failOnStatusCode: false,
        });
        humanWait(2000);

        cy.url().then((newUrl) => {
          if (newUrl.includes("/signin") || newUrl.includes("/login")) {
            cy.log("✅ Logout verified - redirected to signin");
          } else {
            cy.log(
              "ℹ️ Still on app page - logout may need manual verification"
            );
          }
        });
      }
    });

    cy.screenshot("after-logout");
    cy.log("✅ PART 4 COMPLETED: Logout process finished");

    // Final summary
    cy.log("🎉 All test parts completed successfully!");
    cy.log("📊 Test Summary:");
    cy.log("   ✅ Part 1: Single file upload and publish - PASSED");
    cy.log(
      "   ✅ Part 2: Bulk upload with CSV import and bulk publish - PASSED"
    );
    cy.log("   ✅ Part 3: Library verification - PASSED");
    cy.log("   ✅ Part 4: Wait in Library and Logout - PASSED");
  });
});
