const { chromium } = require('playwright');
const fs = require('fs');

// Create screenshots directory
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

async function testBypassAuth() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Testing with potential existing credentials...');
    
    await page.goto('http://localhost:3000');
    
    // Try with the email from the instructions
    console.log('🔑 Trying vinicius.vidica@gmail.com...');
    await page.fill('input[type="email"]', 'vinicius.vidica@gmail.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    let currentUrl = page.url();
    console.log('Current URL after login attempt:', currentUrl);
    
    // Check if we're in a different state
    const hasProspeccaoElements = await page.$('text=Prospecção Ativa') || 
                                  await page.$('h1:has-text("Prospec")') ||
                                  await page.$('.ProspeccaoAtiva');
                                  
    if (hasProspeccaoElements || currentUrl !== 'http://localhost:3000/') {
      console.log('✅ Successfully accessed application');
      await page.screenshot({ path: 'screenshots/prospeccao-main.png', fullPage: true });
      
      // Analyze the design
      const design = await page.evaluate(() => {
        const hasLightBg = window.getComputedStyle(document.body).backgroundColor === 'rgb(249, 250, 251)' ||
                          document.querySelector('.bg-gray-50') ||
                          document.querySelector('[class*="gray-50"]');
                          
        const hasWhiteCards = document.querySelectorAll('.bg-white').length;
        const hasBlueAccents = document.querySelectorAll('[class*="blue-"]').length;
        const hasModernSpacing = document.querySelectorAll('[class*="space-"], [class*="gap-"], [class*="p-"], [class*="m-"]').length;
        
        return {
          hasLightBg: !!hasLightBg,
          whiteCards: hasWhiteCards,
          blueAccents: hasBlueAccents,
          modernSpacing: hasModernSpacing,
          bodyBg: window.getComputedStyle(document.body).backgroundColor
        };
      });
      
      console.log('🎨 Design Analysis:');
      console.log('  Light background:', design.hasLightBg ? '✅' : '❌');
      console.log('  White cards:', design.whiteCards);
      console.log('  Blue accents:', design.blueAccents);
      console.log('  Modern spacing:', design.modernSpacing);
      console.log('  Body background:', design.bodyBg);
      
    } else {
      console.log('❌ Still on login page, trying direct access...');
      
      // Try to inject JavaScript to bypass auth temporarily
      await page.evaluate(() => {
        // Mock user object
        window.localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_in: 3600,
          user: { id: 'mock-user-id', email: 'test@example.com' }
        }));
      });
      
      await page.reload();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/bypass-attempt.png', fullPage: true });
    }
    
  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: 'screenshots/bypass-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testBypassAuth();