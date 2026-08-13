import { chromium } from 'playwright';

const URL = 'https://superboard-three.vercel.app';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  // Inject debug hooks BEFORE page loads
  await page.addInitScript(() => {
    // Hook getFreehandPath to log inputs
    const origGetFreehandPath = window.__getFreehandPath;
    
    // Monitor all path elements created
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.tagName === 'path' || node.tagName === 'PATH') {
            const d = node.getAttribute('d');
            if (d && d.includes('undefined')) {
              if (!window.__badPaths) window.__badPaths = [];
              window.__badPaths.push(d.substring(0, 100));
            }
          }
        }
      }
    });
    
    // Start observing after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { childList: true, subtree: true });
      });
    } else {
      observer.observe(document.body, { childList: true, subtree: true });
    }
    
    // Store debug data
    window.__debugData = { badPaths: [], drawingPoints: [] };
  });
  
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // Click Draw
  await page.click('[title="Draw (D)"]');
  await page.waitForTimeout(300);
  
  // Get canvas position
  const canvasBox = await page.evaluate(() => {
    const div = document.querySelector('div[style*="crosshair"]');
    return div ? div.getBoundingClientRect() : null;
  });
  
  if (!canvasBox) {
    console.log('No canvas');
    await browser.close();
    return;
  }
  
  // Now let's hook into the actual React rendering to see what currentElement looks like
  // We'll do this by examining the React fiber tree
  await page.evaluate(() => {
    // Find React fiber to inspect state
    const rootEl = document.querySelector('.whiteboard-root');
    const fiberKey = Object.keys(rootEl).find(k => k.startsWith('__reactFiber'));
    if (fiberKey) {
      window.__reactRoot = rootEl[fiberKey];
    }
  });
  
  const cx = canvasBox.x + canvasBox.width / 2;
  const cy = canvasBox.y + canvasBox.height / 2;
  
  // Draw a short line
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await p.waitForTimeout(50);
  await page.mouse.move(cx + 50, cy + 30);
  await page.waitForTimeout(50);
  await page.mouse.move(cx + 100, cy);
  await page.mouse.up();
  await page.waitForTimeout(500);
  
  // Check what the points look like by inspecting the rendered path
  const pathAnalysis = await page.evaluate(() => {
    const svg = document.querySelector('svg');
    const paths = svg.querySelectorAll('path');
    const last = paths[paths.length - 1];
    const d = last?.getAttribute('d') || '';
    
    // Check if any paths have valid coordinates (numbers)
    let validPaths = 0;
    let invalidPaths = 0;
    for (const p of paths) {
      const pd = p.getAttribute('d') || '';
      if (pd.match(/M\s+[\d.]+/)) {
        validPaths++;
      } else if (pd.match(/M\s+undefined/)) {
        invalidPaths++;
      }
    }
    
    return {
      totalPaths: paths.length,
      validPaths,
      invalidPaths,
      lastD: d.substring(0, 300),
      hasNaN: d.includes('NaN'),
      hasUndefined: d.includes('undefined'),
    };
  });
  
  console.log('Path analysis:', JSON.stringify(pathAnalysis, null, 2));
  
  await browser.close();
})();
