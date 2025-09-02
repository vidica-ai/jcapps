const { chromium } = require('playwright');

async function testApplication() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Testing JC Apps application...');
    
    // Navigate to the application
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'login-page.png',
      fullPage: true 
    });
    console.log('📸 Login page screenshot saved');
    
    // Get page title and basic info
    const title = await page.title();
    const url = page.url();
    console.log('📄 Page title:', title);
    console.log('🔗 Current URL:', url);
    
    // Check for key elements
    const hasEmailInput = await page.$('input[type="email"]') !== null;
    const hasPasswordInput = await page.$('input[type="password"]') !== null;
    const hasLoginButton = await page.$('button[type="submit"]') !== null;
    
    console.log('🔍 Login form elements:');
    console.log('  Email input:', hasEmailInput);
    console.log('  Password input:', hasPasswordInput);
    console.log('  Login button:', hasLoginButton);
    
    // Try to analyze the page content for design elements
    const bodyClasses = await page.evaluate(() => document.body.className);
    const hasProspeccaoElements = await page.$$('.ProspeccaoAtiva, [class*="prospect"]');
    
    console.log('🎨 Design analysis:');
    console.log('  Body classes:', bodyClasses);
    console.log('  Prospeccao elements found:', hasProspeccaoElements.length);
    
    // Check background color and theme
    const backgroundColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    console.log('  Background color:', backgroundColor);
    
    await browser.close();
    console.log('✅ Basic testing completed');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    await browser.close();
  }
}

testApplication();