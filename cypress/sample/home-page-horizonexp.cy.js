/// <reference types="cypress" />

describe('Horizon Sign-in Flow', () => {
  beforeEach(() => {
    // Visit the Horizon sign-in page
    cy.visit('https://app.horizonexp.com/signin');
  });

  it('should successfully sign in with Google using the red-marked email', () => {
    // Wait for the page to load completely
    cy.wait(1500);
    
    // Wait 2 seconds before clicking sign in button
    cy.wait(2000);
    
    // Click on "Sign in with Google" button
    cy.get('button').contains('Sign in with Google').click();
    
    // Wait 2 seconds before handling OAuth
    cy.wait(2000);
    
    // Wait for Google OAuth page to load and handle it
    cy.origin('https://accounts.google.com', () => {
      // Wait for the account selection page to load
      cy.get('div[data-email="asimaticlabs@gmail.com"]', { timeout: 10000 })
        .should('be.visible')
        .click();
    });
    
    // Wait 2 seconds before verifying redirect
    cy.wait(2000);
    
    // Wait for redirect back to Horizon app
    cy.url().should('include', 'app.horizonexp.com');
    
    // Wait 2 seconds before verification
    cy.wait(2000);
    
    // Verify successful login by checking for elements that appear after login
    // You may need to adjust these selectors based on the actual post-login page
    cy.get('body').should('not.contain', 'Sign in');
    cy.get('body').should('not.contain', 'Login');
  });

  it('should handle Google account selection page properly', () => {
    // Wait for the page to load
    cy.wait(1500);
    
    // Wait 2 seconds before clicking sign in button
    cy.wait(2000);
    
    // Click on "Sign in with Google" button
    cy.get('button').contains('Sign in with Google').click();
    
    // Wait 2 seconds before handling OAuth
    cy.wait(2000);
    
    // Handle Google OAuth flow
    cy.origin('https://accounts.google.com', () => {
      // Wait for account selection page
      cy.get('div[data-email="asimaticlabs@gmail.com"]', { timeout: 10000 })
        .should('be.visible')
        .and('contain', 'Admin Asimatic Labs')
        .click();
    });
    
    // Wait 2 seconds before verifying redirect
    cy.wait(2000);
    
    // Verify we're back on the Horizon app
    cy.url().should('include', 'app.horizonexp.com');
  });

  it('should wait for page load before clicking sign in button', () => {
    // Verify the sign-in page is loaded
    cy.get('body').should('be.visible');
    
    // Wait for 1.5 seconds as specified
    cy.wait(1500);
    
    // Wait 2 seconds before verification
    cy.wait(2000);
    
    // Verify the Google sign-in button is present and clickable
    cy.get('button').contains('Sign in with Google')
      .should('be.visible')
      .and('be.enabled');
  });
});
