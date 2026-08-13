import { chromium } from 'playwright';

const URL = 'https://superboard-three.vercel.app';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  
  console.log('1. Loading page...');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // Click Draw tool
  await page.click('[title="Draw (D)"]');
  await page.waitForTimeout(500);
  
  // Get canvas
  const canvas = await page.evaluate(() => {
    const div = document.querySelector('div[style*="crosshair"]');
    return div ? div.getBoundingClientRect() : null;
  });
  
  if (!canvas) {
    console.log('ERROR: No canvas found');
    await browser.close();
    return;
  }
  
  // Draw a circle
  const cx = canvas.x + canvas.width / 2;
  const cy = canvas.y + canvas.height / 2;
  const radius = 80;
  const steps = 40;
  
  console.log('2. Drawing circle...');
  await page.mouse.move(cx + radius, cy);
  await page.mouse.down();
  
  for (let i = 1; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    await page.mouse.move(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle), { steps: 2 });
  }
  
  await page.mouse.up();
  await page.waitForTimeout(1000);
  
  // Check results
  const result = await page.evaluate(() => {
    const svg = document.querySelector('svg');
    const paths = svg.querySelectorAll('path');
    let drawnPaths = [];
    for (const p of paths) {
      const d = p.getAttribute('d') || '';
      if (d.length > 100 && d.match(/M\s+[\d.]+/)) {
        drawnPaths.push({ len: d.length, starts: d.substring(0, 40) });
      }
    }
    return {
      totalPaths: paths.length,
      validDrawnPaths: drawnPaths.length,
      samples: drawnPaths.slice(0, 3),
    };
  });
  
  console.log('3. Results:', JSON.stringify(result, null, 2));
  
  // Screenshot
  await page.screenshot({ path: '/home/z/my-project/download/vercel-fixed-test.png' });
  console.log('4. Screenshot saved');
  
  // Check for errors
  const hasUndefinedErrors = errors.some(e => e.includes('undefined'));
  console.log('5. Has undefined errors:', hasUndefinedErrors);
  if (errors.length) {
    console.log('Errors (first 5):', errors.slice(0, 5));
  }
  
  console.log('6. SUCCESS:', result.validDrawnPaths > 0 && !hasUndefinedErrors ? 'YES - Drawing works!' : 'NO - Still broken');
  
  await browser.close();
})();
