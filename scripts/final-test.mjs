import { chromium } from 'playwright';

const URL = 'https://superboard-three.vercel.app';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  // Capture ALL console messages including warnings
  const allLogs = [];
  page.on('console', msg => allLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => allLogs.push(`[PAGE_ERROR] ${err.message}`));
  
  // Bypass cache
  const ctx = await page.context();
  await ctx.clearCookies();
  
  console.log('1. Loading page (no cache)...');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(4000);
  console.log('2. Title:', await page.title());
  
  // Take initial screenshot
  await page.screenshot({ path: '/home/z/my-project/download/step1-loaded.png' });
  
  // Click Draw tool
  const drawBtn = await page.$('[title="Draw (D)"]');
  if (!drawBtn) {
    console.log('ERROR: Draw button not found');
    await page.screenshot({ path: '/home/z/my-project/download/error-no-draw-btn.png' });
    // Dump what IS on the page
    const html = await page.evaluate(() => document.body.innerHTML.substring(0, 1000));
    console.log('HTML:', html);
    await browser.close();
    return;
  }
  await drawBtn.click();
  console.log('3. Clicked Draw tool');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/home/z/my-project/download/step2-draw-selected.png' });
  
  // Get the canvas area
  const canvasInfo = await page.evaluate(() => {
    const allDivs = document.querySelectorAll('div');
    for (const d of allDivs) {
      const s = d.getAttribute('style') || '';
      if (s.includes('crosshair')) {
        const r = d.getBoundingClientRect();
        return { found: true, x: r.x, y: r.y, w: r.width, h: r.height, cursor: s.match(/cursor:\s*([^;]+)/)?.[1] };
      }
    }
    return { found: false };
  });
  console.log('4. Canvas:', JSON.stringify(canvasInfo));
  
  if (!canvasInfo.found) {
    console.log('ERROR: No canvas found');
    await browser.close();
    return;
  }
  
  // Draw a BIG circle in the middle
  const cx = canvasInfo.x + canvasInfo.w / 2;
  const cy = canvasInfo.y + canvasInfo.h / 2;
  const radius = 100;
  const steps = 50;
  
  console.log('5. Drawing circle at', cx, cy);
  await page.mouse.move(cx + radius, cy);
  await page.mouse.down();
  
  for (let i = 1; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const px = cx + radius * Math.cos(angle);
    const py = cy + radius * Math.sin(angle);
    await page.mouse.move(px, py, { steps: 1 });
  }
  
  await page.mouse.up();
  console.log('6. Drawing complete, waiting...');
  await page.waitForTimeout(2000);
  
  // Screenshot after drawing
  await page.screenshot({ path: '/home/z/my-project/download/step3-after-drawing.png' });
  
  // Check what's in the SVG
  const svgAnalysis = await page.evaluate(() => {
    const svg = document.querySelector('svg');
    if (!svg) return { error: 'no svg' };
    
    const allPaths = svg.querySelectorAll('path');
    const pathsInfo = [];
    let validPaths = 0;
    let invalidPaths = 0;
    
    for (let i = 0; i < allPaths.length; i++) {
      const p = allPaths[i];
      const d = p.getAttribute('d') || '';
      const fill = p.getAttribute('fill');
      const stroke = p.getAttribute('stroke');
      const opacity = p.getAttribute('opacity');
      
      if (d.length > 30 && d.match(/M\s+[\d.]+/)) {
        validPaths++;
        if (pathsInfo.length < 5) {
          pathsInfo.push({
            index: i,
            len: d.length,
            start: d.substring(0, 60),
            fill,
            stroke,
            opacity,
          });
        }
      } else if (d.includes('undefined') || d.includes('NaN')) {
        invalidPaths++;
      }
    }
    
    // Also count total SVG children
    return {
      totalPaths: allPaths.length,
      validPaths,
      invalidPaths,
      svgChildren: svg.children.length,
      samplePaths: pathsInfo,
    };
  });
  
  console.log('7. SVG Analysis:', JSON.stringify(svgAnalysis, null, 2));
  
  // Check ALL console errors
  const errs = allLogs.filter(l => l.includes('[error]') || l.includes('[PAGE_ERROR]'));
  if (errs.length > 0) {
    console.log('\n--- ERRORS (' + errs.length + ') ---');
    const unique = [...new Set(errs)];
    unique.slice(0, 10).forEach(e => console.log(e));
  }
  
  const success = svgAnalysis.validPaths > 0 && svgAnalysis.invalidPaths === 0;
  console.log('\n=== RESULT:', success ? 'DRAWING WORKS' : 'DRAWING STILL BROKEN', '===');
  
  await browser.close();
})();
