describe("Merged Test: Single Upload & Channel Edit", () => {
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

    it("uploads single file, publishes it, then creates and edits a channel", () => {
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
        // ============================================
        // PART 2: CHANNEL CREATION AND EDIT
        // ============================================
        cy.log("🎬 PART 2: Starting Channel Creation and Edit workflow");
        humanWait(3000);
        // Generate a unique channel name for this test run
        const channelName = `Channel-${Date.now()}`;
        const updatedTitle = "Channel Test";
        const updatedDescription = "Updated Description";

        // Login is handled in beforeEach

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
            .type(channelName, { delay: testConfig.humanTypeDelay })
            .should("have.value", channelName);
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
        cy.log(`🔍 Locating '${channelName}' and opening menu`);
        humanWait(3000); // Wait for list to refresh as per user instruction

        // Find the channel name, then traverse up to the row (closest container with a button), then find the menu button
        cy.contains(channelName)
            .parentsUntil("body")
            .filter((i, el) => Cypress.$(el).find("button").length > 0)
            .first()
            .find("button")
            .last()
            .click({ force: true });

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
            .type(updatedTitle, { delay: testConfig.humanTypeDelay })
            .should("have.value", updatedTitle);
        humanWait(1000);

        // Update Description
        cy.log("📝 Updating Description");
        cy.get('textarea[placeholder*="channel description"]')
            .clear()
            .type(updatedDescription, { delay: testConfig.humanTypeDelay })
            .should("have.value", updatedDescription);
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
        cy.log(`🔍 Locating '${updatedTitle}' and opening menu to disable`);
        cy.contains(updatedTitle)
            .parentsUntil("body")
            .filter((i, el) => Cypress.$(el).find("button").length > 0)
            .first()
            .find("button")
            .last()
            .click({ force: true });
        humanWait(1000);

        // Click Disable button (assuming button text 'Disable')
        cy.contains("Disable channel").should("be.visible").click();
        humanWait(2000);
        // Confirm disable in popup
        cy.contains("Yes, disable").should("be.visible").click();
        humanWait(1000);
        // Refresh after disabling
        cy.reload();
        humanWait(2000);
        cy.log("✅ Channel disabled and page refreshed");
    });
});
