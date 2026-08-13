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
    return d ? d.getBoundingClientRect() : null;
  });
  
  if (!bounds) { console.log('No canvas'); await browser.close(); return; }
  
  const cx = 662; // canvas center x
  const cy = 360; // canvas center y
  
  // Draw circle
  await page.mouse.move(cx + 80, cy);
  await page.mouse.down();
  for (let i = 1; i <= 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const px = cx + 80 * Math.cos(a);
    const py = cy + 80 * Math.sin(a);
    await page.mouse.move(px, py);
  }
  await page.mouse.up();
  await page.waitForTimeout(2000);
  
  // Screenshot
  await page.screenshot({ path: '/home/z/my-project/download/final-verify.png' });
  
  // Check if drawn path has fill color
  const result = await page.evaluate(() => {
    const svg = document.querySelector('svg');
    const paths = svg.querySelectorAll('path');
    let drawnPath = null;
    for (const p of paths) {
      const d = p.getAttribute('d') || '';
      const fill = p.getAttribute('fill') || '';
      // A drawn freehand path has long d, and should have a fill color like #1e293b
      if (d.length > 200 && fill.startsWith('#')) {
        drawnPath = { dLength: d.length, fill, dStart: d.substring(0, 60) };
      }
    }
    return drawnPath;
  });
  
  console.log('Drawn path:', JSON.stringify(result));
  
  // Check pixels for non-background color
  const pixelCheck = await page.evaluate(() => {
    const svg = document.querySelector('svg');
    const svgRect = svg.getBoundingClientRect();
    // Check center area
    const cx = svgRect.x + svgRect.width / 2;
    const cy = svgRect.y + svgRect.height / 2;
    
    // Use getComputedStyle or check actual SVG path fill
    const drawnPaths = svg.querySelectorAll('path[fill^=\"#\"]');
    const hasDarkFill = Array.from(drawnPaths).some(p => {
      const fill = p.getAttribute('fill');
      const d = p.getAttribute('d');
      return fill && fill !== 'transparent' && fill !== 'none' && d && d.length > 200;
    });
    
    return { hasDarkFill, drawnPathCount: drawnPaths.length };
  });
  
  console.log('Pixel check:', JSON.stringify(pixelCheck));
  
  if (errors.length) {
    console.log('Errors:', [...new Set(errors)].slice(0, 5));
  }
  
  const success = result && pixelCheck.hasDarkFill;
  console.log('\n=== ' + (success ? 'SUCCESS - Drawing works and is visible!' : 'FAIL - Check screenshots') + ' ===');
  
  await browser.close();
})();
