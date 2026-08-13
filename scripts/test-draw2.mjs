import { chromium } from 'playwright';

const URL = 'https://superboard-three.vercel.app';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[ERROR] ${err.message}`));
  
  console.log('1. Navigating...');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  console.log('2. Page loaded');
  
  // Check if the full app rendered
  const appInfo = await page.evaluate(() => {
    const root = document.querySelector('.whiteboard-root');
    const svg = document.querySelector('svg');
    const toolbar = document.querySelector('.left-toolbar');
    const topBar = document.querySelector('.top-bar');
    const stylePanel = document.querySelector('.style-panel');
    
    return {
      hasRoot: !!root,
      hasSvg: !!svg,
      hasToolbar: !!toolbar,
      hasTopBar: !!topBar,
      hasStylePanel: !!stylePanel,
    };
  });
  console.log('3. App components:', JSON.stringify(appInfo));
  
  // Find the Draw button by its SVG icon (Pencil)
  // The button has a title attribute "Draw (D)"
  const drawBtn = await page.$('[title="Draw (D)"]');
  if (!drawBtn) {
    console.log('4a. No Draw button found by title, trying by index...');
    // Try clicking the 3rd button in left toolbar (index: select=0, hand=1, draw=2)
    const toolbarBtns = await page.$$('.left-toolbar button');
    console.log('   Found', toolbarBtns.length, 'toolbar buttons');
    for (let i = 0; i < Math.min(toolbarBtns.length, 5); i++) {
      const title = await toolbarBtns[i].getAttribute('title');
      console.log(`   Button ${i}: title="${title}"`);
    }
    if (toolbarBtns.length >= 3) {
      console.log('4b. Clicking toolbar button index 2 (Draw)');
      await toolbarBtns[2].click();
    }
  } else {
    console.log('4a. Found Draw button, clicking');
    await drawBtn.click();
  }
  
  await page.waitForTimeout(500);
  
  // Get the canvas drawing area
  const canvasInfo = await page.evaluate(() => {
    // Find the crosshair cursor container (it's the drawing canvas)
    const allDivs = document.querySelectorAll('div');
    let canvas = null;
    for (const d of allDivs) {
      const style = d.getAttribute('style') || '';
      if (style.includes('crosshair') || style.includes('touch-action: none')) {
        canvas = d;
        break;
      }
    }
    if (!canvas) return { found: false };
    const rect = canvas.getBoundingClientRect();
    return { found: true, x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
  console.log('5. Canvas:', JSON.stringify(canvasInfo));
  
  if (!canvasInfo.found) {
    console.log('ERROR: No canvas container found!');
    if (logs.length) console.log('Logs:', logs.join('\n'));
    await browser.close();
    return;
  }
  
  // Draw a circle using page.mouse
  const cx = canvasInfo.x + canvasInfo.width / 2;
  const cy = canvasInfo.y + canvasInfo.height / 2;
  const radius = 80;
  const steps = 40;
  
  console.log('6. Drawing circle at center', cx, cy, 'radius', radius);
  await page.mouse.move(cx + radius, cy);
  await page.mouse.down();
  
  for (let i = 1; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    await page.mouse.move(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle), { steps: 2 });
  }
  
  await page.mouse.up();
  console.log('7. Finished drawing');
  await page.waitForTimeout(1000);
  
  // Check what was drawn
  const result = await page.evaluate(() => {
    const svg = document.querySelector('svg');
    if (!svg) return { error: 'no svg' };
    
    const allPaths = svg.querySelectorAll('path');
    let drawnCount = 0;
    const pathInfo = [];
    
    for (const p of allPaths) {
      const d = p.getAttribute('d') || '';
      const fill = p.getAttribute('fill');
      const stroke = p.getAttribute('stroke');
      // Real freehand paths are long and use M/Q/T commands
      if (d.length > 50 && (d.includes('Q') || d.includes('M'))) {
        drawnCount++;
        pathInfo.push({ len: d.length, fill, stroke: stroke?.substring(0, 20) });
      }
    }
    
    // Also check for data-element-id attributes
    const elements = document.querySelectorAll('[data-element-id]');
    
    return {
      totalPaths: allPaths.length,
      drawnPaths: drawnCount,
      elementsWithDataId: elements.length,
      pathDetails: pathInfo.slice(0, 5),
    };
  });
  
  console.log('8. After drawing:', JSON.stringify(result, null, 2));
  
  // Screenshot
  await page.screenshot({ path: '/home/z/my-project/download/vercel-draw-test2.png', fullPage: false });
  console.log('9. Screenshot saved');
  
  // Console logs
  if (logs.length) {
    console.log('\n--- Console ---');
    logs.forEach(l => console.log(l));
  }
  
  await browser.close();
  console.log('Done.');
})();
