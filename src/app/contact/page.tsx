// ============================================================
// Contact Page
// ============================================================
import LegalPageLayout from '@/components/legal/LegalPageLayout';

export const metadata = {
  title: 'Contact Us — Superboard',
  description: 'Get in touch with the Superboard team for support, sales, or legal inquiries.',
};

export default function ContactPage() {
  return (
    <LegalPageLayout title="Contact Us" lastUpdated="August 8, 2026">
      <p>
        We&apos;re here to help. Whether you have a question about our platform, need technical
        support, or want to discuss enterprise or agency pricing, don&apos;t hesitate to reach out.
        We aim to respond to all inquiries within one business day.
      </p>

      <h2>General Support</h2>
      <p>
        For help with your account, technical issues, billing questions, or any other questions
        about using Superboard, contact us at:
      </p>
      <ul>
        <li>
          <strong>Email:</strong>{' '}
          <a href="mailto:support@superboard.live">support@superboard.live</a>
        </li>
        <li>
          <strong>Response Time:</strong> Within 1 business day (Monday through Friday, excluding
          Indian public holidays)
        </li>
      </ul>

      <h2>Sales &amp; Enterprise Inquiries</h2>
      <p>
        If you represent a tutoring agency, school, or educational institution and are interested
        in custom plans, volume pricing, or dedicated onboarding, we&apos;d love to hear from you:
      </p>
      <ul>
        <li>
          <strong>Email:</strong>{' '}
          <a href="mailto:sales@superboard.live">sales@superboard.live</a>
        </li>
        <li>
          <strong>Subject:</strong> Include &quot;Agency Inquiry&quot; or &quot;Enterprise&quot; in your email
          subject line for faster routing.
        </li>
      </ul>

      <h2>Legal &amp; Compliance</h2>
      <p>
        For questions related to our Terms &amp; Conditions, Privacy Policy, data protection, or
        regulatory compliance:
      </p>
      <ul>
        <li>
          <strong>Email:</strong>{' '}
          <a href="mailto:legal@superboard.live">legal@superboard.live</a>
        </li>
      </ul>

      <h2>Privacy &amp; Data Requests</h2>
      <p>
        To exercise your data rights (access, correction, deletion, portability, or to withdraw
        consent), or for any privacy-related concerns:
      </p>
      <ul>
        <li>
          <strong>Email:</strong>{' '}
          <a href="mailto:privacy@superboard.live">privacy@superboard.live</a>
        </li>
        <li>
          <strong>Response Time:</strong> We will acknowledge your request within 5 business days
          and respond substantively within 30 calendar days, as required by the Digital Personal
          Data Protection Act, 2023.
        </li>
      </ul>

      <h2>Grievance Officer</h2>
      <p>
        Under the IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, and the
        Digital Personal Data Protection Act, 2023, our designated Grievance Officer is
        contactable at:
      </p>
      <ul>
        <li>
          <strong>Email:</strong>{' '}
          <a href="mailto:grievance@superboard.live">grievance@superboard.live</a>
        </li>
        <li>
          <strong>Acknowledgment:</strong> Within 24 hours of receiving your grievance.
        </li>
        <li>
          <strong>Resolution:</strong> Within 30 calendar days.
        </li>
      </ul>
      <p>
        If you are unsatisfied with the resolution, you may escalate the matter to the relevant
        authority (Data Protection Board of India for data-related grievances, or your local
        consumer dispute redressal forum).
      </p>

      <h2>Report Abuse</h2>
      <p>
        If you encounter content or behavior on Superboard that violates
        our <a href="/terms">Terms &amp; Conditions</a> or is otherwise harmful or illegal, please
        report it to us at:
      </p>
      <ul>
        <li>
          <strong>Email:</strong>{' '}
          <a href="mailto:abuse@superboard.live">abuse@superboard.live</a>
        </li>
      </ul>
      <p>
        We investigate all abuse reports and take appropriate action, which may include warning,
        content removal, suspension, or permanent termination of accounts that violate our policies.
        We comply with valid court orders and government takedown requests as required by law.
      </p>

      <h2>Business Information</h2>
      <table>
        <thead>
          <tr>
            <th>Detail</th>
            <th>Information</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Business Name</td>
            <td>Superboard</td>
          </tr>
          <tr>
            <td>Entity Type</td>
            <td>Sole Proprietorship (India)</td>
          </tr>
          <tr>
            <td>Proprietor</td>
            <td>[Your Full Legal Name]</td>
          </tr>
          <tr>
            <td>GSTIN</td>
            <td>[To be updated after GST registration]</td>
          </tr>
          <tr>
            <td>Registered Address</td>
            <td>[Your Complete Address, City, State, PIN Code, India]</td>
          </tr>
          <tr>
            <td>Platform</td>
            <td><a href="/">superboard.live</a></td>
          </tr>
          <tr>
            <td>Operating Hours</td>
            <td>Monday to Friday, 9:00 AM to 6:00 PM IST</td>
          </tr>
          <tr>
            <td>SAC Code</td>
            <td>998314 (Information technology software-related services)</td>
          </tr>
        </tbody>
      </table>
      <p className="text-sm text-muted-foreground">
        Fields marked with brackets ([ ]) are placeholders and will be updated before the
        platform goes live. If you need to verify our business credentials, email us
        at <a href="mailto:legal@superboard.live">legal@superboard.live</a>.
      </p>
    </LegalPageLayout>
  );
}
