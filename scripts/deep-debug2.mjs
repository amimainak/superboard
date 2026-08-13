import { chromium } from 'playwright';

const URL = 'https://superboard-three.vercel.app';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  const allLogs = [];
  page.on('console', msg => allLogs.push(`[${msg.type()}] ${msg.text()}`));
  
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // Hook into the live page's internals
  await page.evaluate(() => {
    // Monitor all pointer events on the canvas
    const container = document.querySelector('div[style*="crosshair"]');
    if (!container) return;
    
    window.__debugPtrLog = [];
    window.__debugState = {};
    
    container.addEventListener('pointerdown', (e) => {
      window.__debugPtrLog.push({type:'down', x:e.clientX, y:e.clientY, button:e.button});
    }, true); // capture phase
    
    container.addEventListener('pointermove', (e) => {
      if (window.__debugPtrLog.length < 200) {
        window.__debugPtrLog.push({type:'move', x:e.clientX, y:e.clientY});
      }
    }, true);
    
    container.addEventListener('pointerup', (e) => {
      window.__debugPtrLog.push({type:'up'});
    }, true);
    
    // Also observe what happens to the SVG after drawing
    const svg = document.querySelector('svg');
    if (svg) {
      window.__debugSvgChanges = [];
      const obs = new MutationObserver(() => {
        const paths = svg.querySelectorAll('path');
        // Only log paths that look like freehand (long d attribute)
        const freehandPaths = [];
        for (const p of paths) {
          const d = p.getAttribute('d') || '';
          if (d.length > 30) {
            freehandPaths.push(d.substring(0, 60));
          }
        }
        if (freehandPaths.length > 0) {
          window.__debugSvgChanges.push(freehandPaths);
        }
      });
      obs.observe(svg, { childList: true, subtree: true, attributes: true });
    }
  });
  
  // Click Draw
  await page.click('[title="Draw (D)"]');
  await page.waitForTimeout(500);
  
  const canvasInfo = await page.evaluate(() => {
    const d = document.querySelector('div[style*="crosshair"]');
    return d ? d.getBoundingClientRect() : null;
  });
  
  if (!canvasInfo) {
    console.log('No canvas');
    await browser.close();
    return;
  }
  
  // Get the actual container element and dispatch events directly
  const cx = Math.round(canvasInfo.x + canvasInfo.w / 2);
  const cy = Math.round(canvasInfo.y + canvasInfo.h / 2);
  
  // Use native pointer events via CDP for accurate simulation
  await page.evaluate(({ cx, cy, r, steps }) => {
    const container = document.querySelector('div[style*="crosshair"]');
    if (!container) return 'no container';
    
    // Create and dispatch pointer events
    const down = new PointerEvent('pointerdown', {
      clientX: cx + r, clientY: cy, 
      button: 0, bubbles: true, cancelable: true, 
      pointerId: 1, pointerType: 'mouse', pressure: 0.5,
      isPrimary: true
    });
    container.dispatchEvent(down);
    
    // Dispatch move events  
    for (let i = 1; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const move = new PointerEvent('pointermove', {
        clientX: cx + r * Math.cos(angle),
        clientY: cy + r * Math.sin(angle),
        button: 0, bubbles: true, cancelable: true,
        pointerId: 1, pointerType: 'mouse', pressure: 0.5,
        isPrimary: true
      });
      container.dispatchEvent(move);
    }
    
    const up = new PointerEvent('pointerup', {
      clientX: cx, clientY: cy,
      button: 0, bubbles: true, cancelable: true,
      pointerId: 1, pointerType: 'mouse', pressure: 0,
      isPrimary: true
    });
    container.dispatchEvent(up);
    
    return 'dispatched';
  }, { cx, cy, r: 80, steps: 30 });
  
  await page.waitForTimeout(2000);
  
  // Check results
  const ptrLog = await page.evaluate(() => window.__debugPtrLog);
  console.log('Pointer events:', ptrLog.length, 'captured');
  if (ptrLog.length > 0) {
    console.log('  First:', JSON.stringify(ptrLog[0]));
    console.log('  Last:', JSON.stringify(ptrLog[ptrLog.length - 1]));
  }
  
  const svgChanges = await page.evaluate(() => window.__debugSvgChanges);
  console.log('\nSVG changes:', svgChanges.length);
  for (const c of svgChanges) {
    console.log(' ', c);
  }
  
  // Full SVG state
  const svgState = await page.evaluate(() => {
    const svg = document.querySelector('svg');
    const paths = svg.querySelectorAll('path');
    return {
      totalPaths: paths.length,
      paths: Array.from(paths).map(p => ({
        d: (p.getAttribute('d') || '').substring(0, 80),
        fill: p.getAttribute('fill'),
        stroke: p.getAttribute('stroke'),
      })).filter(p => p.d.length > 20),
    };
  });
  console.log('\nSVG state:', JSON.stringify(svgState, null, 2));
  
  // Console errors
  const errors = allLogs.filter(l => l.includes('error') || l.includes('Error'));
  if (errors.length) {
    console.log('\nErrors:', [...new Set(errors)].slice(0, 10));
  }
  
  await page.screenshot({ path: '/home/z/my-project/download/debug-result.png' });
  await browser.close();
})();
