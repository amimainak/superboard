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
      {/* ===== PREAMBLE ===== */}
      <p>
        These Terms and Conditions (&quot;Terms&quot;) govern your access to and use of Superboard
        (&quot;Service&quot;), operated by Superboard, a sole proprietorship registered in India
        (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By creating an account or using the Service, you agree to
        be bound by these Terms. If you do not agree, do not use the Service.
      </p>

      {/* ===== 1. DEFINITIONS ===== */}
      <h2>1. Definitions</h2>
      <ul>
        <li>
          <strong>&quot;Service&quot;</strong> means the Superboard platform, including the interactive
          whiteboard, video conferencing, AI tools, template library, and all related features
          accessible at superboard.live.
        </li>
        <li>
          <strong>&quot;User&quot; or &quot;Tutor&quot;</strong> means any individual or entity that registers an
          account on the Service.
        </li>
        <li>
          <strong>&quot;Agency Owner&quot;</strong> means a User on an Agency Standard or Agency Premium
          subscription plan who has administrative control over sub-tutors and students.
        </li>
        <li>
          <strong>&quot;Sub-Tutor&quot;</strong> means a tutor invited by an Agency Owner to conduct
          sessions under the agency account.
        </li>
        <li>
          <strong>&quot;Student&quot;</strong> means a learner who accesses tutoring sessions through an
          invitation link.
        </li>
        <li>
          <strong>&quot;User Content&quot;</strong> means any data, text, images, drawings, audio, video,
          worksheets, quizzes, or other materials created, uploaded, or shared by Users during
          use of the Service.
        </li>
      </ul>

      {/* ===== 2. NATURE OF THE SERVICE ===== */}
      <h2>2. Nature of the Service</h2>
      <p>
        Superboard provides a software-as-a-service (SaaS) platform comprising an interactive
        whiteboard, real-time collaboration tools, video conferencing, and AI-powered educational
        utilities. The Service is a general-purpose tool designed to facilitate online tutoring
        sessions. Superboard does not provide educational curricula, lesson plans, or
        educational accreditation. We do not employ, supervise, or control the tutors or agencies
        who use our platform. The educational content, teaching methodology, and conduct of
        tutoring sessions are entirely the responsibility of the User or Agency Owner.
      </p>
      <p>
        Superboard acts as an <strong>intermediary</strong> (as defined under Section 2(w) of the
        Information Technology Act, 2000, India) that provides a technological platform for Users
        to conduct tutoring sessions. We do not pre-screen, monitor, edit, or approve User Content
        transmitted through the Service, except as may be required by applicable law.
      </p>

      {/* ===== 3. ELIGIBILITY ===== */}
      <h2>3. Eligibility</h2>
      <p>
        You must be at least 18 years old (or the age of majority in your jurisdiction) to create
        an account. If you are under 18, you may use the Service only under the supervision of a
        parent or legal guardian who agrees to these Terms on your behalf and assumes full
        responsibility for your use of the Service. By using the Service, you represent and warrant
        that you meet these eligibility requirements and have the legal capacity to enter into
        these Terms.
      </p>

      {/* ===== 4. ACCOUNT REGISTRATION ===== */}
      <h2>4. Account Registration &amp; Security</h2>
      <p>
        To access certain features of the Service, you must register for an account. You agree to
        provide accurate, current, and complete information during registration and to update such
        information as necessary. You are responsible for safeguarding your password and for all
        activities that occur under your account. You must notify us immediately of any
        unauthorized use of your account. You are solely responsible for maintaining the
        confidentiality of your account credentials.
      </p>
      <p>
        We reserve the right to suspend or terminate accounts that have been inactive for more than
        12 consecutive months.
      </p>

      {/* ===== 5. SUBSCRIPTION PLANS & BILLING ===== */}
      <h2>5. Subscription Plans &amp; Billing</h2>
      <p>
        Superboard offers multiple subscription tiers, including a Free tier, Pro Tutor ($10/month),
        Agency Standard ($39/month plus per-hour billing), and Agency Premium ($79/month plus
        per-hour billing). All prices are exclusive of applicable taxes unless stated otherwise.
        By selecting a paid plan, you authorize us to charge the applicable subscription fee to
        your payment method on a recurring monthly basis via Stripe, our payment processor.
      </p>

      <h3>5.1 Per-Hour Metered Billing (Agency Plans)</h3>
      <p>
        Agency Standard and Agency Premium plans include metered per-hour billing for tutoring
        sessions conducted by sub-tutors. Usage is measured in clock hours rounded to the nearest
        minute and reported at the end of each billing cycle. Metered charges appear as line items
        on your monthly Stripe invoice. You can monitor real-time usage from your Agency Admin
        Dashboard. The Agency Owner acknowledges and agrees that they are solely responsible for
        all metered charges incurred by sub-tutors operating under their agency account.
      </p>

      <h3>5.2 Payment Method</h3>
      <p>
        Payments are processed through Stripe, Inc. Accepted payment methods include credit cards,
        debit cards, and other methods made available through Stripe in your region. By providing
        your payment information, you agree to Stripe&apos;s own terms of service. We do not store
        your full card details on our servers. All payment-related disputes are governed by
        Stripe&apos;s terms and applicable payment network rules.
      </p>

      <h3>5.3 Subscription Changes</h3>
      <p>
        You may upgrade or downgrade your plan at any time from the Billing section of your
        dashboard. Upgrades take effect immediately, and prorated charges will apply. Downgrades
        take effect at the end of the current billing cycle. You may cancel your subscription at
        any time; your access continues until the end of the paid period. See
        our <a href="/refund">Refund &amp; Cancellation Policy</a> for details on refunds.
      </p>

      <h3>5.4 Taxes</h3>
      <p>
        For users located in India, GST (Goods and Services Tax) will be charged at the applicable
        rate as per Indian tax law. For international users (exports of services), charges are
        exclusive of GST under the LUT (Letter of Undertaking) mechanism. You are responsible for
        any local taxes or duties that may apply in your jurisdiction.
      </p>

      {/* ===== 6. USER CONTENT & RESPONSIBILITY ===== */}
      <h2>6. User Content &amp; User Responsibility</h2>
      <p>
        <strong>The User, Agency Owner, and Sub-Tutors bear sole and exclusive responsibility for
        all User Content created, shared, transmitted, or displayed during tutoring sessions.</strong>{' '}
        This includes, but is not limited to, educational materials, verbal instructions, written
        text, drawings, images, video, audio recordings, and any other content shared during
        sessions.
      </p>
      <p>
        Superboard does not review, verify, endorse, or take responsibility for the accuracy,
        completeness, legality, or appropriateness of any User Content. The Service is a tool for
        conducting sessions; the content and conduct of those sessions are entirely within the
        control and responsibility of the User or Agency Owner.
      </p>
      <p>
        By using the Service, you represent and warrant that:
      </p>
      <ul>
        <li>
          You have all necessary rights, licenses, and permissions to share any content you upload
          or transmit through the Service.
        </li>
        <li>
          Your User Content does not and will not infringe upon or violate the intellectual
          property rights, privacy rights, or any other rights of any third party.
        </li>
        <li>
          Your use of the Service complies with all applicable local, state, national, and
          international laws and regulations.
        </li>
        <li>
          If you are an Agency Owner, you have obtained all necessary consents (including parental
          consent for minors) required by applicable law for registering student information and
          conducting sessions with students.
        </li>
      </ul>

      {/* ===== 7. ACCEPTABLE USE ===== */}
      <h2>7. Acceptable Use Policy</h2>
      <p>
        You agree not to use the Service for any purpose that is unlawful, harmful, or that could
        damage, disable, or impair the Service. Specifically, you agree not to:
      </p>
      <ul>
        <li>
          Use the Service to transmit, store, or share content that is illegal, harmful, threatening,
          abusive, defamatory, vulgar, obscene, pornographic, or otherwise objectionable.
        </li>
        <li>
          Use the Service to harass, bully, exploit, or harm minors or any other person.
        </li>
        <li>
          Share or transmit content that infringes upon any third party&apos;s intellectual property
          rights, including copyrighted materials (text, images, music, video) without proper
          authorization.
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
        <li>
          Share your account credentials with unauthorized third parties.
        </li>
        <li>
          Record, screenshot, or redistribute session content without the express consent of all
          participants.
        </li>
        <li>
          Use the Service to transmit malware, ransomware, or any malicious code.
        </li>
      </ul>

      {/* ===== 8. NO EDUCATIONAL CONTENT WARRANTY ===== */}
      <h2>8. Educational Content Disclaimer</h2>
      <p>
        Superboard is a technology platform and does not provide, endorse, guarantee, or verify
        any educational content, curriculum, or teaching methodology shared through the Service.
        We make no representations regarding the accuracy, quality, completeness, or suitability
        of any educational material created or shared by Users. Parents, guardians, and students
        are advised that the quality of tutoring depends entirely on the individual tutor or agency
        and not on Superboard.
      </p>
      <p>
        <strong>Superboard is not an educational institution, accrediting body, or employer of
        tutors.</strong> We do not conduct background checks on Users or Sub-Tutors. Agency Owners
        are solely responsible for vetting their Sub-Tutors.
      </p>

      {/* ===== 9. AGENCY & SUB-TUTOR PROVISIONS ===== */}
      <h2>9. Agency &amp; Sub-Tutor Provisions</h2>
      <p>
        Agency plan subscribers may invite sub-tutors and register students through the Agency
        Admin Dashboard. The Agency Owner is responsible for ensuring that all sub-tutors comply
        with these Terms. The Agency Owner acknowledges and agrees that:
      </p>
      <ul>
        <li>
          They are the primary payer for all charges, including metered per-hour usage incurred by
          sub-tutors under their agency account.
        </li>
        <li>
          They are responsible for the conduct of all sub-tutors operating under their agency
          account, and any violation of these Terms by a sub-tutor shall be deemed a violation by
          the Agency Owner.
        </li>
        <li>
          Student information (names and email addresses) collected through the student registration
          feature must be obtained with the student&apos;s or their guardian&apos;s consent. The Agency
          Owner is responsible for complying with all applicable data protection laws regarding
          student data.
        </li>
        <li>
          They are responsible for ensuring that sub-tutors have appropriate qualifications and
          conduct sessions in accordance with applicable laws.
        </li>
      </ul>

      {/* ===== 10. STUDENT ACCESS ===== */}
      <h2>10. Student Access</h2>
      <p>
        Students may access tutoring sessions through invitation links shared by their tutor or
        agency. Students are not required to create a full account. Student access is limited to
        joining assigned rooms and participating in live sessions. Students must not record,
        screenshot, or redistribute session content without the tutor&apos;s permission. Superboard is
        not a party to any contractual relationship between tutors/agencies and students.
      </p>

      {/* ===== 11. INTELLECTUAL PROPERTY ===== */}
      <h2>11. Intellectual Property</h2>
      <p>
        The Service, including its software, design, logos, trademarks, and original content
        (excluding User Content), remain the exclusive property of Superboard and its licensors.
        The Service is protected by copyright, trademark, and other laws of India and international
        conventions.
      </p>
      <p>
        You retain all rights to the User Content you create using the Service. However, by using
        the Service, you grant us a limited, non-exclusive, worldwide, royalty-free license to
        store, transmit, cache, and display your content solely for the purpose of providing the
        Service to you and your session participants. This license terminates upon deletion of the
        relevant content or your account.
      </p>

      {/* ===== 12. INTERMEDIARY SAFE HARBOR ===== */}
      <h2>12. Intermediary Safe Harbor &amp; Content Moderation</h2>
      <p>
        Superboard operates as an intermediary under Section 79 of the Information Technology Act,
        2000 (India), and corresponding safe harbor provisions in other applicable jurisdictions.
        We do not exercise editorial control over User Content and are not liable for User Content
        transmitted, stored, or hosted through the Service.
      </p>
      <p>
        However, we reserve the right (but are not obligated) to remove, disable access to, or
        moderate User Content that we become aware of and that, in our sole discretion, violates
        these Terms, applicable law, or the rights of any third party. We may also suspend or
        terminate accounts that repeatedly or egregiously violate these Terms.
      </p>
      <p>
        We comply with valid court orders, government directives, and takedown requests received
        through our designated grievance officer as required under the IT (Intermediary Guidelines
        and Digital Media Ethics Code) Rules, 2021.
      </p>

      {/* ===== 13. INTELLECTUAL PROPERTY INFRINGEMENT (DMCA-STYLE) ===== */}
      <h2>13. Intellectual Property Infringement Complaints</h2>
      <p>
        If you believe that your copyrighted work has been copied or used in a way that
        constitutes copyright infringement through the Service, please notify us at{' '}
        <a href="mailto:legal@superboard.live">legal@superboard.live</a> with the following
        information:
      </p>
      <ol>
        <li>
          A description of the copyrighted work that you claim has been infringed.
        </li>
        <li>
          A description of where the allegedly infringing material is located on the Service
          (e.g., room ID, URL, or description).
        </li>
        <li>
          Your contact information (name, email address, and physical address).
        </li>
        <li>
          A statement that you have a good faith belief that the use is not authorized by the
          copyright owner, its agent, or the law.
        </li>
        <li>
          A statement, under penalty of perjury, that the information in your notice is accurate
          and that you are the copyright owner or authorized to act on behalf of the owner.
        </li>
        <li>
          Your physical or electronic signature.
        </li>
      </ol>
      <p>
        We will take appropriate action upon receiving a valid infringement notice, which may
        include removing or disabling access to the allegedly infringing material. Repeat
        infringers will have their accounts terminated.
      </p>

      {/* ===== 14. SERVICE AVAILABILITY ===== */}
      <h2>14. Service Availability &amp; Disclaimer of Warranties</h2>
      <p>
        The Service is provided on an <strong>&quot;as is&quot; and &quot;as available&quot; basis</strong> without
        warranties of any kind, whether express, implied, or statutory, including but not limited
        to implied warranties of merchantability, fitness for a particular purpose, and
        non-infringement.
      </p>
      <p>
        We do not warrant that the Service will be available at all times, uninterrupted, timely,
        secure, or error-free. We reserve the right to modify, suspend, or discontinue the Service
        (or any part thereof) at any time, with reasonable notice when possible.{' '}
        <strong>We do not provide any service level agreement (SLA) or guaranteed uptime.</strong>{' '}
        Any credits or accommodations for service interruptions will be provided at our sole
        discretion.
      </p>
      <p>
        You understand and agree that your use of the Service is at your sole risk.
      </p>

      {/* ===== 15. LIMITATION OF LIABILITY ===== */}
      <h2>15. Limitation of Liability</h2>
      <p>
        <strong>To the fullest extent permitted by applicable law:</strong>
      </p>
      <ul>
        <li>
          Superboard shall not be liable for any indirect, incidental, special, consequential, or
          punitive damages, including but not limited to loss of profits, data, goodwill, or other
          intangible losses, resulting from (a) your use or inability to use the Service; (b) any
          User Content or conduct of any User, Sub-Tutor, Agency Owner, or Student; (c) any
          unauthorized access to or alteration of your data; or (d) any other matter relating to
          the Service.
        </li>
        <li>
          Superboard shall not be liable for any claims arising from the educational content,
          teaching quality, qualifications of tutors, or outcomes of tutoring sessions conducted
          through the Service. These matters are solely the responsibility of the Users, Agency
          Owners, and Sub-Tutors.
        </li>
        <li>
          Superboard shall not be liable for any failure or delay in performing its obligations
          due to circumstances beyond its reasonable control, including acts of God, natural
          disasters, war, terrorism, riots, pandemics, government actions, or failures of
          third-party infrastructure (including internet service providers, cloud providers, or
          payment processors).
        </li>
        <li>
          Our total aggregate liability to you for any and all claims arising from or related to
          the Service shall not exceed the total amount you paid us in the twelve (12) months
          preceding the event giving rise to the claim, or $100 (USD), whichever is greater.
        </li>
      </ul>

      {/* ===== 16. INDEMNIFICATION ===== */}
      <h2>16. Indemnification</h2>
      <p>
        You agree to indemnify, defend, and hold harmless Superboard, its proprietor, affiliates,
        officers, directors, employees, agents, and service providers from and against any and all
        claims, liabilities, damages, losses, costs, and expenses (including reasonable legal fees)
        arising out of or in any way connected with:
      </p>
      <ul>
        <li>Your use of the Service or your User Content.</li>
        <li>Your violation of these Terms or any applicable law or regulation.</li>
        <li>
          Any claim that your User Content or use of the Service infringes upon or violates any
          third party&apos;s intellectual property rights, privacy rights, or any other rights.
        </li>
        <li>
          Any harm, injury, or damage caused to any person (including minors) resulting from your
          sessions or User Content.
        </li>
        <li>
          For Agency Owners: any actions or omissions of Sub-Tutors operating under the agency
          account.
        </li>
        <li>
          Any claims related to the educational content, teaching quality, or outcomes of sessions
          conducted by you or your Sub-Tutors.
        </li>
      </ul>

      {/* ===== 17. TERMINATION ===== */}
      <h2>17. Termination</h2>
      <p>
        We reserve the right to suspend or terminate your account at any time, with or without
        cause, and with or without notice. We may terminate accounts that violate these Terms,
        engage in abusive behavior, or are involved in fraudulent activity. Upon termination,
        your right to use the Service ceases immediately. Provisions of these Terms that by their
        nature should survive termination (including Sections 6, 11, 15, 16, and 18) will remain
        in effect.
      </p>

      {/* ===== 18. GOVERNING LAW & DISPUTE RESOLUTION ===== */}
      <h2>18. Governing Law &amp; Dispute Resolution</h2>
      <p>
        These Terms shall be governed by and construed in accordance with the laws of India,
        without regard to its conflict of law provisions.
      </p>
      <h3>18.1 Arbitration</h3>
      <p>
        Any dispute, controversy, or claim arising out of or in connection with these Terms, or
        the breach thereof, shall be settled by arbitration administered by a sole arbitrator
        appointed in accordance with the Arbitration and Conciliation Act, 1996 (India). The
        seat of arbitration shall be in India, and the language of arbitration shall be English.
        The arbitrator&apos;s decision shall be final and binding.
      </p>
      <h3>18.2 Exception</h3>
      <p>
        Notwithstanding the above, we may seek injunctive or equitable relief in any court of
        competent jurisdiction in India to protect our intellectual property or prevent
        irreparable harm.
      </p>

      {/* ===== 19. SEVERABILITY ===== */}
      <h2>19. Severability</h2>
      <p>
        If any provision of these Terms is held to be invalid, illegal, or unenforceable by a
        court of competent jurisdiction or arbitrator, such provision shall be modified to the
        minimum extent necessary to make it valid and enforceable, or if modification is not
        possible, shall be severed from these Terms. The remaining provisions shall continue in
        full force and effect.
      </p>

      {/* ===== 20. WAIVER ===== */}
      <h2>20. Waiver</h2>
      <p>
        Our failure to enforce any right or provision of these Terms shall not constitute a waiver
        of that right or provision. Any waiver of any provision of these Terms will be effective
        only if in writing and signed by us.
      </p>

      {/* ===== 21. ASSIGNMENT ===== */}
      <h2>21. Assignment</h2>
      <p>
        You may not assign or transfer these Terms or your rights under these Terms, in whole or
        in part, without our prior written consent. We may assign our rights and obligations under
        these Terms without your consent in connection with a merger, acquisition, or sale of
        assets.
      </p>

      {/* ===== 22. CHANGES TO TERMS ===== */}
      <h2>22. Changes to Terms</h2>
      <p>
        We reserve the right to modify these Terms at any time. We will notify you of material
        changes by posting the revised Terms on this page and updating the &quot;Last updated&quot;
        date. For material changes, we will also send an email notification to registered users
        at least 7 days before the changes take effect. Your continued use of the Service after
        the revised Terms become effective constitutes your acceptance of the changes. We encourage
        you to review these Terms periodically.
      </p>

      {/* ===== 23. ENTIRE AGREEMENT ===== */}
      <h2>23. Entire Agreement</h2>
      <p>
        These Terms, together with the <a href="/privacy">Privacy Policy</a>,{' '}
        <a href="/refund">Refund &amp; Cancellation Policy</a>, and{' '}
        <a href="/cookies">Cookie Policy</a>, constitute the entire agreement between you and
        Superboard regarding the use of the Service, and supersede any prior agreements or
        understandings.
      </p>

      {/* ===== 24. CONTACT ===== */}
      <h2>24. Contact &amp; Grievance Officer</h2>
      <p>
        For questions about these Terms, or to report violations, contact us
        at <a href="/contact">our Contact page</a> or email{' '}
        <a href="mailto:legal@superboard.live">legal@superboard.live</a>.
      </p>
      <p>
        Under the IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, our
        designated Grievance Officer is contactable at{' '}
        <a href="mailto:grievance@superboard.live">grievance@superboard.live</a>. Grievances will
        be acknowledged within 24 hours and resolved within 30 days.
      </p>
    </LegalPageLayout>
  );
}
