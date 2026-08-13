import { chromium } from 'playwright';

const URL = 'https://superboard-three.vercel.app';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(4000);
  
  // Click Draw
  await page.click('[title="Draw (D)"]');
  await page.waitForTimeout(500);
  
  const bounds = await page.evaluate(() => {
    const d = document.querySelector('div[style*="crosshair"]');
    const r = d.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  
  if (!bounds) { console.log('No canvas'); await browser.close(); return; }
  
  // Draw a horizontal line using page.mouse
  const startX = bounds.x + 100;
  const startY = bounds.y + bounds.h / 2;
  const endX = bounds.x + bounds.w - 100;
  
  // Slow deliberate drawing motion
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  
  const steps = 30;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = startX + (endX - startX) * t;
    const y = startY + Math.sin(t * Math.PI * 4) * 20; // wavy line
    await page.mouse.move(x, y);
    await page.waitForTimeout(10);
  }
  
  await page.mouse.up();
  await page.waitForTimeout(2000);
  
  // Analyze SVG
  const result = await page.evaluate(() => {
    const svg = document.querySelector('svg');
    const paths = svg.querySelectorAll('path');
    const allPaths = [];
    let filledCount = 0;
    
    for (const p of paths) {
      const d = p.getAttribute('d') || '';
      const fill = p.getAttribute('fill') || '';
      const stroke = p.getAttribute('stroke') || '';
      
      allPaths.push({ dLen: d.length, fill, stroke });
      
      if (d.length > 200 && fill.startsWith('#')) {
        filledCount++;
      }
    }
    
    return { totalPaths: paths.length, filledCount, allPaths: allPaths.filter(p => p.dLen > 30) };
  });
  
  console.log('SVG analysis:', JSON.stringify(result, null, 2));
  
  await page.screenshot({ path: '/home/z/my-project/download/final-verify3.png' });
  
  // Pixel analysis - check center of canvas for drawn content
  const pixels = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    // We can't easily do this, just check SVG path attributes
    const svg = document.querySelector('svg');
    const longPaths = svg.querySelectorAll('path');
    const info = [];
    for (const p of longPaths) {
      const d = p.getAttribute('d') || '';
      const fill = p.getAttribute('fill') || '';
      if (d.length > 100 && fill !== 'none' && fill !== 'transparent' && fill !== '') {
        info.push({ dLen: d.length, fill, start: d.substring(0, 60) });
      }
    }
    return info;
  });
  console.log('Visible paths:', JSON.stringify(pixels, null, 2));
  
  if (errors.length) console.log('Errors:', [...new Set(errors)].slice(0, 5));
  
  const hasDrawing = pixels.length > 0;
  console.log('\n===' + (hasDrawing ? 'SUCCESS' : 'STILL BROKEN') + '===');
  
  await browser.close();
})();
