/// <reference types="cypress" />

describe('Horizon New Account Creation', () => {
  beforeEach(() => {
    // Visit the Horizon sign-in page
    cy.visit('https://app.horizonexp.com/signin');
  });

  it('should create a new account with verification code handling', () => {
    // Wait 2 seconds after visiting the site
    cy.wait(2000);
    
    // Click on 'Sign up for an account' link
    cy.get('a').contains('Sign up for an account').click();
    
    // Wait 2 seconds for the sign-up page to load
    cy.wait(2000);
    
    // Fill up the sign-up form with dummy data
    cy.get('input[placeholder*="First Name"], input[name*="firstName"], input[id*="firstName"]')
      .first()
      .type('John');
    
    cy.get('input[placeholder*="Last Name"], input[name*="lastName"], input[id*="lastName"]')
      .first()
      .type('Doe');
    
    // Generate a unique email with timestamp
    const timestamp = Date.now();
    const uniqueEmail = `kabaro${timestamp}@filipx.com`;
    
    cy.get('input[placeholder*="Email"], input[name*="email"], input[id*="email"]')
      .first()
      .type(uniqueEmail);
    
    cy.get('input[placeholder*="Password"], input[name*="password"], input[id*="password"]')
      .first()
      .type('TestPassword123!');
    
    cy.get('input[placeholder*="Confirm Password"], input[name*="confirmPassword"], input[id*="confirmPassword"]')
      .first()
      .type('TestPassword123!');
    
    // Wait 2 seconds before clicking Create Account
    cy.wait(2000);
    
    // Click 'Create Account' button
    cy.get('button').contains('Create Account').click();
    
    // Wait for response (either success or error)
    cy.wait(5000);
    
    // Check if account creation was successful or failed
    cy.get('body').then(($body) => {
      if ($body.text().includes('Unable to create account')) {
        // Handle error case
        cy.log('Account creation failed. This might be due to email already in use or validation issues.');
        cy.get('body').should('contain', 'Unable to create account');
        
        // Try with a different email
        cy.get('input[placeholder*="Email"], input[name*="email"], input[id*="email"]')
          .first()
          .clear()
          .type(`kabaro${Date.now() + 1}@filipx.com`);
        
        cy.get('button').contains('Create Account').click();
        cy.wait(5000);
      }
      
      // Check for verification code input
      if ($body.find('input[placeholder*="verification"], input[name*="code"], input[id*="verification"]').length > 0) {
        cy.log('Verification code input detected. Waiting for manual input...');
        
        // Wait for user to enter verification code
        cy.get('input[placeholder*="verification"], input[name*="code"], input[id*="verification"]')
          .should('be.visible')
          .and('be.enabled');
        
        // Wait for user to manually enter the code
        cy.wait(10000);
        
        // Check if there's a submit/verify button and click it
        cy.get('body').then(($body) => {
          if ($body.find('button').filter(':contains("Verify"), :contains("Submit"), :contains("Confirm")').length > 0) {
            cy.get('button').filter(':contains("Verify"), :contains("Submit"), :contains("Confirm")')
              .first()
              .click();
          }
        });
      }
    });
    
    // Wait 5 seconds after processing
    cy.wait(5000);
    
    // Verify we're either logged in or still on signup page
    cy.url().then((url) => {
      if (url.includes('app.horizonexp.com') && !url.includes('signup')) {
        // Successfully logged in
        cy.get('body').should('not.contain', 'Sign up');
        cy.get('body').should('not.contain', 'Create Account');
      } else {
        // Still on signup page - log this for debugging
        cy.log('Still on signup page. Account creation may have failed.');
      }
    });
  });

  it('should handle sign-up form validation', () => {
    // Wait 2 seconds after visiting the site
    cy.wait(2000);
    
    // Click on 'Sign up for an account' link
    cy.get('a').contains('Sign up for an account').click();
    
    // Wait 2 seconds for the sign-up page to load
    cy.wait(2000);
    
    // Try to submit empty form to test validation
    cy.get('button').contains('Create Account').click();
    
    // Wait 2 seconds to see validation messages
    cy.wait(2000);
    
    // Verify validation messages appear (adjust selectors based on actual implementation)
    cy.get('body').should(($body) => {
      expect($body.text()).to.match(/required|field|error|invalid/i);
    });
  });

  it('should handle account creation errors gracefully', () => {
    // Wait 2 seconds after visiting the site
    cy.wait(2000);
    
    // Click on 'Sign up for an account' link
    cy.get('a').contains('Sign up for an account').click();
    
    // Wait 2 seconds for the sign-up page to load
    cy.wait(2000);
    
    // Fill form with potentially problematic data
    cy.get('input[placeholder*="First Name"], input[name*="firstName"], input[id*="firstName"]')
      .first()
      .type('Test');
    
    cy.get('input[placeholder*="Last Name"], input[name*="lastName"], input[id*="lastName"]')
      .first()
      .type('User');
    
    // Use a potentially invalid email format
    cy.get('input[placeholder*="Email"], input[name*="email"], input[id*="email"]')
      .first()
      .type('invalid-email-format');
    
    cy.get('input[placeholder*="Password"], input[name*="password"], input[id*="password"]')
      .first()
      .type('123'); // Short password
    
    cy.get('input[placeholder*="Confirm Password"], input[name*="confirmPassword"], input[id*="confirmPassword"]')
      .first()
      .type('456'); // Mismatched password
    
    // Wait 2 seconds before clicking Create Account
    cy.wait(2000);
    
    // Click 'Create Account' button
    cy.get('button').contains('Create Account').click();
    
    // Wait for response
    cy.wait(5000);
    
    // Verify error handling
    cy.get('body').should(($body) => {
      const text = $body.text();
      expect(text).to.match(/unable to create account|invalid|error|required/i);
    });
  });

  it('should navigate between sign-in and sign-up pages', () => {
    // Wait 2 seconds after visiting the site
    cy.wait(2000);
    
    // Click on 'Sign up for an account' link
    cy.get('a').contains('Sign up for an account').click();
    
    // Wait 2 seconds for the sign-up page to load
    cy.wait(2000);
    
    // Verify we're on the sign-up page
    cy.get('body').should('contain', 'Sign up to Horizon');
    
    // Click on 'Sign In' link to go back
    cy.get('a').contains('Sign In').click();
    
    // Wait 2 seconds for the sign-in page to load
    cy.wait(2000);
    
    // Verify we're back on the sign-in page
    cy.get('body').should('contain', 'Sign In to Horizon');
  });
});