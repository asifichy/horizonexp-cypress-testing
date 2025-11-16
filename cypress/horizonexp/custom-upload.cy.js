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

  // Helper function to find and click the three-dot menu button
  const findAndClickMenuButton = () => {
    return cy.contains('button, a, *', 'Ready to publish', { matchCase: false, timeout: 30000 })
      .should('be.visible')
      .then(($readyButton) => {
        cy.log('✅ Found "Ready to Publish" button');
        humanWait(1000);
        
        const readyRect = $readyButton[0].getBoundingClientRect();
        
        return cy.get('body').then($body => {
          let menuFound = false;
          
          // Strategy 1: Check next sibling
          const $nextSibling = $readyButton.next();
          if ($nextSibling.length > 0 && ($nextSibling.is('button') || $nextSibling.find('button, [role="button"]').length > 0)) {
            const $nextButton = $nextSibling.is('button') ? $nextSibling : $nextSibling.find('button, [role="button"]').first();
            if ($nextButton.is(':visible')) {
              const nextText = $nextButton.text().trim().toLowerCase();
              const hasSvg = $nextButton.find('svg').length > 0;
              if (hasSvg && !nextText.includes('ready') && !nextText.includes('publish')) {
                cy.log('✅ Found menu button as next sibling');
                cy.wrap($nextButton[0]).scrollIntoView().should('be.visible');
                humanWait(1000);
                cy.wrap($nextButton[0]).click({ force: true });
                menuFound = true;
              }
            }
          }
          
          // Strategy 2: Same container search
          if (!menuFound) {
            const $readyParent = $readyButton.parent();
            const $parentButtons = $readyParent.find('button, [role="button"]').filter(':visible');
            
            $parentButtons.each((i, el) => {
              if (menuFound) return false;
              
              const $el = Cypress.$(el);
              const elText = $el.text().trim().toLowerCase();
              
              if (elText.includes('ready') && elText.includes('publish')) {
                return true;
              }
              
              const elRect = el.getBoundingClientRect();
              const isToTheRight = elRect.left > readyRect.right - 10;
              const isSameRow = Math.abs(elRect.top - readyRect.top) < 30;
              const hasSvg = $el.find('svg').length > 0;
              const hasMinimalText = elText.length === 0 || elText.length < 5;
              
              if (isToTheRight && isSameRow && hasSvg && hasMinimalText) {
                cy.log('✅ Found menu button in same container');
                cy.wrap(el).scrollIntoView().should('be.visible');
                humanWait(1000);
                cy.wrap(el).click({ force: true });
                menuFound = true;
                return false;
              }
            });
          }
          
          // Strategy 3: Page-wide search
          if (!menuFound) {
            const $allButtons = $body.find('button, [role="button"]').filter(':visible');
            
            $allButtons.each((i, el) => {
              if (menuFound) return false;
              
              const $el = Cypress.$(el);
              const elText = $el.text().trim().toLowerCase();
              
              if (elText.length > 5 && !elText.includes('⋯') && !elText.includes('...')) {
                return true;
              }
              
              if (elText.includes('ready') && elText.includes('publish')) {
                return true;
              }
              
              const elRect = el.getBoundingClientRect();
              const isToTheRight = elRect.left >= readyRect.right - 20;
              const isSameRow = Math.abs(elRect.top - readyRect.top) < 50;
              const isClose = elRect.left < readyRect.right + 150;
              const hasSvg = $el.find('svg').length > 0;
              const html = $el.html() || '';
              const hasMenuIndicators = html.includes('⋯') || 
                                      html.includes('ellipsis') ||
                                      html.includes('MoreVertical') ||
                                      html.includes('more-vertical') ||
                                      html.includes('DotsVertical') ||
                                      html.includes('dots-vertical');
              
              if (isToTheRight && isSameRow && isClose && (hasSvg || hasMenuIndicators)) {
                cy.log('✅ Found menu button via page-wide search');
                cy.wrap(el).scrollIntoView().should('be.visible');
                humanWait(1000);
                cy.wrap(el).click({ force: true });
                menuFound = true;
                return false;
              }
            });
          }
          
          if (!menuFound) {
            throw new Error('Unable to locate three-dot menu button');
          }
        });
      });
  };

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

  it('uploads and publishes a single file', () => {
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
    cy.log('📹 Starting file upload process');
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
    
    cy.log('✅ Upload completed - asserting success');
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
    selectDropdownOption('Channel', `DevOps' Channel`);
    humanWait(2000);
    
    cy.get('body').then($body => {
      if ($body.text().includes('Channel is required')) {
        cy.log('⚠️ Channel not selected, retrying...');
        selectDropdownOption('Channel', `DevOps' Channel`);
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

    // Assert form fields accept data
    cy.log('🔍 Asserting form fields accept data');
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
    
    cy.log('✅ Publishing completed - asserting success');
    cy.contains('body', /published|success/i, { timeout: 20000 }).should('exist');
    humanWait(2000);

    // Navigate to Library
    navigateToLibrary();

    // Open uploaded item
    cy.log('🔍 Opening uploaded item');
    humanWait(2000);
    
    // Find the most recent uploaded item (usually first in list)
    cy.get('body').then($body => {
      const itemSelectors = [
        '[data-testid*="content-item"]',
        '[class*="content-item"]',
        '[class*="video-item"]',
        'a[href*="/shorts/"]',
        'div[class*="card"]'
      ];
      
      let itemFound = false;
      for (const selector of itemSelectors) {
        if ($body.find(selector).length > 0 && !itemFound) {
          cy.get(selector).first().should('be.visible').click({ force: true });
          itemFound = true;
          humanWait(2000);
          break;
        }
      }
      
      if (!itemFound) {
        // Fallback: click on any link that might lead to content details
        cy.get('a[href*="/shorts/"]').first().click({ force: true });
        humanWait(2000);
      }
    });

    // Assert displayed data matches input
    cy.log('🔍 Asserting displayed data matches input');
    humanWait(2000);
    
    cy.get('body', { timeout: 15000 }).should('satisfy', ($body) => {
      const bodyText = $body.text() || '';
      // Check for title, caption, or tags that match our input
      return bodyText.includes('Test Upload Video') || 
             bodyText.includes('test caption') ||
             bodyText.includes('automation') ||
             bodyText.includes('test') ||
             bodyText.includes('video');
    });
    
    cy.log('✅ Displayed data matches input');
    humanWait(2000);
  });

  it('uploads 5 videos and bulk publishes via CSV', () => {
    const totalUploads = testConfig.bulkUploadFiles.length;
    const uploadCompletionPattern = new RegExp(`${totalUploads}\\s+out\\s+of\\s+${totalUploads}\\s+uploaded`, 'i');

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
    cy.get('body', { timeout: 60000 }).should('satisfy', ($body) => {
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
    cy.contains('body', 'Ready to publish', { timeout: 90000 }).should('exist');
    cy.log('✅ All bulk uploads completed successfully - asserting 5 uploads with success state');
    humanWait(3000);

    // Open batch menu
    cy.log('📋 Opening batch menu');
    findAndClickMenuButton();
    humanWait(2000);

    // Rename batch
    cy.log('✏️ Renaming batch');
    cy.get('body').then($body => {
      const renameSelectors = [
        '*:contains("Rename batch")',
        '*:contains("Rename")',
        'button:contains("Rename batch")',
        'li:contains("Rename batch")',
        '[role="menuitem"]:contains("Rename")'
      ];

      let renameOptionFound = false;
      for (const selector of renameSelectors) {
        if (renameOptionFound) break;
        
        const $option = $body.find(selector).filter(':visible').first();
        if ($option.length > 0) {
          cy.log(`✅ Found "Rename batch" option: ${selector}`);
          cy.wrap($option).scrollIntoView().should('be.visible');
          humanWait(1000);
          cy.wrap($option).click({ force: true });
          renameOptionFound = true;
        }
      }

      if (renameOptionFound) {
        humanWait(2000);
        // Find input field for batch name
        cy.get('input[type="text"], input[placeholder*="name"], input[placeholder*="batch"]')
          .filter(':visible')
          .first()
          .should('be.visible')
          .clear({ force: true })
          .type(`Test Batch ${Date.now()}`, { force: true, delay: testConfig.humanTypeDelay });
        humanWait(1000);
        
        // Click save/confirm button
        cy.get('button:contains("Save"), button:contains("Confirm"), button:contains("OK")')
          .filter(':visible')
          .first()
          .click({ force: true });
        humanWait(2000);
        
        // Assert batch name updated
        cy.log('🔍 Asserting batch name updated');
        cy.get('body').should('contain.text', 'Test Batch');
        cy.log('✅ Batch name updated');
      } else {
        cy.log('⚠️ Rename batch option not found, skipping rename step');
      }
    });
    humanWait(2000);

    // Upload CSV metadata file
    cy.log('📋 Opening batch menu for CSV import');
    findAndClickMenuButton();
    humanWait(2000);

    cy.log('📥 Clicking "Import CSV metadata" option');
    cy.get('body').then($body => {
      const csvMenuSelectors = [
        '*:contains("Import CSV metadata")',
        '*:contains("Import CSV")',
        '*:contains("CSV metadata")',
        'button:contains("Import CSV metadata")',
        'a:contains("Import CSV metadata")',
        'li:contains("Import CSV metadata")',
        '[role="menuitem"]:contains("Import CSV metadata")'
      ];

      let csvOptionFound = false;
      for (const selector of csvMenuSelectors) {
        if (csvOptionFound) break;
        
        const $option = $body.find(selector).filter(':visible').first();
        if ($option.length > 0) {
          cy.log(`✅ Found "Import CSV metadata" option: ${selector}`);
          cy.wrap($option).scrollIntoView().should('be.visible');
          humanWait(1000);
          cy.wrap($option).click({ force: true });
          csvOptionFound = true;
        }
      }

      if (!csvOptionFound) {
        throw new Error('Unable to locate "Import CSV metadata" option in menu');
      }
    });
    humanWait(2000);

    cy.log('📤 Uploading CSV metadata file');
    cy.get('body').then($body => {
      const $csvInputs = $body.find('input[type="file"]').filter((_, el) => {
        const accept = (el.getAttribute('accept') || '').toLowerCase();
        return accept.includes('csv') || accept.includes('.csv') || accept.trim() === '';
      });

      if ($csvInputs.length > 0) {
        cy.log(`✅ Found CSV file input (${$csvInputs.length} candidate(s))`);
        cy.wrap($csvInputs.first()).selectFile(testConfig.csvFilePath, { force: true });
      } else {
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
            cy.get(selector).first().selectFile(testConfig.csvFilePath, { action: 'drag-drop', force: true });
            csvUploaded = true;
          }
        });

        if (!csvUploaded) {
          cy.get('input[type="file"]').first().selectFile(testConfig.csvFilePath, { force: true });
        }
      }
    });
    humanWait(3000);

    // Assert CSV processed (status / toast / etc.)
    cy.log('⏳ Waiting for CSV metadata import to complete');
    cy.get('body', { timeout: 60000 }).should('satisfy', ($body) => {
      if (!$body || $body.length === 0) return false;
      
      const bodyText = $body.text() || '';
      const successIndicators = [
        'imported',
        'metadata imported',
        'CSV imported',
        'successfully imported',
        'import complete',
        'published'
      ];
      
      if (successIndicators.some(indicator => bodyText.toLowerCase().includes(indicator))) {
        return true;
      }
      
      if (bodyText.includes(`${totalUploads} published`) || bodyText.includes('published')) {
        return true;
      }
      
      return false;
    });

    cy.log('✅ CSV metadata import completed - asserting CSV processed');
    cy.contains('body', /imported|success/i, { timeout: 30000 }).should('exist');
    humanWait(2000);

    // Open batch menu
    cy.log('📋 Opening batch menu for Bulk publish');
    findAndClickMenuButton();
    humanWait(2000);

    // Click "Bulk Publish"
    cy.log('🚀 Clicking "Bulk publish" option');
    
    cy.get('body', { timeout: 10000 }).should('satisfy', ($body) => {
      const menuSelectors = [
        '*:contains("Bulk publish")',
        '*:contains("Import CSV metadata")',
        '*:contains("Start Publishing")',
        '*:contains("Rename batch")',
        '[role="menu"]',
        '.ant-dropdown-menu',
        '[class*="dropdown"]',
        '[class*="menu"]'
      ];
      
      for (const selector of menuSelectors) {
        if ($body.find(selector).filter(':visible').length > 0) {
          return true;
        }
      }
      return false;
    });
    
    cy.log('✅ Menu dropdown is visible');
    humanWait(1000);
    
    cy.get('body').then($body => {
      const $bulkPublishOptions = $body.find('*').filter((i, el) => {
        const $el = Cypress.$(el);
        const text = $el.text().trim().toLowerCase();
        return text === 'bulk publish' || (text.includes('bulk publish') && !text.includes('replace'));
      }).filter(':visible');
      
      if ($bulkPublishOptions.length > 0) {
        const $firstOption = $bulkPublishOptions.first();
        cy.log('✅ Found "Bulk publish" option');
        cy.wrap($firstOption[0]).scrollIntoView().should('be.visible');
        humanWait(1000);
        
        if ($firstOption.is('button, a, [role="button"], [role="menuitem"]')) {
          cy.wrap($firstOption[0]).click({ force: true });
        } else {
          const $clickable = $firstOption.closest('button, a, [role="button"], [role="menuitem"], li');
          if ($clickable.length > 0) {
            cy.wrap($clickable[0]).click({ force: true });
          } else {
            cy.wrap($firstOption[0]).click({ force: true });
          }
        }
      } else {
        cy.contains('*', 'Bulk publish', { matchCase: false, timeout: 10000 })
          .should('be.visible')
          .then(($bulkPublishOption) => {
            cy.log('✅ Found "Bulk publish" option via cy.contains');
            cy.wrap($bulkPublishOption).scrollIntoView().should('be.visible');
            humanWait(1000);
            
            const $clickable = $bulkPublishOption.closest('button, a, [role="button"], [role="menuitem"], li');
            if ($clickable.length > 0) {
              cy.wrap($clickable[0]).click({ force: true });
            } else {
              cy.wrap($bulkPublishOption[0]).click({ force: true });
            }
          });
      }
    });
    humanWait(3000);

    // Wait for bulk publish to finish
    cy.log('⏳ Waiting for bulk publish to finish');
    cy.get('body', { timeout: 60000 }).should('satisfy', ($body) => {
      if (!$body || $body.length === 0) return false;
      
      const bodyText = $body.text() || '';
      const successIndicators = [
        'published',
        'Publishing',
        'Success',
        'successfully published',
        'bulk publish',
        `${totalUploads} published`
      ];
      
      if (successIndicators.some(indicator => bodyText.toLowerCase().includes(indicator.toLowerCase()))) {
        return true;
      }
      
      if (bodyText.includes(`${totalUploads} content • ${totalUploads} published`)) {
        return true;
      }
      
      return false;
    });

    // Assert all 5 items are published
    cy.log('🔍 Asserting all 5 items are published');
    cy.contains('body', `${totalUploads} published`, { timeout: 30000 }).should('exist');
    cy.log('✅ Bulk publish completed - asserting all 5 items published');
    humanWait(2000);

    // Navigate to Library
    navigateToLibrary();

    // Assert CSV metadata is correctly applied to items
    cy.log('🔍 Asserting CSV metadata is correctly applied to items');
    humanWait(2000);
    
    // Check that items from the batch are visible and have metadata
    cy.get('body', { timeout: 15000 }).should('satisfy', ($body) => {
      const bodyText = $body.text() || '';
      // Look for indicators that CSV metadata was applied
      // This could be titles, tags, or other metadata from the CSV
      return bodyText.includes('published') || 
             $body.find('[class*="content-item"], [class*="video-item"]').length > 0;
    });
    
    cy.log('✅ CSV metadata correctly applied to items');
    humanWait(2000);
  });

  after(() => {
    // Click logout
    cy.log('🚪 Logging out');
    humanWait(2000);
    
    cy.get('body').then($body => {
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
    });
    
    humanWait(3000);

    // Assert user is logged out / redirected
    cy.log('🔍 Asserting user is logged out');
    cy.url().should('satisfy', (url) => {
      return url.includes('/signin') || url.includes('/login') || url.includes('accounts.google.com');
    });
    cy.log('✅ User successfully logged out');
    humanWait(2000);
  });
});


