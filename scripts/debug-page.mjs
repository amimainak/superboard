import { chromium } from 'playwright';

const URL = 'https://superboard-three.vercel.app';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGE_ERROR] ${err.message}`));
  
  console.log('1. Navigating to:', URL);
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  console.log('2. Title:', await page.title());
  
  // Wait for SVG
  await page.waitForSelector('svg', { timeout: 10000 });
  console.log('3. SVG present');
  
  // Wait for the dynamic content to load (Next.js SSR + client hydration)
  await page.waitForTimeout(3000);
  
  // Check ALL buttons
  const buttons = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    return Array.from(btns).map(b => ({
      text: b.textContent?.trim()?.substring(0, 30),
      visible: b.offsetParent !== null,
      rect: b.getBoundingClientRect(),
      title: b.getAttribute('title'),
    }));
  });
  
  console.log('4. Found', buttons.length, 'buttons:');
  for (const b of buttons) {
    if (b.text && b.visible) {
      console.log(`   "${b.text}" title="${b.title}" at (${Math.round(b.rect.x)},${Math.round(b.rect.y)})`);
    }
  }
  
  // Check for any React error overlay
  const errorOverlay = await page.$('#__next-route-announcer');
  console.log('5. Route announcer:', errorOverlay ? 'present' : 'none');
  
  // Check if the main app div rendered
  const appContent = await page.evaluate(() => {
    const root = document.getElementById('__next');
    return root ? root.innerHTML.substring(0, 300) : 'no __next';
  });
  console.log('6. __next content (first 300 chars):', appContent);
  
  // Screenshot
  await page.screenshot({ path: '/home/z/my-project/download/vercel-debug.png', fullPage: false });
  console.log('7. Screenshot saved');
  
  // Print logs
  if (logs.length) {
    console.log('\n--- Logs ---');
    logs.forEach(l => console.log(l));
  }
  
  await browser.close();
})();
