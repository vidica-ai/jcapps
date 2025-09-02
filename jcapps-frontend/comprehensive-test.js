const { chromium } = require('playwright');
const fs = require('fs');

// Create screenshots directory if it doesn't exist
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

async function comprehensiveTest() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1
  });
  
  const page = await context.newPage();
  
  const results = {
    loginPage: {},
    dashboard: {},
    authentication: {},
    design: {},
    functionality: {}
  };
  
  try {
    console.log('🚀 Starting comprehensive JC Apps testing...\n');
    
    // === LOGIN PAGE ANALYSIS ===
    console.log('📋 Testing Login Page...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Take screenshots
    await page.screenshot({ path: 'screenshots/01-login-desktop.png', fullPage: true });
    
    // Mobile responsive test
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: 'screenshots/02-login-mobile.png', fullPage: true });
    await page.setViewportSize({ width: 1920, height: 1080 }); // Reset
    
    // Analyze login page design
    const loginDesign = await page.evaluate(() => {
      const body = document.body;
      const container = document.querySelector('.login-container');
      const card = document.querySelector('.login-card');
      
      return {
        bodyBgColor: window.getComputedStyle(body).backgroundColor,
        containerBgColor: container ? window.getComputedStyle(container).backgroundColor : null,
        cardBgColor: card ? window.getComputedStyle(card).backgroundColor : null,
        hasLoginForm: !!document.querySelector('form'),
        hasEmailInput: !!document.querySelector('input[type="email"]'),
        hasPasswordInput: !!document.querySelector('input[type="password"]'),
        hasSubmitButton: !!document.querySelector('button[type="submit"]'),
        title: document.title,
        isDarkTheme: container ? window.getComputedStyle(container).backgroundColor === 'rgb(0, 0, 0)' : false
      };
    });
    
    results.loginPage = loginDesign;
    console.log('  ✅ Login page analyzed');
    console.log('  📊 Dark theme detected:', loginDesign.isDarkTheme);
    
    // === AUTHENTICATION TESTING ===
    console.log('\n🔐 Testing Authentication...');
    
    // Test with empty credentials
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/03-empty-login.png', fullPage: true });
    
    // Test with demo/test credentials
    const testCredentials = [
      { email: 'admin@jcapps.com', password: 'admin123' },
      { email: 'demo@example.com', password: 'demo123' },
      { email: 'test@test.com', password: 'test123' },
      { email: 'user@jcapps.com', password: 'password123' }
    ];
    
    let loggedIn = false;
    for (const creds of testCredentials) {
      console.log(`  🔑 Trying ${creds.email}...`);
      
      // Clear previous values
      await page.fill('input[type="email"]', '');
      await page.fill('input[type="password"]', '');
      
      // Enter credentials
      await page.fill('input[type="email"]', creds.email);
      await page.fill('input[type="password"]', creds.password);
      
      // Submit
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      
      // Check if redirected/login successful
      const currentUrl = page.url();
      const hasProspeccaoTitle = await page.$('text=Prospecção Ativa') || 
                                 await page.$('text=ProspeccaoAtiva') ||
                                 await page.$('[class*="ProspeccaoAtiva"]');
                                 
      const isDashboard = currentUrl !== 'http://localhost:3000/' || hasProspeccaoTitle;
      
      if (isDashboard) {
        console.log(`  ✅ Successfully logged in with ${creds.email}`);
        results.authentication.successful = true;
        results.authentication.credentials = creds.email;
        loggedIn = true;
        break;
      }
    }
    
    if (!loggedIn) {
      console.log('  ❌ Could not log in with test credentials');
      console.log('  📋 Checking if already in dashboard mode...');
      
      // Maybe we're already logged in or in a different state
      const hasProspeccaoElements = await page.$$('[class*="prospect"], [class*="client"], .bg-white');
      const hasDashboardElements = await page.$('[class*="dashboard"], [class*="main"]');
      
      if (hasProspeccaoElements.length > 0 || hasDashboardElements) {
        console.log('  ℹ️  Application appears to be in dashboard/main mode');
        loggedIn = true;
      }
    }
    
    // === DASHBOARD/MAIN PAGE ANALYSIS ===
    if (loggedIn) {
      console.log('\n📊 Testing Dashboard/Main Application...');
      await page.screenshot({ path: 'screenshots/04-dashboard-main.png', fullPage: true });
      
      // Analyze main page design
      const mainDesign = await page.evaluate(() => {
        const body = document.body;
        const main = document.querySelector('main, [class*="main"], [class*="dashboard"]');
        
        // Look for modern design elements
        const hasWhiteCards = document.querySelectorAll('.bg-white, [class*="white"]').length;
        const hasGrayBackground = document.querySelectorAll('[class*="gray-"], .bg-gray').length;
        const hasBlueAccents = document.querySelectorAll('[class*="blue-"], .text-blue, .bg-blue').length;
        const hasModernSpacing = document.querySelectorAll('[class*="space-"], [class*="gap-"], [class*="p-"], [class*="m-"]').length;
        
        // Check for ProspeccaoAtiva elements
        const prospeccaoTitle = document.querySelector('h1, h2, h3') ?
          Array.from(document.querySelectorAll('h1, h2, h3')).find(h => 
            h.textContent.includes('Prospec') || h.textContent.includes('Prospect')
          ) : null;
          
        return {
          bodyBgColor: window.getComputedStyle(body).backgroundColor,
          mainBgColor: main ? window.getComputedStyle(main).backgroundColor : null,
          hasWhiteCards,
          hasGrayBackground,
          hasBlueAccents,
          hasModernSpacing,
          prospeccaoTitle: prospeccaoTitle ? prospeccaoTitle.textContent : null,
          totalElements: document.querySelectorAll('*').length,
          hasMinimalistDesign: hasWhiteCards > 0 && hasGrayBackground > 0
        };
      });
      
      results.dashboard = mainDesign;
      console.log('  ✅ Dashboard analyzed');
      console.log('  🎨 Minimalist design detected:', mainDesign.hasMinimalistDesign);
      console.log('  📋 ProspeccaoAtiva title:', mainDesign.prospeccaoTitle || 'Not found');
      
      // === FUNCTIONALITY TESTING ===
      console.log('\n⚙️  Testing Functionality...');
      
      // Look for search functionality
      const searchInput = await page.$('input[placeholder*="Buscar"], input[placeholder*="buscar"], input[placeholder*="Search"]');
      if (searchInput) {
        console.log('  🔍 Testing search functionality...');
        await page.fill('input[placeholder*="Buscar"], input[placeholder*="buscar"], input[placeholder*="Search"]', 'test');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/05-search-test.png', fullPage: true });
        results.functionality.hasSearch = true;
      }
      
      // Look for client cards/elements
      const clientElements = await page.$$('.bg-white.rounded, [class*="card"], [class*="client"]');
      console.log(`  📋 Found ${clientElements.length} potential client cards`);
      results.functionality.clientCards = clientElements.length;
      
      if (clientElements.length > 0) {
        console.log('  🎯 Testing client interaction...');
        await clientElements[0].click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/06-client-detail.png', fullPage: true });
        
        // Look for note functionality
        const noteButton = await page.$('button:has-text("Nova Observação"), button:has-text("Add Note"), button:has-text("Nova")');
        if (noteButton) {
          console.log('  📝 Testing note functionality...');
          await noteButton.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: 'screenshots/07-note-modal.png', fullPage: true });
          results.functionality.hasNoteFunction = true;
        }
      }
      
      // Test responsive design
      console.log('  📱 Testing responsive design...');
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.screenshot({ path: 'screenshots/08-tablet-view.png', fullPage: true });
      
      await page.setViewportSize({ width: 375, height: 667 });
      await page.screenshot({ path: 'screenshots/09-mobile-view.png', fullPage: true });
    }
    
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    console.log('Login Page:');
    console.log(`  - Dark theme: ${results.loginPage.isDarkTheme ? '❌ Yes (should be light)' : '✅ No'}`);
    console.log(`  - Form elements: ${results.loginPage.hasLoginForm ? '✅' : '❌'}`);
    
    if (results.authentication.successful) {
      console.log('Authentication:');
      console.log(`  - Status: ✅ Successful with ${results.authentication.credentials}`);
      
      console.log('Dashboard:');
      console.log(`  - Minimalist design: ${results.dashboard.hasMinimalistDesign ? '✅' : '❌'}`);
      console.log(`  - White cards: ${results.dashboard.hasWhiteCards} elements`);
      console.log(`  - ProspeccaoAtiva: ${results.dashboard.prospeccaoTitle ? '✅' : '❌'}`);
      
      console.log('Functionality:');
      console.log(`  - Search: ${results.functionality.hasSearch ? '✅' : '❌'}`);
      console.log(`  - Client cards: ${results.functionality.clientCards || 0}`);
      console.log(`  - Note function: ${results.functionality.hasNoteFunction ? '✅' : '❌'}`);
    } else {
      console.log('Authentication: ❌ Failed to login');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
    await page.screenshot({ path: 'screenshots/error-state.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n🏁 Comprehensive testing completed');
    console.log('📸 Screenshots saved in ./screenshots/ directory');
  }
  
  return results;
}

comprehensiveTest();