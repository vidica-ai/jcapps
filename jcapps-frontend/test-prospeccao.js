const { chromium } = require('playwright');

async function testProspeccaoAtiva() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Testing ProspeccaoAtiva page...');
    
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Take dashboard screenshot
    await page.screenshot({ path: 'screenshots/dashboard-main.png', fullPage: true });
    console.log('📸 Dashboard screenshot captured');
    
    // Look for and click on Prospecção Ativa card
    console.log('🎯 Looking for Prospecção Ativa card...');
    
    // Try different selectors to find the ProspeccaoAtiva card
    const prospeccaoCard = await page.$('text="Prospecção Ativa"') || 
                          await page.$('[class*="card"]:has-text("Prospecção")') ||
                          await page.$('button:has-text("INICIAR")');
                          
    if (prospeccaoCard) {
      console.log('✅ Found Prospecção Ativa card, clicking...');
      await prospeccaoCard.click();
      await page.waitForTimeout(3000);
      
      // Take ProspeccaoAtiva page screenshot
      await page.screenshot({ path: 'screenshots/prospeccao-ativa-main.png', fullPage: true });
      console.log('📸 ProspeccaoAtiva page screenshot captured');
      
      // Analyze the ProspeccaoAtiva design
      const design = await page.evaluate(() => {
        const body = document.body;
        const main = document.querySelector('main, div[class*="min-h-screen"]');
        
        // Check for light gray background (rgb(249, 250, 251) is bg-gray-50 in Tailwind)
        const hasLightGrayBg = body.style.backgroundColor === 'rgb(249, 250, 251)' ||
                              document.querySelector('.bg-gray-50') ||
                              window.getComputedStyle(body).backgroundColor === 'rgb(249, 250, 251)';
        
        // Check for white cards
        const whiteCards = document.querySelectorAll('.bg-white').length;
        const roundedCards = document.querySelectorAll('.rounded, .rounded-xl, .rounded-lg').length;
        
        // Check for blue accents
        const blueAccents = document.querySelectorAll('[class*="blue-"], .text-blue, .bg-blue').length;
        
        // Check for modern spacing
        const modernSpacing = document.querySelectorAll('[class*="space-"], [class*="gap-"], [class*="p-"], [class*="m-"]').length;
        
        // Check for ProspeccaoAtiva specific elements
        const hasTitle = !!document.querySelector('h1:has-text("Prospecção Ativa"), h1:has-text("Prospec")');
        const hasSearchBar = !!document.querySelector('input[placeholder*="Buscar"], input[placeholder*="buscar"]');
        const hasFilters = document.querySelectorAll('select, button[class*="filter"]').length;
        
        // Check for client cards with proper styling
        const clientCards = document.querySelectorAll('.bg-white.rounded, [class*="card"]').length;
        const hasContactButtons = document.querySelectorAll('button[title*="WhatsApp"], button[title*="Email"], button[title*="Telefone"]').length;
        
        return {
          hasLightGrayBg: !!hasLightGrayBg,
          whiteCards,
          roundedCards,
          blueAccents,
          modernSpacing,
          hasTitle,
          hasSearchBar,
          hasFilters,
          clientCards,
          hasContactButtons,
          bodyBg: window.getComputedStyle(body).backgroundColor,
          mainBg: main ? window.getComputedStyle(main).backgroundColor : 'N/A',
          pageTitle: document.title
        };
      });
      
      console.log('\n🎨 ProspeccaoAtiva Design Analysis:');
      console.log('====================================');
      console.log('✅ MINIMALIST DESIGN ELEMENTS:');
      console.log(`  Light gray background: ${design.hasLightGrayBg ? '✅ YES' : '❌ NO'}`);
      console.log(`  White cards: ${design.whiteCards} cards`);
      console.log(`  Blue accents: ${design.blueAccents} elements`);
      console.log(`  Modern spacing: ${design.modernSpacing} elements`);
      console.log(`  Rounded corners: ${design.roundedCards} elements`);
      
      console.log('\n🔧 FUNCTIONALITY ELEMENTS:');
      console.log(`  ProspeccaoAtiva title: ${design.hasTitle ? '✅ YES' : '❌ NO'}`);
      console.log(`  Search bar: ${design.hasSearchBar ? '✅ YES' : '❌ NO'}`);
      console.log(`  Filter elements: ${design.hasFilters}`);
      console.log(`  Client cards: ${design.clientCards}`);
      console.log(`  Contact buttons: ${design.hasContactButtons}`);
      
      console.log('\n🎨 COLORS:');
      console.log(`  Body background: ${design.bodyBg}`);
      console.log(`  Main background: ${design.mainBg}`);
      
      // Test client interaction
      if (design.clientCards > 0) {
        console.log('\n🎯 Testing client card interaction...');
        
        const firstClientCard = await page.$('.bg-white.rounded');
        if (firstClientCard) {
          await firstClientCard.click();
          await page.waitForTimeout(2000);
          
          await page.screenshot({ path: 'screenshots/client-detail-page.png', fullPage: true });
          console.log('📸 Client detail page screenshot captured');
          
          // Test note functionality
          const noteButton = await page.$('button:has-text("Nova Observação")');
          if (noteButton) {
            console.log('📝 Testing note modal...');
            await noteButton.click();
            await page.waitForTimeout(1000);
            
            await page.screenshot({ path: 'screenshots/note-modal.png', fullPage: true });
            console.log('📸 Note modal screenshot captured');
            
            // Close the modal
            const closeButton = await page.$('button:has-text("Cancelar")') || await page.$('button svg');
            if (closeButton) {
              await closeButton.click();
              await page.waitForTimeout(500);
            }
          }
          
          // Test back navigation
          const backButton = await page.$('button svg') || await page.$('[data-testid="back"]');
          if (backButton) {
            console.log('🔙 Testing back navigation...');
            await backButton.click();
            await page.waitForTimeout(1000);
          }
        }
      }
      
      // Test responsive design
      console.log('\n📱 Testing responsive design...');
      
      // Tablet view
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/prospeccao-tablet.png', fullPage: true });
      
      // Mobile view  
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/prospeccao-mobile.png', fullPage: true });
      
      console.log('✅ Responsive screenshots captured');
      
      // Overall assessment
      const isMinimalistDesign = design.hasLightGrayBg && design.whiteCards > 0 && design.blueAccents > 0;
      console.log('\n📊 OVERALL ASSESSMENT:');
      console.log('=======================');
      console.log(`Minimalist design implemented: ${isMinimalistDesign ? '✅ YES' : '❌ NO'}`);
      console.log(`This is ${isMinimalistDesign ? 'a significant improvement' : 'still using the dark theme'} over the previous design.`);
      
    } else {
      console.log('❌ Could not find Prospecção Ativa card');
      await page.screenshot({ path: 'screenshots/dashboard-error.png', fullPage: true });
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
    await page.screenshot({ path: 'screenshots/prospeccao-error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n🏁 ProspeccaoAtiva testing completed');
  }
}

testProspeccaoAtiva();