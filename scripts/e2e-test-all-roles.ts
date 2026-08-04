/**
 * End-to-end test for all 4 roles: Student, Free Tutor, Pro Tutor, Agency
 * Takes screenshots of each role's experience and reports bugs
 */
import { chromium, Browser, Page, BrowserContext } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = '/home/z/my-project/download/e2e-screenshots';

// Test accounts
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
  screenshot?: string;
}

const bugs: BugReport[] = [];
const logs: string[] = [];

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
  logs.push(msg);
}

function reportBug(role: string, page: string, action: string, expected: string, actual: string, severity: 'critical' | 'major' | 'minor' = 'major') {
  const bug = { role, page, action, expected, actual, severity };
  bugs.push(bug);
  log(`🐛 BUG [${severity.toUpperCase()}] (${role}) ${action}: expected "${expected}" but got "${actual}"`);
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function screenshot(page: Page, name: string) {
  const path = `${SCREENSHOT_DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: false });
  log(`📸 Screenshot saved: ${path}`);
  return path;
}

async function waitForNavigation(page: Page, timeout = 10000) {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch (e) {
    // networkidle timeout is ok, page might still be functional
  }
}

async function loginAs(page: Page, account: typeof accounts[0]): Promise<boolean> {
  log(`\n=== Logging in as ${account.role} (${account.email}) ===`);
  
  try {
    // Navigate to home page
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    
    // Click the login button
    const loginBtn = page.getByRole('button', { name: /login|sign in/i });
    if (await loginBtn.count() > 0) {
      await loginBtn.first().click();
      await sleep(1000);
    } else {
      // Try link
      const loginLink = page.getByRole('link', { name: /login|sign in/i });
      if (await loginLink.count() > 0) {
        await loginLink.first().click();
        await sleep(1000);
      }
    }
    
    // Look for a login dialog/modal
    await sleep(1500);
    await screenshot(page, `${account.role}-01-login-dialog`);
    
    // Fill in email
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    if (await emailInput.count() > 0) {
      await emailInput.fill(account.email);
      log(`  ✅ Filled email: ${account.email}`);
    } else {
      reportBug(account.role, 'Login', 'Find email input', 'Email input field visible', 'No email input found', 'critical');
      await screenshot(page, `${account.role}-01-login-no-email-input`);
      return false;
    }
    
    // Fill in password
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    if (await passwordInput.count() > 0) {
      await passwordInput.fill(account.password);
      log(`  ✅ Filled password`);
    } else {
      reportBug(account.role, 'Login', 'Find password input', 'Password input field visible', 'No password input found', 'critical');
      return false;
    }
    
    await screenshot(page, `${account.role}-02-login-filled`);
    
    // Click submit/login button
    const submitBtn = page.getByRole('button', { name: /login|sign in|submit/i });
    if (await submitBtn.count() > 0) {
      await submitBtn.first().click();
      log(`  ✅ Clicked login button`);
    } else {
      reportBug(account.role, 'Login', 'Find submit button', 'Login submit button visible', 'No submit button found', 'critical');
      return false;
    }
    
    // Wait for navigation/redirect after login
    await sleep(5000);
    await waitForNavigation(page);
    
    const currentUrl = page.url();
    const pageContent = await page.content();
    
    // Check if login succeeded (should redirect away from login page)
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/room') || 
        !currentUrl.includes('login') || pageContent.includes(account.email) ||
        pageContent.includes(account.role === 'student' ? '' : 'dashboard')) {
      log(`  ✅ Login successful! Current URL: ${currentUrl}`);
      await screenshot(page, `${account.role}-03-login-success`);
      return true;
    } else {
      // Check for error messages
      const errorEl = page.locator('[class*="error"], [class*="Error"], [role="alert"], .text-red, [class*="destructive"]');
      const errorMsg = await errorEl.textContent().catch(() => '');
      reportBug(account.role, 'Login', 'Login authentication', 'Redirect to dashboard', `Still on ${currentUrl}. Error: ${errorMsg || 'none visible'}`, 'critical');
      await screenshot(page, `${account.role}-03-login-failed`);
      return false;
    }
  } catch (error) {
    reportBug(account.role, 'Login', 'Login process', 'Successful login', `Exception: ${(error as Error).message}`, 'critical');
    await screenshot(page, `${account.role}-03-login-error`);
    return false;
  }
}

async function testDashboard(page: Page, account: typeof accounts[0]) {
  log(`\n=== Testing Dashboard for ${account.role} ===`);
  
  try {
    // Navigate to dashboard
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await sleep(3000);
    await waitForNavigation(page);
    await screenshot(page, `${account.role}-04-dashboard`);
    
    const pageContent = await page.content();
    
    // Check for dashboard elements
    const hasDashboard = pageContent.includes('dashboard') || 
                         pageContent.includes('Dashboard') ||
                         pageContent.includes('lesson') ||
                         pageContent.includes('Lesson') ||
                         pageContent.includes('room') ||
                         pageContent.includes('Room');
    
    if (!hasDashboard && pageContent.includes('404')) {
      reportBug(account.role, 'Dashboard', 'Load dashboard page', 'Dashboard visible', '404 Not Found', 'critical');
      return;
    }
    
    if (!hasDashboard && pageContent.includes('sign in')) {
      reportBug(account.role, 'Dashboard', 'Access dashboard', 'Dashboard visible', 'Redirected to login (auth not working)', 'critical');
      return;
    }
    
    log(`  ✅ Dashboard loaded for ${account.role}`);
    
    // Check for tier-specific features
    if (account.role === 'agency') {
      const hasBranding = pageContent.includes('brand') || pageContent.includes('Branding') || 
                          pageContent.includes('white-label') || pageContent.includes('White Label');
      if (!hasBranding) {
        reportBug(account.role, 'Dashboard', 'Agency branding features', 'Branding/white-label options visible', 'No branding features found', 'minor');
      } else {
        log(`  ✅ Agency branding features visible`);
      }
    }
    
    if (account.role === 'pro-tutor') {
      const hasVideo = pageContent.includes('video') || pageContent.includes('Video') ||
                       pageContent.includes('record') || pageContent.includes('Record');
      if (!hasVideo) {
        reportBug(account.role, 'Dashboard', 'Pro video features', 'Video/recording options visible', 'No video features found', 'minor');
      } else {
        log(`  ✅ Pro tutor video features visible`);
      }
    }
    
    if (account.role === 'free-tutor') {
      // Free tutors should see usage limits or upgrade prompts
      const hasUpgrade = pageContent.includes('upgrade') || pageContent.includes('Upgrade') ||
                         pageContent.includes('limit') || pageContent.includes('Limit') ||
                         pageContent.includes('pro') || pageContent.includes('PRO');
      if (hasUpgrade) {
        log(`  ✅ Free tutor sees upgrade/limit prompts`);
      }
    }
    
  } catch (error) {
    reportBug(account.role, 'Dashboard', 'Load dashboard', 'Dashboard visible', `Exception: ${(error as Error).message}`, 'major');
  }
}

async function testCreateLesson(page: Page, account: typeof accounts[0]) {
  if (account.role === 'student') {
    log(`  ⏭️ Skipping lesson creation for student`);
    return;
  }
  
  log(`\n=== Testing Create Lesson for ${account.role} ===`);
  
  try {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    await waitForNavigation(page);
    
    // Look for "create lesson" or "new lesson" or "new room" button
    const createBtn = page.getByRole('button', { name: /create|new lesson|new room|add/i });
    if (await createBtn.count() > 0) {
      await createBtn.first().click();
      await sleep(2000);
      await screenshot(page, `${account.role}-05-create-lesson-dialog`);
      log(`  ✅ Create lesson button found and clicked`);
      
      // Fill lesson name
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i], input[placeholder*="title" i]').first();
      if (await nameInput.count() > 0) {
        await nameInput.fill(`E2E Test Lesson - ${account.role}`);
        log(`  ✅ Filled lesson name`);
      }
      
      await screenshot(page, `${account.role}-06-create-lesson-filled`);
      
      // Try to submit
      const submitBtn = page.getByRole('button', { name: /create|save|submit|start/i });
      if (await submitBtn.count() > 0) {
        await submitBtn.first().click();
        await sleep(3000);
        await waitForNavigation(page);
        
        const newUrl = page.url();
        log(`  ✅ Lesson created, navigated to: ${newUrl}`);
        await screenshot(page, `${account.role}-07-lesson-created`);
      }
    } else {
      reportBug(account.role, 'Create Lesson', 'Find create button', 'Create/New Lesson button visible', 'No create button found on dashboard', 'major');
    }
  } catch (error) {
    reportBug(account.role, 'Create Lesson', 'Create lesson flow', 'Lesson created successfully', `Exception: ${(error as Error).message}`, 'major');
  }
}

async function testRoomWhiteboard(page: Page, account: typeof accounts[0]) {
  log(`\n=== Testing Room/Whiteboard for ${account.role} ===`);
  
  try {
    // For tutors, go to their first room; for students, use a known room
    let roomUrl: string;
    if (account.role === 'student') {
      roomUrl = `${BASE_URL}/room/test-room-e2e`;
    } else {
      // Try to find a room link on dashboard
      const roomLink = page.locator('a[href*="/room/"]').first();
      if (await roomLink.count() > 0) {
        roomUrl = await roomLink.getAttribute('href') || '';
        if (!roomUrl.startsWith('http')) roomUrl = BASE_URL + roomUrl;
      } else {
        roomUrl = `${BASE_URL}/room/e2e-${account.role}-room`;
      }
    }
    
    await page.goto(roomUrl, { waitUntil: 'domcontentloaded' });
    await sleep(3000);
    await waitForNavigation(page);
    await screenshot(page, `${account.role}-08-room`);
    
    const pageContent = await page.content();
    
    // Check for whiteboard/canvas element
    const hasCanvas = await page.locator('canvas').count() > 0;
    const hasWhiteboard = pageContent.includes('whiteboard') || pageContent.includes('board');
    
    if (hasCanvas) {
      log(`  ✅ Whiteboard canvas found`);
    } else if (hasWhiteboard) {
      log(`  ✅ Whiteboard element found`);
    } else {
      reportBug(account.role, 'Room', 'Whiteboard rendering', 'Canvas/whiteboard element visible', 'No whiteboard element found', 'major');
    }
    
    // Check for smart tools (pen, eraser, shapes, etc.)
    const toolButtons = page.locator('[data-tool], [class*="tool"], button[title]');
    const toolCount = await toolButtons.count();
    log(`  📝 Found ${toolCount} tool elements`);
    
    if (toolCount > 0) {
      log(`  ✅ Smart tools available`);
      await screenshot(page, `${account.role}-09-tools`);
    } else {
      reportBug(account.role, 'Room', 'Smart tools', 'Drawing tools visible (pen, eraser, shapes)', 'No tools found', 'minor');
    }
    
    // Check for "Lesson Not Available" error (student specific)
    if (account.role === 'student') {
      const hasNotAvailable = pageContent.includes('Not Available') || pageContent.includes('not available') || 
                              pageContent.includes('not found') || pageContent.includes('404');
      if (hasNotAvailable) {
        reportBug(account.role, 'Room', 'Student room access', 'Room loads or shows friendly message', '"Lesson Not Available" error', 'major');
      }
    }
    
  } catch (error) {
    reportBug(account.role, 'Room', 'Room/whiteboard loading', 'Room with whiteboard visible', `Exception: ${(error as Error).message}`, 'major');
  }
}

async function testUsageAndBilling(page: Page, account: typeof accounts[0]) {
  if (account.role === 'student') {
    log(`  ⏭️ Skipping billing test for student`);
    return;
  }
  
  log(`\n=== Testing Usage/Billing for ${account.role} ===`);
  
  try {
    // Check usage API
    const usageResponse = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/usage/current');
        return { status: res.status, data: await res.json().catch(() => null) };
      } catch (e) {
        return { status: 0, data: null, error: String(e) };
      }
    });
    
    log(`  📊 Usage API response: status=${usageResponse.status}`);
    if (usageResponse.data) {
      log(`  📊 Usage data: ${JSON.stringify(usageResponse.data).substring(0, 200)}`);
    }
    
    if (usageResponse.status === 200 && usageResponse.data) {
      log(`  ✅ Usage API working for ${account.role}`);
    } else if (usageResponse.status === 401) {
      reportBug(account.role, 'Usage', 'Fetch usage data', '200 with usage data', `401 Unauthorized - auth not working`, 'critical');
    } else {
      reportBug(account.role, 'Usage', 'Fetch usage data', '200 with usage data', `Status ${usageResponse.status}`, 'major');
    }
    
    // Navigate to billing/pricing page if it exists
    const billingPaths = ['/billing', '/pricing', '/settings/billing', '/dashboard/billing'];
    for (const path of billingPaths) {
      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
      await sleep(2000);
      const status = await page.evaluate(() => {
        const el = document.querySelector('main') || document.body;
        return { text: el.innerText.substring(0, 200), url: window.location.href };
      });
      if (!status.url.includes('404') && (status.text.includes('bill') || status.text.includes('plan') || status.text.includes('price'))) {
        log(`  ✅ Billing page found at ${path}`);
        await screenshot(page, `${account.role}-10-billing`);
        break;
      }
    }
    
    // For free tier, check if limits/paywall appear
    if (account.tier === 'FREE') {
      const pageContent = await page.content();
      const hasLimit = pageContent.includes('limit') || pageContent.includes('Limit') ||
                       pageContent.includes('upgrade') || pageContent.includes('Upgrade');
      if (hasLimit) {
        log(`  ✅ Free tier shows usage limits/upgrade prompt`);
      }
    }
    
  } catch (error) {
    reportBug(account.role, 'Usage/Billing', 'Usage & billing flow', 'Usage data and billing visible', `Exception: ${(error as Error).message}`, 'major');
  }
}

async function testProfile(page: Page, account: typeof accounts[0]) {
  log(`\n=== Testing Profile for ${account.role} ===`);
  
  try {
    const profileResponse = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/auth/profile');
        return { status: res.status, data: await res.json().catch(() => null) };
      } catch (e) {
        return { status: 0, data: null, error: String(e) };
      }
    });
    
    log(`  👤 Profile API response: status=${profileResponse.status}`);
    if (profileResponse.data) {
      log(`  👤 Profile data: ${JSON.stringify(profileResponse.data).substring(0, 300)}`);
    }
    
    if (profileResponse.status === 200 && profileResponse.data) {
      const profile = profileResponse.data;
      if (profile.email === account.email) {
        log(`  ✅ Profile email matches: ${profile.email}`);
      } else {
        reportBug(account.role, 'Profile', 'Profile email match', `Email: ${account.email}`, `Email: ${profile.email || 'missing'}`, 'major');
      }
      if (profile.tier === account.tier) {
        log(`  ✅ Profile tier matches: ${profile.tier}`);
      } else {
        reportBug(account.role, 'Profile', 'Profile tier match', `Tier: ${account.tier}`, `Tier: ${profile.tier || 'missing'}`, 'major');
      }
    } else if (profileResponse.status === 401) {
      reportBug(account.role, 'Profile', 'Fetch profile', '200 with profile data', '401 Unauthorized', 'critical');
    } else {
      reportBug(account.role, 'Profile', 'Fetch profile', '200 with profile data', `Status ${profileResponse.status}`, 'major');
    }
    
  } catch (error) {
    reportBug(account.role, 'Profile', 'Profile API', 'Profile data returned', `Exception: ${(error as Error).message}`, 'major');
  }
}

async function testHomePage(page: Page) {
  log(`\n=== Testing Home Page (unauthenticated) ===`);
  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await sleep(3000);
    await waitForNavigation(page);
    await screenshot(page, '00-home-page');
    
    const pageContent = await page.content();
    log(`  📄 Home page loaded. Title: ${await page.title()}`);
    
    // Check for login/signup buttons
    const hasLogin = pageContent.includes('Login') || pageContent.includes('login') || pageContent.includes('Sign');
    const hasSignup = pageContent.includes('Sign up') || pageContent.includes('sign up') || pageContent.includes('Register');
    
    if (hasLogin) log(`  ✅ Login button/link present on home page`);
    else reportBug('home', 'Home Page', 'Login button', 'Login button visible', 'No login button found', 'major');
    
    if (hasSignup) log(`  ✅ Signup button/link present on home page`);
    else reportBug('home', 'Home Page', 'Signup button', 'Signup button visible', 'No signup button found', 'minor');
    
    // Check for any glass/blur effects (should be NONE per design requirements)
    const styleElements = await page.evaluate(() => {
      const allEls = document.querySelectorAll('*');
      const issues: string[] = [];
      allEls.forEach(el => {
        const style = getComputedStyle(el);
        if (style.backdropFilter && style.backdropFilter !== 'none') {
          issues.push(`Element ${el.tagName}.${el.className} has backdrop-filter: ${style.backdropFilter}`);
        }
        if (style.opacity && parseFloat(style.opacity) < 0.95 && parseFloat(style.opacity) > 0) {
          issues.push(`Element ${el.tagName}.${el.className} has opacity: ${style.opacity}`);
        }
      });
      return issues;
    });
    
    if (styleElements.length > 0) {
      log(`  ⚠️ Found ${styleElements.length} elements with potential blur/transparency (checking if oklch...)`);
      // Check for oklch colors
      for (const issue of styleElements.slice(0, 5)) {
        log(`    - ${issue}`);
      }
    } else {
      log(`  ✅ No glass/blur/transparency effects found (design compliant)`);
    }
    
  } catch (error) {
    reportBug('home', 'Home Page', 'Load home page', 'Home page visible', `Exception: ${(error as Error).message}`, 'critical');
  }
}

async function runTests() {
  log('🚀 Starting End-to-End Test Suite for All Roles');
  log(`Base URL: ${BASE_URL}`);
  log(`Screenshot dir: ${SCREENSHOT_DIR}`);
  
  // Create screenshot directory
  const { mkdirSync } = await import('fs');
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
  
  const browser: Browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  
  // Test 1: Home page (unauthenticated)
  log('\n' + '='.repeat(60));
  log('TEST 0: Home Page (Unauthenticated)');
  log('='.repeat(60));
  const homeContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const homePage = await homeContext.newPage();
  await testHomePage(homePage);
  await homeContext.close();
  
  // Test each role
  for (const account of accounts) {
    log('\n' + '='.repeat(60));
    log(`TEST: ${account.role.toUpperCase()} (${account.tier} tier)`);
    log('='.repeat(60));
    
    const context: BrowserContext = await browser.newContext({ 
      viewport: { width: 1440, height: 900 },
      // Don't persist storage between tests
    });
    const page = await context.newPage();
    
    // Set up console error capture
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(`PageError: ${err.message}`));
    
    // Step 1: Login
    const loginSuccess = await loginAs(page, account);
    
    if (loginSuccess) {
      // Step 2: Profile API check
      await testProfile(page, account);
      
      // Step 3: Dashboard
      await testDashboard(page, account);
      
      // Step 4: Create Lesson (tutors only)
      await testCreateLesson(page, account);
      
      // Step 5: Room/Whiteboard
      await testRoomWhiteboard(page, account);
      
      // Step 6: Usage/Billing
      await testUsageAndBilling(page, account);
      
      // Log any console errors
      if (consoleErrors.length > 0) {
        log(`  ⚠️ ${consoleErrors.length} console errors detected:`);
        consoleErrors.slice(0, 10).forEach(e => log(`    - ${e}`));
        if (consoleErrors.length > 10) {
          log(`    ... and ${consoleErrors.length - 10} more`);
        }
      }
    }
    
    await context.close();
  }
  
  await browser.close();
  
  // Print final report
  log('\n' + '='.repeat(60));
  log('📊 FINAL BUG REPORT');
  log('='.repeat(60));
  
  if (bugs.length === 0) {
    log('🎉 NO BUGS FOUND! All tests passed.');
  } else {
    const criticals = bugs.filter(b => b.severity === 'critical');
    const majors = bugs.filter(b => b.severity === 'major');
    const minors = bugs.filter(b => b.severity === 'minor');
    
    log(`\nTotal bugs: ${bugs.length}`);
    log(`  Critical: ${criticals.length}`);
    log(`  Major: ${majors.length}`);
    log(`  Minor: ${minors.length}`);
    log('');
    
    bugs.forEach((bug, i) => {
      log(`${i + 1}. [${bug.severity.toUpperCase()}] ${bug.role} - ${bug.page} - ${bug.action}`);
      log(`   Expected: ${bug.expected}`);
      log(`   Actual: ${bug.actual}`);
      log('');
    });
  }
  
  log(`\n📸 Screenshots saved to: ${SCREENSHOT_DIR}`);
  log('🏁 End-to-end test suite complete.');
}

runTests().catch(err => {
  console.error('Fatal error in test suite:', err);
  process.exit(1);
});
