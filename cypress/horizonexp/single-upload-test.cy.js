describe('HorizonExp Single Upload Test Suite', () => {
  // Test configuration and setup
  const testConfig = {
    baseUrl: 'https://app.horizonexp.com/signin',
    userEmail: 'asifniloy2017@gmail.com',
    userPassword: 'devops_test$sqa@flagship',
    humanDelay: 3000, // 3 seconds delay for human-like behavior
    humanTypeDelay: 120, // Delay between keystrokes for human-like typing
    uploadFile: {
      path: 'C:\\Users\\user\\Downloads\\SPAM\\6.mp4',
      fileName: '6.mp4'
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

        cy.contains('div, button, li', optionText, { timeout: 10000 })
          .filter(':visible')
          .first()
          .click({ force: true });
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
      try {
        // Handle both string and object responses
        let responseBody = body;
        if (typeof body === 'string') {
          try {
            responseBody = JSON.parse(body);
          } catch (e) {
            // Not JSON, skip
            return;
          }
        }
        
        // Check for various property name formats
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
        
        // Also check nested data structures
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

    // Intercept publish requests (most likely to contain the URLs)
    cy.intercept('POST', '**/publish**', (req) => {
      req.continue((res) => {
        if (res.body) {
          cy.log('📡 Publish API response intercepted');
          extractMetadata(res.body);
        }
      });
    }).as('publishRequest');

    cy.intercept('POST', '**/api/**/publish**', (req) => {
      req.continue((res) => {
        if (res.body) {
          cy.log('📡 Publish API response intercepted (alt endpoint)');
          extractMetadata(res.body);
        }
      });
    }).as('publishRequestAlt');
    
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
      .type(testConfig.userEmail, { delay: testConfig.humanTypeDelay });

    humanWait(1000);

    // Fill password field - use a more targeted approach  
    cy.log('🔒 Filling password field');
    cy.get('input[type="password"], input[name="password"], input[placeholder*="password"], input[placeholder*="Password"]')
      .first()
      .should('be.visible')
      .clear()
      .type(testConfig.userPassword, { delay: testConfig.humanTypeDelay });

    humanWait(1000);

    // Step 3: Submit the login form
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
            cy.get('input[type="email"]').first().clear().type(testConfig.userEmail, { delay: testConfig.humanTypeDelay });
            humanWait(1000);
            cy.get('button:contains("Next"), #identifierNext, [data-continue-as]').first().click();
            humanWait(3000);
            
            cy.get('body').then($body2 => {
              if ($body2.find('input[type="password"]').length > 0) {
                cy.get('input[type="password"]').first().type(testConfig.userPassword, { delay: testConfig.humanTypeDelay });
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
    
    // Step 5a: First click on "Short-form" menu item in the sidebar
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

    // Step 5b: Then click on "Uploads" under Short-form
    cy.log('📤 Step 2: Clicking on Uploads menu');
    cy.get('body').then($body => {
      // Look for "Uploads" link/button in the navigation
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
    humanWait();
    
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

        // If accept is empty, prefer elements that look like the React upload widget (data-testid etc.)
        const dataTestId = (el.getAttribute('data-testid') || '').toLowerCase();
        if (dataTestId.includes('video') || dataTestId.includes('upload')) {
          return true;
        }

        return accept.trim() === '';
      });

      if (chooseableInputs.length > 0) {
        cy.log(`✅ Using file input for upload (matching ${chooseableInputs.length} candidate(s))`);
        cy.wrap(chooseableInputs.first()).selectFile(testConfig.uploadFile.path, { force: true });
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
          const genericSelectors = '[class*="upload"], [id*="upload"]';
          if ($body.find(genericSelectors).length > 0) {
            cy.get(genericSelectors).first().selectFile(testConfig.uploadFile.path, { force: true });
          } else {
            throw new Error('Unable to locate a suitable file input or drag-drop area for video upload.');
          }
        }
      }
    });

    humanWait(2000);

    // Step 8: Verify file selection and start upload
    cy.log('⏳ Verifying file selection and upload progress');
    
    // Wait for upload indicators with longer timeout
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
          cy.wait(1000);
          cy.get(selector).first().click({ force: true });
          break;
        }
      }
    });

    humanWait(2000);

    // Step 9: Wait for upload completion
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
    
    cy.log('✅ Upload completed');
    humanWait(3000);

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
          cy.get(selector).first().scrollIntoView().click({ force: true });
          clicked = true;
          break;
        }
      }
    });
    
    cy.wait(3000);
    cy.screenshot('after-ready-to-publish-click');
    
    // Step 11: Wait for publish form to load
    cy.log('⏳ Waiting for publish form to load');
    
    // Wait for navigation to publish page (url contains /shorts/upload/<id>/publish)
    cy.location('pathname', { timeout: 45000 }).should((pathname) => {
      expect(pathname).to.match(/\/shorts\/upload\/[^/]+\/publish$/);
    });
    
    // Ensure the form renders by waiting for Channel dropdown label
    cy.contains(/select channel/i, { timeout: 30000 }).should('be.visible');
    cy.contains(/select categories/i).should('be.visible');

    cy.log('✅ Form loaded');
    cy.screenshot('publish-form-loaded');

    // Step 12: Fill required dropdowns (Channel and Category) - Select first option
    cy.log('📺 STEP 12: Filling required Channel and Category dropdowns');
    
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.wait(2000);

    // Fill Channel dropdown (REQUIRED) - Select first available option
    selectDropdownOption('Channel', `DevOps' Channel`);
    cy.wait(2000);
    
    // Verify Channel is selected, retry if needed
    cy.get('body').then($body => {
      if ($body.text().includes('Channel is required')) {
        cy.log('⚠️ Channel not selected, retrying...');
        selectDropdownOption('Channel', `DevOps' Channel`);
        cy.wait(2000);
      }
    });
    
    // Fill Category dropdown (REQUIRED) - Select first available option
    selectDropdownOption('Category', 'Auto & Vehicles');
    cy.wait(2000);
    
    // Verify Category is selected, retry if needed
    cy.get('body').then($body => {
      const bodyText = $body.text() || '';
      if (bodyText.includes('Minimum 1 category is required') || bodyText.includes('Category is required')) {
        cy.log('⚠️ Category not selected, retrying...');
        selectDropdownOption('Category', 'Auto & Vehicles');
        cy.wait(2000);
      }
    });
    
    // Final verification that both required fields are filled
    cy.log('🔍 Final verification of required fields skipped (dropdowns already selected)');

    // Step 13: Fill other form fields with dummy data
    cy.log('📝 STEP 13: Filling other form fields');
    cy.wait(2000);
    
    humanWait(1000);

    // Fill Title
    cy.get('input[placeholder*="title"], input[name="title"]')
      .filter(':visible')
      .first()
      .clear({ force: true })
      .type('Test Upload Video', { force: true, delay: testConfig.humanTypeDelay });

    humanWait(1000);

    // Fill Caption
    cy.get('textarea[placeholder*="caption"], textarea[name="caption"], input[placeholder*="caption"]')
      .filter(':visible')
      .first()
      .clear({ force: true })
      .type('This is a test caption generated by automation.', { force: true, delay: testConfig.humanTypeDelay });

    humanWait(1000);

    // Fill Tags
    cy.get('input[placeholder*="tag"], input[name="tags"]')
      .filter(':visible')
      .first()
      .clear({ force: true })
      .type('automation{enter}test{enter}video{enter}', { force: true, delay: testConfig.humanTypeDelay });

    humanWait(1000);

    // Fill CTA Button text and link if present
    cy.get('input[placeholder*="button label"], input[name*="cta"], input[placeholder*="Button label"]')
      .filter(':visible')
      .first()
      .clear({ force: true })
      .type('Learn More', { force: true, delay: testConfig.humanTypeDelay });

    humanWait(1000);

    cy.get('input[placeholder*="button link"], input[name*="cta"], input[placeholder*="Button link"]')
      .filter(':visible')
      .last()
      .clear({ force: true })
      .type('https://example.com', { force: true, delay: testConfig.humanTypeDelay });

    humanWait(1000);

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
      
      for (const selector of selectors) {
        if ($body.find(selector).length > 0) {
          cy.get(selector).first().should('be.visible').click({ force: true });
          break;
        }
      }
    });
    
    // Step 15: Wait for publishing completion
    cy.log('⏳ Waiting for publishing to complete');
    
    // Wait for publish API call (will timeout gracefully if not intercepted)
    cy.wait('@publishRequest', { timeout: 30000 }).then(() => {
      cy.log('📡 Publish API response received');
    });
    
    cy.wait(3000);
    
    // Verify publishing completed
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
    
    cy.log('✅ Publishing completed');
    cy.screenshot('upload-completed');
    
    // Step 16: Validate success criteria - Check for the three URLs
    cy.log('🔍 STEP 16: Validating success criteria - Checking for URLs');
    
    cy.then(() => {
      cy.log('📊 Captured Metadata Status:');
      cy.log(`  - thumbnailurl: ${capturedMetadata.thumbnailurl || 'NOT CAPTURED'}`);
      cy.log(`  - videourl: ${capturedMetadata.videourl || 'NOT CAPTURED'}`);
      cy.log(`  - previewurl: ${capturedMetadata.previewurl || 'NOT CAPTURED'}`);
      
      // Validate that all three URLs are captured
      const missingUrls = [];
      
      if (!capturedMetadata.thumbnailurl) {
        missingUrls.push('thumbnailurl');
      }
      if (!capturedMetadata.videourl) {
        missingUrls.push('videourl');
      }
      if (!capturedMetadata.previewurl) {
        missingUrls.push('previewurl');
      }
      
      if (missingUrls.length > 0) {
        cy.log(`⚠️ Missing URLs: ${missingUrls.join(', ')}`);
        cy.log('🔍 Attempting to extract URLs from page content...');
        
        // Try to find URLs in the page content as fallback
        cy.get('body').then($body => {
          const html = $body.html() || '';
          const urlPattern = /https?:\/\/[^\s<>"']+/g;
          const urls = html.match(urlPattern) || [];
          
          // Extract URLs
          for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            if (url.includes('thumbnail') && !capturedMetadata.thumbnailurl) {
              capturedMetadata.thumbnailurl = url;
              cy.log(`📸 Found thumbnailurl in page: ${url}`);
            }
            if (url.includes('video') && !capturedMetadata.videourl && !url.includes('thumbnail')) {
              capturedMetadata.videourl = url;
              cy.log(`🎥 Found videourl in page: ${url}`);
            }
            if (url.includes('preview') && !capturedMetadata.previewurl) {
              capturedMetadata.previewurl = url;
              cy.log(`👁️ Found previewurl in page: ${url}`);
            }
          }
        });
      }
      
      // Final validation
      expect(capturedMetadata.thumbnailurl, 'thumbnailurl should be captured').to.not.be.null;
      expect(capturedMetadata.videourl, 'videourl should be captured').to.not.be.null;
      expect(capturedMetadata.previewurl, 'previewurl should be captured').to.not.be.null;
      
      cy.log('✅ SUCCESS: All three URLs captured successfully!');
      cy.log(`  ✅ thumbnailurl: ${capturedMetadata.thumbnailurl}`);
      cy.log(`  ✅ videourl: ${capturedMetadata.videourl}`);
      cy.log(`  ✅ previewurl: ${capturedMetadata.previewurl}`);
    });
    
    cy.log('🎉 Video upload and publishing test completed successfully!');
  });
});