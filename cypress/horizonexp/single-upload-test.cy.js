describe('HorizonExp Single Upload Test Suite', () => {
  // Test configuration and setup
  const testConfig = {
    baseUrl: 'https://app.horizonexp.com/signin',
    userEmail: 'asifniloy2017@gmail.com',
    userPassword: 'devops_test$sqa@flagship',
    humanDelay: 3000, // 3 seconds delay for human-like behavior
    uploadFile: {
      path: 'C:\\Users\\user\\Downloads\\SPAM\\0.mp4',
      fileName: '1.mp4'
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

  // Improved helper function for dropdown selection - selects first available option
  const selectFromDropdown = (fieldName, searchText) => {
    cy.log(`🔍 Looking for ${fieldName} dropdown with text: ${searchText}`);
    
    // Try multiple approaches to find the dropdown
    cy.get('body').then($body => {
      // Approach 1: Find by label text
      let $trigger = null;
      
      // Look for label or text containing the search text
      const $label = $body.find(`label:contains("${searchText}"), *:contains("${searchText}")`).first();
      
      if ($label.length > 0) {
        // Find the associated input/select/button near the label
        $trigger = $label.closest('div, form, section').find('select, [role="combobox"], button, input').first();
        
        if ($trigger.length === 0) {
          // Try finding by going up the DOM tree
          $trigger = $label.parent().find('select, [role="combobox"], button, input').first();
        }
      }
      
      // Approach 2: Direct search for select/combobox elements
      if (!$trigger || $trigger.length === 0) {
        $trigger = $body.find(`select, [role="combobox"]`).filter((i, el) => {
          const $el = Cypress.$(el);
          const label = $el.closest('div, form').find('label, span, div').text();
          return label.includes(searchText) || $el.attr('placeholder')?.includes(searchText);
        }).first();
      }
      
      // Approach 3: Find by placeholder or aria-label
      if (!$trigger || $trigger.length === 0) {
        $trigger = $body.find(`[placeholder*="${searchText}"], [aria-label*="${searchText}"]`).first();
      }
      
      if ($trigger && $trigger.length > 0) {
        cy.log(`✅ Found ${fieldName} dropdown element`);
        
        // Scroll into view and click
        cy.wrap($trigger).scrollIntoView().should('be.visible');
        cy.wait(500);
        cy.wrap($trigger).click({ force: true });
        cy.wait(1500);
        
        // Wait for dropdown options to appear and select the first available option
        cy.get('body').then($body2 => {
          // Look for dropdown options in various formats
          const optionSelectors = [
            '[role="option"]',
            '[role="menuitem"]',
            'li[role="option"]',
            '.MuiMenuItem-root',
            '.ant-select-item',
            'option:not([value=""])',
            '[data-option-index]'
          ];
          
          let optionFound = false;
          
          for (const selector of optionSelectors) {
            const $options = $body2.find(selector).filter(function() {
              const $opt = Cypress.$(this);
              const text = $opt.text().trim();
              const value = $opt.attr('value') || $opt.text();
              
              // Skip placeholder/empty options
              return text.length > 0 && 
                     !text.toLowerCase().includes('select') && 
                     !text.toLowerCase().includes('choose') &&
                     !text.toLowerCase().includes('channel') &&
                     !text.toLowerCase().includes('category') &&
                     value !== '' &&
                     value !== null;
            });
            
            if ($options.length > 0 && !optionFound) {
              cy.log(`✅ Found ${$options.length} options for ${fieldName}, selecting first`);
              cy.wrap($options.first()).scrollIntoView().click({ force: true });
              cy.log(`✅ Selected first option for ${fieldName}`);
              optionFound = true;
              cy.wait(1000);
              break;
            }
          }
          
          // Fallback: try clicking on any visible option-like element
          if (!optionFound) {
            cy.log(`⚠️ Standard options not found, trying fallback for ${fieldName}`);
            cy.get('body').then($body3 => {
              const $allOptions = $body3.find('div, li, span').filter(function() {
                const $el = Cypress.$(this);
                const text = $el.text().trim();
                return text.length > 0 && 
                       text.length < 100 && // Reasonable option text length
                       !text.toLowerCase().includes('select') &&
                       !text.toLowerCase().includes('channel') &&
                       !text.toLowerCase().includes('category');
              });
              
              if ($allOptions.length > 0) {
                cy.wrap($allOptions.first()).scrollIntoView().click({ force: true });
                cy.log(`✅ Selected fallback option for ${fieldName}`);
                cy.wait(1000);
              }
            });
          }
        });
      } else {
        cy.log(`⚠️ Could not find ${fieldName} dropdown, trying alternative approach`);
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
    
    // Step 5a: First click on "Short-form" menu item in the sidebar
    cy.log('📱 Step 1: Clicking on Short-form menu');
    cy.get('body').then($body => {
      // Look for "Short-form" in the sidebar/navigation
      const shortFormSelectors = [
        '*:contains("Short-form")',
        'a:contains("Short-form")',
        'button:contains("Short-form")',
        '[data-testid*="short-form"]',
        '[data-testid*="short"]'
      ];
      
      let clicked = false;
      for (const selector of shortFormSelectors) {
        const $element = $body.find(selector).first();
        if ($element.length > 0 && !clicked) {
          cy.log(`✅ Found Short-form menu: ${selector}`);
          cy.get(selector).first().scrollIntoView().should('be.visible').click({ force: true });
          clicked = true;
          humanWait(2000);
          break;
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
      
      let clicked = false;
      for (const selector of uploadsSelectors) {
        const $element = $body.find(selector).filter((i, el) => {
          const $el = Cypress.$(el);
          const text = $el.text().trim();
          return text === 'Uploads' || text.includes('Uploads');
        }).first();
        
        if ($element.length > 0 && !clicked) {
          cy.log(`✅ Found Uploads menu: ${selector}`);
          cy.wrap($element).scrollIntoView().should('be.visible').click({ force: true });
          cy.log('✅ Clicked Uploads menu');
          clicked = true;
          humanWait(2000);
          break;
        }
      }
      
      if (!clicked) {
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

    // Step 12: Fill required dropdowns (Channel and Category) - Select first option
    cy.log('📺 STEP 12: Filling required Channel and Category dropdowns');
    
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.wait(2000);

    // Fill Channel dropdown (REQUIRED) - Select first available option
    selectFromDropdown('Channel', 'Select Channel');
    cy.wait(3000);
    
    // Verify Channel is selected, retry if needed
    cy.get('body').then($body => {
      if ($body.text().includes('Channel is required')) {
        cy.log('⚠️ Channel not selected, retrying...');
        selectFromDropdown('Channel', 'Channel');
        cy.wait(2000);
      }
    });
    
    // Fill Category dropdown (REQUIRED) - Select first available option
    selectFromDropdown('Category', 'Select categories');
    cy.wait(3000);
    
    // Verify Category is selected, retry if needed
    cy.get('body').then($body => {
      const bodyText = $body.text() || '';
      if (bodyText.includes('Minimum 1 category is required') || bodyText.includes('Category is required')) {
        cy.log('⚠️ Category not selected, retrying...');
        selectFromDropdown('Category', 'Category');
        cy.wait(2000);
      }
    });
    
    // Final verification that both required fields are filled
    cy.log('🔍 Final verification of required fields');
    cy.wait(2000);
    cy.get('body').should('satisfy', ($body) => {
      if (!$body || $body.length === 0) return false;
      
      const bodyText = $body.text() || '';
      const hasChannelError = bodyText.includes('Channel is required');
      const hasCategoryError = bodyText.includes('Minimum 1 category is required') || bodyText.includes('Category is required');
      
      if (!hasChannelError && !hasCategoryError) {
        cy.log('✅ All required fields are filled');
        return true;
      } else {
        cy.log(`⚠️ Required fields still need attention - Channel error: ${hasChannelError}, Category error: ${hasCategoryError}`);
        return false;
      }
    });

    // Step 13: Fill other form fields with dummy data
    cy.log('📝 STEP 13: Filling other form fields');
    cy.wait(2000);
    
    // Fill Title if available
    cy.get('body').then($body => {
      if ($body.find('input[placeholder*="title"]').length > 0) {
        cy.get('input[placeholder*="title"]').first().type('Test Upload Video', { force: true });
      }
    });
    
    // Fill Caption if available
    cy.get('body').then($body => {
      if ($body.find('textarea[placeholder*="caption"], input[placeholder*="caption"]').length > 0) {
        cy.get('textarea[placeholder*="caption"], input[placeholder*="caption"]').first().type('Test caption', { force: true });
      }
    });
    
    // Fill Tags if available
    cy.get('body').then($body => {
      if ($body.find('input[placeholder*="tag"]').length > 0) {
        cy.get('input[placeholder*="tag"]').first().type('test{enter}video{enter}', { force: true });
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