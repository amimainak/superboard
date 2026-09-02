'use client';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Users, BookOpen, Shield, Check } from 'lucide-react';

/**
 * Social Proof — HONEST version
 * No inflated stats. Only real capabilities.
 * Stats reflect platform capabilities, not inflated user counts.
 * NOTE: Testimonials below are SAMPLE/PLACEHOLDER data — replace with real user feedback.
 */
const CAPABILITIES = [
  { icon: Shield, value: 'E2E Encrypted', label: 'All lessons are encrypted end-to-end' },
  { icon: Users, value: 'No Student Signup', label: 'Students join via link — no accounts needed' },
  { icon: BookOpen, value: '4 Subjects', label: 'Math, Science, Language Arts, General' },
  { icon: Check, value: 'Works Everywhere', label: 'Browser-based — tablets, laptops, phones' },
];

// SAMPLE / PLACEHOLDER testimonials — replace with real user feedback when available
const TESTIMONIALS = [
  {
    name: 'Sarah C.',
    role: 'Math Tutor · Using Pro',
    text: 'The smart tools save me about 20 minutes per lesson on worksheet prep. Being able to graph functions and solve equations right on the board means my students see the work happen in real time.',
    rating: 5,
    highlight: 'saves 20 min per lesson',
  },
  {
    name: 'Michael T.',
    role: 'Science Teacher · Using Free',
    text: 'I started with the free plan to test it out. The whiteboard works smoothly and the video call quality is solid. I upgraded to Pro after my first week so I could save boards and export PDFs for my students.',
    rating: 4,
    highlight: 'Free plan works well',
  },
  {
    name: 'Emily R.',
    role: 'ELA Tutor · Using Pro',
    text: 'My students can collaborate on the same board from their own devices. That real-time interaction keeps them engaged way more than a shared Google Doc ever did. The grammar and vocabulary tools are a nice bonus.',
    rating: 5,
    highlight: 'Real-time collaboration',
  },
  {
    name: 'David P.',
    role: 'Tutoring Center · Using Agency',
    text: 'We manage 12 tutors through the agency dashboard. Having branded boards and a unified schedule in one place replaced three separate tools we were paying for. The per-hour billing model fits our variable workload.',
    rating: 5,
    highlight: 'Replaced 3 tools',
  },
];

export function SocialProofSection() {
  return (
    <section className="py-20 px-6 bg-section-cool">
      <div className="max-w-6xl mx-auto">
        {/* Platform Capabilities — not inflated stats */}
        <div className="text-center mb-16">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Built for the way tutors actually work</h3>
          <p className="text-sm text-gray-500">No inflated numbers — just what the platform delivers.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {CAPABILITIES.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                <stat.icon className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-sm font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1 leading-relaxed">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials — with tier context so users know which plan each person uses */}
        <div className="text-center mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">What tutors are saying</h3>
          <p className="text-sm text-gray-500">Sample feedback — real reviews coming soon.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="rounded-2xl border-0 shadow-sm">
              <CardContent className="pt-6">
                {/* Tier badge */}
                <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-3 ${
                  t.role.includes('Free') ? 'bg-gray-100 text-gray-600' :
                  t.role.includes('Pro') ? 'bg-emerald-50 text-emerald-700' :
                  'bg-amber-50 text-amber-700'
                }`}>
                  {t.role.includes('Free') ? 'Free Plan' : t.role.includes('Pro') ? 'Pro Plan' : 'Agency Plan'}
                </span>
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < t.rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full hidden sm:inline-block">
                    {t.highlight}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
