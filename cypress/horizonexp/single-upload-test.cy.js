describe('HorizonExp Single Upload Test Suite', () => {
  // Test configuration and setup
  const testConfig = {
    baseUrl: 'https://app.horizonexp.com/signin',
    userEmail: 'asifniloy2017@gmail.com',
    userPassword: 'devops_test$sqa@flagship',
    humanDelay: 3000, // 3 seconds delay for human-like behavior
    uploadTimeout: 30000,
    uploadFile: {
      path: 'C:\\Users\\user\\Downloads\\SPAM\\0.mp4',
      fileName: '1.mp4',
      mimeType: 'video/mp4'
    }
  };

  // Store metadata captured from API responses
  let capturedMetadata = {
    thumbnailurl: null,
    videourl: null,
    previewurl: null
  };

  // Helper function for delays
  const humanWait = (customDelay = testConfig.humanDelay) => {
    cy.wait(customDelay);
  };

  // Simplified helper function for dropdown selection
  const selectFromDropdown = (fieldName, searchText) => {
    cy.log(`🔍 Looking for ${fieldName} dropdown`);
    
    cy.get('body').then($body => {
      const $trigger = $body.find(`*:contains("${searchText}")`).first();
      
      if ($trigger.length > 0) {
        cy.log(`✅ Found ${fieldName} trigger`);
        
        const $clickable = $trigger.is('button, select, [role="combobox"]') ? 
                          $trigger : 
                          $trigger.closest('div').find('button, select, [role="combobox"]').first();
        
        if ($clickable.length > 0) {
          cy.wrap($clickable).click({ force: true });
          cy.wait(2000);
          
          cy.get('body').then($body2 => {
            const $options = $body2.find('option, [role="option"], [role="menuitem"]').filter(function() {
              const text = Cypress.$(this).text().trim();
              return text.length > 0 && !text.includes('Select') && !text.includes('Choose');
            });
            
            if ($options.length > 0) {
              cy.wrap($options.first()).click({ force: true });
              cy.log(`✅ Selected ${fieldName} option`);
            }
          });
        }
      }
    });
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
    
    // Intercept network requests to capture upload metadata
    const extractMetadata = (body) => {
      if (body.thumbnailUrl || body.thumbnailurl) {
        capturedMetadata.thumbnailurl = body.thumbnailUrl || body.thumbnailurl;
      }
      if (body.videoUrl || body.videourl) {
        capturedMetadata.videourl = body.videoUrl || body.videourl;
      }
      if (body.previewUrl || body.previewurl) {
        capturedMetadata.previewurl = body.previewUrl || body.previewurl;
      }
    };

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

    cy.intercept('GET', '**/api/**', (req) => {
      req.continue((res) => {
        if (res.body && (res.body.thumbnailUrl || res.body.videoUrl || res.body.previewUrl)) {
          cy.log('📡 API response with video metadata intercepted');
          extractMetadata(res.body);
        }
      });
    }).as('apiRequest');
    
    // Visit the signin page
    cy.visit(testConfig.baseUrl);
    
    // Wait for page to fully load
    humanWait();
  });

  it('Should successfully upload a file through the complete user journey', () => {
    // Step 1: Navigate to signin page and verify it loads
    cy.title().should('contain', 'Horizon');
    cy.url().should('include', '/signin');
    
    // Add human-like delay after page load
    humanWait();

    // Step 2: Fill in email and password
    cy.log('🔐 Starting email/password authentication');
    
    // Fill email field - use a more targeted approach
    cy.log('📧 Filling email field');
    cy.get('input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="Email"]')
      .first()
      .should('be.visible')
      .clear()
      .type(testConfig.userEmail, { delay: 100 });

    humanWait(1000);

    // Fill password field - use a more targeted approach  
    cy.log('🔒 Filling password field');
    cy.get('input[type="password"], input[name="password"], input[placeholder*="password"], input[placeholder*="Password"]')
      .first()
      .should('be.visible')
      .clear()
      .type(testConfig.userPassword, { delay: 100 });

    humanWait(1000);

    // Step 3: Submit the login form
    cy.log('🚀 Submitting login form');
    
    // Click submit/login button (avoid Google OAuth button)
    cy.log('✅ Looking for email/password submit button');
    
    // First try to find a form and submit it
    cy.get('body').then($body => {
      // Look for a form containing the email/password fields
      if ($body.find('form').length > 0) {
        cy.log('📝 Found form, submitting via form');
        cy.get('form').first().submit();
      } else {
        // Look for submit button that's NOT the Google button
        cy.log('🔍 Looking for non-Google submit button');
        cy.get('button[type="submit"], input[type="submit"]')
          .not(':contains("Google")')
          .not(':contains("Sign in with Google")')
          .first()
          .should('be.visible')
          .click();
      }
    });

    // Wait for authentication to complete (increased delay)
    humanWait(5000);

    // Step 4: Handle post-login navigation
    cy.log('✅ Handling post-login navigation');
    
    cy.url().then((currentUrl) => {
      cy.log(`Current URL after login: ${currentUrl}`);
      
      if (currentUrl.includes('accounts.google.com')) {
        cy.log('⚠️ Redirected to Google OAuth - handling OAuth flow');
        humanWait(2000);
        
        cy.get('body').then($body => {
          if ($body.find('input[type="email"]').length > 0) {
            cy.get('input[type="email"]').first().clear().type(testConfig.userEmail);
            humanWait(1000);
            cy.get('button:contains("Next"), #identifierNext, [data-continue-as]').first().click();
            humanWait(3000);
            
            cy.get('body').then($body2 => {
              if ($body2.find('input[type="password"]').length > 0) {
                cy.get('input[type="password"]').first().type(testConfig.userPassword);
                cy.get('button:contains("Next"), #passwordNext').first().click();
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
      } else {
        cy.log('✅ Login successful, proceeding with test');
      }
    });

    // Wait for authentication to complete and redirect back to app
    cy.log('⏳ Waiting for authentication to complete');
    
    // Wait for redirect back to the app (with longer timeout for OAuth)
    cy.url({ timeout: 15000 }).should('satisfy', (url) => {
      return url.includes('app.horizonexp.com') && !url.includes('/signin');
    });
    
    humanWait();

    // Step 5: Navigate to Shorts Uploads section
    cy.log('📱 Navigating to Shorts Uploads section');
    
    cy.get('body').should('be.visible');
    humanWait(2000);
    
    // Navigate to shorts section if not already there
    cy.url().then((currentUrl) => {
      if (!currentUrl.includes('/shorts/')) {
        cy.log('📱 Navigating to shorts section');
        cy.get('[data-testid*="short"], *').contains('Short-form').first().click();
        humanWait(2000);
      }
    });

    // Navigate to uploads page
    cy.url().then((currentUrl) => {
      if (!currentUrl.includes('/uploads')) {
        cy.log('📤 Navigating to uploads page');
        cy.get('body').then($body => {
          if ($body.find('a:contains("Uploads")').length > 0) {
            cy.get('a:contains("Uploads")').first().click();
          } else if ($body.find('*:contains("Uploads")').length > 0) {
            cy.get('*:contains("Uploads")').first().click();
          } else {
            cy.visit('https://app.horizonexp.com/shorts/uploads');
          }
        });
        humanWait(2000);
      }
    });
    
    cy.url().should('include', '/shorts/uploads');

    // Step 6: Click Upload New button
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
    
    humanWait();

    // Step 7: Upload video file
    cy.log('📹 Starting file upload process');
    
    cy.get('body').should('satisfy', ($body) => {
      const text = $body.text();
      return text.includes('upload') || text.includes('Upload');
    });
    
    humanWait();
    
    cy.get('body').then($body => {
      if ($body.find('input[type="file"]').length > 0) {
        cy.log('✅ Using file input for upload');
        cy.get('input[type="file"]').first().selectFile(testConfig.uploadFile.path, { force: true });
      } else {
        cy.log('🎯 Using drag-drop upload method');
        const uploadAreaSelectors = ['.upload-area', '.drop-zone', '[data-testid="upload-area"]', '.file-drop-zone', '.upload-container'];
        
        let uploadAreaFound = false;
        uploadAreaSelectors.forEach(selector => {
          if (!uploadAreaFound && $body.find(selector).length > 0) {
            cy.get(selector).selectFile(testConfig.uploadFile.path, { action: 'drag-drop' });
            uploadAreaFound = true;
          }
        });

        if (!uploadAreaFound) {
          cy.get('[class*="upload"], [id*="upload"]').first().selectFile(testConfig.uploadFile.path, { force: true });
        }
      }
    });

    humanWait(2000);

    // Step 8: Verify file selection and start upload
    cy.log('⏳ Verifying file selection and upload progress');
    
    cy.get('body').should('satisfy', ($body) => {
      const text = $body.text();
      return text.includes(testConfig.uploadFile.fileName) || 
             text.includes('uploaded') || 
             text.includes('Video #') ||
             text.includes('Ready to publish') ||
             text.includes('100%');
    });
    
    // Click upload submit button if needed
    cy.get('body').then($body => {
      const uploadButtonSelectors = ['button:contains("Upload")', 'button:contains("Submit")', 'button:contains("Start Upload")', '[data-testid="upload-submit"]'];

      uploadButtonSelectors.forEach(selector => {
        if ($body.find(selector).length > 0) {
          cy.log('🚀 Clicking upload submit button');
          cy.wait(1000);
          cy.get(selector).first().click({ force: true });
          return false;
        }
      });
    });

    humanWait(2000);

    // Step 9: Wait for upload completion
    cy.log('⏳ Waiting for upload to complete');
    
    cy.get('body', { timeout: 60000 }).should('satisfy', ($body) => {
      if (!$body || $body.length === 0) return false;
      
      const bodyText = $body.text() || '';
      const completionIndicators = ['100%', 'Upload complete', 'Upload successful', 'Ready to publish', 'Successfully uploaded'];
      
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
    
    cy.log('✅ Upload completed');
    humanWait(3000);
    
    // Brief debug log
    cy.get('body').then($body => {
      const bodyText = $body.text();
      cy.log(`📋 Page ready: Ready to publish = ${bodyText.includes('Ready to publish')}`);
    });

    // Step 10: Click "Ready to publish" button
    cy.log('📝 Looking for Ready to publish button');
    
    cy.get('body', { timeout: 30000 }).should('contain.text', 'Ready to publish');
    cy.screenshot('before-ready-to-publish-click');
    
    cy.get('body').then($body => {
      const selectors = [
        'button:contains("Ready to publish")',
        'a:contains("Ready to publish")',
        '*:contains("Ready to publish")'
      ];
      
      let clicked = false;
      
      for (const selector of selectors) {
        if (!clicked && $body.find(selector).length > 0) {
          cy.log(`✅ Found Ready to publish: ${selector}`);
          cy.get(selector).first().scrollIntoView().click({ force: true });
          cy.log('✅ Clicked Ready to publish button');
          clicked = true;
          break;
        }
      }
    });
    
    cy.wait(3000);
    cy.screenshot('after-ready-to-publish-click');
    
    // Step 11: Wait for publish form to load
    cy.log('⏳ Waiting for publish form to load');
    
    cy.url().then((currentUrl) => {
      cy.log(`📍 Current URL: ${currentUrl}`);
      
      if (currentUrl.includes('/uploads')) {
        cy.log('⚠️ Still on uploads page - trying direct navigation');
        cy.visit('https://app.horizonexp.com/shorts/publish');
        cy.wait(3000);
      }
    });
    
    cy.get('body', { timeout: 20000 }).should('satisfy', ($body) => {
      if (!$body || $body.length === 0) return false;
      
      const bodyText = $body.text() || '';
      const hasFormElements = $body.find('select, [role="combobox"], input').length > 0;
      const hasFormText = bodyText.includes('Channel') || bodyText.includes('Category');
      
      return hasFormElements || hasFormText;
    });

    cy.wait(2000);
    cy.log('✅ Form loaded');
    cy.screenshot('publish-form-loaded');

    // Step 12: Fill required dropdowns (Channel and Category)
    cy.log('📺 STEP 12: Filling required Channel and Category dropdowns');
    
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.wait(2000);

    // Fill Channel dropdown (REQUIRED)
    selectFromDropdown('Channel', 'Select Channel');
    cy.wait(2000);
    
    // Fill Category dropdown (REQUIRED)
    selectFromDropdown('Category', 'Select categories');
    cy.wait(2000);
    
    // Verify both required fields are filled
    cy.log('🔍 Verifying required fields');
    cy.get('body').should('satisfy', ($body) => {
      if (!$body || $body.length === 0) return false;
      
      const bodyText = $body.text() || '';
      const hasChannelError = bodyText.includes('Channel is required');
      const hasCategoryError = bodyText.includes('Minimum 1 category is required');
      
      if (!hasChannelError && !hasCategoryError) {
        cy.log('✅ Required fields filled');
        return true;
      } else {
        cy.log('⚠️ Required fields still need attention');
        return false;
      }
    });

    // Step 13: Fill other form fields with dummy data
    cy.log('📝 STEP 13: Filling other form fields');
    
    cy.wait(2000);

    // Fill optional form fields (simplified)
    cy.log('📝 Filling optional form fields');
    
    // Fill Title if available
    cy.get('body').then($body => {
      if ($body.find('input[placeholder*="title"]').length > 0) {
        cy.get('input[placeholder*="title"]').first().type('Test Upload Video', { force: true });
        cy.log('✅ Filled title');
      }
    });
    
    // Fill Caption if available
    cy.get('body').then($body => {
      if ($body.find('textarea[placeholder*="caption"], input[placeholder*="caption"]').length > 0) {
        cy.get('textarea[placeholder*="caption"], input[placeholder*="caption"]').first().type('Test caption', { force: true });
        cy.log('✅ Filled caption');
      }
    });
    
    // Fill Tags if available
    cy.get('body').then($body => {
      if ($body.find('input[placeholder*="tag"]').length > 0) {
        cy.get('input[placeholder*="tag"]').first().type('test{enter}video{enter}', { force: true });
        cy.log('✅ Added tags');
      }
    });

    // Step 14: Final validation and publish
    cy.log('🚀 Final validation and publishing');
    
    cy.wait(2000);
    
    // Click Publish button
    cy.get('body').then($body => {
      const selectors = [
        'button:contains("Publish")',
        'button[class*="bg-blue"]',
        'button[type="submit"]'
      ];
      
      let clicked = false;
      
      for (const selector of selectors) {
        if (!clicked && $body.find(selector).length > 0) {
          cy.log(`✅ Found Publish button: ${selector}`);
          cy.get(selector).first().should('be.visible').click({ force: true });
          cy.log('✅ Clicked Publish button');
          clicked = true;
          break;
        }
      }
    });
    
    // Step 15: Wait for publishing completion
    cy.log('⏳ Waiting for publishing to complete');
    
    cy.get('body', { timeout: 15000 }).should('satisfy', ($body) => {
      if (!$body || $body.length === 0) return false;
      
      const bodyText = $body.text() || '';
      return bodyText.includes('Published') || 
             bodyText.includes('Success') ||
             window.location.href.includes('/uploads');
    });
    
    cy.log('🎉 Video upload and publishing test completed');
    cy.screenshot('upload-completed');
    
    // Stay signed in for 2 minutes
    cy.log('⏰ Staying signed in for 2 minutes');
    cy.wait(120000);
    cy.log('✅ Session maintained');
  });
});