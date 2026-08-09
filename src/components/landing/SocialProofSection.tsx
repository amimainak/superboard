'use client';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Users, BookOpen, Award } from 'lucide-react';

const STATS = [
  { icon: Users, value: '10,000+', label: 'Active Tutors' },
  { icon: BookOpen, value: '500,000+', label: 'Lessons Delivered' },
  { icon: Star, value: '4.9/5', label: 'Average Rating' },
  { icon: Award, value: '50+', label: 'Awards Won' },
];

const TESTIMONIALS = [
  { name: 'Sarah Chen', role: 'Math Tutor', text: 'Superboard transformed how I teach algebra. The AI tools help me create worksheets in seconds.', rating: 5 },
  { name: 'Michael Torres', role: 'Science Teacher', text: 'My students love the interactive whiteboard. Engagement has increased by 300% since we started using it.', rating: 5 },
  { name: 'Emily Rodriguez', role: 'Language Arts Tutor', text: 'The real-time collaboration is incredible. My students can work together from anywhere.', rating: 5 },
  { name: 'David Park', role: 'Agency Owner', text: 'Managing 15 tutors used to be chaos. Superboard\'s agency tools brought order to our operations.', rating: 5 },
];

export function SocialProofSection() {
  return (
    <section className="py-20 px-6 bg-gray-50/50">
      <div className="max-w-6xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className="w-8 h-8 mx-auto mb-3 text-emerald-500" />
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-2 gap-6">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="rounded-2xl border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
