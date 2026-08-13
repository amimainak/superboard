import { chromium } from 'playwright';

const URL = 'https://superboard-three.vercel.app';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(4000);
  
  // Click Draw tool
  await page.click('[title="Draw (D)"]');
  await page.waitForTimeout(500);
  
  // Draw using evaluate + native PointerEvent  
  const result = await page.evaluate(() => {
    return new Promise((resolve) => {
      const container = document.querySelector('div[style*="crosshair"]');
      if (!container) { resolve({error:'no container'}); return; }
      
      const rect = container.getBoundingClientRect();
      const cx = rect.x + rect.width / 2;
      const cy = rect.y + rect.height / 2;
      
      // Create pointer events
      function makeEvent(type, x, y, button = 0, pressure = 0.5) {
        return new PointerEvent(type, {
          clientX: x, clientY: y,
          button: button,
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          pointerType: 'mouse',
          pressure: pressure,
          isPrimary: true,
          width: 1, height: 1,
        });
      }
      
      // Draw a zigzag line
      const points = [];
      for (let i = 0; i < 20; i++) {
        points.push({ x: cx - 100 + i * 10, y: cy + (i % 2 === 0 ? -30 : 30) });
      }
      
      // Dispatch events with small delays between them
      container.dispatchEvent(makeEvent('pointerdown', points[0].x, points[0].y));
      
      let idx = 1;
      const interval = setInterval(() => {
        if (idx < points.length) {
          container.dispatchEvent(makeEvent('pointermove', points[idx].x, points[idx].y));
          idx++;
        } else {
          container.dispatchEvent(makeEvent('pointerup', points[points.length-1].x, points[points.length-1].y, 0, 0));
          clearInterval(interval);
          
          // Wait a bit then check result
          setTimeout(() => {
            const svg = document.querySelector('svg');
            const paths = svg.querySelectorAll('path');
            const pathData = [];
            for (const p of paths) {
              const d = p.getAttribute('d') || '';
              const fill = p.getAttribute('fill') || '';
              const stroke = p.getAttribute('stroke') || '';
              if (d.length > 50) {
                pathData.push({ dLen: d.length, fill, stroke, dStart: d.substring(0, 80) });
              }
            }
            resolve({ totalPaths: paths.length, drawnPaths: pathData, hasUndefined: pathData.some(p => p.dStart.includes('undefined')) });
          }, 1000);
        }
      }, 30);
    });
  });
  
  console.log('Result:', JSON.stringify(result, null, 2));
  
  // Screenshot
  await page.screenshot({ path: '/home/z/my-project/download/final-verify2.png' });
  console.log('Screenshot saved');
  
  if (errors.length) console.log('Errors:', [...new Set(errors)].slice(0, 5));
  
  await browser.close();
})();
