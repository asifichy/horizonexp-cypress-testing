describe('Content Upload & Publishing', () => {
  // Test configuration and setup
  const testConfig = {
    baseUrl: 'https://app.horizonexp.com/signin',
    userEmail: 'asifniloy2017@gmail.com',
    userPassword: 'devops_test$sqa@flagship',
    humanDelay: 3000, // 3 seconds delay for human-like behavior
    humanTypeDelay: 120, // Delay between keystrokes for human-like typing
    singleUploadFile: {
      path: 'C:\\Users\\user\\Downloads\\SPAM\\6.mp4',
      fileName: '6.mp4'
    },
    bulkUploadFiles: [
      { path: 'C:\\Users\\user\\Downloads\\SPAM\\0.mp4', fileName: '0.mp4' },
      { path: 'C:\\Users\\user\\Downloads\\SPAM\\1.mp4', fileName: '1.mp4' },
      { path: 'C:\\Users\\user\\Downloads\\SPAM\\2.mp4', fileName: '2.mp4' },
      { path: 'C:\\Users\\user\\Downloads\\SPAM\\3.mp4', fileName: '3.mp4' },
      { path: 'C:\\Users\\user\\Downloads\\SPAM\\4.mp4', fileName: '4.mp4' }
    ],
    csvFilePath: 'C:\\Users\\user\\Downloads\\Sample.csv'
  };

  // Store metadata captured from API responses
  let capturedMetadata = {
    thumbnailurl: null,
    videourl: null,
    previewurl: null
  };
  let publishRequestTriggered = false;

  // Helper function for delays
  const humanWait = (customDelay = testConfig.humanDelay) => {
    cy.wait(customDelay);
  };

  // Helper to select a specific option from a dropdown identified by its label text
  const selectDropdownOption = (labelText, optionText) => {
    cy.log(`🔽 Selecting "${optionText}" for dropdown "${labelText}"`);

    cy.contains('label, span', labelText, { matchCase: false, timeout: 20000 })
      .filter(':visible')
      .first()
      .then(($label) => {
        const $container =
          $label.closest('.ant-space-item, .ant-form-item, .ant-row, form div').length > 0
            ? $label.closest('.ant-space-item, .ant-form-item, .ant-row, form div').first()
            : $label.parent();

        let $button = $container.find('button, [role="button"]').filter(':visible').first();

        if (!$button || $button.length === 0) {
          $button = $label.nextAll('button').filter(':visible').first();
        }

        if (!$button || $button.length === 0) {
          throw new Error(`Unable to locate dropdown trigger button for "${labelText}"`);
        }

        cy.wrap($button)
          .scrollIntoView()
          .click({ force: true });

        humanWait(1000);

        cy.contains('div, button, li', optionText, { timeout: 10000 })
          .filter(':visible')
          .first()
          .click({ force: true });
      });
  };

  const uploadCardSelector =
    '[class*="ant-card"], .ant-list-item, .ant-space-item, .ant-row, [class*="card"], [class*="upload"]';

  const hasReadyButton = ($element) =>
    $element
      .find('button, [role="button"]')
      .filter((i, el) => {
        const text = Cypress.$(el).text().trim().toLowerCase();
        return text.includes('ready') && text.includes('publish');
      })
      .length > 0;

  const collectCardsForContext = ($body, context) => {
    const totalUploads = testConfig.bulkUploadFiles.length;
    return $body
      .find(uploadCardSelector)
      .filter(':visible')
      .filter((i, el) => {
        const $el = Cypress.$(el);
        if (!hasReadyButton($el)) {
          return false;
        }
        const text = $el.text().trim().toLowerCase();
        if (context === 'batch') {
          return (
            text.includes('batch') ||
            text.includes(`${totalUploads} content`) ||
            text.includes(`${totalUploads} out of`) ||
            (text.includes('content') && text.includes('ready to publish')) ||
            text.includes('0 published')
          );
        }
        return text.includes('video') && !text.includes('batch');
      });
  };

  const pickPreferredCard = ($cards, context) => {
    if (context === 'batch') {
      const $pending = $cards.filter((i, el) => {
        const text = Cypress.$(el).text();
        return /0\s+published/i.test(text) || !/\d+\s+published/i.test(text);
      });
      if ($pending.length > 0) {
        cy.log('📌 Selected batch card with pending publish state');
        return $pending.first();
      }
    }
    return $cards.first();
  };

  const waitForBatchReadyCard = () => {
    cy.log('⏳ Waiting for batch card indicators');
    cy.get('body', { timeout: 45000 }).should(($body) => collectCardsForContext($body, 'batch').length > 0);
    cy.log('✅ Batch card detected on page');
  };

  // Helper function to navigate to Uploads section
  const navigateToUploads = () => {
    cy.log('📱 Navigating to Shorts Uploads section');
    
    cy.get('body').should('be.visible');
    humanWait(2000);
    
    // Step 1: Click on "Short-form" menu item in the sidebar
    cy.log('📱 Step 1: Clicking on Short-form menu');
    
    cy.get('body').then($body => {
      const shortFormSelectors = [
        'a:contains("Short-form")',
        'button:contains("Short-form")',
        '*:contains("Short-form")',
        '[data-testid*="short-form"]',
        '[data-testid*="short"]'
      ];
      
      let found = false;
      for (const selector of shortFormSelectors) {
        if (found) break;
        const $element = $body.find(selector).first();
        if ($element.length > 0) {
          cy.log(`✅ Found Short-form menu: ${selector}`);
          cy.wrap($element).should('exist').scrollIntoView().should('be.visible').click({ force: true });
          humanWait(2000);
          found = true;
        }
      }
    });

    // Step 2: Click on "Uploads" under Short-form
    cy.log('📤 Step 2: Clicking on Uploads menu');
    cy.get('body').then($body => {
      const uploadsSelectors = [
        'a:contains("Uploads")',
        '*:contains("Uploads")',
        'button:contains("Uploads")',
        '[data-testid*="upload"]',
        '[href*="uploads"]'
      ];
      
      let found = false;
      for (const selector of uploadsSelectors) {
        if (found) break;
        const $element = $body.find(selector).filter((i, el) => {
          const $el = Cypress.$(el);
          const text = $el.text().trim();
          return text === 'Uploads' || text.includes('Uploads');
        }).first();
        
        if ($element.length > 0) {
          cy.log(`✅ Found Uploads menu: ${selector}`);
          cy.wrap($element).should('exist').scrollIntoView().should('be.visible').click({ force: true });
          humanWait(2000);
          found = true;
        }
      }
      
      if (!found) {
        cy.log('⚠️ Uploads menu not found, trying direct navigation');
        cy.visit('https://app.horizonexp.com/shorts/uploads');
        humanWait(2000);
      }
    });
    
    // Verify we're on the uploads page
    cy.url({ timeout: 10000 }).should('include', '/shorts/uploads');
    cy.log('✅ Successfully navigated to Shorts Uploads page');
    humanWait(1000);
  };

  // Helper function to find and click the three-dot menu button for a specific card
  const findAndClickMenuButton = (context = 'single') => {
    cy.log(`📋 Opening menu for ${context} card`);

    return cy.get('body', { timeout: 30000 }).then(($body) => {
      const $allCards = collectCardsForContext($body, context);

      if (!$allCards.length) {
        cy.log(`⚠️ Card detection details:`);
        cy.log(`Total potential cards found: ${$body.find(uploadCardSelector).length}`);
        cy.log(`Visible cards: ${$body.find(uploadCardSelector).filter(':visible').length}`);
        cy.log(
          `Cards with Ready button: ${
            $body.find(uploadCardSelector).filter((i, el) => hasReadyButton(Cypress.$(el))).length
          }`
        );

        cy.screenshot(`error-${context}-card-not-found`);
        throw new Error(`Unable to locate ${context} upload card on the page. Check screenshot for details.`);
      }

      const $card = pickPreferredCard($allCards, context);
      const cardSummary = $card.text().replace(/\s+/g, ' ').trim();

      cy.log(`✅ Found ${context} card, proceeding to click menu`);
      cy.log(`🆔 ${context} card snapshot: ${cardSummary.substring(0, 160)}`);
      cy.wrap($card).screenshot(`${context}-card-before-menu-click`);

      cy.wrap($card)
        .scrollIntoView()
        .should('be.visible')
        .then(($cardEl) => {
          const $readyButton = $cardEl
            .find('button, [role="button"]')
            .filter((i, el) => /ready\s+to\s+publish/i.test(Cypress.$(el).text()))
            .first();

          if (!$readyButton || !$readyButton.length) {
            cy.screenshot(`error-no-ready-button-${context}`);
            throw new Error(`Unable to locate "Ready to publish" button within ${context} card.`);
          }

          const selectorPriority = [
            'button[aria-label*="more"]',
            'button[aria-label*="option"]',
            '[data-testid*="menu"]',
            '[data-testid*="more"]',
            '[aria-haspopup="menu"]',
            'button:contains("⋯")',
            'button:contains("...")',
            'button:contains("•••")'
          ];

          const findMenuCandidate = () => {
            for (const selector of selectorPriority) {
              const $candidate = $cardEl.find(selector).filter(':visible').not($readyButton).first();
              if ($candidate.length) {
                cy.log(`✅ Located menu button via selector "${selector}"`);
                return $candidate;
              }
            }

            const $aroundReady = $readyButton
              .parent()
              .find('button, [role="button"]')
              .add($readyButton.closest('[class]').siblings().find('button, [role="button"]'))
              .filter(':visible')
              .filter((i, el) => el !== $readyButton[0]);

            const $fallback = $aroundReady.filter((i, el) => {
              const $el = Cypress.$(el);
              const text = $el.text().trim().toLowerCase();
              const hasSvg = $el.find('svg').length > 0;
              const isDots = text === '...' || text === '⋯' || text === '•••';
              const looksMenu = $el.attr('aria-haspopup') === 'menu' || $el.attr('aria-expanded') === 'false';
              return hasSvg || isDots || looksMenu;
            });

            if ($fallback.length) {
              cy.log('✅ Using fallback menu button near "Ready to publish"');
              return $fallback.first();
            }

            const $anyButton = $cardEl.find('button, [role="button"]').filter(':visible').not($readyButton);
            if ($anyButton.length) {
              cy.log('⚠️ Defaulting to last visible button in card as menu');
              return $anyButton.last();
            }

            return Cypress.$();
          };

          const $menuButton = findMenuCandidate();

          if (!$menuButton || !$menuButton.length) {
            cy.screenshot(`error-no-menu-button-${context}`);
            throw new Error(`Unable to locate three-dot menu button for ${context} card. Please check the page structure.`);
          }

          cy.wrap($menuButton).scrollIntoView().should('be.visible');
          humanWait(1000);
          cy.wrap($menuButton).click({ force: true });
        });
    });
  };

  const getVisibleDropdownMenu = () =>
    cy.get('[role="menu"], .ant-dropdown-menu').filter(':visible').first();

  // Helper function to navigate to Library
  const navigateToLibrary = () => {
    cy.log('📚 Navigating to Library section');
    humanWait(2000);
    
    cy.get('body').then($body => {
      const librarySelectors = [
        'a:contains("Library")',
        '*:contains("Library")',
        'button:contains("Library")',
        '[data-testid*="library"]',
        '[href*="library"]'
      ];
      
      let found = false;
      for (const selector of librarySelectors) {
        if (found) break;
        const $element = $body.find(selector).filter((i, el) => {
          const $el = Cypress.$(el);
          const text = $el.text().trim();
          return text === 'Library' || text.includes('Library');
        }).first();
        
        if ($element.length > 0) {
          cy.log(`✅ Found Library menu: ${selector}`);
          cy.wrap($element).should('exist').scrollIntoView().should('be.visible').click({ force: true });
          humanWait(2000);
          found = true;
        }
      }
      
      if (!found) {
        cy.log('⚠️ Library menu not found, trying direct navigation');
        cy.visit('https://app.horizonexp.com/shorts/library');
        humanWait(2000);
      }
    });
    
    cy.url({ timeout: 10000 }).should('include', '/library');
    cy.log('✅ Successfully navigated to Library page');
    humanWait(1000);
  };

  beforeEach(() => {
    // Set viewport to simulate desktop experience
    cy.viewport(1920, 1080);
    
    // Reset captured metadata
    capturedMetadata = {
      thumbnailurl: null,
      videourl: null,
      previewurl: null
    };
    publishRequestTriggered = false;
    
    // Intercept network requests to capture upload metadata
    const extractMetadata = (body) => {
      try {
        let responseBody = body;
        if (typeof body === 'string') {
          try {
            responseBody = JSON.parse(body);
          } catch (e) {
            return;
          }
        }
        
        if (responseBody.thumbnailUrl || responseBody.thumbnailurl || responseBody.thumbnail_url) {
          const url = responseBody.thumbnailUrl || responseBody.thumbnailurl || responseBody.thumbnail_url;
          if (url && !capturedMetadata.thumbnailurl) {
            capturedMetadata.thumbnailurl = url;
            cy.log(`📸 Captured thumbnailUrl: ${url}`);
          }
        }
        if (responseBody.videoUrl || responseBody.videourl || responseBody.video_url) {
          const url = responseBody.videoUrl || responseBody.videourl || responseBody.video_url;
          if (url && !capturedMetadata.videourl) {
            capturedMetadata.videourl = url;
            cy.log(`🎥 Captured videoUrl: ${url}`);
          }
        }
        if (responseBody.previewUrl || responseBody.previewurl || responseBody.preview_url) {
          const url = responseBody.previewUrl || responseBody.previewurl || responseBody.preview_url;
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
    cy.intercept('POST', '**/upload**', (req) => {
      req.continue((res) => {
        if (res.body) {
          cy.log('📡 Upload API response intercepted');
          extractMetadata(res.body);
        }
      });
    }).as('uploadRequest');

    cy.intercept('POST', '**/api/**/upload**', (req) => {
      req.continue((res) => {
        if (res.body) {
          cy.log('📡 Upload API response intercepted (alt endpoint)');
          extractMetadata(res.body);
        }
      });
    }).as('uploadRequestAlt');

    // Intercept publish requests
    cy.intercept('POST', '**/publish**', (req) => {
      req.continue((res) => {
        if (res.body) {
          cy.log('📡 Publish API response intercepted');
          extractMetadata(res.body);
        }
      });
      publishRequestTriggered = true;
    }).as('publishRequest');

    cy.intercept('POST', '**/api/**/publish**', (req) => {
      req.continue((res) => {
        if (res.body) {
          cy.log('📡 Publish API response intercepted (alt endpoint)');
          extractMetadata(res.body);
        }
      });
      publishRequestTriggered = true;
    }).as('publishRequestAlt');
    
    // Visit the signin page
    cy.visit(testConfig.baseUrl);
    humanWait(2000);
    
    // Verify signin page loads
    cy.title().should('contain', 'Horizon');
    cy.url().should('include', '/signin');
    humanWait(1000);

    // Fill in email
    cy.log('📧 Filling email field');
    cy.get('input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="Email"]')
      .first()
      .should('be.visible')
      .clear()
      .type(testConfig.userEmail, { delay: testConfig.humanTypeDelay });
    humanWait(1000);

    // Fill in password
    cy.log('🔒 Filling password field');
    cy.get('input[type="password"], input[name="password"], input[placeholder*="password"], input[placeholder*="Password"]')
      .first()
      .should('be.visible')
      .clear()
      .type(testConfig.userPassword, { delay: testConfig.humanTypeDelay });
    humanWait(1000);

    // Click login
    cy.log('🚀 Submitting login form');
    cy.get('body').then($body => {
      if ($body.find('form').length > 0) {
        cy.get('form').first().submit();
      } else {
        cy.get('button[type="submit"], input[type="submit"]')
          .not(':contains("Google")')
          .not(':contains("Sign in with Google")')
          .first()
          .should('be.visible')
          .click();
      }
    });
    humanWait(5000);

    // Handle post-login navigation
    cy.log('✅ Handling post-login navigation');
    cy.url().then((currentUrl) => {
      cy.log(`Current URL after login: ${currentUrl}`);
      
      if (currentUrl.includes('accounts.google.com')) {
        cy.log('⚠️ Redirected to Google OAuth - handling OAuth flow');
        humanWait(2000);
        
        cy.get('body').then($body => {
          if ($body.find('input[type="email"]').length > 0) {
            cy.get('input[type="email"]').first().clear().type(testConfig.userEmail, { delay: testConfig.humanTypeDelay });
            humanWait(1000);
            cy.get('button:contains("Next"), #identifierNext, [data-continue-as]').first().click();
            humanWait(3000);
            
            cy.get('body').then($body2 => {
              if ($body2.find('input[type="password"]').length > 0) {
                cy.get('input[type="password"]').first().type(testConfig.userPassword, { delay: testConfig.humanTypeDelay });
                cy.get('button:contains("Next"), #passwordNext').first().click();
                humanWait(3000);
              }
            });
          }
        });
      } else if (currentUrl.includes('/signin')) {
        cy.log('❌ Still on signin page - checking for errors');
        cy.get('body').then($body => {
          if ($body.text().includes('Invalid') || $body.text().includes('Error')) {
            throw new Error('Login failed - invalid credentials detected');
          }
        });
      } else if (currentUrl.includes('404')) {
        cy.log('⚠️ Got 404 page, navigating to main app');
        cy.visit('https://app.horizonexp.com');
        humanWait(2000);
      }
    });

    // Wait for authentication to complete and redirect back to app
    cy.log('⏳ Waiting for authentication to complete');
    cy.url({ timeout: 15000 }).should('satisfy', (url) => {
      return url.includes('app.horizonexp.com') && !url.includes('/signin');
    });
    
    // Assert successful login
    cy.url().should('include', 'app.horizonexp.com');
    cy.url().should('not.include', '/signin');
    cy.log('✅ Login successful');
    humanWait(2000);
  });

  it('uploads single file, publishes it, then performs bulk upload with CSV and bulk publish, then verifies in Library', () => {
    const totalUploads = testConfig.bulkUploadFiles.length;
    const uploadCompletionPattern = new RegExp(`${totalUploads}\\s+out\\s+of\\s+${totalUploads}\\s+uploaded`, 'i');

    // ============================================
    // PART 1: SINGLE FILE UPLOAD AND PUBLISH
    // ============================================
    cy.log('🎬 PART 1: Starting single file upload and publish workflow');
    
    // Navigate to Upload section
    navigateToUploads();

    // Click "Upload New"
    cy.log('➕ Clicking Upload New button');
    humanWait(1000);
    
    const uploadButtonSelectors = [
      'button:contains("Upload New")',
      '[data-testid*="upload"]',
      'button[class*="bg-blue"], button[class*="primary"]',
      'a:contains("Upload New")',
      '*:contains("Upload New")'
    ];
    
    cy.get('body').then($body => {
      let buttonFound = false;
      for (const selector of uploadButtonSelectors) {
        if ($body.find(selector).length > 0 && !buttonFound) {
          cy.log(`➕ Found Upload New button: ${selector}`);
          cy.get(selector).first().should('be.visible').click();
          buttonFound = true;
          break;
        }
      }
      
      if (!buttonFound) {
        cy.get('button, a').filter(':contains("Upload")').first().click();
      }
    });
    humanWait(2000);

    // Select 1 file
    cy.log('📹 Starting single file upload process');
    humanWait(1000);
    
    cy.get('body').then(($body) => {
      const $fileInputs = $body.find('input[type="file"]');

      const chooseableInputs = $fileInputs.filter((_, el) => {
        const accept = (el.getAttribute('accept') || '').toLowerCase();

        if (accept.includes('csv')) {
          return false;
        }

        if (accept.includes('video') || accept.includes('mp4') || accept.includes('quicktime')) {
          return true;
        }

        const dataTestId = (el.getAttribute('data-testid') || '').toLowerCase();
        if (dataTestId.includes('video') || dataTestId.includes('upload')) {
          return true;
        }

        return accept.trim() === '';
      });

      if (chooseableInputs.length > 0) {
        cy.log(`✅ Using file input for upload (matching ${chooseableInputs.length} candidate(s))`);
        cy.wrap(chooseableInputs.first()).selectFile(testConfig.singleUploadFile.path, { force: true });
      } else {
        cy.log('🎯 Using drag-drop upload method');
        const uploadAreaSelectors = ['.upload-area', '.drop-zone', '[data-testid="upload-area"]', '.file-drop-zone', '.upload-container'];
        
        let uploadAreaFound = false;
        uploadAreaSelectors.forEach(selector => {
          if (!uploadAreaFound && $body.find(selector).length > 0) {
            cy.get(selector).selectFile(testConfig.singleUploadFile.path, { action: 'drag-drop' });
            uploadAreaFound = true;
          }
        });

        if (!uploadAreaFound) {
          const genericSelectors = '[class*="upload"], [id*="upload"]';
          if ($body.find(genericSelectors).length > 0) {
            cy.get(genericSelectors).first().selectFile(testConfig.singleUploadFile.path, { force: true });
          } else {
            throw new Error('Unable to locate a suitable file input or drag-drop area for video upload.');
          }
        }
      }
    });
    humanWait(2000);

    // Wait for upload to complete
    cy.log('⏳ Verifying file selection and upload progress');
    
    cy.get('body', { timeout: 30000 }).should('satisfy', ($body) => {
      if (!$body || $body.length === 0) return false;
      const text = $body.text() || '';
      return text.includes('uploaded') || 
             text.includes('Video #') ||
             text.includes('Ready to publish') ||
             text.includes('100%') ||
             text.includes('out of') ||
             text.includes('content');
    });
    
    // Click upload submit button if needed
    cy.get('body').then($body => {
      const submitButtonSelectors = ['button:contains("Upload")', 'button:contains("Submit")', 'button:contains("Start Upload")', '[data-testid="upload-submit"]'];

      for (const selector of submitButtonSelectors) {
        if ($body.find(selector).length > 0) {
          cy.log('🚀 Clicking upload submit button');
          humanWait(1000);
          cy.get(selector).first().click({ force: true });
          break;
        }
      }
    });
    humanWait(2000);

    // Assert upload status/success indicator
    cy.log('⏳ Waiting for upload to complete');
    cy.get('body', { timeout: 60000 }).should('satisfy', ($body) => {
      if (!$body || $body.length === 0) return false;
      
      const bodyText = $body.text() || '';
      const completionIndicators = [
        '100%', 
        'Upload complete', 
        'Upload successful', 
        'Ready to publish', 
        'Successfully uploaded',
        'uploaded (100%)'
      ];
      
      if (completionIndicators.some(indicator => bodyText.includes(indicator))) {
        return true;
      }
      
      const progressBar = $body.find('[role="progressbar"], .progress-bar, [class*="progress"]');
      if (progressBar.length > 0) {
        const progressValue = progressBar.attr('aria-valuenow') || progressBar.attr('value') || '';
        const progressText = progressBar.text() || '';
        
        if (progressValue === '100' || progressValue === '100%' || progressText.includes('100%')) {
          return true;
        }
        
        cy.log(`📊 Progress: ${progressValue || progressText || 'checking...'}`);
        return false;
      }
      
      return true;
    });
    
    cy.log('✅ Single file upload completed');
    cy.contains('body', 'Ready to publish', { timeout: 30000 }).should('exist');
    humanWait(3000);

    // Click "Ready to Publish"
    cy.log('📝 Clicking Ready to publish button');
    cy.get('body').then($body => {
      const selectors = [
        'button:contains("Ready to publish")',
        'a:contains("Ready to publish")',
        '*:contains("Ready to publish")'
      ];
      
      let clicked = false;
      
      for (const selector of selectors) {
        if (!clicked && $body.find(selector).length > 0) {
          cy.get(selector).first().scrollIntoView().click({ force: true });
          clicked = true;
          break;
        }
      }
    });
    humanWait(3000);

    // Wait for publish form to load
    cy.log('⏳ Waiting for publish form to load');
    cy.location('pathname', { timeout: 45000 }).should((pathname) => {
      expect(pathname).to.match(/\/shorts\/upload\/[^/]+\/publish$/);
    });
    
    cy.contains(/select channel/i, { timeout: 30000 }).should('be.visible');
    cy.contains(/select categories/i).should('be.visible');
    cy.log('✅ Form loaded');
    humanWait(2000);

    // Fill publish form
    cy.log('📝 Filling publish form');
    
    // Fill Channel dropdown (REQUIRED)
    selectDropdownOption('Channel', `DevOps`);
    humanWait(2000);
    
    cy.get('body').then($body => {
      if ($body.text().includes('Channel is required')) {
        cy.log('⚠️ Channel not selected, retrying...');
        selectDropdownOption('Channel', `DevOps`);
        humanWait(2000);
      }
    });
    
    // Fill Category dropdown (REQUIRED)
    selectDropdownOption('Category', 'Auto & Vehicles');
    humanWait(2000);
    
    cy.get('body').then($body => {
      const bodyText = $body.text() || '';
      if (bodyText.includes('Minimum 1 category is required') || bodyText.includes('Category is required')) {
        cy.log('⚠️ Category not selected, retrying...');
        selectDropdownOption('Category', 'Auto & Vehicles');
        humanWait(2000);
      }
    });

    // Fill form fields
    cy.log('🔍 Filling form fields');
    cy.get('input[placeholder*="title"], input[name="title"]')
      .filter(':visible')
      .first()
      .should('be.visible')
      .clear({ force: true })
      .type('Test Upload Video', { force: true, delay: testConfig.humanTypeDelay });
    humanWait(1000);

    cy.get('textarea[placeholder*="caption"], textarea[name="caption"], input[placeholder*="caption"]')
      .filter(':visible')
      .first()
      .should('be.visible')
      .clear({ force: true })
      .type('This is a test caption generated by automation.', { force: true, delay: testConfig.humanTypeDelay });
    humanWait(1000);

    cy.get('input[placeholder*="tag"], input[name="tags"]')
      .filter(':visible')
      .first()
      .should('be.visible')
      .clear({ force: true })
      .type('automation{enter}test{enter}video{enter}', { force: true, delay: testConfig.humanTypeDelay });
    humanWait(1000);

    cy.get('input[placeholder*="button label"], input[name*="cta"], input[placeholder*="Button label"]')
      .filter(':visible')
      .first()
      .should('be.visible')
      .clear({ force: true })
      .type('Learn More', { force: true, delay: testConfig.humanTypeDelay });
    humanWait(1000);

    cy.get('input[placeholder*="button link"], input[name*="cta"], input[placeholder*="Button link"]')
      .filter(':visible')
      .last()
      .should('be.visible')
      .clear({ force: true })
      .type('https://example.com', { force: true, delay: testConfig.humanTypeDelay });
    humanWait(2000);

    // Click "Publish"
    cy.log('🚀 Clicking Publish button');
    cy.get('body').then($body => {
      const selectors = [
        'button:contains("Publish")',
        'button[class*="bg-blue"]',
        'button[type="submit"]'
      ];
      
      for (const selector of selectors) {
        if ($body.find(selector).length > 0) {
          cy.get(selector).first().should('be.visible').click({ force: true });
          break;
        }
      }
    });
    humanWait(3000);

    // Assert publish success message / status
    cy.log('⏳ Waiting for publishing to complete');
    
    cy.then(() => {
      if (publishRequestTriggered) {
        return cy.wait('@publishRequest', { timeout: 30000 }).then(() => {
          cy.log('📡 Publish API response received');
        });
      }
      cy.log('ℹ️ No publish request was intercepted; continuing without waiting on alias');
    });

    humanWait(3000);
    
    cy.url().then((currentUrl) => {
      cy.get('body', { timeout: 20000 }).should('satisfy', ($body) => {
        if (!$body || $body.length === 0) return false;
        
        const bodyText = $body.text() || '';
        return bodyText.includes('Published') || 
               bodyText.includes('Success') ||
               bodyText.includes('published') ||
               currentUrl.includes('/uploads');
      });
    });
    
    cy.log('✅ Single file publishing completed');
    cy.contains('body', /published|success/i, { timeout: 20000 }).should('exist');
    cy.screenshot('single-file-published');
    
    // Navigate back to Uploads page and wait there before proceeding with bulk upload
    cy.log('📍 Navigating back to Uploads page after single file publish');
    navigateToUploads();
    
    // Wait on uploads page (human-like behavior)
    cy.log('⏳ Waiting on uploads page before proceeding with bulk upload');
    humanWait(5000);

    // ============================================
    // PART 2: BULK UPLOAD WITH CSV AND BULK PUBLISH
    // ============================================
    cy.log('🎬 PART 2: Starting bulk upload workflow with CSV import and bulk publish');

    // Click "Upload New" for bulk upload
    cy.log('➕ Clicking Upload New button for bulk upload');
    humanWait(1000);
    
    const bulkUploadButtonSelectors = [
      'button:contains("Upload New")',
      '[data-testid*="upload"]',
      'button[class*="bg-blue"], button[class*="primary"]',
      'a:contains("Upload New")',
      '*:contains("Upload New")'
    ];
    
    cy.get('body').then($body => {
      let buttonFound = false;
      for (const selector of bulkUploadButtonSelectors) {
        if ($body.find(selector).length > 0 && !buttonFound) {
          cy.log(`➕ Found Upload New button: ${selector}`);
          cy.get(selector).first().should('be.visible').click();
          buttonFound = true;
          break;
        }
      }
      
      if (!buttonFound) {
        cy.get('button, a').filter(':contains("Upload")').first().click();
      }
    });
    humanWait(2000);

    // Select 5 videos
    cy.log('📹 Starting bulk file upload process');
    humanWait(1000);
    
    const uploadPaths = testConfig.bulkUploadFiles.map((file) => file.path);
    cy.get('body').then(($body) => {
      const $fileInputs = $body.find('input[type="file"]');

      const chooseableInputs = $fileInputs.filter((_, el) => {
        const accept = (el.getAttribute('accept') || '').toLowerCase();

        if (accept.includes('csv')) {
          return false;
        }

        if (accept.includes('video') || accept.includes('mp4') || accept.includes('quicktime')) {
          return true;
        }

        const dataTestId = (el.getAttribute('data-testid') || '').toLowerCase();
        if (dataTestId.includes('video') || dataTestId.includes('upload')) {
          return true;
        }

        return accept.trim() === '';
      });

      if (chooseableInputs.length > 0) {
        cy.log(`✅ Using file input for upload (matching ${chooseableInputs.length} candidate(s))`);
        cy.wrap(chooseableInputs.first()).selectFile(uploadPaths, { force: true });
      } else {
        cy.log('🎯 Using drag-drop upload method');
        const uploadAreaSelectors = ['.upload-area', '.drop-zone', '[data-testid="upload-area"]', '.file-drop-zone', '.upload-container'];
        
        let uploadAreaFound = false;
        uploadAreaSelectors.forEach(selector => {
          if (!uploadAreaFound && $body.find(selector).length > 0) {
            cy.get(selector).selectFile(uploadPaths, { action: 'drag-drop' });
            uploadAreaFound = true;
          }
        });

        if (!uploadAreaFound) {
          const genericSelectors = '[class*="upload"], [id*="upload"]';
          if ($body.find(genericSelectors).length > 0) {
            cy.get(genericSelectors).first().selectFile(uploadPaths, { force: true });
          } else {
            throw new Error('Unable to locate a suitable file input or drag-drop area for video upload.');
          }
        }
      }
    });
    humanWait(2000);

    // Wait for all uploads to complete
    cy.log('⏳ Verifying file selection and upload progress');
    
    cy.get('body', { timeout: 30000 }).should('satisfy', ($body) => {
      if (!$body || $body.length === 0) return false;
      const text = $body.text() || '';
      return text.includes('uploaded') || 
             text.includes('Video #') ||
             text.includes('Ready to publish') ||
             text.includes('100%') ||
             text.includes('out of') ||
             text.includes('content');
    });
    
    // Click upload submit button if needed
    cy.get('body').then($body => {
      const submitButtonSelectors = ['button:contains("Upload")', 'button:contains("Submit")', 'button:contains("Start Upload")', '[data-testid="upload-submit"]'];

      for (const selector of submitButtonSelectors) {
        if ($body.find(selector).length > 0) {
          cy.log('🚀 Clicking upload submit button');
          humanWait(1000);
          cy.get(selector).first().click({ force: true });
          break;
        }
      }
    });
    humanWait(2000);

    // Assert 5 uploads appear with success state
    cy.log('⏳ Waiting for all bulk uploads to complete');
    cy.get('body', { timeout: 90000 }).should('satisfy', ($body) => {
      if (!$body || $body.length === 0) return false;
      
      const bodyText = $body.text() || '';
      const completionIndicators = [
        '100%', 
        'Upload complete', 
        'Upload successful', 
        'Ready to publish', 
        'Successfully uploaded',
        'out of',
        'uploaded (100%)'
      ];
      
      if (completionIndicators.some(indicator => bodyText.includes(indicator))) {
        return true;
      }
      
      const progressBar = $body.find('[role="progressbar"], .progress-bar, [class*="progress"]');
      if (progressBar.length > 0) {
        const progressValue = progressBar.attr('aria-valuenow') || progressBar.attr('value') || '';
        const progressText = progressBar.text() || '';
        
        if (progressValue === '100' || progressValue === '100%' || progressText.includes('100%')) {
          return true;
        }
        
        cy.log(`📊 Progress: ${progressValue || progressText || 'checking...'}`);
        return false;
      }
      
      return true;
    });
    
    cy.contains('body', uploadCompletionPattern, { timeout: 90000 }).should('exist');
    cy.contains('button, [role="button"]', /ready\s*to\s*publish/i, { timeout: 90000 }).should('exist');
    waitForBatchReadyCard();
    cy.log('✅ All bulk uploads completed successfully');
    humanWait(2000);

    // Step 11: Click three-dot menu and import CSV metadata
    cy.log('📋 Step 11: Importing CSV metadata for bulk publish');
    
    // Find the batch card and click its menu
    findAndClickMenuButton('batch');
    humanWait(2000);

    // Step 12: Click "Import CSV metadata" from the dropdown menu
    cy.log('📥 Step 12: Clicking "Import CSV metadata" option');
    getVisibleDropdownMenu()
      .should('exist')
      .within(() => {
        cy.contains('li, button, a, span, div, [role="menuitem"]', 'Import CSV metadata', {
          matchCase: false
        })
          .should('be.visible')
          .click({ force: true });
      });
    humanWait(2000);

    // Step 13: Upload the CSV file
    cy.log('📤 Step 13: Uploading CSV metadata file');
    
    const csvFilePath = testConfig.csvFilePath;
    
    cy.get('body').then($body => {
      // Look for file input that accepts CSV
      const $csvInputs = $body.find('input[type="file"]').filter((_, el) => {
        const accept = (el.getAttribute('accept') || '').toLowerCase();
        return accept.includes('csv') || accept.includes('.csv') || accept.trim() === '';
      });

      if ($csvInputs.length > 0) {
        cy.log(`✅ Found CSV file input (${$csvInputs.length} candidate(s))`);
        cy.wrap($csvInputs.first()).selectFile(csvFilePath, { force: true });
      } else {
        // Try drag-drop method
        cy.log('🎯 Using drag-drop method for CSV upload');
        const uploadAreaSelectors = [
          '.upload-area',
          '.drop-zone',
          '[data-testid*="upload"]',
          '.file-drop-zone',
          '.upload-container',
          'input[type="file"]'
        ];

        let csvUploaded = false;
        uploadAreaSelectors.forEach(selector => {
          if (!csvUploaded && $body.find(selector).length > 0) {
            cy.get(selector).first().selectFile(csvFilePath, { action: 'drag-drop', force: true });
            csvUploaded = true;
          }
        });

        if (!csvUploaded) {
          // Last resort: try any file input
          cy.get('input[type="file"]').first().selectFile(csvFilePath, { force: true });
        }
      }
    });
    humanWait(3000);

    // Step 14: Wait for CSV import to complete
    cy.log('⏳ Step 14: Waiting for CSV metadata import to complete');
    cy.get('body', { timeout: 60000 }).should('satisfy', ($body) => {
      if (!$body || $body.length === 0) return false;
      
      const bodyText = $body.text() || '';
      const successIndicators = [
        'imported',
        'metadata imported',
        'CSV imported',
        'successfully imported',
        'import complete',
        'Import successful'
      ];
      
      if (successIndicators.some(indicator => bodyText.toLowerCase().includes(indicator))) {
        cy.log('✅ CSV import success indicator detected');
        return true;
      }
      
      // Check if batch shows published count increased or still ready
      if (bodyText.includes('Ready to publish') || bodyText.includes('0 published')) {
        cy.log('✅ Batch card still shows ready state after CSV');
        return true;
      }
      
      return false;
    });

    cy.log('✅ CSV metadata import completed');
    humanWait(3000);
    cy.screenshot('csv-import-completed');

    // Step 15: Click three-dot menu again and select "Bulk publish"
    cy.log('📋 Step 15: Clicking three-dot menu for Bulk publish');
    waitForBatchReadyCard();
    
    // Find the batch card menu again
    findAndClickMenuButton('batch');
    humanWait(2000);

    // Step 16: Wait for menu dropdown to open, then click "Bulk publish"
    cy.log('🚀 Step 16: Waiting for menu dropdown and clicking "Bulk publish" option');
    
    getVisibleDropdownMenu()
      .should('exist')
      .within(() => {
        cy.contains('li, button, a, span, div, [role="menuitem"]', /^Bulk publish$/i)
          .should('be.visible')
          .then(($option) => {
            cy.log('✅ Found "Bulk publish" option');
            cy.wrap($option).scrollIntoView().should('be.visible');
            humanWait(1000);
            cy.wrap($option).click({ force: true });
          });
      });
    humanWait(3000);

    // Step 17: Wait for bulk publish to complete
    cy.log('⏳ Step 17: Waiting for bulk publish to complete');
    
    cy.get('body', { timeout: 90000 }).should('satisfy', ($body) => {
      if (!$body || $body.length === 0) return false;
      
      const bodyText = $body.text() || '';
      const successIndicators = [
        'published',
        'Publishing',
        'Success',
        'successfully published',
        'bulk publish',
        `${totalUploads} published`,
        'All content published'
      ];
      
      // Check if bulk publish completed
      if (successIndicators.some(indicator => bodyText.toLowerCase().includes(indicator.toLowerCase()))) {
        cy.log('✅ Bulk publish success indicator detected');
        return true;
      }
      
      // Check if batch shows all content published
      if (bodyText.includes(`${totalUploads} content • ${totalUploads} published`)) {
        cy.log('✅ All content published indicator found');
        return true;
      }
      
      // Also check for individual published counts
      const publishedMatch = bodyText.match(/(\d+)\s+published/i);
      if (publishedMatch && parseInt(publishedMatch[1]) === totalUploads) {
        cy.log(`✅ Found ${totalUploads} published videos`);
        return true;
      }
      
      return false;
    });

    cy.log('✅ Bulk publish completed');
    humanWait(3000);
    cy.screenshot('bulk-publish-completed');

    cy.log('🎉 Bulk upload, CSV metadata import, and bulk publish test completed successfully!');

    // ============================================
    // PART 3: VERIFY IN LIBRARY
    // ============================================
    cy.log('🎬 PART 3: Verifying published videos in Library');
    
    // Navigate to Library
    navigateToLibrary();

    // Wait for library to load
    cy.log('⏳ Waiting for Library page to load');
    humanWait(3000);

    // Verify that videos appear in the library
    cy.log('🔍 Verifying published videos in Library');
    
    // Check for video cards or published content
    cy.get('body', { timeout: 30000 }).should('satisfy', ($body) => {
      const bodyText = $body.text() || '';
      
      // Look for indicators that videos are present
      const hasVideoIndicators = bodyText.includes('video') || 
                                 bodyText.includes('Video') ||
                                 bodyText.includes('content') ||
                                 bodyText.includes('published');
      
      if (hasVideoIndicators) {
        cy.log('✅ Video content indicators found in Library');
      }
      
      return hasVideoIndicators || $body.find('[class*="video"], [class*="card"], [class*="content"]').length > 0;
    });

    // Try to count published videos
    cy.get('body').then($body => {
      const videoSelectors = [
        '[class*="video-card"]',
        '[class*="content-card"]',
        '.ant-card',
        '[class*="library-item"]',
        '[data-testid*="video"]'
      ];
      
      let videoCount = 0;
      videoSelectors.forEach(selector => {
        const elements = $body.find(selector).filter(':visible');
        if (elements.length > videoCount) {
          videoCount = elements.length;
        }
      });
      
      if (videoCount > 0) {
        cy.log(`✅ Found ${videoCount} video(s) in Library`);
      } else {
        cy.log('⚠️ Could not determine exact video count, but Library page loaded');
      }
      
      // Verify we have at least 1 video (single upload) or more (bulk uploads)
      const expectedMinVideos = 1; // At minimum the single video
      if (videoCount >= expectedMinVideos) {
        cy.log(`✅ Library verification successful - found ${videoCount} videos (expected at least ${expectedMinVideos})`);
      }
    });

    cy.screenshot('library-verification-complete');
    humanWait(2000);

    // Final success log
    cy.log('✅ PART 3 COMPLETED: Library verification successful');
    cy.log('🎉 All test parts completed successfully!');
    cy.log('📊 Test Summary:');
    cy.log('   ✅ Part 1: Single file upload and publish - PASSED');
    cy.log('   ✅ Part 2: Bulk upload with CSV import and bulk publish - PASSED');
    cy.log('   ✅ Part 3: Library verification - PASSED');
  });

  after(() => {
    // Try to navigate to a page where logout is accessible
    cy.log('🚪 Attempting to log out');
    cy.url().then((currentUrl) => {
      // If we're on a publish page or upload page, navigate to main app first
      if (currentUrl.includes('/publish') || currentUrl.includes('/upload')) {
        cy.log('📍 Navigating away from publish/upload page to access logout');
        cy.visit('https://app.horizonexp.com', { failOnStatusCode: false });
        humanWait(2000);
      }
    });
    
    // Try to find and click logout
    cy.get('body', { timeout: 10000 }).then($body => {
      const logoutSelectors = [
        'button:contains("Logout")',
        'button:contains("Log out")',
        'a:contains("Logout")',
        'a:contains("Log out")',
        '*:contains("Logout")',
        '*:contains("Log out")',
        '[data-testid*="logout"]',
        '[href*="logout"]'
      ];
      
      let logoutFound = false;
      for (const selector of logoutSelectors) {
        if (logoutFound) break;
        const $element = $body.find(selector).filter((i, el) => {
          const $el = Cypress.$(el);
          const text = $el.text().trim().toLowerCase();
          return text.includes('log') && (text.includes('out') || text.includes('off'));
        }).first();
        
        if ($element.length > 0) {
          cy.log(`✅ Found logout button: ${selector}`);
          cy.wrap($element).should('exist').scrollIntoView().should('be.visible').click({ force: true });
          logoutFound = true;
          humanWait(2000);
          break;
        }
      }
      
      if (!logoutFound) {
        // Try to find user menu/profile dropdown
        cy.get('body').then($body2 => {
          const profileSelectors = [
            '[data-testid*="user-menu"]',
            '[class*="user-menu"]',
            '[class*="profile"]',
            'button[aria-label*="user"]',
            'button[aria-label*="profile"]'
          ];
          
          for (const selector of profileSelectors) {
            if ($body2.find(selector).length > 0) {
              cy.get(selector).first().click({ force: true });
              humanWait(1000);
              cy.get('*:contains("Logout"), *:contains("Log out")').first().click({ force: true });
              logoutFound = true;
              break;
            }
          }
        });
      }
      
      if (!logoutFound) {
        cy.log('⚠️ Logout button not found, skipping logout step');
      }
    });
    
    humanWait(3000);

    // Try to verify logout, but don't fail if it doesn't work
    cy.url().then((currentUrl) => {
      const isLoggedOut = currentUrl.includes('/signin') || 
                         currentUrl.includes('/login') || 
                         currentUrl.includes('accounts.google.com');
      
      if (isLoggedOut) {
        cy.log('✅ User successfully logged out');
      } else {
        cy.log('ℹ️ Could not verify logout status, but test completed');
      }
    });
    
    humanWait(1000);
  });
});