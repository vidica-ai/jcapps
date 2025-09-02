const { chromium } = require('playwright');

async function testBypassed() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Testing bypassed authentication...');
    
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Take main screenshot
    await page.screenshot({ path: 'screenshots/main-bypassed.png', fullPage: true });
    console.log('📸 Main page screenshot captured');
    
    // Analyze the page
    const analysis = await page.evaluate(() => {
      // Check for ProspeccaoAtiva elements
      const prospeccaoTitle = document.querySelector('h1, h2, h3');
      const prospeccaoText = prospeccaoTitle ? prospeccaoTitle.textContent : '';
      
      // Check for design elements
      const bodyStyles = window.getComputedStyle(document.body);
      const hasGrayBackground = bodyStyles.backgroundColor === 'rgb(249, 250, 251)' || 
                               document.querySelector('.bg-gray-50') ||
                               document.querySelector('[class*="gray-50"]');
      
      const whiteCards = document.querySelectorAll('.bg-white').length;
      const clientCards = document.querySelectorAll('[class*="card"], [class*="client"]').length;
      const blueAccents = document.querySelectorAll('[class*="blue-"]').length;
      
      // Check for specific ProspeccaoAtiva elements
      const hasSearchInput = !!document.querySelector('input[placeholder*="Buscar"], input[placeholder*="buscar"]');
      const hasFilterElements = document.querySelectorAll('select, button').length;
      const hasModernSpacing = document.querySelectorAll('[class*="space-"], [class*="gap-"], [class*="p-"], [class*="m-"]').length;
      
      // Check for loading states
      const hasLoadingSpinner = !!document.querySelector('[class*="animate-spin"], [class*="loading"]');
      const hasErrorMessage = !!document.querySelector('[class*="error"], .error');
      
      return {
        prospeccaoText: prospeccaoText,
        hasGrayBackground: !!hasGrayBackground,
        whiteCards: whiteCards,
        clientCards: clientCards,
        blueAccents: blueAccents,
        hasSearchInput: hasSearchInput,
        hasFilterElements: hasFilterElements,
        hasModernSpacing: hasModernSpacing,
        hasLoadingSpinner: hasLoadingSpinner,
        hasErrorMessage: hasErrorMessage,
        bodyBg: bodyStyles.backgroundColor,
        totalElements: document.querySelectorAll('*').length
      };
    });
    
    console.log('🎨 Design Analysis:');
    console.log('  ProspeccaoAtiva title:', analysis.prospeccaoText);
    console.log('  Gray background:', analysis.hasGrayBackground ? '✅' : '❌');
    console.log('  White cards:', analysis.whiteCards);
    console.log('  Client cards:', analysis.clientCards);
    console.log('  Blue accents:', analysis.blueAccents);
    console.log('  Search input:', analysis.hasSearchInput ? '✅' : '❌');
    console.log('  Filter elements:', analysis.hasFilterElements);
    console.log('  Modern spacing:', analysis.hasModernSpacing);
    console.log('  Loading spinner:', analysis.hasLoadingSpinner ? '✅' : '❌');
    console.log('  Error message:', analysis.hasErrorMessage ? '❌' : '✅');
    console.log('  Body background:', analysis.bodyBg);
    
    if (analysis.clientCards > 0) {
      console.log('\n🎯 Testing client interaction...');
      
      // Try to click on a client card
      const firstCard = await page.$('[class*="card"]:first-of-type, .bg-white:first-of-type');
      if (firstCard) {
        await firstCard.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/client-detail-bypassed.png', fullPage: true });
        console.log('📸 Client detail screenshot captured');
        
        // Look for note functionality
        const noteButton = await page.$('button:has-text("Nova Observação"), button:has-text("Add Note")');
        if (noteButton) {
          await noteButton.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: 'screenshots/note-modal-bypassed.png', fullPage: true });
          console.log('📸 Note modal screenshot captured');
        }
      }
    }
    
    // Test responsive design
    console.log('\n📱 Testing responsive design...');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: 'screenshots/tablet-bypassed.png', fullPage: true });
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: 'screenshots/mobile-bypassed.png', fullPage: true });
    
    console.log('✅ Testing completed with bypassed authentication');
    
  } catch (error) {
    console.error('❌ Test error:', error);
    await page.screenshot({ path: 'screenshots/bypassed-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testBypassed();