// Test drawing on the live Vercel whiteboard using raw HTTP + Playwright
import { chromium } from 'playwright';

const URL = 'https://superboard-three.vercel.app';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  // Collect console messages
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[ERROR] ${err.message}`));
  
  console.log('1. Navigating to:', URL);
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  console.log('2. Page loaded. Title:', await page.title());
  
  // Wait for the whiteboard to render
  await page.waitForSelector('svg', { timeout: 10000 });
  console.log('3. SVG found');
  
  // Click the Draw tool
  const drawBtn = page.locator('button:has-text("Draw (D)")');
  await drawBtn.click();
  console.log('4. Clicked Draw tool');
  await page.waitForTimeout(500);
  
  // Get the canvas container
  const canvasContainer = page.locator('div[style*="crosshair"]');
  const box = await canvasContainer.boundingBox();
  console.log('5. Canvas container box:', box);
  
  if (!box) {
    console.log('ERROR: No canvas container found!');
    await browser.close();
    process.exit(1);
  }
  
  // Dispatch pointer events to draw a circle
  const cx = box.x + 200;
  const cy = box.y + 200;
  
  console.log('6. Simulating draw at', cx, cy);
  
  // Use page.mouse for realistic pointer events
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  
  // Draw a circle
  const steps = 30;
  const radius = 80;
  for (let i = 1; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const px = cx + radius * Math.cos(angle);
    const py = cy + radius * Math.sin(angle);
    await page.mouse.move(px, py, { steps: 1 });
    await page.waitForTimeout(10);
  }
  
  await page.mouse.up();
  console.log('7. Pointer up');
  await page.waitForTimeout(1000);
  
  // Check if anything was drawn
  const svgContent = await page.evaluate(() => {
    const svg = document.querySelector('svg');
    if (!svg) return 'no svg';
    const paths = svg.querySelectorAll('path');
    const gCount = svg.querySelectorAll('g').length;
    // Filter out icon paths (they have very specific patterns)
    let drawnPaths = 0;
    for (const p of paths) {
      const d = p.getAttribute('d') || '';
      if (d.length > 100) drawnPaths++; // Real drawings have long paths
    }
    return {
      totalPaths: paths.length,
      drawnPaths,
      groups: gCount,
      svgChildCount: svg.children.length
    };
  });
  
  console.log('8. SVG state after drawing:', JSON.stringify(svgContent));
  
  // Take a screenshot
  await page.screenshot({ path: '/home/z/my-project/download/vercel-draw-test.png', fullPage: false });
  console.log('9. Screenshot saved to download/vercel-draw-test.png');
  
  // Print console logs
  if (logs.length > 0) {
    console.log('\n--- Console Logs ---');
    logs.forEach(l => console.log(l));
  }
  
  // Also try: does the SVG get new elements? Check for freehand paths
  const storeState = await page.evaluate(() => {
    // Try to access Zustand store
    try {
      // Zustand stores are typically not on window, but let's check
      const allElements = document.querySelectorAll('[data-element-id]');
      return { elementCount: allElements.length };
    } catch (e) {
      return { error: e.message };
    }
  });
  console.log('10. Store state:', JSON.stringify(storeState));
  
  await browser.close();
  console.log('Done.');
})();
