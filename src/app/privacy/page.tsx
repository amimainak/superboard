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
        Superboard (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your privacy. This
        Privacy Policy explains how we collect, use, disclose, and safeguard your information when
        you use our tutoring whiteboard platform and related services (&quot;Service&quot;). Please read this
        policy carefully. By using the Service, you consent to the practices described herein.
      </p>

      <h2>1. Information We Collect</h2>

      <h3>1.1 Information You Provide</h3>
      <ul>
        <li>
          <strong>Account Information:</strong> When you register, we collect your email address
          and password. For agency accounts, we may collect your business name and branding
          preferences.
        </li>
        <li>
          <strong>Student Information:</strong> Agency owners may register students by providing the
          student&apos;s name and email address. This data is stored to enable session access and is
          never sold to third parties.
        </li>
        <li>
          <strong>Payment Information:</strong> Payment details (credit card numbers, bank account
          information) are collected and processed by Stripe, Inc., our third-party payment
          processor. We do not store full payment card details on our servers.
        </li>
        <li>
          <strong>Content You Create:</strong> Whiteboard drawings, quizzes, worksheets, and other
          educational content you create during sessions are stored to provide the Service. You
          retain ownership of your content.
        </li>
      </ul>

      <h3>1.2 Information Collected Automatically</h3>
      <ul>
        <li>
          <strong>Usage Data:</strong> We collect information about how you interact with the
          Service, including features used, session duration, room activity, and pages visited.
        </li>
        <li>
          <strong>Device Information:</strong> We collect device type, operating system, browser
          type, and IP address for analytics and service improvement purposes.
        </li>
        <li>
          <strong>Cookies &amp; Similar Technologies:</strong> We use cookies and similar tracking
          technologies to maintain your session, remember your preferences, and collect usage
          analytics. See our <a href="/cookies">Cookie Policy</a> for details.
        </li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>We use the information we collect for the following purposes:</p>
      <ul>
        <li>To provide, maintain, and improve the Service.</li>
        <li>To process subscription payments and manage your account.</li>
        <li>To facilitate tutoring sessions, including connecting tutors and students.</li>
        <li>To send service-related communications, such as account verification, billing
          receipts, and security alerts.</li>
        <li>To provide customer support and respond to your inquiries.</li>
        <li>To analyze usage patterns and improve the Service&apos;s features and performance.</li>
        <li>To detect, prevent, and address fraud, abuse, and security issues.</li>
        <li>To comply with legal obligations.</li>
      </ul>

      <h2>3. Data Sharing &amp; Disclosure</h2>
      <p>
        We do not sell, rent, or trade your personal information to third parties for marketing
        purposes. We may share your information in the following limited circumstances:
      </p>
      <ul>
        <li>
          <strong>Service Providers:</strong> We share data with trusted third-party service
          providers who help us operate the Service, including Stripe (payments), Supabase
          (database hosting), LiveKit (video/audio infrastructure), and AWS (cloud infrastructure).
          These providers are contractually bound to protect your data.
        </li>
        <li>
          <strong>Agency Operations:</strong> For agency accounts, the agency owner has
          administrative visibility into sub-tutor activity, student roster, and usage metrics
          within their organization.
        </li>
        <li>
          <strong>Legal Requirements:</strong> We may disclose information if required to do so by
          law or in response to valid requests by public authorities, or to protect our rights,
          privacy, safety, or property, or that of our users and the public.
        </li>
        <li>
          <strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of
          assets, your information may be transferred as part of that transaction. We will notify
          you of any such change.
        </li>
      </ul>

      <h2>4. Data Retention</h2>
      <p>
        We retain your account information for as long as your account is active or as needed to
        provide the Service. If you delete your account, we will remove your personal data within
        30 days, except where retention is required by law (e.g., billing records for tax
        compliance, which may be retained for up to 6 years). Whiteboard content associated with
        deleted accounts is permanently removed within 60 days.
      </p>

      <h2>5. Data Security</h2>
      <p>
        We implement industry-standard security measures to protect your information, including
        encryption in transit (TLS/HTTPS), encryption at rest, access controls, and regular
        security assessments. While we strive to protect your data, no method of transmission or
        storage is 100% secure. We cannot guarantee absolute security but are committed to
        maintaining reasonable safeguards.
      </p>

      <h2>6. Your Rights</h2>
      <p>Depending on your location, you may have the following rights regarding your data:</p>
      <ul>
        <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
        <li>
          <strong>Correction:</strong> Request correction of inaccurate or incomplete data.
        </li>
        <li>
          <strong>Deletion:</strong> Request deletion of your personal data, subject to legal
          retention requirements.
        </li>
        <li>
          <strong>Data Portability:</strong> Request your data in a structured, machine-readable
          format.
        </li>
        <li>
          <strong>Objection:</strong> Object to the processing of your data for certain purposes,
          including marketing.
        </li>
        <li>
          <strong>Withdrawal of Consent:</strong> Withdraw consent where processing is based on
          consent.
        </li>
      </ul>
      <p>
        To exercise any of these rights, contact us at{' '}
        <a href="mailto:privacy@superboard.live">privacy@superboard.live</a>. We will respond to
        your request within 30 days.
      </p>

      <h2>7. Children&apos;s Privacy</h2>
      <p>
        The Service may be used by students under the age of 18 in connection with tutoring
        sessions. Student accounts created through the agency registration process require the
        responsible tutor or agency to obtain appropriate parental or guardian consent. We do not
        knowingly collect personal information from children under 13 without verifiable parental
        consent. If we learn that we have collected data from a child under 13 without consent, we
        will take steps to delete that information promptly.
      </p>

      <h2>8. International Data Transfers</h2>
      <p>
        Your information may be transferred to and processed in countries other than your country of
        residence. These countries may have different data protection laws. We ensure that appropriate
        safeguards are in place, including Standard Contractual Clauses and compliance with applicable
        data transfer frameworks, to protect your data during international transfers.
      </p>

      <h2>9. Changes to This Privacy Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of material changes
        by posting the updated policy on this page and updating the &quot;Last updated&quot; date. Your
        continued use of the Service after changes are posted constitutes your acceptance of the
        revised policy.
      </p>

      <h2>10. Contact</h2>
      <p>
        If you have questions or concerns about this Privacy Policy or our data practices, contact
        us at <a href="mailto:privacy@superboard.live">privacy@superboard.live</a> or visit
        our <a href="/contact">Contact page</a>.
      </p>
    </LegalPageLayout>
  );
}
