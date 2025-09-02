const { chromium } = require('playwright');

async function testApplication() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🚀 Starting UI tests for JC Apps...');
    
    // Navigate to the application
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of login page
    await page.screenshot({ 
      path: 'screenshots/01-login-page.png',
      fullPage: true 
    });
    console.log('📸 Screenshot taken: Login page');
    
    // Check if login form elements are present
    const emailField = await page.$('input[type="email"]');
    const passwordField = await page.$('input[type="password"]');
    const loginButton = await page.$('button[type="submit"]');
    
    console.log('✅ Login form elements detected:', {
      email: !!emailField,
      password: !!passwordField,
      loginButton: !!loginButton
    });
    
    // Try to log in (we'll need credentials or check if there's a demo mode)
    if (emailField && passwordField && loginButton) {
      // First, let's see what happens with empty credentials
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: 'screenshots/02-login-empty-validation.png',
        fullPage: true 
      });
      console.log('📸 Screenshot taken: Login validation');
      
      // Try with demo credentials if they exist
      await page.fill('input[type="email"]', 'demo@example.com');
      await page.fill('input[type="password"]', 'demo123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ 
        path: 'screenshots/03-login-attempt.png',
        fullPage: true 
      });
      console.log('📸 Screenshot taken: Login attempt');
      
      // Check if we're redirected to dashboard
      const currentUrl = page.url();
      if (currentUrl.includes('dashboard') || await page.$('[data-testid="dashboard"]') || await page.$('.ProspeccaoAtiva')) {
        console.log('✅ Successfully logged in or reached dashboard');
        
        await page.screenshot({ 
          path: 'screenshots/04-dashboard-main.png',
          fullPage: true 
        });
        console.log('📸 Screenshot taken: Dashboard/Main page');
        
        // Look for ProspeccaoAtiva elements
        const prospeccaoElements = await page.$$('.ProspeccaoAtiva, [class*="prospect"], [class*="client"]');
        console.log(`🔍 Found ${prospeccaoElements.length} prospect/client related elements`);
        
        // Test search functionality
        const searchInput = await page.$('input[placeholder*="Buscar"], input[placeholder*="Search"]');
        if (searchInput) {
          await page.fill('input[placeholder*="Buscar"], input[placeholder*="Search"]', 'teste');
          await page.waitForTimeout(1000);
          await page.screenshot({ 
            path: 'screenshots/05-search-functionality.png',
            fullPage: true 
          });
          console.log('📸 Screenshot taken: Search functionality');
        }
        
        // Look for client cards or list items
        const clientCards = await page.$$('[class*="card"], [class*="client"], .bg-white.rounded');
        console.log(`🔍 Found ${clientCards.length} potential client cards`);
        
        if (clientCards.length > 0) {
          // Click on the first client card to test navigation
          await clientCards[0].click();
          await page.waitForTimeout(2000);
          
          await page.screenshot({ 
            path: 'screenshots/06-client-detail.png',
            fullPage: true 
          });
          console.log('📸 Screenshot taken: Client detail page');
          
          // Test note adding functionality
          const addNoteButton = await page.$('button:has-text("Nova Observação"), button:has-text("Add Note"), button:has-text("Nova")');
          if (addNoteButton) {
            await addNoteButton.click();
            await page.waitForTimeout(1000);
            
            await page.screenshot({ 
              path: 'screenshots/07-add-note-modal.png',
              fullPage: true 
            });
            console.log('📸 Screenshot taken: Add note modal');
            
            // Close modal
            const closeButton = await page.$('button:has-text("Cancelar"), button:has-text("Cancel"), [data-testid="close"]');
            if (closeButton) {
              await closeButton.click();
            }
          }
          
          // Test back navigation
          const backButton = await page.$('button:has-text("←"), [data-testid="back"], button svg');
          if (backButton) {
            await backButton.click();
            await page.waitForTimeout(1000);
            
            await page.screenshot({ 
              path: 'screenshots/08-back-to-list.png',
              fullPage: true 
            });
            console.log('📸 Screenshot taken: Back to prospect list');
          }
        }
        
        // Test responsive design
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(1000);
        await page.screenshot({ 
          path: 'screenshots/09-responsive-tablet.png',
          fullPage: true 
        });
        console.log('📸 Screenshot taken: Tablet responsive view');
        
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(1000);
        await page.screenshot({ 
          path: 'screenshots/10-responsive-mobile.png',
          fullPage: true 
        });
        console.log('📸 Screenshot taken: Mobile responsive view');
        
      } else {
        console.log('❌ Login failed or authentication issue detected');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ 
      path: 'screenshots/error-state.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
    console.log('🏁 UI tests completed');
  }
}

// Create screenshots directory first
const fs = require('fs');
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

testApplication();