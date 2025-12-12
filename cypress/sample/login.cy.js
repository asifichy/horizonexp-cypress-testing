/// <reference types="cypress" />

describe('Horizon Login Process', () => {
  beforeEach(() => {
    // Visit the Horizon sign-in page
    cy.visit('https://app.horizonexp.com/signin');
  });

  it('should successfully login with email and password', () => {
    // Wait 3 seconds after visiting the site
    cy.wait(3000);
    
    // Verify we're on the sign-in page
    cy.get('body').should('contain', 'Sign In to Horizon');
    
    // Wait 2 seconds before filling email (human-like delay)
    cy.wait(2000);
    
    // Fill in the email field with human-like typing speed
    cy.get('input[placeholder*="Email"], input[name*="email"], input[id*="email"]')
      .first()
      .type('kabaro2210@filipx.com', { delay: 100 });
    
    // Wait 2 seconds between email and password (human behavior)
    cy.wait(1000);
    
    // Wait 3 seconds before filling password
    cy.wait(1000);
    
    // Fill in the password field with human-like typing speed
    cy.get('input[placeholder*="Password"], input[name*="password"], input[id*="password"]')
      .first()
      .type('TestPassword123!', { delay: 120 });
    
    // Wait 2 seconds before clicking sign in (human hesitation)
    cy.wait(1000);
    
    // Wait 1 seconds before clicking sign in
    cy.wait(1000);
    
    // Click the 'Sign In' button
    cy.get('button').contains('Sign In').click();
    
    // Wait 5 seconds for login processing (server response time)
    cy.wait(5000);
    
    // Verify successful login by checking URL and page content
    cy.url().should('include', 'app.horizonexp.com');
    cy.url().should('not.include', 'signin');
    
    // Wait 3 seconds before final verification
    cy.wait(3000);
    
    // Verify we're logged in (check for elements that appear after login)
    cy.get('body').should('not.contain', 'Sign In');
    cy.get('body').should('not.contain', 'Sign up');
    
    // Wait 15 seconds after successful login (as requested)
    cy.wait(15000);
  });

//   it('should handle login with Google OAuth', () => {
//     // Wait 3 seconds after visiting the site
//     cy.wait(3000);
    
//     // Verify we're on the sign-in page
//     cy.get('body').should('contain', 'Sign In to Horizon');
    
//     // Wait 3 seconds before clicking Google sign-in
//     cy.wait(3000);
    
//     // Click on "Sign in with Google" button
//     cy.get('button').contains('Sign in with Google').click();
    
//     // Wait 3 seconds for OAuth page to load
//     cy.wait(3000);
    
//     // Handle Google OAuth flow
//     cy.origin('https://accounts.google.com', () => {
//       // Wait for the account selection page to load
//       cy.get('div[data-email="asimaticlabs@gmail.com"]', { timeout: 10000 })
//         .should('be.visible')
//         .click();
//     });
    
//     // Wait 3 seconds for redirect back to Horizon app
//     cy.wait(3000);
    
//     // Verify we're back on the Horizon app
//     cy.url().should('include', 'app.horizonexp.com');
    
//     // Wait 3 seconds before final verification
//     cy.wait(3000);
    
//     // Verify successful login
//     cy.get('body').should('not.contain', 'Sign In');
//     cy.get('body').should('not.contain', 'Sign up');
//   });

//   it('should handle invalid login credentials', () => {
//     // Wait 3 seconds after visiting the site
//     cy.wait(3000);
    
//     // Verify we're on the sign-in page
//     cy.get('body').should('contain', 'Sign In to Horizon');
    
//     // Wait 3 seconds before filling invalid email
//     cy.wait(3000);
    
//     // Fill in invalid email
//     cy.get('input[placeholder*="Email"], input[name*="email"], input[id*="email"]')
//       .first()
//       .type('invalid@email.com');
    
//     // Wait 3 seconds before filling invalid password
//     cy.wait(3000);
    
//     // Fill in invalid password
//     cy.get('input[placeholder*="Password"], input[name*="password"], input[id*="password"]')
//       .first()
//       .type('WrongPassword123!');
    
//     // Wait 3 seconds before clicking sign in
//     cy.wait(3000);
    
//     // Click the 'Sign In' button
//     cy.get('button').contains('Sign In').click();
    
//     // Wait 3 seconds for error response
//     cy.wait(3000);
    
//     // Verify error message appears
//     cy.get('body').should(($body) => {
//       const text = $body.text();
//       expect(text).to.match(/invalid|incorrect|error|failed|wrong/i);
//     });
    
//     // Wait 3 seconds before final verification
//     cy.wait(3000);
    
//     // Verify we're still on the sign-in page
//     cy.url().should('include', 'signin');
//     cy.get('body').should('contain', 'Sign In to Horizon');
//   });

//   it('should handle empty form submission', () => {
//     // Wait 3 seconds after visiting the site
//     cy.wait(3000);
    
//     // Verify we're on the sign-in page
//     cy.get('body').should('contain', 'Sign In to Horizon');
    
//     // Wait 3 seconds before clicking sign in without filling fields
//     cy.wait(3000);
    
//     // Click the 'Sign In' button without filling any fields
//     cy.get('button').contains('Sign In').click();
    
//     // Wait 3 seconds for validation messages
//     cy.wait(3000);
    
//     // Verify validation messages appear
//     cy.get('body').should(($body) => {
//       const text = $body.text();
//       expect(text).to.match(/required|field|error|invalid/i);
//     });
    
//     // Wait 3 seconds before final verification
//     cy.wait(3000);
    
//     // Verify we're still on the sign-in page
//     cy.url().should('include', 'signin');
//     cy.get('body').should('contain', 'Sign In to Horizon');
//   });

//   it('should navigate to sign-up page from login', () => {
//     // Wait 3 seconds after visiting the site
//     cy.wait(3000);
    
//     // Verify we're on the sign-in page
//     cy.get('body').should('contain', 'Sign In to Horizon');
    
//     // Wait 3 seconds before clicking sign up link
//     cy.wait(3000);
    
//     // Click on 'Sign up for an account' link
//     cy.get('a').contains('Sign up for an account').click();
    
//     // Wait 3 seconds for the sign-up page to load
//     cy.wait(3000);
    
//     // Verify we're on the sign-up page
//     cy.get('body').should('contain', 'Sign up to Horizon');
    
//     // Wait 3 seconds before navigating back
//     cy.wait(3000);
    
//     // Click on 'Sign In' link to go back
//     cy.get('a').contains('Sign In').click();
    
//     // Wait 3 seconds for the sign-in page to load
//     cy.wait(3000);
    
//     // Verify we're back on the sign-in page
//     cy.get('body').should('contain', 'Sign In to Horizon');
//   });

//   it('should test "Remember me" functionality', () => {
//     // Wait 3 seconds after visiting the site
//     cy.wait(3000);
    
//     // Verify we're on the sign-in page
//     cy.get('body').should('contain', 'Sign In to Horizon');
    
//     // Wait 3 seconds before filling email
//     cy.wait(3000);
    
//     // Fill in the email field
//     cy.get('input[placeholder*="Email"], input[name*="email"], input[id*="email"]')
//       .first()
//       .type('kabaro2210@filipx.com');
    
//     // Wait 3 seconds before filling password
//     cy.wait(3000);
    
//     // Fill in the password field
//     cy.get('input[placeholder*="Password"], input[name*="password"], input[id*="password"]')
//       .first()
//       .type('TestPassword123!');
    
//     // Wait 3 seconds before checking remember me
//     cy.wait(3000);
    
//     // Check the "Remember me" checkbox if it exists
//     cy.get('body').then(($body) => {
//       if ($body.find('input[type="checkbox"]').length > 0) {
//         cy.get('input[type="checkbox"]').first().check();
//       }
//     });
    
//     // Wait 3 seconds before clicking sign in
//     cy.wait(3000);
    
//     // Click the 'Sign In' button
//     cy.get('button').contains('Sign In').click();
    
//     // Wait 3 seconds for login processing
//     cy.wait(3000);
    
//     // Verify successful login
//     cy.url().should('include', 'app.horizonexp.com');
//     cy.url().should('not.include', 'signin');
    
//     // Wait 3 seconds before final verification
//     cy.wait(3000);
    
//     // Verify we're logged in
//     cy.get('body').should('not.contain', 'Sign In');
//   });

//   it('should test "Forgot your password?" functionality', () => {
//     // Wait 3 seconds after visiting the site
//     cy.wait(3000);
    
//     // Verify we're on the sign-in page
//     cy.get('body').should('contain', 'Sign In to Horizon');
    
//     // Wait 3 seconds before clicking forgot password
//     cy.wait(3000);
    
//     // Click on "Forgot your password?" link
//     cy.get('a').contains('Forgot your password?').click();
    
//     // Wait 3 seconds for password reset page to load
//     cy.wait(3000);
    
//     // Verify we're on password reset page (adjust based on actual implementation)
//     cy.get('body').should(($body) => {
//       const text = $body.text();
//       expect(text).to.match(/forgot|reset|password|email/i);
//     });
    
//     // Wait 3 seconds before final verification
//     cy.wait(3000);
    
//     // Verify we're on a different page than sign-in
//     cy.url().should('not.include', 'signin');
//   });
});