'use client';
import React from 'react';
import { 
  Sparkles, Video, Users, Palette, Shield, Globe,
  Brain, PenTool, Clock, Zap, BarChart3, Download,
  Lock, Check,
} from 'lucide-react';

type TierAvailability = 'free' | 'pro' | 'agency';

const FEATURES: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  color: string; 
  tier: TierAvailability;
  tierLabel: string;
}[] = [
  { icon: PenTool, title: 'Infinite Whiteboard', description: 'Draw, write, and collaborate on an unlimited canvas. Zoom in for detail or zoom out for the big picture.', color: 'from-emerald-500 to-teal-500', tier: 'free', tierLabel: 'Free' },
  { icon: Video, title: 'Live Video Calling', description: 'Built-in face-to-face video with your students. No separate app needed — everything happens on the same screen.', color: 'from-blue-500 to-cyan-500', tier: 'free', tierLabel: 'Free · Limited' },
  { icon: Sparkles, title: 'Smart Content Tools', description: 'Generate quizzes, plot graphs, balance equations, and create worksheets right from your board. Free users get 10 credits/week.', color: 'from-purple-500 to-indigo-500', tier: 'free', tierLabel: 'Free (limited)' },
  { icon: Brain, title: 'Handwriting Recognition', description: 'Convert handwritten math into digital equations and diagrams automatically.', color: 'from-cyan-500 to-blue-500', tier: 'pro', tierLabel: 'Pro' },
  { icon: Download, title: 'Export & Templates', description: 'Save boards as reusable templates, export branded PDFs, and share PNGs with students.', color: 'from-orange-500 to-red-500', tier: 'pro', tierLabel: 'Pro' },
  { icon: Clock, title: 'Session Recording', description: 'Record lessons for students to review later. Great for absent students or exam revision.', color: 'from-teal-500 to-emerald-500', tier: 'pro', tierLabel: 'Pro · Limited' },
  { icon: Palette, title: 'White-Label Branding', description: 'Add your agency logo, colors, and custom domain to every lesson board.', color: 'from-pink-500 to-rose-500', tier: 'agency', tierLabel: 'Agency' },
  { icon: Users, title: 'Multi-Tutor Management', description: 'Manage sub-tutors, track their usage, and assign students from one dashboard.', color: 'from-amber-500 to-orange-500', tier: 'agency', tierLabel: 'Agency' },
  { icon: BarChart3, title: 'Usage Analytics', description: 'Track lesson hours, student engagement, and teaching effectiveness across your team.', color: 'from-indigo-500 to-violet-500', tier: 'agency', tierLabel: 'Agency' },
  { icon: Shield, title: 'End-to-End Encryption', description: 'All video calls, board data, and student interactions are encrypted in transit and at rest.', color: 'from-emerald-500 to-green-500', tier: 'free', tierLabel: 'All Plans' },
  { icon: Globe, title: 'Works on Any Device', description: 'Browser-based with no downloads. Works on tablets, laptops, and phones.', color: 'from-violet-500 to-purple-500', tier: 'free', tierLabel: 'All Plans' },
  { icon: Zap, title: 'Per-Hour Billing', description: 'Pay only for the hours your tutors actually teach. No flat fees for unused capacity.', color: 'from-yellow-500 to-amber-500', tier: 'agency', tierLabel: 'Agency' },
];

const tierStyles: Record<TierAvailability, { badge: string; text: string }> = {
  free: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-100', text: 'text-emerald-600' },
  pro: { badge: 'bg-sky-50 text-sky-700 border-sky-100', text: 'text-sky-600' },
  agency: { badge: 'bg-amber-50 text-amber-700 border-amber-100', text: 'text-amber-600' },
};

export function FeatureShowcase() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What you get at each plan level</h2>
          <p className="text-gray-500 max-w-2xl mx-auto mb-6">Start free with the basics, upgrade when you need more. Every feature listed here works as described.</p>
        </div>

        {/* Tier Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          {[
            { tier: 'free' as TierAvailability, label: 'Available on Free', icon: Check },
            { tier: 'pro' as TierAvailability, label: 'Requires Pro ($10/mo)', icon: Lock },
            { tier: 'agency' as TierAvailability, label: 'Requires Agency ($39/mo+)', icon: Lock },
          ].map(({ tier, label, icon: Icon }) => (
            <div key={tier} className="flex items-center gap-1.5 text-xs font-medium">
              <Icon className={`w-3 h-3 ${tierStyles[tier].text}`} />
              <span className={`px-2 py-0.5 rounded-full border ${tierStyles[tier].badge}`}>{label}</span>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => {
            const style = tierStyles[feature.tier];
            return (
              <div 
                key={feature.title} 
                className="group rounded-2xl border border-gray-100 p-6 hover:border-gray-200 hover:shadow-lg transition-all duration-300 relative"
              >
                {/* Tier badge in top-right corner */}
                <span className={`absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${style.badge}`}>
                  {feature.tierLabel}
                </span>

                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA for free users considering upgrade */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 mb-4">
            On the free plan and hit a limit? <span className="text-emerald-600 font-medium">Upgrade to Pro anytime</span> — your boards and settings carry over.
          </p>
        </div>
      </div>
    </section>
  );
}
