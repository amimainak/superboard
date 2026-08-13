import { chromium } from 'playwright';

const URL = 'https://superboard-three.vercel.app';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  const allLogs = [];
  page.on('console', msg => allLogs.push(`[${msg.type()}] ${msg.text()}`));
  
  // Inject debug hooks before page loads
  await page.addInitScript(() => {
    // Monkey-patch the pointer event handling to log what happens
    const origDispatch = EventTarget.prototype.dispatchEvent;
    window.__pointerLog = [];
    window.__drawingState = {};
  });
  
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // Inject monitoring into the React rendering cycle
  await page.evaluate(() => {
    // Hook into the Zustand store by intercepting all state changes
    // We can observe DOM mutations to understand what's being rendered
    
    window.__svgMutations = [];
    const svgEl = document.querySelector('svg');
    if (svgEl) {
      const obs = new MutationObserver((mutations) => {
        for (const m of mutations) {
          for (const node of m.addedNodes) {
            if (node.nodeName === 'path' || node.nodeName === 'g') {
              const d = node.getAttribute?.('d') || '';
              window.__svgMutations.push({
                tag: node.nodeName,
                d: d.substring(0, 80),
                attrs: Array.from(node.attributes || []).map(a => `${a.name}=${a.value?.substring(0,30)}`).join(' '),
              });
            }
          }
        }
      });
      obs.observe(svgEl, { childList: true, subtree: true, attributes: true });
    }
  });
  
  // Click Draw
  await page.click('[title="Draw (D)"]');
  await page.waitForTimeout(300);
  
  const canvasInfo = await page.evaluate(() => {
    const d = document.querySelector('div[style*="crosshair"]');
    return d ? d.getBoundingClientRect() : null;
  });
  
  if (!canvasInfo) {
    console.log('No canvas');
    await browser.close();
    return;
  }
  
  // Add more detailed monitoring
  await page.evaluate(() => {
    // Monitor pointer events on the canvas container
    const container = document.querySelector('div[style*="crosshair"]');
    if (container) {
      container.addEventListener('pointerdown', (e) => {
        window.__pointerLog.push('DOWN at ' + e.clientX + ',' + e.clientY + ' button=' + e.button);
      }, true);
      container.addEventListener('pointermove', (e) => {
        if (window.__pointerLog.length < 100) {
          window.__pointerLog.push('MOVE at ' + e.clientX + ',' + e.clientY);
        }
      }, true);
      container.addEventListener('pointerup', (e) => {
        window.__pointerLog.push('UP');
      }, true);
    }
  });
  
  const cx = canvasInfo.x + canvasInfo.w / 2;
  const cy = canvasInfo.y + canvasInfo.h / 2;
  
  // Draw
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.waitForTimeout(50);
  await page.mouse.move(cx + 100, cy + 50);
  await page.waitForTimeout(50);
  await page.mouse.move(cx + 200, cy);
  await page.mouse.up();
  await page.waitForTimeout(1500);
  
  // Check pointer log
  const pointerLog = await page.evaluate(() => window.__pointerLog);
  console.log('Pointer events captured:', pointerLog.length);
  console.log('First 5:', pointerLog.slice(0, 5));
  console.log('Last 5:', pointerLog.slice(-5));
  
  // Check SVG mutations
  const svgMuts = await page.evaluate(() => window.__svgMutations);
  console.log('\nSVG mutations:', svgMuts.length);
  for (const m of svgMuts.slice(0, 10)) {
    console.log(' ', JSON.stringify(m));
  }
  
  // Check currentElement state by looking at all rendered paths
  const pathDetails = await page.evaluate(() => {
    const paths = document.querySelectorAll('svg path');
    const details = [];
    for (const p of paths) {
      details.push({
        d: (p.getAttribute('d') || '').substring(0, 100),
        fill: p.getAttribute('fill'),
        stroke: p.getAttribute('stroke'),
      });
    }
    return details;
  });
  console.log('\nAll SVG paths:', JSON.stringify(pathDetails, null, 2));
  
  // Errors
  const errors = allLogs.filter(l => l.includes('error') || l.includes('Error'));
  console.log('\nErrors:', errors.slice(0, 10));
  
  await browser.close();
})();
