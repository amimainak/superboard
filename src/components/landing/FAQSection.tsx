// ============================================================
// FAQ Section — Persona-based Accordion with Illustrations
// ============================================================
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Sparkles,
  Users,
  Video,
  BarChart3,
  GraduationCap,
  CalendarDays,
  Shield,
  Clock,
  Lightbulb,
  MonitorSmartphone,
  CreditCard,
  MessageSquare,
  FolderOpen,
  Timer,
  Image as ImageIcon,
  PenTool,
  FileText,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';

interface FAQItem {
  id: string;
  category: string;
  icon: LucideIcon;
  question: string;
  answer: string;
  image?: string;
  imageAlt?: string;
  popular?: boolean;
}

const faqItems: FAQItem[] = [
  // ── FOR STUDENTS & PARENTS ──────────────────────────────
  {
    id: 'student-join',
    category: 'For Students',
    icon: Users,
    question: 'How do I join a lesson?',
    answer:
      'Your tutor will send you a lesson link — it could be via WhatsApp, email, or SMS. Click the link, type in your name, and you\'re in. That\'s it. There\'s nothing to download, no account to create, and no app to install. It works on any device with a browser — laptop, tablet, or phone. If you\'re on a phone, you can even pin the page to your home screen so it feels like an app.',
    image: '/faq-images/student-join.webp',
    imageAlt: 'A student enters their name and joins a lesson in one click',
    popular: true,
  },
  {
    id: 'student-need',
    category: 'For Students',
    icon: MonitorSmartphone,
    question: 'What do I need on my end to use Superboard?',
    answer:
      'Just a device with a modern browser — Chrome, Safari, Edge, or Firefox will all work perfectly. For the best experience, use a laptop or tablet with a stable internet connection. If your lesson includes a video call, you\'ll also need a microphone and optionally a webcam. No stylus or drawing tablet is required, though if you have one, you can use it to write naturally on the board.',
  },
  {
    id: 'student-interactive',
    category: 'For Students',
    icon: PenTool,
    question: 'Can I write and draw on the whiteboard too, or do I just watch?',
    answer:
      'You can fully participate. Your tutor controls whether you have drawing permission, and once enabled, you can write, draw, type, add sticky notes, and place shapes right alongside your tutor. You\'ll see your own cursor and your tutor\'s cursor moving in real-time, so it feels like working on the same physical desk. Many tutors encourage students to solve problems directly on the board during the lesson.',
    image: '/faq-images/whiteboard-canvas.webp',
    imageAlt: 'A student and tutor drawing together on a shared whiteboard',
  },
  {
    id: 'student-recordings',
    category: 'For Students',
    icon: Clock,
    question: 'Will I get a recording of the lesson to revise later?',
    answer:
      'That\'s up to your tutor. If they enable recording, the entire lesson — the whiteboard, voice, and video — is captured as a single playback. After the lesson ends, your tutor can share a recording link with you. You can watch it as many times as you like, skip to specific moments, and use it to revise before exams. You don\'t need a Superboard account to view recordings.',
    image: '/faq-images/recording-playback.webp',
    imageAlt: 'Lesson recording playback with timeline for easy navigation',
  },
  {
    id: 'parent-portal',
    category: 'For Students',
    icon: GraduationCap,
    question: 'I\'m a parent — can I see my child\'s schedule and progress?',
    answer:
      'Yes. If your child\'s tutor or tutoring centre uses Superboard, you\'ll receive a private parent portal link. This lets you see upcoming lessons, past lesson history, attendance, and progress across subjects — all in one place. For tutoring centres, the portal also shows invoices and payment history. It\'s designed to give you visibility without needing to call or message the tutor every time.',
    image: '/faq-images/parent-portal.webp',
    imageAlt: 'Parent portal showing upcoming lessons, attendance, and progress',
  },
  {
    id: 'student-missed',
    category: 'For Students',
    icon: CalendarDays,
    question: 'What happens if I miss a scheduled lesson?',
    answer:
      'If your tutor records their lessons, you\'ll receive a recording link so you can catch up on everything you missed. You can also message your tutor through the platform to reschedule (if they allow it). Any homework or notes shared during the lesson will still be available to you. We recommend letting your tutor know in advance if you can\'t attend, so they can plan accordingly.',
  },

  // ── FOR TUTORS ──────────────────────────────────────────
  {
    id: 'tutor-whiteboard',
    category: 'For Tutors',
    icon: Sparkles,
    question: 'What exactly can I do on the whiteboard?',
    answer:
      'Think of it as an infinite canvas that you and your student share in real-time. You can draw freehand, add shapes, type text, place sticky notes, highlight sections, and use a laser pointer to draw attention to specific areas. The canvas scrolls and zooms endlessly, so you never run out of space. Every stroke appears instantly on your student\'s screen, and you can see their cursor and changes as they happen. It feels like standing at the same physical whiteboard together.',
    image: '/faq-images/whiteboard-canvas.webp',
    imageAlt: 'The interactive whiteboard with drawing tools and real-time collaboration',
    popular: true,
  },
  {
    id: 'tutor-subjects',
    category: 'For Tutors',
    icon: Lightbulb,
    question: 'I teach a specific subject — are there tools built for it?',
    answer:
      'Yes. Superboard includes four subject-specific toolkits that you can switch between during a lesson. The Maths toolkit gives you an interactive graphing calculator — plot functions, draw geometry, explore transformations with sliders — plus a beautiful equation renderer for writing formulas. The Science toolkit provides diagram builders, a periodic table reference, and equation-balancing helpers. The Language toolkit includes grammar annotations, vocabulary builders, and text-analysis tools. And the General toolkit covers everything else: timers, shapes, sticky notes, and more. You can mix tools from different kits in the same lesson.',
    image: '/faq-images/subject-toolkit.webp',
    imageAlt: 'Subject-specific toolkits for Maths, Science, Language, and General use',
  },
  {
    id: 'tutor-video',
    category: 'For Tutors',
    icon: Video,
    question: 'How does the video calling work — do my students need a separate app?',
    answer:
      'No separate app needed. Video and voice calling are built directly into the lesson room. When you start a lesson, you can turn on your camera and microphone with one click. Your student sees and hears you right next to the whiteboard — no switching between tabs, no meeting links, no PIN codes. The video panel can be moved, resized, or minimized so it never covers your lesson content. If your student doesn\'t have a camera, they can still participate via voice and the whiteboard.',
    image: '/faq-images/video-tutoring.webp',
    imageAlt: 'Video call alongside the whiteboard — everything in one place',
  },
  {
    id: 'tutor-generate',
    category: 'For Tutors',
    icon: Sparkles,
    question: 'Can Superboard help me create worksheets and quizzes?',
    answer:
      'Absolutely. You can generate quizzes, worksheets, and answer keys directly from your whiteboard content. For example, you can select a topic you\'ve been teaching and instantly generate a multiple-choice quiz that appears right on the canvas. You can then edit the questions, adjust difficulty, and share them with your student in one click. You can also convert handwritten work into neat digital text with the built-in handwriting recognition, so students get clean printed materials even if you wrote on a tablet.',
    image: '/faq-images/ai-quiz.webp',
    imageAlt: 'Generating a quiz from whiteboard content in one click',
  },
  {
    id: 'tutor-templates',
    category: 'For Tutors',
    icon: FolderOpen,
    question: 'Do I have to start from a blank canvas every lesson?',
    answer:
      'Not unless you want to. Superboard comes with a gallery of ready-made templates — lined paper, graph paper, Venn diagrams, fraction models, periodic tables, essay outlines, and more. Pick one and your lesson starts with the right layout from the first second. You can also save any board as your own reusable template. If you teach the same topic to multiple students, just load your saved template instead of recreating everything.',
  },
  {
    id: 'tutor-record',
    category: 'For Tutors',
    icon: Timer,
    question: 'Can I record my lessons?',
    answer:
      'Yes. Hit the record button at any point during a lesson and everything gets captured — your whiteboard strokes, voice, and video. When you stop recording, it saves to your dashboard automatically. From there, you can share a link with your student, watch it back yourself to reflect on your teaching, or keep a library of recorded lessons for future students. Recordings are a powerful way to add value to your tutoring — students love being able to revisit explanations before exams.',
  },
  {
    id: 'tutor-homework',
    category: 'For Tutors',
    icon: FileText,
    question: 'Is there a way to assign and track homework?',
    answer:
      'Yes. You can create homework tasks linked to specific lessons, set due dates, and assign them to individual students. Students (and parents) see pending homework in their portal with clear deadlines. When they complete it, you can review and mark it directly on the whiteboard — just like in a live lesson. You can also attach notes or voice comments to their work. Everything stays organized in one place, so you never lose track of who has submitted what.',
  },
  {
    id: 'tutor-scheduling',
    category: 'For Tutors',
    icon: CalendarDays,
    question: 'Can I schedule lessons in advance?',
    answer:
      'Yes. Create lessons with a date, time, duration, student name, and subject. Your students and their parents see upcoming lessons in their portal. They can also add the lesson to their own phone or computer calendar with one click — it works with Google Calendar, Apple Calendar, and Outlook. If you need to reschedule or cancel, it updates everywhere instantly. Recurring lessons are supported too, so you can set up a weekly slot once and it fills your calendar automatically.',
    image: '/faq-images/scheduling.webp',
    imageAlt: 'Weekly schedule with colour-coded lessons and one-click calendar sync',
  },
  {
    id: 'tutor-export',
    category: 'For Tutors',
    icon: ImageIcon,
    question: 'Can I export or save my whiteboard content?',
    answer:
      'Of course. You can export any whiteboard as a high-resolution image (PNG) with one click — perfect for sharing notes with students after the lesson. You can also save boards as reusable templates, as described above. For agencies with branding enabled, exports can include your centre\'s logo and colour scheme on every document. Everything you create on Superboard belongs to you and is always available in your dashboard.',
  },
  {
    id: 'tutor-notes',
    category: 'For Tutors',
    icon: MessageSquare,
    question: 'Can I take lesson notes that students can review later?',
    answer:
      'Yes. Each lesson room has a built-in notes section where you can type summaries, key points, or action items. These notes are timestamped, so students can see exactly when each note was written relative to the lesson. Students and parents access these notes through their portal. It\'s a great way to ensure nothing gets forgotten after the lesson ends — you write "Revise Chapter 4 for next week" and both student and parent see it.',
  },

  // ── FOR TUTORING AGENCIES ───────────────────────────────
  {
    id: 'agency-overview',
    category: 'For Agencies',
    icon: BarChart3,
    question: 'How does Superboard help me run my tutoring centre?',
    answer:
      'Superboard gives you a central command dashboard for your entire operation. Add your tutors as team members — each gets their own login, their own lesson rooms, and their own schedule. From your dashboard, you can see every lesson happening across all tutors, track student attendance, monitor hours taught, and view revenue breakdowns. You can manage student rosters, assign students to specific tutors, and automatically generate invoices based on actual lesson time. Parents get their own portal so they can see their child\'s progress without calling your office. Essentially, Superboard replaces the spreadsheet chaos with a clean, automated system.',
    image: '/faq-images/agency-dashboard.webp',
    imageAlt: 'Agency dashboard showing all tutors, students, lessons, and revenue in one view',
    popular: true,
  },
  {
    id: 'agency-subtutors',
    category: 'For Agencies',
    icon: Users,
    question: 'How do I add tutors to my agency account?',
    answer:
      'From your agency dashboard, invite tutors by email. They receive an invitation link and create their own login — you don\'t need to share passwords or manage accounts on their behalf. Once joined, each tutor operates independently with their own rooms, schedule, and students, but you retain full visibility into their activity. You can set permission levels — for example, a senior tutor might be able to create and share templates while a new tutor starts with basic room access only.',
  },
  {
    id: 'agency-students',
    category: 'For Agencies',
    icon: GraduationCap,
    question: 'Can I manage all my students from one place?',
    answer:
      'Yes. The student management panel lets you add, edit, and organise every student your agency works with. You can assign each student to one or more tutors, track their lesson history, attendance, and subject-wise progress over time. Import students in bulk using a spreadsheet upload, or add them one at a time. When a student needs to switch tutors, reassigning them takes two clicks. The entire student roster is searchable and filterable, so you can find any student\'s details in seconds.',
  },
  {
    id: 'agency-billing',
    category: 'For Agencies',
    icon: CreditCard,
    question: 'How does per-hour billing work for agencies?',
    answer:
      'Agency plans combine a fixed monthly subscription with pay-per-hour usage. When a tutor starts a lesson and a student joins, the timer begins. When the lesson ends or the student leaves, the timer pauses. You\'re billed only for minutes where both tutor and student were present in the room — no paying for empty rooms or no-shows. Hours are tracked automatically across all your tutors and summed into a single monthly invoice. You can see the breakdown by tutor, by student, and by date range in your billing panel.',
  },
  {
    id: 'agency-invoices',
    category: 'For Agencies',
    icon: FileText,
    question: 'Can I generate invoices for my clients?',
    answer:
      'Yes. Superboard can auto-generate invoices based on lesson records. Set your hourly rate per tutor or per subject, and the system calculates the total based on actual minutes taught. Invoices are itemised — each line shows the date, duration, student, tutor, and subject. You can add your agency\'s logo, address, and payment details. Export invoices as branded PDFs and send them directly to parents or schools from the dashboard. It eliminates manual bookkeeping entirely.',
  },
  {
    id: 'agency-progress',
    category: 'For Agencies',
    icon: BarChart3,
    question: 'How do I track student progress across my agency?',
    answer:
      'Each student has a progress profile that builds over time. After every lesson, tutors can log notes, topics covered, and a quick assessment. The system compiles this into a visual progress report showing strengths, areas for improvement, and attendance trends across subjects. Parents see this in their portal — building trust and reducing the "how is my child doing?" phone calls. As the agency owner, you can view progress across all students to spot trends, identify students who need extra support, and demonstrate value to parents.',
  },
  {
    id: 'agency-parents',
    category: 'For Agencies',
    icon: MessageSquare,
    question: 'Do parents have to contact my office for updates?',
    answer:
      'Not anymore. Every student\'s parent or guardian receives a secure portal link. From there, they see the upcoming schedule, attendance records, lesson notes from each session, progress indicators by subject, and invoices. They can message the assigned tutor directly through the portal if needed. This self-service model dramatically reduces administrative phone calls and emails, while giving parents more visibility than they had before. It\'s a win for everyone — parents feel informed, tutors stay focused on teaching, and your office staff aren\'t constantly answering routine questions.',
    image: '/faq-images/parent-portal.webp',
    imageAlt: 'The parent portal — schedule, progress, and invoices all in one place',
  },
  {
    id: 'agency-analytics',
    category: 'For Agencies',
    icon: BarChart3,
    question: 'What kind of analytics and reports do I get?',
    answer:
      'Your agency dashboard includes a rich analytics panel. See total lesson hours per week or month, revenue breakdowns by tutor and by subject, student attendance rates, tutor utilisation (how many hours each tutor is actually teaching vs. available), and growth trends over time. Charts update in real-time as lessons happen. You can filter by date range, tutor, or student. Export reports as spreadsheets for deeper analysis or for presentations to stakeholders. These insights help you optimise scheduling, identify your most effective tutors, and spot underperforming areas before they become problems.',
  },
  {
    id: 'agency-integrations',
    category: 'For Agencies',
    icon: Shield,
    question: 'Can Superboard connect to my existing tools?',
    answer:
      'Yes. Superboard supports webhook integrations — whenever key events happen (a lesson is scheduled, a student joins, an invoice is generated, etc.), Superboard sends a notification to any system you use. Many agencies connect this to their CRM, communication platforms like WhatsApp Business, or accounting software. Calendar sync works with Google Calendar, Apple Calendar, and Outlook so lessons appear automatically in tutors\' and students\' personal calendars. If you need a custom integration, our webhook system makes it straightforward.',
  },

  // ── GENERAL ────────────────────────────────────────────
  {
    id: 'gen-devices',
    category: 'General',
    icon: MonitorSmartphone,
    question: 'What devices and browsers are supported?',
    answer:
      'Superboard works in any modern browser — Chrome, Safari, Firefox, and Edge — on laptops, desktops, tablets, and phones. There\'s no app to download (though you can add it to your home screen on mobile for a native-app-like experience). For the best whiteboard experience, a tablet with a stylus or a laptop with a mouse works great. Video calling works on all devices with a front camera and microphone. We recommend a stable internet connection of at least 5 Mbps for smooth video and real-time collaboration.',
  },
  {
    id: 'gen-security',
    category: 'General',
    icon: Shield,
    question: 'Is student data safe?',
    answer:
      'Yes. All sessions are encrypted end-to-end using TLS. Data is stored in enterprise-grade data centres with SOC 2 compliance. We follow GDPR (Europe), India\'s DPDPA 2023, and COPPA guidelines for students under 13. Room links are randomly generated and impossible to guess — they can\'t be found by search engines or accessed without the direct link. You control access: once you close a room, the link stops working immediately. Agency admins can enforce data retention policies, export data, or delete it on request. We never sell or share data with third parties.',
  },
  {
    id: 'gen-pricing',
    category: 'General',
    icon: CreditCard,
    question: 'How does pricing work — are there hidden fees or lock-in contracts?',
    answer:
      'No hidden fees and no lock-ins. The Free plan gives you 1 room, 25 smart credits per week, and 120 minutes of video calling per month — completely free, no credit card required. Pro plans unlock more rooms, more credits, and longer video sessions. Agency plans add a management dashboard, multi-tutor support, billing tools, parent portals, and analytics. Every plan can be upgraded, downgraded, or cancelled at any time from your dashboard. You\'re never locked into a contract — your access continues until the end of your current billing period.',
  },
  {
    id: 'gen-referral',
    category: 'General',
    icon: Sparkles,
    question: 'Is there a referral programme?',
    answer:
      'Yes. When you refer another tutor and they sign up using your unique referral link, both of you earn rewards. Your referral dashboard shows how many people you\'ve referred, who has signed up, and what rewards you\'ve earned. Referral credits are applied automatically to your account. It\'s a simple way to earn while helping other tutors discover a better teaching tool.',
  },
  {
    id: 'gen-support',
    category: 'General',
    icon: MessageSquare,
    question: 'What if I need help or something isn\'t working?',
    answer:
      'We\'re here to help. You can reach us through the contact page, and our team responds during business hours. Pro and Agency plan users get priority support with faster response times. We also maintain a growing library of help articles and video guides covering every feature in detail. If you encounter a bug or have a feature suggestion, we actively listen and ship improvements regularly.',
  },
];

const categories = Array.from(new Set(faqItems.map((item) => item.category)));

export function FAQSection() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredItems = activeCategory
    ? faqItems.filter((item) => item.category === activeCategory)
    : faqItems;

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-6">
            <Lightbulb className="w-4 h-4" />
            Everything you need to know
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
            How Superboard Works
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Answers organised by role — whether you&apos;re a student, a tutor, or
            running an agency. Click any question to learn more.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
              activeCategory === null
                ? 'bg-gray-900 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
            aria-pressed={activeCategory === null}
          >
            All Questions
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setActiveCategory(activeCategory === cat ? null : cat)
              }
              className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
              aria-pressed={activeCategory === cat}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="space-y-3">
          {filteredItems.map((item) => {
            const IconComp = item.icon;
            return (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="rounded-2xl border border-gray-200 bg-white data-[state=open]:border-emerald-200 data-[state=open]:shadow-lg data-[state=open]:shadow-emerald-500/5 transition-all duration-300 overflow-hidden px-6"
              >
                <AccordionTrigger className="hover:no-underline py-5">
                  <div className="flex items-center gap-4 text-left">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
                      <IconComp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {item.category}
                        </span>
                        {item.popular && (
                          <span className="text-[11px] font-medium uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      <h3 className="text-[15px] font-semibold text-gray-900">
                        {item.question}
                      </h3>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <div className="pl-0 sm:pl-14">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {item.answer}
                    </p>
                    {item.image && item.imageAlt && (
                      <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm group mt-5">
                        <div className="aspect-[16/9] bg-gray-100 relative">
                          <Image
                            src={item.image}
                            alt={item.imageAlt}
                            fill
                            className="object-cover object-top group-hover:scale-[1.02] transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 900px"
                          />
                        </div>
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                          <p className="text-xs text-white/90 font-medium">
                            {item.imageAlt}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* Bottom CTA */}
        <div className="mt-14 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Still have questions? We&apos;re happy to help.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            Contact Support
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
