// ============================================================
// Subject metadata — shared across dashboard components
// ============================================================
import {
  Calculator,
  FlaskConical,
  Languages,
  ClipboardList,
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
};
