// ============================================================
// Refund & Cancellation Policy Page
// ============================================================
import LegalPageLayout from '@/components/legal/LegalPageLayout';

export const metadata = {
  title: 'Refund & Cancellation Policy — Superboard',
  description: 'Refund and cancellation policy for Superboard subscriptions and services.',
};

export default function RefundPage() {
  return (
    <LegalPageLayout title="Refund &amp; Cancellation Policy" lastUpdated="August 8, 2026">
      <p>
        This Refund and Cancellation Policy (&quot;Policy&quot;) describes the circumstances under which
        Superboard (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) issues refunds or allows cancellations for
        subscription fees and other charges associated with our tutoring whiteboard platform
        (&quot;Service&quot;). This Policy supplements our <a href="/terms">Terms &amp; Conditions</a>.
      </p>

      <h2>1. Subscription Cancellation</h2>
      <p>
        You may cancel your paid subscription at any time from the Billing section of your
        dashboard, or by contacting us at{' '}
        <a href="mailto:support@superboard.live">support@superboard.live</a>. Upon cancellation,
        you will continue to have access to your paid plan features until the end of the current
        billing period. Your account will then automatically revert to the Free tier at the start
        of the next billing cycle. No partial-month refunds are provided for unused days in the
        current billing period.
      </p>

      <h2>2. Refund Eligibility</h2>

      <h3>2.1 New Subscriptions (First-Time Purchases)</h3>
      <p>
        If you are a first-time subscriber and are not satisfied with the Service, you may request
        a full refund within <strong>7 calendar days</strong> of your initial subscription charge.
        This cooling-off period applies only to your very first subscription purchase and not to
        subsequent renewals, upgrades, or plan changes. Refund requests must be sent to{' '}
        <a href="mailto:support@superboard.live">support@superboard.live</a> with your account
        email and the date of the charge.
      </p>

      <h3>2.2 Renewal Charges</h3>
      <p>
        Subscription renewal charges are non-refundable once the billing cycle has commenced. If you
        do not wish to be charged for a renewal, you must cancel your subscription before the next
        billing date. You can view your next billing date in the Billing section of your dashboard.
      </p>

      <h3>2.3 Plan Upgrades</h3>
      <p>
        When you upgrade from a lower-tier plan to a higher-tier plan (e.g., Free to Pro, Pro to
        Agency Standard), the upgrade takes effect immediately and charges are prorated based on
        the remaining days in your current billing cycle. Upgrade charges are non-refundable.
      </p>

      <h3>2.4 Plan Downgrades</h3>
      <p>
        Downgrade requests take effect at the end of the current billing period. No refund is
        issued for the current period when a downgrade is requested. The new lower-tier rate will
        apply starting from the next billing cycle.
      </p>

      <h2>3. Metered Usage Charges (Agency Plans)</h2>
      <p>
        Agency Standard ($3/hour) and Agency Premium ($2/hour) plans include per-hour metered
        billing for tutoring sessions. Metered charges are calculated based on actual session
        duration recorded by the system and are reported at the end of each billing cycle. Metered
        usage charges are non-refundable once they have been incurred and invoiced.
      </p>
      <p>
        We recommend monitoring your usage regularly through the Agency Admin Dashboard to manage
        costs effectively. You will receive notifications as you approach usage thresholds, but
        you are ultimately responsible for all metered charges incurred by sub-tutors under your
        agency account.
      </p>

      <h2>4. Service Interruptions</h2>
      <p>
        If the Service experiences a significant outage or downtime exceeding 24 consecutive
        hours, affected users may contact us to request a prorated credit toward their next billing
        cycle. The credit amount will be proportional to the duration of the outage relative to
        the billing period. This provision does not apply to minor interruptions, planned
        maintenance (for which we will provide advance notice), or issues caused by factors outside
        our control (e.g., internet service provider outages, local network issues).
      </p>

      <h2>5. How to Request a Refund</h2>
      <p>To request a refund, follow these steps:</p>
      <ol>
        <li>
          Send an email to <a href="mailto:support@superboard.live">support@superboard.live</a>{' '}
          with the subject line &quot;Refund Request.&quot;
        </li>
        <li>
          Include your registered email address, the charge amount, and the date of the charge.
        </li>
        <li>
          Briefly describe the reason for your refund request (this helps us improve the Service).
        </li>
        <li>
          We will review your request and respond within <strong>5 business days</strong>.
        </li>
      </ol>
      <p>
        Approved refunds will be processed back to the original payment method within 5 to 10
        business days. The timing of the refund appearing on your statement depends on your
        payment provider.
      </p>

      <h2>6. Non-Refundable Items</h2>
      <p>The following are not eligible for refunds under any circumstances:</p>
      <ul>
        <li>Subscription renewal charges beyond the 7-day first-purchase cooling-off period.</li>
        <li>Metered usage charges that have been incurred and invoiced.</li>
        <li>Charges for months in which the Service was used, even partially.</li>
        <li>Charges related to accounts terminated for violations of our{' '}
          <a href="/terms">Terms &amp; Conditions</a>.</li>
      </ul>

      <h2>7. Account Deletion</h2>
      <p>
        If you wish to permanently delete your account and all associated data, you may do so from
        your account settings or by contacting us. Upon account deletion, your subscription will be
        cancelled automatically. No refunds will be issued for the current billing period. Please
        note that account deletion is irreversible and all your whiteboard content, templates, and
        session history will be permanently removed.
      </p>

      <h2>8. Changes to This Policy</h2>
      <p>
        We reserve the right to modify this Refund and Cancellation Policy at any time. Material
        changes will be posted on this page with an updated &quot;Last updated&quot; date. Your continued
        use of the Service after changes are posted constitutes acceptance of the revised Policy.
      </p>

      <h2>9. Contact</h2>
      <p>
        For questions about refunds or cancellations, contact us at{' '}
        <a href="mailto:support@superboard.live">support@superboard.live</a> or visit
        our <a href="/contact">Contact page</a>.
      </p>
    </LegalPageLayout>
  );
}
