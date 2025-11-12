describe('HorizonExp Single Upload Test Suite', () => {
    // Test configuration and setup
    const testConfig = {
      baseUrl: 'https://app.horizonexp.com/signin',
      userEmail: 'asifniloy2017@gmail.com',
      userPassword: 'devops_test$sqa@flagship',
      humanDelay: 3000, // 3 seconds delay for human-like behavior
      humanTypeDelay: 120, // Delay between keystrokes for human-like typing
      uploadFiles: [
        { path: 'C:\\Users\\user\\Downloads\\SPAM\\0.mp4', fileName: '0.mp4' },
        { path: 'C:\\Users\\user\\Downloads\\SPAM\\1.mp4', fileName: '1.mp4' },
        { path: 'C:\\Users\\user\\Downloads\\SPAM\\2.mp4', fileName: '2.mp4' },
        { path: 'C:\\Users\\user\\Downloads\\SPAM\\3.mp4', fileName: '3.mp4' },
        { path: 'C:\\Users\\user\\Downloads\\SPAM\\4.mp4', fileName: '4.mp4' }
      ]
    };
  
    // Store metadata captured from API responses
    let capturedMetadata = {
      thumbnailurl: null,
      videourl: null,
      previewurl: null
    };
    let lastPublishAlias = null;
  
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
      lastPublishAlias = null;
      
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
        lastPublishAlias = 'publishRequest';
      }).as('publishRequest');
  
      cy.intercept('POST', '**/api/**/publish**', (req) => {
        req.continue((res) => {
          if (res.body) {
            cy.log('📡 Publish API response intercepted (alt endpoint)');
            extractMetadata(res.body);
          }
        });
        lastPublishAlias = 'publishRequestAlt';
      }).as('publishRequestAlt');
      
      // Visit the signin page
      cy.visit(testConfig.baseUrl);
      
      // Wait for page to fully load
      humanWait();
    });
  
    it('Should successfully upload a file through the complete user journey', () => {
      const totalUploads = testConfig.uploadFiles.length;
      const uploadCompletionPattern = new RegExp(`${totalUploads}\\s+out\\s+of\\s+${totalUploads}\\s+uploaded`, 'i');

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
      
      const uploadPaths = testConfig.uploadFiles.map((file) => file.path);
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

      // Step 10: Wait for all bulk uploads to complete
      cy.log('⏳ Waiting for all bulk uploads to complete');
      cy.contains('body', uploadCompletionPattern, { timeout: 90000 }).should('exist');
      cy.contains('body', 'Ready to publish', { timeout: 90000 }).should('exist');
      cy.log('✅ All bulk uploads completed successfully');

      humanWait(2000);

      // Step 11: Click three-dot menu and import CSV metadata
      cy.log('📋 Step 11: Importing CSV metadata for bulk publish');
      
      // Find the batch card and click the three-dot menu
      cy.get('body').then($body => {
        // Look for the three-dot menu button (common patterns: button with three dots, menu trigger, etc.)
        const menuSelectors = [
          'button[aria-label*="menu" i]',
          'button[aria-label*="more" i]',
          'button[aria-label*="options" i]',
          '[data-testid*="menu"]',
          '[data-testid*="more"]',
          'button:has(svg)',
          '.ant-dropdown-trigger',
          '[role="button"]:has(svg)'
        ];

        let menuFound = false;
        
        // First, try to find menu near batch-related content
        for (const selector of menuSelectors) {
          if (menuFound) break;
          
          const $menus = $body.find(selector).filter(':visible');
          if ($menus.length > 0) {
            // Prefer menu that's near batch content
            const $batchCard = $body.find('*:contains("Batch #"), *:contains("content")').first();
            if ($batchCard.length > 0) {
              const batchRect = $batchCard[0].getBoundingClientRect();
              $menus.each((i, el) => {
                if (menuFound) return false;
                const menuRect = el.getBoundingClientRect();
                // Check if menu is near the batch card (within reasonable distance)
                const distance = Math.abs(menuRect.top - batchRect.top) + Math.abs(menuRect.left - batchRect.left);
                if (distance < 500) {
                  cy.log(`✅ Found three-dot menu near batch card: ${selector}`);
                  cy.wrap(el).scrollIntoView().should('be.visible');
                  humanWait(1000);
                  cy.wrap(el).click({ force: true });
                  menuFound = true;
                  return false;
                }
              });
            }
            
            // If no menu near batch, try the first visible one
            if (!menuFound && $menus.length > 0) {
              cy.log(`✅ Found three-dot menu: ${selector}`);
              cy.wrap($menus.first()).scrollIntoView().should('be.visible');
              humanWait(1000);
              cy.wrap($menus.first()).click({ force: true });
              menuFound = true;
            }
          }
        }

        // Fallback: look for any clickable element with three dots or ellipsis
        if (!menuFound) {
          cy.log('🔍 Trying alternative method to find menu');
          cy.get('body').then($body2 => {
            const $allButtons = $body2.find('button, [role="button"]').filter(':visible');
            $allButtons.each((i, el) => {
              if (menuFound) return false;
              const $el = Cypress.$(el);
              const text = $el.text().trim();
              const html = $el.html() || '';
              
              // Look for three dots pattern in text or HTML
              if (text === '⋯' || text === '...' || html.includes('⋯') || html.includes('ellipsis') || 
                  $el.find('svg').length > 0 || $el.attr('aria-label')?.toLowerCase().includes('menu')) {
                cy.log('✅ Found potential menu button');
                cy.wrap(el).scrollIntoView().should('be.visible');
                humanWait(1000);
                cy.wrap(el).click({ force: true });
                menuFound = true;
                return false;
              }
            });
          });
        }

        if (!menuFound) {
          throw new Error('Unable to locate three-dot menu button');
        }
      });

      humanWait(2000);

      // Step 12: Click "Import CSV metadata" from the dropdown menu
      cy.log('📥 Step 12: Clicking "Import CSV metadata" option');
      
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

      // Step 13: Upload the CSV file
      cy.log('📤 Step 13: Uploading CSV metadata file');
      
      const csvFilePath = 'C:\\Users\\user\\Downloads\\Sample.csv';
      
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
          'published'
        ];
        
        // Check if import completed or if we're back on uploads page with updated status
        if (successIndicators.some(indicator => bodyText.toLowerCase().includes(indicator))) {
          return true;
        }
        
        // Check if batch shows published count increased
        if (bodyText.includes(`${totalUploads} published`) || bodyText.includes('published')) {
          return true;
        }
        
        return false;
      });

      cy.log('✅ CSV metadata import completed');
      humanWait(2000);
      cy.screenshot('csv-import-completed');

      cy.log('🎉 Bulk upload and CSV metadata import test completed successfully!');
    });
  });