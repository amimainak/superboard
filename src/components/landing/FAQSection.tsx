// ============================================================
// FAQ Section — Innovative Accordion with Illustrations
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
  Brain,
  BarChart3,
  GraduationCap,
  CalendarDays,
  Shield,
  Clock,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react';

interface FAQItem {
  id: string;
  category: string;
  icon: LucideIcon;
  question: string;
  answer: string;
  image?: string;
  imageAlt: string;
}

const faqItems: FAQItem[] = [
  {
    id: 'student-join',
    category: 'Getting Started',
    icon: Users,
    question: 'How do my students join a lesson — do they need to sign up?',
    answer:
      'No sign-up required at all. When you create a room, you get a unique lesson link. Share it with your student via email, WhatsApp, or any messenger. They click the link, enter their name in a one-step dialog, and they\'re instantly inside your whiteboard. No downloads, no account creation, no friction. This works on desktops, tablets, and phones — students just need a browser.',
    image: '/faq-images/student-join.png',
    imageAlt: 'Student join screen — just enter your name and start',
  },
  {
    id: 'whiteboard-tools',
    category: 'Whiteboard',
    icon: Sparkles,
    question: 'What can I actually do on the whiteboard?',
    answer:
      'Superboard is a full-featured collaborative canvas powered by tldraw. You get freehand drawing, shapes, text, sticky notes, laser pointers, and an infinite canvas. On top of that, there are subject-specific toolkits: a Math toolkit with GeoGebra graphing and KaTeX equation rendering, a Science toolkit with diagrams and equation balancing, a Language toolkit with grammar and vocabulary tools, and a General toolkit. Every stroke is synced in real-time to all participants — you and your student see each other\'s cursors and changes live.',
    image: '/faq-images/whiteboard-canvas.png',
    imageAlt: 'Interactive whiteboard canvas with drawing tools and collaboration',
  },
  {
    id: 'ai-features',
    category: 'AI Features',
    icon: Brain,
    question: 'How does the AI help during lessons?',
    answer:
      'Superboard has AI built directly into the whiteboard — not a separate chatbot, but tools that work inside your lesson. You can generate quizzes with multiple-choice questions, auto-create worksheets from your board content, get AI answer keys for any problem, and use OCR to convert handwritten equations to digital text (powered by Mathpix). Each action uses AI credits — Free users get 25 per week, Pro and Agency plans get substantially more. The AI generates content right on the canvas, so you can edit, annotate, and share it instantly.',
    image: '/faq-images/ai-quiz.png',
    imageAlt: 'AI quiz generator creating questions from whiteboard content',
  },
  {
    id: 'video-calling',
    category: 'Video & Recording',
    icon: Video,
    question: 'Do I need Zoom or Google Meet, or is video built in?',
    answer:
      'Video calling is built right into Superboard — no external tools needed. Powered by LiveKit, you get HD video and crystal-clear audio alongside your whiteboard. The video appears in a picture-in-picture panel that you can drag, resize, or minimize, so it never blocks your content. You can also record entire sessions — whiteboard strokes, voice, and video all get captured together. Recordings appear in your dashboard and can be shared with students who missed the lesson.',
    image: '/faq-images/video-tutoring.png',
    imageAlt: 'Split-screen tutoring session with whiteboard and video call',
  },
  {
    id: 'agency-management',
    category: 'For Agencies',
    icon: BarChart3,
    question: 'I run a tutoring centre — how does Superboard help me manage multiple tutors?',
    answer:
      'Superboard\'s Agency plan is built specifically for tutoring businesses. You get a management dashboard where you can add tutors as sub-users, each with their own rooms and schedules. Track every lesson across all tutors with analytics: total hours taught, student attendance, revenue per tutor, and subject-wise breakdowns. Create and manage student rosters, assign students to tutors, and generate invoices automatically based on per-hour billing. Parents get their own portal to view their child\'s schedule, progress, and lesson notes — without needing to contact you directly.',
    image: '/faq-images/agency-dashboard.png',
    imageAlt: 'Agency management dashboard with analytics and schedule',
  },
  {
    id: 'scheduling',
    category: 'Scheduling',
    icon: CalendarDays,
    question: 'Can I schedule lessons and send reminders automatically?',
    answer:
      'Yes. The scheduling system lets you create one-off or recurring lessons with date, time, duration, student, and subject. Students (and parents) can view upcoming lessons in their portal. When a lesson is scheduled, the system generates an ICS calendar file that students can add to Google Calendar, Apple Calendar, or Outlook with one click. You can also cancel or reschedule lessons from the dashboard, and the change is reflected everywhere. For agencies with Webhook integrations, scheduling events are pushed to your CRM or communication tools automatically.',
    image: '/faq-images/scheduling.png',
    imageAlt: 'Lesson scheduling calendar with color-coded sessions',
  },
  {
    id: 'recordings-playback',
    category: 'Video & Recording',
    icon: Clock,
    question: 'What happens to lesson recordings — can students rewatch them?',
    answer:
      'Every recorded session is saved to your dashboard under "Recordings". Each recording captures the full whiteboard state, video, and audio. Students can access recordings through a shared link that you send them — they don\'t need an account. Recordings also include timestamped lesson notes, so students can jump to specific topics. This is especially useful for revision before exams. Recordings count toward your storage limits based on your plan tier.',
    image: '/faq-images/recording-playback.png',
    imageAlt: 'Lesson recording playback with timeline and notes',
  },
  {
    id: 'parent-portal',
    category: 'For Agencies',
    icon: GraduationCap,
    question: 'Can parents see their child\'s progress without calling me?',
    answer:
      'Exactly. Each student gets a unique parent portal link. When parents visit it, they see their child\'s upcoming schedule, past lesson history, attendance record, and subject-wise progress indicators — all without needing to email or call you. For agency plans, this portal also shows invoices, payment history, and tutor notes from each session. It dramatically reduces the "how\'s my child doing?" calls and builds trust with parents by giving them transparent, real-time visibility.',
    image: '/faq-images/parent-portal.png',
    imageAlt: 'Parent portal showing student progress and schedule',
  },
  {
    id: 'subjects',
    category: 'Whiteboard',
    icon: Lightbulb,
    question: 'I teach [subject] — does Superboard have tools for my subject?',
    answer:
      'Superboard ships with four specialized subject toolkits. The Math toolkit includes a full GeoGebra graphing calculator for plotting functions, geometry construction, and interactive sliders. It also has KaTeX for rendering beautiful LaTeX equations and Mathpix OCR for digitizing handwritten math. The Science toolkit supports diagrams, periodic table references, and equation balancing. The Language toolkit has grammar checking, vocabulary builders, and annotation tools. The General toolkit covers everything else with shapes, sticky notes, and timers. You can switch toolkits mid-lesson or use tools from multiple kits simultaneously.',
    image: '/faq-images/subject-toolkit.png',
    imageAlt: 'Subject-specific toolkits for Math, Science, Language, and General',
  },
  {
    id: 'security',
    category: 'Trust & Security',
    icon: Shield,
    question: 'Is student data safe? What about compliance?',
    answer:
      'All whiteboard sessions are end-to-end encrypted using TLS. Data is stored in SOC 2 compliant data centers (hosted on Supabase). We comply with GDPR (Europe), India\'s DPDPA 2023, and follow COPPA guidelines for students under 13. Room links are cryptographically random and unguessable — they can\'t be discovered by search engines. You control access: close a room and the link stops working immediately. Agency admins can enforce data retention policies and export or delete student data. We never sell data to third parties.',
    image: '/faq-images/student-join.png',
    imageAlt: 'Secure student join flow with encrypted connections',
  },
  {
    id: 'pricing-billing',
    category: 'Billing',
    icon: Sparkles,
    question: 'How does billing work — are there hidden fees or lock-ins?',
    answer:
      'Transparent and flexible. The Free plan costs nothing — no credit card required. Pro plans are billed monthly via Stripe, and Agency plans combine a monthly base fee with per-hour billing for actual lesson time (tracked automatically when rooms are active). You can upgrade, downgrade, or cancel anytime from your dashboard — there are no lock-in contracts. Usage is metered fairly: you only pay for hours where at least two participants (tutor + student) are in the room. All invoices are generated automatically and available in your billing panel.',
    imageAlt: '',
  },
  {
    id: 'templates',
    category: 'Whiteboard',
    icon: Sparkles,
    question: 'Do I have to start from a blank canvas every time?',
    answer:
      'Not at all. Superboard has a template gallery with 14+ pre-built layouts: lined paper, grid paper, graph paper, Venn diagrams, fraction models, periodic tables, essay outlines, and more. You can also save any board state as your own custom template and reuse it across lessons. For agencies, shared templates let you standardize teaching materials across all your tutors — create a template once and every tutor on your team can use it.',
    image: '/faq-images/whiteboard-canvas.png',
    imageAlt: 'Template gallery with pre-built lesson layouts',
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
            Real answers about real features. Click any question to see details and
            screenshots.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === null
                ? 'bg-gray-900 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            All Questions
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setActiveCategory(activeCategory === cat ? null : cat)
              }
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion with Images */}
        <Accordion type="single" collapsible className="space-y-3">
          {filteredItems.map((item, index) => {
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
                        {index < 3 && (
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
                  <div className="pl-14">
                    <p className="text-sm text-gray-600 leading-relaxed mb-5">
                      {item.answer}
                    </p>
                    {item.image && (
                      <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
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
