// ============================================================
// Subject metadata — shared across dashboard components
// ============================================================
import {
  Calculator,
  FlaskConical,
  Languages,
  ClipboardList,
  Music,
  Code2,
  Target,
  Palette,
  Globe,
} from 'lucide-react';

export const subjectMeta: Record<string, {
  icon: React.ElementType;
  gradient: string;
  emoji: string;
  label: string;
}> = {
  MATH: { icon: Calculator, gradient: 'stat-gradient-sparkles', emoji: '\u{1F4D0}', label: 'Mathematics' },
  SCIENCE: { icon: FlaskConical, gradient: 'stat-gradient-video', emoji: '\u{1F52C}', label: 'Science' },
  LANGUAGE: { icon: Languages, gradient: 'stat-gradient-recordings', emoji: '\u270D\uFE0F', label: 'Language' },
  GENERAL: { icon: ClipboardList, gradient: 'stat-gradient-sparkles', emoji: '\u{1F4CB}', label: 'General' },
  MUSIC: { icon: Music, gradient: 'bg-gradient-to-br from-purple-400 to-pink-500', emoji: '\u{1F3B5}', label: 'Music' },
  CODING: { icon: Code2, gradient: 'bg-gradient-to-br from-cyan-400 to-blue-600', emoji: '\u{1F4BB}', label: 'Coding' },
  TEST_PREP: { icon: Target, gradient: 'bg-gradient-to-br from-orange-400 to-red-500', emoji: '\u{1F4DD}', label: 'Test Prep' },
  ART: { icon: Palette, gradient: 'bg-gradient-to-br from-yellow-400 to-orange-500', emoji: '\u{1F3A8}', label: 'Art' },
  ESL: { icon: Globe, gradient: 'bg-gradient-to-br from-teal-400 to-emerald-600', emoji: '\u{1F30D}', label: 'ESL' },
};
