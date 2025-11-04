/// <reference types="cypress" />

describe("Horizon Page Navigation Tests", () => {
  before(() => {
    // Create and cache the login session
    cy.session('horizon-login', () => {
      // Visit the Horizon sign-in page
      cy.visit("https://app.horizonexp.com/signin");
      
      // Wait 3 seconds after visiting the site
      cy.wait(3000);

      // Verify we're on the sign-in page
      cy.get("body").should("contain", "Sign In to Horizon");

      // Wait 2 seconds before filling email (human-like delay)
      cy.wait(2000);

      // Fill in the email field with human-like typing speed
      cy.get(
        'input[placeholder*="Email"], input[name*="email"], input[id*="email"]'
      )
        .first()
        .type("kabaro2210@filipx.com", { delay: 100 });

      // Wait 1 second between email and password (human behavior)
      cy.wait(1000);

      // Wait 1 second before filling password
      cy.wait(1000);

      // Fill in the password field with human-like typing speed
      cy.get(
        'input[placeholder*="Password"], input[name*="password"], input[id*="password"]'
      )
        .first()
        .type("TestPassword123!", { delay: 120 });

      // Wait 1 second before clicking sign in (human hesitation)
      cy.wait(1000);

      // Wait 1 second before clicking sign in
      cy.wait(1000);

      // Click the 'Sign In' button
      cy.get("button").contains("Sign In").click();

      // Wait 5 seconds for login processing (server response time)
      cy.wait(5000);

      // Verify successful login by checking URL and page content
      cy.url().should("include", "app.horizonexp.com");
      cy.url().should("not.include", "signin");

      // Wait 3 seconds before final verification
      cy.wait(3000);

      // Verify we're logged in (check for elements that appear after login)
      cy.get("body").should("not.contain", "Sign In");
      cy.get("body").should("not.contain", "Sign up");

      // Wait 10 seconds after successful login
      cy.wait(10000);
    });
  });

  beforeEach(() => {
    // Restore the cached session
    cy.session('horizon-login');
    
    // Visit the main app page (session will be restored)
    cy.visit("https://app.horizonexp.com");
    
    // Wait 3 seconds for page to load
    cy.wait(3000);
    
    // Verify we're still logged in
    cy.get("body").should("not.contain", "Sign In");
    cy.get("body").should("not.contain", "Sign up");
  });

  it("should visit Shorts Library page", () => {
    // Navigate to Shorts Library
    cy.get('a').contains('Library').click();
    
    // Wait 5 seconds on the page
    cy.wait(5000);
    
    // Verify we're on the Shorts Library page
    cy.get('body').should('contain', 'Shorts Library');
    cy.url().should('include', 'app.horizonexp.com');
  });

  it("should visit Shorts Entry Points page", () => {
    // Navigate to Entry Points
    cy.get('a').contains('Entry Points').click();
    
    // Wait 5 seconds on the page
    cy.wait(5000);
    
    // Verify we're on the Entry Points page
    cy.get('body').should('contain', 'Entry Points');
    cy.url().should('include', 'app.horizonexp.com');
  });

  it("should visit Shorts Uploads page", () => {
    // Navigate to Uploads
    cy.get('a').contains('Uploads').click();
    
    // Wait 5 seconds on the page
    cy.wait(5000);
    
    // Verify we're on the Uploads page
    cy.get('body').should('contain', 'Uploads');
    cy.url().should('include', 'app.horizonexp.com');
  });

  it("should visit Shorts Channels page", () => {
    // Navigate to Channels
    cy.get('a').contains('Channels').click();
    
    // Wait 5 seconds on the page
    cy.wait(5000);
    
    // Verify we're on the Channels page
    cy.get('body').should('contain', 'Channels');
    cy.url().should('include', 'app.horizonexp.com');
  });

  it("should visit Shorts Users page", () => {
    // Navigate to Users
    cy.get('a').contains('Users').click();
    
    // Wait 5 seconds on the page
    cy.wait(5000);
    
    // Verify we're on the Users page
    cy.get('body').should('contain', 'Users');
    cy.url().should('include', 'app.horizonexp.com');
  });

  it("should visit Shorts Metrics page", () => {
    // Navigate to Metrics
    cy.get('a').contains('Metrics').click();
    
    // Wait 5 seconds on the page
    cy.wait(5000);
    
    // Verify we're on the Metrics page
    cy.get('body').should('contain', 'Metrics');
    cy.url().should('include', 'app.horizonexp.com');
  });

  it("should visit Campaign page", () => {
    // Navigate to Campaign
    cy.get('div').contains('Campaign').click();
    
    // Wait 5 seconds on the page
    cy.wait(5000);
    
    // Verify we're on the Campaign page
    cy.get('body').should('contain', 'Campaign');
    cy.url().should('include', 'app.horizonexp.com');
  });

  it("should visit UGC page", () => {
    // Navigate to UGC
    cy.get('div').contains('UGC').click();
    
    // Wait 5 seconds on the page
    cy.wait(5000);
    
    // Verify we're on the UGC page
    cy.get('body').should('contain', 'UGC');
    cy.url().should('include', 'app.horizonexp.com');
  });

  it("should visit Experience page", () => {
    // Navigate to Experience
    cy.get('div').contains('Experience').click();
    
    // Wait 5 seconds on the page
    cy.wait(5000);
    
    // Verify we're on the Experience page
    cy.get('body').should('contain', 'Experience');
    cy.url().should('include', 'app.horizonexp.com');
  });

  it("should test navigation between multiple pages", () => {
    // Visit Library page
    cy.get('a').contains('Library').click();
    cy.wait(5000);
    cy.get('body').should('contain', 'Library');
    
    // Navigate to Entry Points
    cy.get('a').contains('Entry Points').click();
    cy.wait(5000);
    cy.get('body').should('contain', 'Entry Points');
    
    // Navigate to Uploads
    cy.get('a').contains('Uploads').click();
    cy.wait(5000);
    cy.get('body').should('contain', 'Uploads');
    
    // Navigate to Channels
    cy.get('a').contains('Channels').click();
    cy.wait(5000);
    cy.get('body').should('contain', 'Channels');
    
    // Navigate to Users
    cy.get('a').contains('Users').click();
    cy.wait(5000);
    cy.get('body').should('contain', 'Users');
    
    // Navigate to Metrics
    cy.get('a').contains('Metrics').click();
    cy.wait(5000);
    cy.get('body').should('contain', 'Metrics');
  });

  it("should test main navigation sections", () => {
    // Test Shorts section
    cy.get('div').contains('Shorts').click();
    cy.wait(5000);
    cy.get('body').should('contain', 'Shorts');
    
    // Test Campaign section
    cy.get('div').contains('Campaign').click();
    cy.wait(5000);
    cy.get('body').should('contain', 'Campaign');
    
    // Test UGC section
    cy.get('div').contains('UGC').click();
    cy.wait(5000);
    cy.get('body').should('contain', 'UGC');
    
    // Test Experience section
    cy.get('div').contains('Experience').click();
    cy.wait(5000);
    cy.get('body').should('contain', 'Experience');
  });
});
