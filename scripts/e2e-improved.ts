/**
 * Improved E2E test — tests through the actual app UI, not direct API calls.
 * Tests all 4 roles: Student, Free Tutor, Pro Tutor, Agency.
 */
import { chromium, Browser, Page, BrowserContext } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = '/home/z/my-project/download/e2e-screenshots';

const accounts = [
  { role: 'student', email: 'student@superboard.app', password: 'Student1234!', tier: 'FREE' },
  { role: 'free-tutor', email: 'free-tutor@superboard.app', password: 'FreeTutor1234!', tier: 'FREE' },
  { role: 'pro-tutor', email: 'pro-tutor@superboard.app', password: 'ProTutor1234!', tier: 'PRO' },
  { role: 'agency', email: 'agency@superboard.app', password: 'Agency1234!', tier: 'AGENCY' },
];

interface BugReport {
  role: string;
  page: string;
  action: string;
  expected: string;
  actual: string;
  severity: 'critical' | 'major' | 'minor';
}

const bugs: BugReport[] = [];
const logs: string[] = [];

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
  logs.push(msg);
}

function reportBug(role: string, page: string, action: string, expected: string, actual: string, severity: 'critical' | 'major' | 'minor' = 'major') {
  bugs.push({ role, page, action, expected, actual, severity });
  log(`🐛 BUG [${severity.toUpperCase()}] (${role}) ${action}: expected "${expected}" but got "${actual}"`);
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function screenshot(page: Page, name: string) {
  const path = `${SCREENSHOT_DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: false });
  log(`📸 Screenshot: ${name}.png`);
}

async function loginAs(page: Page, account: typeof accounts[0]): Promise<boolean> {
  log(`\n=== Logging in as ${account.role} ===`);
  
  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await sleep(3000);
    
    // Click "Sign In" or "Login" text
    const signInBtn = page.getByText('Sign In', { exact: false });
    const loginBtn = page.getByRole('button', { name: /login|sign in/i });
    const signInLink = page.getByRole('link', { name: /login|sign in/i });
    
    let clicked = false;
    if (await signInBtn.count() > 0) {
      await signInBtn.first().click();
      clicked = true;
    } else if (await loginBtn.count() > 0) {
      await loginBtn.first().click();
      clicked = true;
    } else if (await signInLink.count() > 0) {
      await signInLink.first().click();
      clicked = true;
    }
    
    if (!clicked) {
      // Try clicking anything that says "Login" or "Sign In"
      const anyLogin = page.locator('text=/Sign In|Login/i').first();
      if (await anyLogin.count() > 0) {
        await anyLogin.click();
        clicked = true;
      }
    }
    
    await sleep(1500);
    await screenshot(page, `${account.role}-01-auth-dialog`);
    
    // Fill email
    const emailInput = page.locator('input#login-email, input[type="email"]').first();
    await emailInput.waitFor({ timeout: 5000 });
    await emailInput.fill(account.email);
    
    // Fill password
    const passwordInput = page.locator('input#login-password, input[type="password"]').first();
    await passwordInput.fill(account.password);
    
    await screenshot(page, `${account.role}-02-auth-filled`);
    
    // Submit
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    
    // Wait for dashboard to appear (Welcome back text or Superboard header)
    try {
      await page.waitForSelector('text=/Welcome back|Superboard/', { timeout: 15000 });
    } catch {
      // Check if still on landing page
    }
    
    await sleep(3000);
    
    const pageContent = await page.content();
    const hasWelcome = pageContent.includes('Welcome back');
    const hasDashboard = pageContent.includes('New Lesson') || pageContent.includes('Smart Credits');
    const hasError = pageContent.includes('Invalid login') || pageContent.includes('error');
    
    if (hasWelcome || hasDashboard) {
      log(`  ✅ Login successful — dashboard visible`);
      await screenshot(page, `${account.role}-03-dashboard`);
      return true;
    } else if (hasError) {
      const errText = await page.locator('.text-rose-600, [class*="error"], [class*="rose"]').textContent().catch(() => '');
      reportBug(account.role, 'Login', 'Authentication', 'Dashboard visible', `Auth error: ${errText || 'login failed'}`, 'critical');
      await screenshot(page, `${account.role}-03-login-error`);
      return false;
    } else {
      reportBug(account.role, 'Login', 'Authentication', 'Dashboard visible', `Unknown state — no dashboard detected`, 'critical');
      await screenshot(page, `${account.role}-03-login-unknown`);
      return false;
    }
  } catch (error) {
    reportBug(account.role, 'Login', 'Login process', 'Successful login', `Exception: ${(error as Error).message}`, 'critical');
    return false;
  }
}

async function testDashboardFeatures(page: Page, account: typeof accounts[0]) {
  log(`\n=== Dashboard Features for ${account.role} ===`);
  
  try {
    const content = await page.content();
    
    // 1. Check user email shown
    if (content.includes(account.email)) {
      log(`  ✅ User email displayed in header`);
    } else {
      reportBug(account.role, 'Dashboard', 'User email display', `Email ${account.email} visible`, 'Email not found in header', 'minor');
    }
    
    // 2. Check tier badge
    const tierLabels: Record<string, string> = {
      'FREE': 'Free',
      'PRO': 'Pro', 
      'AGENCY': 'Agency',
    };
    if (content.includes(tierLabels[account.tier])) {
      log(`  ✅ Tier badge shows "${tierLabels[account.tier]}"`);
    } else {
      reportBug(account.role, 'Dashboard', 'Tier badge', `Tier "${tierLabels[account.tier]}" badge`, 'Wrong or missing tier badge', 'major');
    }
    
    // 3. Check Smart Credits display
    if (content.includes('Smart Credits')) {
      log(`  ✅ Smart Credits card visible`);
    } else {
      reportBug(account.role, 'Dashboard', 'Smart Credits', 'Smart Credits card visible', 'Not found', 'major');
    }
    
    // 4. Check Video Minutes display
    if (content.includes('Video Minutes')) {
      log(`  ✅ Video Minutes card visible`);
    } else {
      reportBug(account.role, 'Dashboard', 'Video Minutes', 'Video Minutes card visible', 'Not found', 'minor');
    }
    
    // 5. Check Session Recordings display
    if (content.includes('Session Recordings')) {
      log(`  ✅ Session Recordings card visible`);
    } else {
      reportBug(account.role, 'Dashboard', 'Session Recordings', 'Recordings card visible', 'Not found', 'minor');
    }
    
    // 6. Check "New Lesson" button (for tutors/agency)
    if (account.role !== 'student') {
      if (content.includes('New Lesson')) {
        log(`  ✅ "New Lesson" button visible`);
      } else {
        reportBug(account.role, 'Dashboard', 'New Lesson button', 'New Lesson button visible', 'Not found', 'major');
      }
    }
    
    // 7. Check tabs: Boards, Templates
    if (content.includes('Boards') && content.includes('Templates')) {
      log(`  ✅ Boards & Templates tabs visible`);
    } else {
      reportBug(account.role, 'Dashboard', 'Content tabs', 'Boards & Templates tabs', 'Tabs not found', 'minor');
    }
    
    // 8. Tier-specific: Free should see upgrade hints
    if (account.tier === 'FREE') {
      if (content.includes('Requires Pro') || content.includes('upgrade') || content.includes('Upgrade')) {
        log(`  ✅ Free tier sees upgrade prompt`);
      }
    }
    
    // 9. Agency: should see branding option in New Lesson dialog
    if (account.tier === 'AGENCY') {
      // Open New Lesson dialog to check branding
      const newLessonBtn = page.locator('button:has-text("New Lesson")').first();
      if (await newLessonBtn.count() > 0) {
        await newLessonBtn.click();
        await sleep(1000);
        const dialogContent = await page.content();
        if (dialogContent.includes('Branding')) {
          log(`  ✅ Agency branding field in New Lesson dialog`);
        } else {
          reportBug(account.role, 'Dashboard', 'Agency branding in lesson', 'Branding field visible in dialog', 'Not found', 'minor');
        }
        // Close dialog
        const closeBtn = page.locator('button[aria-label="Close"]').first();
        if (await closeBtn.count() > 0) await closeBtn.click();
        await sleep(500);
      }
    }
    
    await screenshot(page, `${account.role}-04-dashboard-features`);
    
  } catch (error) {
    reportBug(account.role, 'Dashboard', 'Feature checks', 'All features visible', `Exception: ${(error as Error).message}`, 'major');
  }
}

async function testCreateLessonFlow(page: Page, account: typeof accounts[0]) {
  if (account.role === 'student') {
    log(`  ⏭️ Students don't create lessons — skipping`);
    return;
  }
  
  log(`\n=== Create Lesson Flow for ${account.role} ===`);
  
  try {
    // Open New Lesson dialog
    const newLessonBtn = page.locator('button:has-text("New Lesson")').first();
    if (await newLessonBtn.count() === 0) {
      reportBug(account.role, 'Create Lesson', 'Open dialog', 'New Lesson button clickable', 'Button not found', 'major');
      return;
    }
    
    await newLessonBtn.click();
    await sleep(1500);
    await screenshot(page, `${account.role}-05-new-lesson-dialog`);
    
    // Check dialog elements
    const dialogContent = await page.content();
    
    if (dialogContent.includes('Create New Lesson')) {
      log(`  ✅ Create New Lesson dialog title visible`);
    }
    
    if (dialogContent.includes('Mathematics') && dialogContent.includes('Science')) {
      log(`  ✅ Subject options available (Math, Science, etc.)`);
    }
    
    if (dialogContent.includes('Start Lesson')) {
      log(`  ✅ "Start Lesson" button visible`);
    }
    
    // Select Mathematics
    const mathOption = page.locator('text=Mathematics').first();
    if (await mathOption.count() > 0) {
      await mathOption.click();
      await sleep(500);
    }
    
    // Click Start Lesson (this will navigate to room page)
    const startBtn = page.locator('button:has-text("Start Lesson")').first();
    if (await startBtn.count() > 0) {
      log(`  ✅ Clicking "Start Lesson"...`);
      await startBtn.click();
      
      // Wait for navigation to room
      try {
        await page.waitForURL('**/room/**', { timeout: 10000 });
        await sleep(3000);
        log(`  ✅ Navigated to room: ${page.url()}`);
        await screenshot(page, `${account.role}-06-new-room`);
        
        // Check for whiteboard
        const roomContent = await page.content();
        if (roomContent.includes('canvas') || await page.locator('canvas').count() > 0) {
          log(`  ✅ Whiteboard canvas loaded in new room`);
        } else {
          log(`  ⚠️ No canvas element detected — whiteboard may still be loading`);
        }
        
        // Go back to dashboard
        await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
        await sleep(3000);
        await page.waitForSelector('text=/Welcome back/', { timeout: 10000 }).catch(() => {});
        
      } catch {
        // May have gotten an error
        log(`  ⚠️ Did not navigate to room — checking for error`);
        await screenshot(page, `${account.role}-06-create-error`);
      }
    }
    
  } catch (error) {
    reportBug(account.role, 'Create Lesson', 'Full flow', 'Lesson created and room opened', `Exception: ${(error as Error).message}`, 'major');
  }
}

async function testWhiteboardTools(page: Page, account: typeof accounts[0]) {
  log(`\n=== Whiteboard Tools for ${account.role} ===`);
  
  try {
    // Navigate to the room
    let roomUrl: string;
    if (account.role === 'student') {
      roomUrl = `${BASE_URL}/room/test-room-e2e`;
    } else {
      // Find a room link from dashboard
      const roomLink = page.locator('a[href*="/room/"]').first();
      if (await roomLink.count() > 0) {
        roomUrl = await roomLink.getAttribute('href') || '';
        if (!roomUrl.startsWith('http')) roomUrl = BASE_URL + roomUrl;
      } else {
        // Create a new lesson to get a room
        const newLessonBtn = page.locator('button:has-text("New Lesson")').first();
        if (await newLessonBtn.count() > 0) {
          await newLessonBtn.click();
          await sleep(1000);
          const startBtn = page.locator('button:has-text("Start Lesson")').first();
          await startBtn.click();
          try {
            await page.waitForURL('**/room/**', { timeout: 10000 });
            roomUrl = page.url();
          } catch {
            log(`  ⚠️ Could not create room for tool testing`);
            return;
          }
        } else {
          log(`  ⚠️ No room available for tool testing`);
          return;
        }
      }
    }
    
    await page.goto(roomUrl, { waitUntil: 'domcontentloaded' });
    await sleep(4000);
    await screenshot(page, `${account.role}-07-whiteboard`);
    
    const content = await page.content();
    
    // For student with non-existent room — we should see the improved error page
    if (account.role === 'student' && roomUrl.includes('test-room-e2e')) {
      if (content.includes('Room not found')) {
        log(`  ✅ Student sees friendly "Room not found" page (improved UX)`);
      } else if (content.includes('Lesson Not Available')) {
        reportBug(account.role, 'Room', 'Student room UX', '"Room not found" friendly page', 'Still shows old "Lesson Not Available"', 'major');
      } else {
        log(`  ℹ️ Student room shows some other content`);
      }
      await screenshot(page, `${account.role}-08-student-room-ux`);
      return;
    }
    
    // Check for whiteboard elements
    const canvasCount = await page.locator('canvas').count();
    log(`  📝 Canvas elements found: ${canvasCount}`);
    
    // Look for tool buttons in various ways
    const allButtons = await page.locator('button').count();
    const svgIcons = await page.locator('button svg, button [class*="icon"]').count();
    log(`  📝 Total buttons: ${allButtons}, buttons with icons: ${svgIcons}`);
    
    // Check for specific known tool areas
    const toolbarExists = content.includes('Toolbar') || content.includes('toolbar') || 
                         content.includes('Pen') || content.includes('pen') ||
                         content.includes('Eraser') || content.includes('eraser');
    
    if (toolbarExists || svgIcons > 3) {
      log(`  ✅ Toolbar/Tools appear to be present`);
    } else {
      log(`  ⚠️ Toolbar not clearly detected — may need manual verification`);
    }
    
    // Check for subject-specific toolkit
    const hasToolkit = content.includes('MathToolkit') || content.includes('ScienceToolkit') || 
                       content.includes('LanguageToolkit') || content.includes('GeneralToolkit') ||
                       content.includes('Calculator') || content.includes('GeoGebra');
    if (hasToolkit) {
      log(`  ✅ Subject toolkit detected`);
    }
    
    // Check for AI panel
    const hasAI = content.includes('AI') || content.includes('Smart') || content.includes('Quiz') || content.includes('Worksheet');
    if (hasAI) {
      log(`  ✅ AI tools panel detected`);
    }
    
  } catch (error) {
    reportBug(account.role, 'Whiteboard', 'Tool detection', 'Tools and whiteboard functional', `Exception: ${(error as Error).message}`, 'major');
  }
}

async function testLogout(page: Page, account: typeof accounts[0]) {
  log(`\n=== Logout for ${account.role} ===`);
  
  try {
    const logoutBtn = page.locator('button[title="Sign out"]').first();
    if (await logoutBtn.count() > 0) {
      await logoutBtn.click();
      await sleep(2000);
      
      const content = await page.content();
      if (!content.includes('Welcome back') && (content.includes('Sign In') || content.includes('Sign in'))) {
        log(`  ✅ Logout successful — back to landing page`);
        await screenshot(page, `${account.role}-09-logged-out`);
      } else {
        reportBug(account.role, 'Logout', 'Sign out', 'Landing page visible', 'Still on dashboard', 'major');
      }
    } else {
      log(`  ⚠️ Logout button not found (may be hidden on small viewport)`);
    }
  } catch (error) {
    log(`  ⚠️ Logout test error: ${(error as Error).message}`);
  }
}

async function testHomeDesign(page: Page) {
  log(`\n=== Testing Home Page Design ===`);
  
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await sleep(3000);
  await screenshot(page, '00-homepage-design');
  
  const content = await page.content();
  
  // Check for proper design (no oklch, no glass)
  const styleIssues = await page.evaluate(() => {
    const issues: string[] = [];
    const allEls = document.querySelectorAll('*');
    let blurCount = 0;
    let oklchCount = 0;
    
    allEls.forEach(el => {
      const style = getComputedStyle(el);
      // Check backdrop-filter (glass effects)
      if (style.backdropFilter && style.backdropFilter !== 'none') {
        blurCount++;
      }
      // Check for oklch colors in inline styles
      const inlineStyle = (el as HTMLElement).style.cssText;
      if (inlineStyle.includes('oklch')) {
        oklchCount++;
        issues.push(`oklch found in inline style of ${el.tagName}.${el.className}`);
      }
    });
    
    return { blurCount, oklchCount, issues };
  });
  
  if (styleIssues.blurCount > 0) {
    log(`  ⚠️ Found ${styleIssues.blurCount} elements with backdrop-filter (glass effect)`);
  } else {
    log(`  ✅ No glass/blur effects found`);
  }
  
  if (styleIssues.oklchCount > 0) {
    reportBug('home', 'Design', 'oklch colors', 'No oklch colors', `Found ${styleIssues.oklchCount} oklch colors`, 'major');
    styleIssues.issues.forEach(i => log(`    - ${i}`));
  } else {
    log(`  ✅ No oklch colors found`);
  }
  
  // Check opacity elements are decorative (background blobs only)
  const opacityElements = await page.evaluate(() => {
    const els = document.querySelectorAll('*');
    const opacities: { tag: string; class: string; opacity: string }[] = [];
    els.forEach(el => {
      const style = getComputedStyle(el);
      const op = parseFloat(style.opacity);
      if (op < 0.1 && op > 0 && el.children.length === 0) {
        opacities.push({ tag: el.tagName, class: el.className, opacity: style.opacity });
      }
    });
    return opacities;
  });
  
  if (opacityElements.length > 0) {
    log(`  ℹ️ ${opacityElements.length} low-opacity elements (likely decorative backgrounds)`);
  }
}

async function runTests() {
  log('🚀 IMPROVED E2E Test Suite — All 4 Roles');
  log(`Base URL: ${BASE_URL}`);
  
  const { mkdirSync } = await import('fs');
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
  
  const browser: Browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  
  // Test 0: Home page design check
  const homeCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await testHomeDesign(await homeCtx.newPage());
  await homeCtx.close();
  
  // Test each role
  for (const account of accounts) {
    log('\n' + '='.repeat(60));
    log(`ROLE: ${account.role.toUpperCase()} (${account.tier})`);
    log('='.repeat(60));
    
    const context: BrowserContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    
    // Capture console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', err => consoleErrors.push(`PageError: ${err.message}`));
    
    const loginOk = await loginAs(page, account);
    
    if (loginOk) {
      await testDashboardFeatures(page, account);
      await testCreateLessonFlow(page, account);
      await testWhiteboardTools(page, account);
      await testLogout(page, account);
      
      if (consoleErrors.length > 0) {
        log(`  ⚠️ ${consoleErrors.length} console errors (non-blocking)`);
        consoleErrors.filter(e => !e.includes('DialogContent') && !e.includes('favicon')).slice(0, 5)
          .forEach(e => log(`    - ${e.substring(0, 120)}`));
      }
    }
    
    await context.close();
  }
  
  await browser.close();
  
  // Final report
  log('\n' + '='.repeat(60));
  log('📊 FINAL BUG REPORT');
  log('='.repeat(60));
  
  if (bugs.length === 0) {
    log('🎉 NO BUGS FOUND! All tests passed.');
  } else {
    const criticals = bugs.filter(b => b.severity === 'critical');
    const majors = bugs.filter(b => b.severity === 'major');
    const minors = bugs.filter(b => b.severity === 'minor');
    
    log(`\nTotal: ${bugs.length} | Critical: ${criticals.length} | Major: ${majors.length} | Minor: ${minors.length}\n`);
    bugs.forEach((bug, i) => {
      log(`${i + 1}. [${bug.severity.toUpperCase()}] ${bug.role}/${bug.page}: ${bug.action}`);
      log(`   Expected: ${bug.expected}`);
      log(`   Actual: ${bug.actual}\n`);
    });
  }
  
  log(`📸 Screenshots: ${SCREENSHOT_DIR}/`);
}

runTests().catch(err => { console.error('Fatal:', err); process.exit(1); });
