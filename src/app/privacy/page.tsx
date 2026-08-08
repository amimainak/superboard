// ============================================================
// Privacy Policy Page
// ============================================================
import LegalPageLayout from '@/components/legal/LegalPageLayout';

export const metadata = {
  title: 'Privacy Policy — Superboard',
  description: 'Privacy policy explaining how Superboard collects, uses, and protects your data.',
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="August 8, 2026">
      <p>
        Superboard (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), a sole proprietorship registered in India,
        is committed to protecting your privacy. This Privacy Policy explains how we collect, use,
        disclose, and safeguard your information when you use our tutoring whiteboard platform
        and related services (&quot;Service&quot;). Please read this policy carefully. By using the
        Service, you consent to the practices described herein.
      </p>

      {/* ===== 1. APPLICABLE LAWS ===== */}
      <h2>1. Applicable Legal Framework</h2>
      <p>
        This Privacy Policy is designed to comply with the following laws and regulations:
      </p>
      <ul>
        <li>
          <strong>Digital Personal Data Protection Act, 2023 (DPDPA):</strong> India&apos;s comprehensive
          data protection law governing the processing of personal data of Indian residents.
        </li>
        <li>
          <strong>Information Technology Act, 2000 &amp; IT Rules, 2011:</strong> Indian laws
          governing reasonable security practices and sensitive personal data.
        </li>
        <li>
          <strong>General Data Protection Regulation (GDPR):</strong> For users located in the
          European Union/European Economic Area, we comply with GDPR requirements for
          cross-border data processing of EU residents&apos; data.
        </li>
        <li>
          <strong>Children&apos;s Online Privacy Protection Act (COPPA):</strong> For users in the
          United States, we comply with COPPA requirements regarding children&apos;s data.
        </li>
        <li>
          Other applicable data protection laws in jurisdictions where we operate or have users.
        </li>
      </ul>

      {/* ===== 2. DATA WE COLLECT ===== */}
      <h2>2. Information We Collect</h2>

      <h3>2.1 Information You Provide</h3>
      <ul>
        <li>
          <strong>Account Information:</strong> When you register, we collect your email address
          and a hashed password. For agency accounts, we may collect your business name and
          branding preferences (brand color). We do not collect government-issued identification
          numbers (e.g., PAN, Aadhaar, SSN) through the registration process.
        </li>
        <li>
          <strong>Student Information:</strong> Agency owners may register students by providing
          the student&apos;s name and email address. This data is stored solely to enable session
          access and is never sold to third parties.
        </li>
        <li>
          <strong>Payment Information:</strong> Payment details (credit card numbers, bank account
          information) are collected and processed directly by Stripe, Inc., our third-party
          payment processor. We do not store, process, or have access to your full payment card
          details. Stripe is PCI DSS Level 1 certified.
        </li>
        <li>
          <strong>User Content:</strong> Whiteboard drawings, quizzes, worksheets, audio/video
          recordings of sessions, and other educational content you create during sessions are
          stored to provide the Service. You retain full ownership of your content.
        </li>
      </ul>

      <h3>2.2 Information Collected Automatically</h3>
      <ul>
        <li>
          <strong>Usage Data:</strong> Session duration, features used, room activity, pages
          visited, and interaction patterns.
        </li>
        <li>
          <strong>Device Information:</strong> Device type, operating system, browser type, and
          IP address for analytics and security purposes.
        </li>
        <li>
          <strong>Cookies &amp; Similar Technologies:</strong> We use cookies to maintain sessions,
          remember preferences, and collect usage analytics. See
          our <a href="/cookies">Cookie Policy</a> for details.
        </li>
      </ul>

      {/* ===== 3. PURPOSE OF PROCESSING ===== */}
      <h2>3. Purpose &amp; Legal Basis of Processing</h2>
      <p>We process your personal data for the following purposes:</p>
      <table>
        <thead>
          <tr>
            <th>Purpose</th>
            <th>Legal Basis</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Providing and maintaining the Service</td>
            <td>Contractual necessity (DPDPA &amp; GDPR)</td>
          </tr>
          <tr>
            <td>Processing subscription payments</td>
            <td>Contractual necessity + legal obligation (tax compliance)</td>
          </tr>
          <tr>
            <td>Facilitating tutoring sessions</td>
            <td>Contractual necessity</td>
          </tr>
          <tr>
            <td>Service communications (verification, billing, security alerts)</td>
            <td>Legitimate interest</td>
          </tr>
          <tr>
            <td>Customer support</td>
            <td>Contractual necessity</td>
          </tr>
          <tr>
            <td>Usage analytics &amp; service improvement</td>
            <td>Legitimate interest</td>
          </tr>
          <tr>
            <td>Fraud detection &amp; security</td>
            <td>Legitimate interest + legal obligation</td>
          </tr>
          <tr>
            <td>Compliance with legal obligations</td>
            <td>Legal obligation</td>
          </tr>
        </tbody>
      </table>
      <p>
        Under the DPDPA, we process your personal data for the purposes stated above with your
        consent (provided at registration) and where processing is necessary for the purposes
        stated. You may withdraw your consent at any time by contacting us, though this may
        affect your ability to use the Service.
      </p>

      {/* ===== 4. DATA SHARING ===== */}
      <h2>4. Data Sharing &amp; Disclosure</h2>
      <p>
        We do not sell, rent, or trade your personal information to third parties for marketing
        purposes. We may share your information in the following limited circumstances:
      </p>
      <ul>
        <li>
          <strong>Service Providers:</strong> We share data with trusted third-party service
          providers who help us operate the Service. These providers process data on our behalf
          and are contractually bound to protect your data:
          <ul>
            <li><strong>Stripe, Inc.:</strong> Payment processing (USA). PCI DSS Level 1 certified.</li>
            <li><strong>Supabase, Inc.:</strong> Database hosting (USA). SOC 2 Type II compliant.</li>
            <li><strong>LiveKit, Inc.:</strong> Video/audio infrastructure (USA).</li>
            <li><strong>Amazon Web Services (AWS):</strong> Cloud infrastructure (multiple regions). ISO 27001, SOC 2 certified.</li>
          </ul>
        </li>
        <li>
          <strong>Agency Operations:</strong> For agency accounts, the Agency Owner has
          administrative visibility into sub-tutor activity, student roster, and usage metrics
          within their organization. The Agency Owner acts as a data controller for sub-tutor and
          student data within their agency.
        </li>
        <li>
          <strong>Legal Requirements:</strong> We may disclose information if required by Indian
          law, court order, government directive, or to protect our rights, privacy, safety, or
          property. Under the DPDPA, we may disclose personal data when required by law.
        </li>
        <li>
          <strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of
          assets, your information may be transferred as part of that transaction, with
          continued protection under this Privacy Policy.
        </li>
      </ul>

      {/* ===== 5. INTERNATIONAL TRANSFERS ===== */}
      <h2>5. International Data Transfers</h2>
      <p>
        Your information may be transferred to and processed in countries other than your country
        of residence, including the United States (where our service providers are located) and
        India (where we are based). These countries may have different data protection laws.
      </p>
      <p>
        We ensure that appropriate safeguards are in place for international transfers:
      </p>
      <ul>
        <li>
          For transfers under the DPDPA: We ensure that the recipient jurisdiction provides an
          adequate level of data protection, or we implement appropriate contractual safeguards
          as prescribed by the Indian government.
        </li>
        <li>
          For transfers from the EU/EEA under GDPR: We rely on Standard Contractual Clauses
          (SCCs) approved by the European Commission, supplemented by additional technical and
          organizational measures.
        </li>
      </ul>
      <p>
        If you have concerns about international data transfers, please contact us at{' '}
        <a href="mailto:privacy@superboard.live">privacy@superboard.live</a>.
      </p>

      {/* ===== 6. DATA RETENTION ===== */}
      <h2>6. Data Retention</h2>
      <p>We retain your data for the following durations:</p>
      <table>
        <thead>
          <tr>
            <th>Data Type</th>
            <th>Retention Period</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Account information (email, profile)</td>
            <td>Duration of account + 30 days after deletion</td>
          </tr>
          <tr>
            <td>User Content (whiteboards, recordings)</td>
            <td>Duration of account + 60 days after deletion</td>
          </tr>
          <tr>
            <td>Usage analytics (anonymized)</td>
            <td>Up to 24 months (anonymized)</td>
          </tr>
          <tr>
            <td>Billing records</td>
            <td>6 years (Indian tax law requirement under the Income Tax Act)</td>
          </tr>
          <tr>
            <td>Security logs (IP, access events)</td>
            <td>90 days</td>
          </tr>
        </tbody>
      </table>
      <p>
        Upon account deletion, we initiate the deletion process within 30 days. Whiteboard content
        is purged from primary storage within 60 days and from backups within 90 days. Billing
        records are retained for the legally mandated period.
      </p>

      {/* ===== 7. DATA SECURITY ===== */}
      <h2>7. Data Security</h2>
      <p>
        We implement reasonable security measures as required under Section 43A of the IT Act,
        2000 and the IT (Reasonable Security Practices and Procedures and Sensitive Personal
        Data or Information) Rules, 2011:
      </p>
      <ul>
        <li>Encryption in transit (TLS 1.3 / HTTPS) for all data communication.</li>
        <li>Encryption at rest for database storage.</li>
        <li>Role-based access controls limiting data access to authorized personnel only.</li>
        <li>Regular security assessments and vulnerability scanning.</li>
        <li>Secure password hashing (bcrypt / argon2).</li>
      </ul>
      <p>
        While we implement reasonable safeguards, no method of electronic transmission or storage
        is 100% secure. We cannot guarantee absolute security but are committed to maintaining
        industry-standard protections.
      </p>

      {/* ===== 8. YOUR RIGHTS ===== */}
      <h2>8. Your Rights</h2>
      <p>Depending on your location and applicable law, you may have the following rights:</p>
      <ul>
        <li>
          <strong>Access (DPDPA &amp; GDPR Article 15):</strong> Request a summary of personal
          data we hold about you.
        </li>
        <li>
          <strong>Correction (DPDPA &amp; GDPR Article 16):</strong> Request correction of
          inaccurate or incomplete data.
        </li>
        <li>
          <strong>Erasure / Right to be Forgotten (DPDPA &amp; GDPR Article 17):</strong> Request
          deletion of your personal data, subject to legal retention requirements.
        </li>
        <li>
          <strong>Data Portability (GDPR Article 20):</strong> Request your data in a structured,
          machine-readable format (JSON or CSV).
        </li>
        <li>
          <strong>Objection (GDPR Article 21):</strong> Object to processing based on legitimate
          interests or for marketing purposes.
        </li>
        <li>
          <strong>Withdrawal of Consent (DPDPA &amp; GDPR Article 7):</strong> Withdraw your
          consent where processing is based on consent. This may affect your ability to use the
          Service.
        </li>
        <li>
          <strong>Grievance Redressal (DPDPA):</strong> You may lodge a complaint with our
          Grievance Officer at{' '}
          <a href="mailto:grievance@superboard.live">grievance@superboard.live</a>. If
          unsatisfied, you may file a complaint with the Data Protection Board of India.
        </li>
      </ul>
      <p>
        To exercise any of these rights, contact us at{' '}
        <a href="mailto:privacy@superboard.live">privacy@superboard.live</a>. We will
        acknowledge your request within 5 business days and respond substantively within 30
        calendar days, as required by the DPDPA and GDPR.
      </p>

      {/* ===== 9. CHILDREN&apos;S PRIVACY ===== */}
      <h2>9. Children&apos;s Privacy</h2>
      <p>
        The Service may be used by students under the age of 18 in connection with tutoring
        sessions. Students access sessions through invitation links and are not required to create
        full accounts. We collect only the student&apos;s name and email address for session access
        purposes.
      </p>
      <p>
        Agency Owners and tutors are responsible for obtaining appropriate parental or guardian
        consent before registering student information. We do not knowingly collect personal
        information from children under 13 without verifiable parental consent (COPPA
        compliance). If we learn that we have collected data from a child under 13 without
        appropriate consent, we will take steps to delete that information promptly.
      </p>
      <p>
        Parents or guardians who wish to review, modify, or delete their child&apos;s information
        may contact us at <a href="mailto:privacy@superboard.live">privacy@superboard.live</a>.
      </p>

      {/* ===== 10. DATA BREACH NOTIFICATION ===== */}
      <h2>10. Data Breach Notification</h2>
      <p>
        In the event of a personal data breach that is likely to result in harm to any data
        principal, we will notify affected users without unreasonable delay and in accordance
        with the requirements of the DPDPA and other applicable laws. We will also notify the
        Indian Computer Emergency Response Team (CERT-In) as required by law.
      </p>

      {/* ===== 11. CHANGES ===== */}
      <h2>11. Changes to This Privacy Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of material
        changes by posting the updated policy on this page with an updated &quot;Last updated&quot;
        date. For material changes, we will also send an email notification to registered
        users. Your continued use of the Service after changes are posted constitutes your
        acceptance of the revised policy.
      </p>

      {/* ===== 12. CONTACT ===== */}
      <h2>12. Contact</h2>
      <p>
        For questions about this Privacy Policy or our data practices, contact
        us at <a href="mailto:privacy@superboard.live">privacy@superboard.live</a> or visit
        our <a href="/contact">Contact page</a>.
      </p>
      <p>
        Our Grievance Officer (as required under the DPDPA) is contactable at{' '}
        <a href="mailto:grievance@superboard.live">grievance@superboard.live</a>.
      </p>
    </LegalPageLayout>
  );
}
