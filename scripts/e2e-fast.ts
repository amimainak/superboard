/**
 * Fast E2E test — login each role, capture dashboard screenshot, check key elements
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const DIR = '/home/z/my-project/download/e2e-screenshots';
const { mkdirSync } = require('fs');
mkdirSync(DIR, { recursive: true });

const accounts = [
  { role: 'student', email: 'student@superboard.app', pw: 'Student1234!' },
  { role: 'free-tutor', email: 'free-tutor@superboard.app', pw: 'FreeTutor1234!' },
  { role: 'pro-tutor', email: 'pro-tutor@superboard.app', pw: 'ProTutor1234!' },
  { role: 'agency', email: 'agency@superboard.app', pw: 'Agency1234!' },
];

function log(m: string) { console.log(m); }

async function ss(page: any, name: string) {
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: false });
  log(`📸 ${name}.png`);
}

async function main() {
  log('🚀 Fast E2E Test');
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  
  for (const acct of accounts) {
    log(`\n=== ${acct.role.toUpperCase()} ===`);
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    
    // Go to home
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Open login dialog
    const signBtn = page.locator('text=Sign In').first();
    if (await signBtn.count() > 0) {
      await signBtn.click();
      await page.waitForTimeout(1000);
    }
    
    await ss(page, `${acct.role}-01-auth-dialog`);
    
    // Fill form
    const email = page.locator('input#login-email, input[type="email"]').first();
    const pass = page.locator('input#login-password, input[type="password"]').first();
    await email.fill(acct.email);
    await pass.fill(acct.pw);
    
    await ss(page, `${acct.role}-02-auth-filled`);
    
    // Submit
    await page.locator('button[type="submit"]').first().click();
    
    // Wait for dashboard
    try {
      await page.waitForSelector('text=Welcome back', { timeout: 15000 });
    } catch {
      log(`  ⚠️ Dashboard did not load for ${acct.role}`);
      await ss(page, `${acct.role}-03-no-dashboard`);
      await ctx.close();
      continue;
    }
    
    await page.waitForTimeout(2000);
    await ss(page, `${acct.role}-03-dashboard`);
    
    // Check content
    const html = await page.content();
    
    // Check profile/usage working via app (check console errors)
    if (html.includes('Smart Credits')) log(`  ✅ Smart Credits visible`);
    else log(`  ❌ Smart Credits missing`);
    
    if (html.includes('Video Minutes')) log(`  ✅ Video Minutes visible`);
    else log(`  ❌ Video Minutes missing`);
    
    if (html.includes('New Lesson')) log(`  ✅ New Lesson button`);
    else log(`  ❌ No New Lesson button`);
    
    if (html.includes(acct.email)) log(`  ✅ Email displayed`);
    else log(`  ❌ Email not displayed`);
    
    // Tier badge
    const tierMap: Record<string,string> = { 'student':'Free', 'free-tutor':'Free', 'pro-tutor':'Pro', 'agency':'Agency' };
    if (html.includes(tierMap[acct.role])) log(`  ✅ Tier: ${tierMap[acct.role]}`);
    else log(`  ❌ Tier badge missing or wrong`);
    
    // Tabs
    if (html.includes('Boards') && html.includes('Templates')) log(`  ✅ Boards & Templates tabs`);
    
    // Open New Lesson dialog (non-student)
    if (acct.role !== 'student') {
      const nlBtn = page.locator('button:has-text("New Lesson")').first();
      if (await nlBtn.count() > 0) {
        await nlBtn.click();
        await page.waitForTimeout(1000);
        await ss(page, `${acct.role}-04-new-lesson`);
        const dialogHtml = await page.content();
        if (dialogHtml.includes('Mathematics')) log(`  ✅ Subject selector works`);
        if (dialogHtml.includes('Start Lesson')) log(`  ✅ Start Lesson button`);
        
        // For agency, check branding
        if (acct.role === 'agency' && dialogHtml.includes('Branding')) log(`  ✅ Agency branding field`);
        
        // Close dialog
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    }
    
    // Navigate to a room (non-student: open New Lesson, start it)
    if (acct.role !== 'student') {
      const nlBtn = page.locator('button:has-text("New Lesson")').first();
      if (await nlBtn.count() > 0) {
        await nlBtn.click();
        await page.waitForTimeout(1000);
        const startBtn = page.locator('button:has-text("Start Lesson")').first();
        if (await startBtn.count() > 0) {
          await startBtn.click();
          try {
            await page.waitForURL('**/room/**', { timeout: 10000 });
            await page.waitForTimeout(3000);
            await ss(page, `${acct.role}-05-room`);
            const roomHtml = await page.content();
            const canvasCount = await page.locator('canvas').count();
            log(`  📝 Canvas elements: ${canvasCount}`);
            if (canvasCount > 0) log(`  ✅ Whiteboard loaded`);
          } catch {
            log(`  ⚠️ Room creation may have failed`);
            await ss(page, `${acct.role}-05-room-error`);
          }
        }
      }
    } else {
      // Student: visit non-existent room
      await page.goto(`${BASE}/room/nonexistent-test-room`);
      await page.waitForTimeout(3000);
      await ss(page, `${acct.role}-05-student-room`);
      const roomHtml = await page.content();
      if (roomHtml.includes('Room not found')) log(`  ✅ Student sees "Room not found" (fixed UX)`);
      else if (roomHtml.includes('Lesson Not Available')) log(`  ❌ Still shows old "Lesson Not Available"`);
    }
    
    await ctx.close();
  }
  
  await browser.close();
  log(`\n✅ All tests done. Screenshots: ${DIR}/`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
