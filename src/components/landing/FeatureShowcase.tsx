'use client';
import React from 'react';
import { 
  Sparkles, Video, Users, Palette, Shield, Globe,
  Brain, PenTool, Clock, Zap, BarChart3, Download,
} from 'lucide-react';

const FEATURES = [
  { icon: Sparkles, title: 'AI-Powered Tools', description: 'Generate quizzes, worksheets, and lesson materials instantly with Claude AI integration.', color: 'from-purple-500 to-indigo-500' },
  { icon: Video, title: 'Live Video Calls', description: 'Built-in video conferencing with screen sharing and recording capabilities.', color: 'from-blue-500 to-cyan-500' },
  { icon: Users, title: 'Real-time Collaboration', description: 'Multi-user whiteboard with cursors, presence indicators, and instant sync.', color: 'from-emerald-500 to-teal-500' },
  { icon: Palette, title: 'White-Label Branding', description: 'Customize colors, logos, and domains for your tutoring agency.', color: 'from-pink-500 to-rose-500' },
  { icon: Shield, title: 'Enterprise Security', description: 'SOC 2 compliant with encrypted data, SSO, and role-based access control.', color: 'from-amber-500 to-orange-500' },
  { icon: Globe, title: 'Works Everywhere', description: 'Browser-based with no downloads needed. Works on tablets, laptops, and phones.', color: 'from-violet-500 to-purple-500' },
  { icon: Brain, title: 'Smart Content', description: 'Handwriting recognition, math equation parsing, and diagram generation.', color: 'from-cyan-500 to-blue-500' },
  { icon: PenTool, title: 'Drawing Tools', description: 'Professional drawing tools, shapes, text, and LaTeX equation support.', color: 'from-rose-500 to-pink-500' },
  { icon: Clock, title: 'Session Scheduling', description: 'Schedule lessons in advance, send reminders, and track attendance.', color: 'from-teal-500 to-emerald-500' },
  { icon: Zap, title: 'Instant Templates', description: 'Pre-built templates for math, science, language arts, and more.', color: 'from-yellow-500 to-amber-500' },
  { icon: BarChart3, title: 'Usage Analytics', description: 'Track lesson hours, student engagement, and teaching effectiveness.', color: 'from-indigo-500 to-violet-500' },
  { icon: Download, title: 'Export & Share', description: 'Export boards as PNG, PDF, or save as reusable templates.', color: 'from-orange-500 to-red-500' },
];

export function FeatureShowcase() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to teach online</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">Professional tools designed specifically for K-12 tutoring — from solo tutors to large agencies.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <div 
              key={feature.title} 
              className="group rounded-2xl border border-gray-100 p-6 hover:border-emerald-200/60 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
