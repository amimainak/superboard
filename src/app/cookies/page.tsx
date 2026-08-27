// ============================================================
// Cookie Policy Page
// ============================================================
import LegalPageLayout from '@/components/legal/LegalPageLayout';

export const metadata = {
  title: 'Cookie Policy — Superboard',
  description: 'Cookie policy explaining how Superboard uses cookies and similar technologies.',
};

export default function CookiesPage() {
  return (
    <LegalPageLayout title="Cookie Policy" lastUpdated="August 8, 2026">
      <p>
        This Cookie Policy explains how Superboard (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) uses cookies and
        similar tracking technologies when you visit and use our tutoring whiteboard platform
        (&quot;Service&quot;). This policy should be read alongside
        our <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2>1. What Are Cookies?</h2>
      <p>
        Cookies are small text files placed on your device (computer, tablet, or mobile phone)
        when you visit a website. They are widely used to make websites work more efficiently and
        to provide information to website owners. Similar technologies include local storage,
        session storage, and pixel tags (also known as web beacons).
      </p>

      <h2>2. How We Use Cookies</h2>
      <p>We use cookies for the following purposes:</p>

      <h3>2.1 Essential Cookies (Required)</h3>
      <p>
        These cookies are strictly necessary for the operation of the Service. They enable core
        functionality such as authentication, session management, and security. Without these
        cookies, the Service cannot function properly.
      </p>
      <table>
        <thead>
          <tr>
            <th>Cookie</th>
            <th>Purpose</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>sb-session</td>
            <td>Maintains your authenticated session</td>
            <td>Session (until browser closes)</td>
          </tr>
          <tr>
            <td>sb-pref-theme</td>
            <td>Stores your light/dark mode preference</td>
            <td>1 year</td>
          </tr>
          <tr>
            <td>__stripe_mid</td>
            <td>Stripe fraud prevention and security</td>
            <td>1 year</td>
          </tr>
          <tr>
            <td>__stripe_sid</td>
            <td>Stripe session management during checkout</td>
            <td>Session (until browser closes)</td>
          </tr>
        </tbody>
      </table>

      <h3>2.2 Analytics Cookies</h3>
      <p>
        These cookies collect information about how visitors use the Service, such as which pages
        are visited most frequently, how users navigate between pages, and where error messages
        occur. All data collected by analytics cookies is aggregated and anonymized.
      </p>
      <table>
        <thead>
          <tr>
            <th>Cookie</th>
            <th>Purpose</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>_ga</td>
            <td>Distinguishes unique visitors for analytics</td>
            <td>2 years</td>
          </tr>
          <tr>
            <td>_ga_*</td>
            <td>Maintains session state for analytics</td>
            <td>2 years</td>
          </tr>
        </tbody>
      </table>

      <h3>2.3 Functional Cookies</h3>
      <p>
        These cookies enable enhanced functionality and personalization, such as remembering your
        recently used templates, preferred whiteboard settings, and dashboard layout preferences.
      </p>

      <h2>3. Third-Party Cookies</h2>
      <p>
        Some cookies on our Service are placed by third-party services that we use to operate our
        platform. These include:
      </p>
      <ul>
        <li>
          <strong>Stripe:</strong> Uses cookies for secure payment processing, fraud detection, and
          checkout session management.
        </li>
        <li>
          <strong>Supabase:</strong> Uses cookies for authentication and real-time database
          connections.
        </li>
        <li>
          <strong>LiveKit:</strong> Uses cookies for video and audio session management.
        </li>
        <li>
          <strong>Google Analytics:</strong> Uses cookies to help us understand how visitors
          interact with our Service. You can opt out of Google Analytics by installing
          the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a>.
        </li>
      </ul>
      <p>
        We do not control these third-party cookies. We encourage you to review the privacy
        policies of these third-party providers for more information about their cookie practices.
      </p>

      <h2>4. Managing Cookies</h2>
      <p>
        You can control and manage cookies through your browser settings. Most browsers allow you
        to view, delete, or block cookies. Please note that blocking or deleting essential cookies
        may affect the functionality of the Service. For more information on managing cookies in
        your specific browser, consult your browser&apos;s help documentation:
      </p>
      <ul>
        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
        <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
        <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer">Apple Safari</a></li>
        <li><a href="https://support.microsoft.com/en-us/microsoft-edge/manage-cookies-in-microsoft-edge-view-allow-block-delete-and-use-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
      </ul>

      <h2>5. Changes to This Cookie Policy</h2>
      <p>
        We may update this Cookie Policy from time to time. Any changes will be posted on this
        page with an updated &quot;Last updated&quot; date. We encourage you to review this policy
        periodically.
      </p>

      <h2>6. Contact</h2>
      <p>
        If you have questions about our use of cookies, contact us at{' '}
        <a href="mailto:privacy@superboard.live">privacy@superboard.live</a> or visit
        our <a href="/contact">Contact page</a>.
      </p>
    </LegalPageLayout>
  );
}
