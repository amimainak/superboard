// ============================================================
// Terms & Conditions Page
// ============================================================
import LegalPageLayout from '@/components/legal/LegalPageLayout';

export const metadata = {
  title: 'Terms of Service — Superboard',
  description: 'Terms and conditions governing the use of Superboard tutoring whiteboard platform.',
};

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms &amp; Conditions" lastUpdated="August 8, 2026">
      <p>
        These Terms and Conditions (&quot;Terms&quot;) govern your access to and use of Superboard
        (&quot;Service&quot;), operated by Superboard (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By creating an
        account or using the Service, you agree to be bound by these Terms. If you do not agree, do
        not use the Service.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        You must be at least 18 years old (or the age of majority in your jurisdiction) to create an
        account. If you are under 18, you may use the Service only under the supervision of a parent
        or legal guardian who agrees to these Terms on your behalf. By using the Service, you
        represent and warrant that you meet these eligibility requirements.
      </p>

      <h2>2. Account Registration</h2>
      <p>
        To access certain features of the Service, you must register for an account. You agree to
        provide accurate, current, and complete information during registration and to update such
        information as necessary. You are responsible for safeguarding your password and for all
        activities that occur under your account. You must notify us immediately of any unauthorized
        use of your account.
      </p>

      <h2>3. Subscription Plans &amp; Billing</h2>
      <p>
        Superboard offers multiple subscription tiers, including a Free tier, Pro Tutor ($10/month),
        Agency Standard ($39/month plus per-hour billing), and Agency Premium ($79/month plus
        per-hour billing). By selecting a paid plan, you authorize us to charge the applicable
        subscription fee to your payment method on a recurring monthly basis via Stripe, our
        payment processor.
      </p>

      <h3>3.1 Per-Hour Metered Billing (Agency Plans)</h3>
      <p>
        Agency Standard and Agency Premium plans include metered per-hour billing for tutoring
        sessions conducted by sub-tutors. Usage is measured in clock hours rounded to the nearest
        minute and reported at the end of each billing cycle. Metered charges appear as line items
        on your monthly Stripe invoice. You can monitor real-time usage from your Agency Admin
        Dashboard.
      </p>

      <h3>3.2 Payment Method</h3>
      <p>
        Payments are processed through Stripe, Inc. Accepted payment methods include credit cards,
        debit cards, and other methods made available through Stripe in your region. By providing
        your payment information, you agree to Stripe&apos;s own terms of service. We do not store
        your full card details on our servers.
      </p>

      <h3>3.3 Subscription Changes</h3>
      <p>
        You may upgrade or downgrade your plan at any time from the Billing section of your
        dashboard. Upgrades take effect immediately, and prorated charges will apply. Downgrades
        take effect at the end of the current billing cycle. You may cancel your subscription at
        any time; your access continues until the end of the paid period. See our{' '}
        <a href="/refund">Refund &amp; Cancellation Policy</a> for details on refunds.
      </p>

      <h2>4. Acceptable Use</h2>
      <p>
        You agree not to use the Service for any purpose that is unlawful, harmful, or that could
        damage, disable, or impair the Service. Specifically, you agree not to:
      </p>
      <ul>
        <li>
          Use the Service to transmit, store, or share content that is illegal, harmful, threatening,
          abusive, defamatory, vulgar, obscene, or otherwise objectionable.
        </li>
        <li>
          Attempt to gain unauthorized access to any portion of the Service, other accounts, computer
          systems, or networks connected to the Service.
        </li>
        <li>
          Interfere with or disrupt the integrity or performance of the Service, including through
          the use of automated scripts, bots, or scraping tools.
        </li>
        <li>
          Resell, sublicense, or redistribute the Service or access to it without our prior written
          consent.
        </li>
        <li>
          Use the Service to compete directly with Superboard or to build a similar product.
        </li>
        <li>Share your account credentials with unauthorized third parties.</li>
      </ul>

      <h2>5. Intellectual Property</h2>
      <p>
        The Service and its original content (excluding content provided by users) remain the
        exclusive property of Superboard and its licensors. The Service is protected by copyright,
        trademark, and other laws. Our trademarks, service marks, and trade dress may not be used in
        connection with any product or service without prior written consent.
      </p>
      <p>
        You retain all rights to the educational content you create using the Service (whiteboard
        drawings, quizzes, worksheets, etc.). However, by using the Service, you grant us a limited,
        non-exclusive, worldwide license to store, transmit, and display your content solely for
        the purpose of providing the Service to you and your students.
      </p>

      <h2>6. Agency &amp; Sub-Tutor Provisions</h2>
      <p>
        Agency plan subscribers may invite sub-tutors and register students through the Agency
        Admin Dashboard. The agency owner is responsible for ensuring that all sub-tutors comply
        with these Terms. The agency owner is the primary payer for all charges, including metered
        per-hour usage incurred by sub-tutors under their agency account.
      </p>
      <p>
        Student information (names and email addresses) collected through the student registration
        feature must be obtained with the student&apos;s or their guardian&apos;s consent. The agency
        owner is responsible for complying with all applicable data protection laws regarding
        student data.
      </p>

      <h2>7. Student Access</h2>
      <p>
        Students may access tutoring sessions through invitation links shared by their tutor or
        agency. Students are not required to create a full account. Student access is limited to
        joining assigned rooms and participating in live sessions. Students must not record,
        screenshot, or redistribute session content without the tutor&apos;s permission.
      </p>

      <h2>8. Service Availability</h2>
      <p>
        We strive to provide a reliable Service, but we do not guarantee that the Service will be
        available at all times, uninterrupted, or error-free. We reserve the right to modify,
        suspend, or discontinue the Service (or any part thereof) at any time, with reasonable
        notice when possible. We will make reasonable efforts to notify you of planned maintenance
        or significant changes that may affect your use of the Service.
      </p>

      <h2>9. Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by applicable law, Superboard shall not be liable for any
        indirect, incidental, special, consequential, or punitive damages, including loss of profits,
        data, or other intangible losses, resulting from (a) your use or inability to use the Service;
        (b) any unauthorized access to or alteration of your data; or (c) any other matter relating
        to the Service. Our total liability to you for any claim arising from or related to the
        Service shall not exceed the amount you paid us in the twelve (12) months preceding the
        claim.
      </p>

      <h2>10. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless Superboard, its affiliates, officers, directors,
        employees, and agents from and against any claims, liabilities, damages, losses, and
        expenses arising out of or in any way connected with your access to or use of the Service,
        your violation of these Terms, or your violation of any rights of a third party.
      </p>

      <h2>11. Governing Law</h2>
      <p>
        These Terms shall be governed by and construed in accordance with the laws of India,
        without regard to its conflict of law provisions. Any disputes arising under or in connection
        with these Terms shall be subject to the exclusive jurisdiction of the courts of India.
      </p>

      <h2>12. Changes to Terms</h2>
      <p>
        We reserve the right to modify these Terms at any time. We will notify you of material
        changes by posting the revised Terms on this page and updating the &quot;Last updated&quot;
        date. Your continued use of the Service after the revised Terms are posted constitutes your
        acceptance of the changes. We encourage you to review these Terms periodically.
      </p>

      <h2>13. Contact</h2>
      <p>
        If you have any questions about these Terms, please contact us at{' '}
        <a href="/contact">our Contact page</a> or email us at{' '}
        <a href="mailto:legal@superboard.live">legal@superboard.live</a>.
      </p>
    </LegalPageLayout>
  );
}
