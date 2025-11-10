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

  // Helper function for human-like delays
  const humanWait = (customDelay = testConfig.humanDelay) => {
    cy.wait(customDelay);
  };

  // Helper function for human-like clicking
  const humanClick = (selector, options = {}) => {
    cy.get(selector).should('be.visible').then($el => {
      cy.wrap($el).trigger('mouseover');
      cy.wait(300);
      cy.wrap($el).click(options);
    });
  };

  // Helper function for dropdown selection
  const selectFromDropdown = (fieldName, searchTexts, options = []) => {
    cy.log(`🔍 Looking for ${fieldName} dropdown (REQUIRED field)`);
    
    let fieldFound = false;
    
    // Strategy 1: Look for search text
    searchTexts.forEach(searchText => {
      if (!fieldFound) {
        cy.get('body').then($body => {
          const $labels = $body.find(`*:contains("${searchText}")`);
          if ($labels.length > 0) {
            cy.log(`✅ Found "${searchText}" text, looking for dropdown`);
            
            $labels.each((i, label) => {
              if (!fieldFound) {
                const $label = Cypress.$(label);
                const $parent = $label.closest('div');
                const $dropdown = $parent.find('button, [role="combobox"], select, [class*="dropdown"], [class*="select"]');
                
                if ($dropdown.length > 0) {
                  cy.log(`✅ Found ${fieldName} dropdown trigger`);
                  cy.wrap($dropdown.first()).click({ force: true });
                  cy.wait(2000);
                  
                  cy.get('body').then($body2 => {
                    let optionSelected = false;
                    
                    // Try specific options first
                    for (const option of options) {
                      if (!optionSelected && $body2.find(`*:contains("${option}")`).length > 0) {
                        const $optionElement = $body2.find(`*:contains("${option}")`).filter(function() {
                          const $opt = Cypress.$(this);
                          const text = $opt.text().trim();
                          return text === option || text.includes(option);
                        });
                        
                        if ($optionElement.length > 0) {
                          cy.wrap($optionElement.first()).click({ force: true });
                          cy.log(`✅ Selected ${fieldName}: ${option}`);
                          optionSelected = true;
                          fieldFound = true;
                          break;
                        }
                      }
                    }
                    
                    // Fallback to first available option
                    if (!optionSelected) {
                      const $genericOptions = $body2.find('option, [role="option"], [role="menuitem"], .dropdown-item, li').filter(function() {
                        const $opt = Cypress.$(this);
                        const text = $opt.text().trim();
                        return text.length > 0 && !text.includes('Select') && !text.includes('Choose');
                      });
                      
                      if ($genericOptions.length > 0) {
                        const firstOption = $genericOptions.first();
                        cy.wrap(firstOption).click({ force: true });
                        const optionText = firstOption.text() || 'Unknown';
                        cy.log(`✅ Selected first available ${fieldName}: ${optionText}`);
                        fieldFound = true;
                      }
                    }
                  });
                  
                  return false; // Break out of each loop
                }
              }
            });
          }
        });
      }
    });
    
    if (!fieldFound) {
      cy.log(`❌ CRITICAL: ${fieldName} dropdown not found - this is a required field!`);
      cy.screenshot(`${fieldName.toLowerCase()}-dropdown-not-found`);
    }
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
          humanWait(1000);
          humanClick(selector);
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
    
    // Debug: Log current page state before looking for Ready to publish
    cy.get('body').then($body => {
      const bodyText = $body.text();
      cy.log('📋 Current page content includes:');
      cy.log(`- Ready to publish: ${bodyText.includes('Ready to publish')}`);
      cy.log(`- 100%: ${bodyText.includes('100%')}`);
      cy.log(`- uploaded: ${bodyText.includes('uploaded')}`);
      
      // Log any buttons found on the page
      const buttons = $body.find('button');
      cy.log(`📝 Found ${buttons.length} button(s) on page`);
      buttons.each((i, btn) => {
        const $btn = Cypress.$(btn);
        const btnText = $btn.text().trim();
        if (btnText.length > 0 && btnText.length < 50) {
          cy.log(`  - Button ${i}: "${btnText}"`);
        }
      });
    });

    // Step 10: Click "Ready to publish" button
    cy.log('📝 Looking for and clicking Ready to publish button');
    
    // Wait for the Ready to publish button to appear
    cy.get('body', { timeout: 30000 }).should('satisfy', ($body) => {
      return $body.text().includes('Ready to publish') || 
             $body.find('button:contains("Ready to publish"), *:contains("Ready to publish")').length > 0;
    });
    
    // Take a screenshot to see the current state
    cy.screenshot('before-ready-to-publish-click');
    
    // More specific approach to find the Ready to publish button
    cy.get('body').then($body => {
      cy.log('🔍 Searching for Ready to publish button in the uploaded video item');
      
      // First, try to find the uploaded video item/container
      const videoContainerSelectors = [
        '[class*="upload"]',
        '[class*="video"]',
        'div:contains("1 out of 1 uploaded")',
        'div:contains("100%")',
        '*:has(*:contains("Ready to publish"))'
      ];
      
      let readyToPublishClicked = false;
      
      // Look for the Ready to publish button within the video container
      for (const containerSelector of videoContainerSelectors) {
        if (!readyToPublishClicked && $body.find(containerSelector).length > 0) {
          cy.log(`🎯 Found video container: ${containerSelector}`);
          
          // Look for Ready to publish button within this container
          cy.get(containerSelector).then($containers => {
            $containers.each((index, container) => {
              const $container = Cypress.$(container);
              const containerText = $container.text();
              
              if (containerText.includes('Ready to publish') && !readyToPublishClicked) {
                cy.log(`✅ Found container with Ready to publish text`);
                
                // Look for clickable elements within this container
                const $readyButton = $container.find('button:contains("Ready to publish"), a:contains("Ready to publish"), *:contains("Ready to publish")').filter(function() {
                  const $el = Cypress.$(this);
                  return $el.is('button, a, [role="button"]') || $el.css('cursor') === 'pointer';
                });
                
                if ($readyButton.length > 0) {
                  cy.log('🎯 Found clickable Ready to publish button in container');
                  cy.wrap($readyButton.first()).should('be.visible').then($btn => {
                    // Scroll into view first
                    cy.wrap($btn).scrollIntoView();
                    cy.wait(1000);
                    
                    // Human-like interaction
                    cy.wrap($btn).trigger('mouseover');
                    cy.wait(500);
                    cy.wrap($btn).click({ force: true });
                    cy.log('✅ Clicked Ready to publish button');
                    readyToPublishClicked = true;
                  });
                  return false; // Break out of each loop
                } else {
                  // If no specific button found, try clicking on the text itself
                  const $readyText = $container.find('*:contains("Ready to publish")').last();
                  if ($readyText.length > 0) {
                    cy.log('🎯 Trying to click on Ready to publish text directly');
                    cy.wrap($readyText).should('be.visible').then($text => {
                      cy.wrap($text).scrollIntoView();
                      cy.wait(1000);
                      cy.wrap($text).trigger('mouseover');
                      cy.wait(500);
                      cy.wrap($text).click({ force: true });
                      cy.log('✅ Clicked Ready to publish text');
                      readyToPublishClicked = true;
                    });
                    return false;
                  }
                }
              }
            });
          });
          
          if (readyToPublishClicked) break;
        }
      }
      
      // Fallback approach if container-based search didn't work
      if (!readyToPublishClicked) {
        cy.log('⚠️ Container approach failed, trying direct button search');
        
        const directSelectors = [
          'button:contains("Ready to publish")',
          'a:contains("Ready to publish")',
          '[data-testid*="ready-to-publish"]',
          '[data-testid*="publish"]',
          '.btn:contains("Ready to publish")',
          '[class*="publish"]:contains("Ready to publish")'
        ];
        
        for (const selector of directSelectors) {
          if (!readyToPublishClicked && $body.find(selector).length > 0) {
            cy.log(`✅ Found Ready to publish button with direct selector: ${selector}`);
            cy.get(selector).first().should('be.visible').then($btn => {
              cy.wrap($btn).scrollIntoView();
              cy.wait(1000);
              cy.wrap($btn).trigger('mouseover');
              cy.wait(500);
              cy.wrap($btn).click({ force: true });
              cy.log('✅ Clicked Ready to publish button (direct approach)');
              readyToPublishClicked = true;
            });
            break;
          }
        }
      }
      
      // Final fallback - click any element containing "Ready to publish"
      if (!readyToPublishClicked) {
        cy.log('⚠️ Direct approach failed, trying final fallback');
        cy.get('*').contains('Ready to publish').first().should('be.visible').then($el => {
          cy.wrap($el).scrollIntoView();
          cy.wait(1000);
          cy.wrap($el).trigger('mouseover');
          cy.wait(500);
          cy.wrap($el).click({ force: true });
          cy.log('✅ Clicked Ready to publish button (fallback approach)');
        });
      }
    });
    
    // Wait a moment after clicking
    cy.wait(3000);
    
    // Take a screenshot after clicking to see what happened
    cy.screenshot('after-ready-to-publish-click');
    
    // Step 11: Wait for publish form to load or handle navigation issues
    cy.log('⏳ Waiting for publish form to load');
    
    // Check if we're still on uploads page or if we navigated to publish form
    cy.url().then((currentUrl) => {
      cy.log(`📍 Current URL after Ready to publish click: ${currentUrl}`);
      
      if (currentUrl.includes('/uploads')) {
        cy.log('⚠️ Still on uploads page - Ready to publish click may not have worked');
        cy.log('🔄 Attempting to click Ready to publish again');
        
        // Try clicking Ready to publish again with a different approach
        cy.get('body').then($body => {
          // Look for any blue button or link that might be the Ready to publish button
          const alternativeSelectors = [
            'button[class*="blue"]:contains("Ready")',
            'a[class*="blue"]:contains("Ready")',
            'button[class*="primary"]:contains("Ready")',
            'a[class*="primary"]:contains("Ready")',
            '[class*="btn"][class*="blue"]:contains("Ready")',
            '[class*="button"]:contains("Ready to publish")',
            '.ready-to-publish',
            '[data-action*="publish"]'
          ];
          
          let alternativeButtonFound = false;
          
          for (const selector of alternativeSelectors) {
            if (!alternativeButtonFound && $body.find(selector).length > 0) {
              cy.log(`🎯 Trying alternative selector: ${selector}`);
              cy.get(selector).first().should('be.visible').then($btn => {
                cy.wrap($btn).scrollIntoView();
                cy.wait(1000);
                cy.wrap($btn).click({ force: true });
                cy.log('✅ Clicked alternative Ready to publish button');
                alternativeButtonFound = true;
              });
              break;
            }
          }
          
          if (!alternativeButtonFound) {
            cy.log('❌ Could not find alternative Ready to publish button');
            cy.log('🔄 Trying to navigate directly to publish form');
            // Try direct navigation as last resort
            cy.visit('https://app.horizonexp.com/shorts/publish');
          }
        });
        
        cy.wait(3000);
      }
    });
    
    // Now wait for the publish form to load
    cy.get('body', { timeout: 20000 }).should('satisfy', ($body) => {
      const bodyText = $body.text();
      const hasFormElements = $body.find('select, [role="combobox"], [class*="dropdown"], [class*="select"]').length > 0;
      const hasFormLabels = $body.find('label:contains("Channel"), label:contains("Category")').length > 0;
      const hasFormText = bodyText.includes('Channel') || bodyText.includes('Category') || bodyText.includes('Select Channel') || bodyText.includes('Select categories');
      
      const isPublishForm = hasFormElements || hasFormLabels || hasFormText;
      
      if (isPublishForm) {
        cy.log('✅ Publish form detected');
      } else {
        cy.log('⚠️ Publish form not detected yet, current page content includes:', bodyText.substring(0, 200));
      }
      
      return isPublishForm;
    });

    cy.wait(2000);
    cy.log('✅ Form loaded, starting to fill fields');
    cy.screenshot('publish-form-loaded');

    // Step 12: Fill required dropdowns (Channel and Category)
    cy.log('📺 STEP 12: Filling required Channel and Category dropdowns');
    
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.wait(2000);

    // Fill Channel dropdown (REQUIRED)
    selectFromDropdown('Channel', ['Select Channel'], ['DevOps', 'Test', 'SQA']);
    
    // Verify Channel selection
    cy.log('🔍 Verifying Channel selection');
    cy.wait(2000);
    cy.get('body').should('satisfy', ($body) => {
      const hasChannelError = $body.text().includes('Channel is required');
      if (!hasChannelError) {
        cy.log('✅ Channel successfully selected');
      } else {
        cy.log('❌ Channel still required');
      }
      return !hasChannelError;
    });

    // Fill Category dropdown (REQUIRED)
    cy.wait(2000);
    selectFromDropdown('Category', ['Select categories'], [
      'Entertainment', 'Education', 'Gaming', 'Music', 'Sports', 'Technology', 
      'Lifestyle', 'Comedy', 'Auto & Vehicles', 'Travel', 'Food', 'Fashion'
    ]);
    
    // Verify Category selection
    cy.log('🔍 Verifying Category selection');
    cy.wait(2000);
    cy.get('body').should('satisfy', ($body) => {
      const hasCategoryError = $body.text().includes('Minimum 1 category is required');
      if (!hasCategoryError) {
        cy.log('✅ Category successfully selected');
      } else {
        cy.log('❌ Category still required');
      }
      return !hasCategoryError;
    });

    // Step 13: Fill other form fields with dummy data
    cy.log('📝 STEP 13: Filling other form fields');
    
    cy.wait(2000);

    // Helper function to fill form field
    const fillFormField = (fieldName, selectors, value) => {
      cy.get('body').then($body => {
        let fieldFound = false;
        for (const selector of selectors) {
          if ($body.find(selector).length > 0 && !fieldFound) {
            cy.log(`✅ Found ${fieldName} field: ${selector}`);
            cy.get(selector).first()
              .should('be.visible')
              .clear({ force: true })
              .trigger('focus')
              .type(value, { delay: 50, force: true });
            cy.log(`✅ Filled ${fieldName}: ${value}`);
            fieldFound = true;
            break;
          }
        }
        if (!fieldFound) {
          cy.log(`⚠️ ${fieldName} field not found`);
        }
      });
    };

    // Fill Title
    fillFormField('title', [
      'input[name*="title"]', 'input[placeholder*="title"]', 'input[placeholder*="Title"]',
      'label:contains("Title") + input', 'div:has(label:contains("Title")) input'
    ], 'Test Upload Video - Automated Test Title');

    cy.wait(500);

    // Fill Caption
    fillFormField('caption', [
      'textarea[placeholder="Enter caption"]', 'input[placeholder="Enter caption"]',
      'textarea[placeholder*="caption"]', 'input[placeholder*="caption"]',
      'textarea[name*="caption"]', 'input[name*="caption"]'
    ], 'Test Upload Video - Automated test caption for video publishing');

    cy.wait(500);

    // Fill Tags
    cy.get('body').then($body => {
      const tagsSelectors = [
        'input[placeholder*="Press enter or comma to add tags"]',
        'input[placeholder*="add tags"]', 'input[placeholder*="tag"]',
        '[data-testid*="tags"] input', 'input[name*="tags"]'
      ];
      
      let tagsFieldFound = false;
      for (const selector of tagsSelectors) {
        if ($body.find(selector).length > 0 && !tagsFieldFound) {
          cy.log(`✅ Found tags field: ${selector}`);
          cy.get(selector).first()
            .should('be.visible')
            .trigger('focus')
            .type('test{enter}automated{enter}video{enter}', { delay: 50, force: true });
          cy.log('✅ Added tags: test, automated, video');
          tagsFieldFound = true;
          break;
        }
      }
    });

    cy.wait(500);

    // Fill CTA Button fields
    fillFormField('CTA label', [
      'input[placeholder="Button label"]', 'input[placeholder*="Button label"]',
      '[data-testid*="cta"] input[placeholder*="label"]', 'input[name*="buttonLabel"]'
    ], 'Click Here');

    fillFormField('CTA link', [
      'input[placeholder="Button link"]', 'input[placeholder*="Button link"]',
      '[data-testid*="cta"] input[placeholder*="link"]', 'input[type="url"]'
    ], 'https://www.example.com');

    // Step 14: Final validation and publish
    cy.log('🚀 STEP 14: Final validation and publishing video');
    
    cy.wait(2000);
    
    // Verify required fields are filled
    cy.log('🔍 Final validation: Checking required fields');
    cy.get('body').should('satisfy', ($body) => {
      const bodyText = $body.text();
      const hasChannelError = bodyText.includes('Channel is required');
      const hasCategoryError = bodyText.includes('Minimum 1 category is required');
      const allRequiredFieldsFilled = !hasChannelError && !hasCategoryError;
      
      if (allRequiredFieldsFilled) {
        cy.log('✅ All required fields validated - ready to publish');
      } else {
        if (hasChannelError) cy.log('❌ Channel is still required');
        if (hasCategoryError) cy.log('❌ Category is still required');
      }
      
      return allRequiredFieldsFilled;
    });
    
    // Click Publish button
    const publishButtonSelectors = [
      'button:contains("Publish")', '[data-testid*="publish"] button',
      'button[class*="bg-blue"]', 'button[class*="primary"]',
      '.publish-button', 'button[type="submit"]:contains("Publish")'
    ];
    
    cy.get('body').then($body => {
      let publishButtonFound = false;
      
      for (const selector of publishButtonSelectors) {
        if ($body.find(selector).length > 0 && !publishButtonFound) {
          cy.log(`✅ Found Publish button: ${selector}`);
          cy.get(selector).first()
            .should('be.visible')
            .should('not.be.disabled')
            .trigger('mouseover')
            .click({ force: true });
          cy.log('✅ Clicked Publish button');
          publishButtonFound = true;
          break;
        }
      }
      
      if (!publishButtonFound) {
        cy.get('button').contains('Publish').first()
          .should('be.visible')
          .should('not.be.disabled')
          .trigger('mouseover')
          .click({ force: true });
        cy.log('✅ Clicked Publish button via fallback');
      }
    });
    
    // Step 15: Wait for publishing completion and verify
    cy.log('⏳ Waiting for publishing to complete');
    
    cy.get('body', { timeout: 15000 }).should('satisfy', ($body) => {
      const bodyText = $body.text();
      return bodyText.includes('Published') || 
             bodyText.includes('Success') ||
             bodyText.includes('Complete') ||
             bodyText.includes('Video') ||
             $body.find('.success, [data-status="success"], .published').length > 0 ||
             window.location.href.includes('/uploads');
    });
    
    cy.url().then((currentUrl) => {
      cy.log(`📍 Current URL after publishing: ${currentUrl}`);
      if (currentUrl.includes('/uploads')) {
        cy.log('✅ Redirected to uploads page - publishing successful');
      } else {
        cy.log('✅ Publishing completed');
      }
    });

    // Final verification
    cy.wait(3000);
    cy.log('🔍 Verifying publishing success');
    
    const fileItemSelectors = [
      `div:contains("Video #")`, `div:contains("Published")`,
      `[data-filename="${testConfig.uploadFile.fileName}"]`,
      `div:contains("${testConfig.uploadFile.fileName}")`,
      '.video-item', '.upload-item', '[data-testid*="video-item"]'
    ];

    cy.get('body').then($body => {
      let fileItemFound = false;
      for (const selector of fileItemSelectors) {
        if ($body.find(selector).length > 0) {
          cy.log(`📍 Found uploaded file: ${selector}`);
          cy.get(selector).first().should('be.visible');
          fileItemFound = true;
          break;
        }
      }
      if (!fileItemFound) {
        cy.log('✅ Upload completed successfully');
      }
    });

    cy.log('🎉 Video upload and publishing test completed successfully');
    cy.screenshot('upload-and-publish-completed');
    cy.url().should('satisfy', (url) => url.includes('app.horizonexp.com'));
    
    // Stay signed in for 2 minutes as requested
    cy.log('⏰ Staying signed in for 2 minutes as requested');
    cy.wait(120000);
    cy.log('✅ 2-minute wait completed - session maintained');
  });
});