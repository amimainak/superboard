// ============================================================
// Tool Category Registry
// ============================================================
// Central registry of all tools organized by category.
// Categories are helpful suggestions, not hard rules —
// tutors can render any tool at any time during lessons.
// ============================================================

import React from 'react';
import type { ToolCategory, Subject } from '@/types';

export interface ToolRegistration {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  category: ToolCategory;
  suggestedSubjects: Subject[];
  isPremium: boolean;
  // Panel component key for lazy loading
  panelKey: string;
}

// ============================================================
// All Tools Across 6 Categories
// ============================================================

export const TOOL_REGISTRY: ToolRegistration[] = [
  // ---- English & Reading ----
  {
    id: 'annotation-layers',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('path', { d: 'm12 2 0 20M2 12h20M5 5l14 14M19 5 5 19' })),
    label: 'Annotation Layers',
    description: 'Separate tutor & student annotation layers with visibility toggles',
    category: 'english-reading',
    suggestedSubjects: ['LANGUAGE', 'GENERAL'],
    isPremium: false,
    panelKey: 'AnnotationLayerPanel',
  },
  {
    id: 'graphic-organizers',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('rect', { x: 3, y: 3, width: 7, height: 7, rx: 1 }), React.createElement('rect', { x: 14, y: 3, width: 7, height: 7, rx: 1 }), React.createElement('rect', { x: 3, y: 14, width: 7, height: 7, rx: 1 }), React.createElement('rect', { x: 14, y: 14, width: 7, height: 7, rx: 1 })),
    label: 'Graphic Organizers',
    description: 'Story map, KWL chart, Venn diagram, Frayer model & more',
    category: 'english-reading',
    suggestedSubjects: ['LANGUAGE', 'GENERAL'],
    isPremium: false,
    panelKey: 'GraphicOrganizerPanel',
  },
  {
    id: 'fluency-timer',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('circle', { cx: 12, cy: 12, r: 10 }), React.createElement('polyline', { points: '12 6 12 12 16 14' })),
    label: 'Fluency Timer',
    description: 'Timed reading with WPM calculation',
    category: 'english-reading',
    suggestedSubjects: ['LANGUAGE'],
    isPremium: false,
    panelKey: 'FluencyTimerWidget',
  },
  {
    id: 'rubric',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }), React.createElement('polyline', { points: '14 2 14 8 20 8' })),
    label: 'Rubric Overlay',
    description: 'Grading rubric with real-time scoring',
    category: 'english-reading',
    suggestedSubjects: ['LANGUAGE', 'GENERAL'],
    isPremium: false,
    panelKey: 'RubricOverlay',
  },
  {
    id: 'essay-builder',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('path', { d: 'M12 20h9' }), React.createElement('path', { d: 'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' })),
    label: 'Essay Builder',
    description: 'Drag-and-drop essay structure outline builder',
    category: 'english-reading',
    suggestedSubjects: ['LANGUAGE'],
    isPremium: false,
    panelKey: 'EssayBuilder',
  },
  {
    id: 'parts-of-speech',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }), React.createElement('polyline', { points: '14 2 14 8 20 8' })),
    label: 'Parts of Speech',
    description: 'Color-coded parts of speech highlighting for any sentence',
    category: 'english-reading',
    suggestedSubjects: ['LANGUAGE'],
    isPremium: false,
    panelKey: 'PartsOfSpeechPanel',
  },

  // ---- Foreign Language ----
  {
    id: 'diacritical-toolbar',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('circle', { cx: 12, cy: 12, r: 10 }), React.createElement('line', { x1: 2, y1: 12, x2: 22, y2: 12 }), React.createElement('path', { d: 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' })),
    label: 'Special Characters',
    description: 'Spanish, French, German, Portuguese diacritical characters',
    category: 'foreign-language',
    suggestedSubjects: ['LANGUAGE'],
    isPremium: false,
    panelKey: 'DiacriticalToolbar',
  },
  {
    id: 'conjugation-tables',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('rect', { x: 3, y: 3, width: 18, height: 18, rx: 2 }), React.createElement('line', { x1: 3, y1: 9, x2: 21, y2: 9 }), React.createElement('line', { x1: 3, y1: 15, x2: 21, y2: 15 }), React.createElement('line', { x1: 9, y1: 3, x2: 9, y2: 21 })),
    label: 'Conjugation Tables',
    description: 'Verb conjugation templates for Spanish, French, German',
    category: 'foreign-language',
    suggestedSubjects: ['LANGUAGE'],
    isPremium: false,
    panelKey: 'ConjugationTablePanel',
  },
  {
    id: 'cloze-builder',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('rect', { x: 2, y: 6, width: 20, height: 12, rx: 2 }), React.createElement('line', { x1: 6, y1: 10, x2: 6, y2: 14 }), React.createElement('line', { x1: 10, y1: 10, x2: 10, y2: 14 })),
    label: 'Cloze Builder',
    description: 'Fill-in-the-blank exercise generator from any text',
    category: 'foreign-language',
    suggestedSubjects: ['LANGUAGE'],
    isPremium: false,
    panelKey: 'ClozeBuilderPanel',
  },
  {
    id: 'audio-recorder',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('path', { d: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z' }), React.createElement('path', { d: 'M19 10v2a7 7 0 0 1-14 0v-2' }), React.createElement('line', { x1: 12, y1: 19, x2: 12, y2: 23 })),
    label: 'Audio Recorder',
    description: 'Record & play pronunciation examples',
    category: 'foreign-language',
    suggestedSubjects: ['LANGUAGE'],
    isPremium: false,
    panelKey: 'AudioRecordPanel',
  },
  {
    id: 'flashcards',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('rect', { x: 2, y: 4, width: 20, height: 16, rx: 2 }), React.createElement('path', { d: 'M2 4v16a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V4' })),
    label: 'Flashcards',
    description: 'Vocabulary flashcard mode with flip & navigation',
    category: 'foreign-language',
    suggestedSubjects: ['LANGUAGE'],
    isPremium: false,
    panelKey: 'FlashcardModeWidget',
  },
  {
    id: 'translation-toggle',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('path', { d: 'm5 8 6 6' }), React.createElement('path', { d: 'm4 14 6-6 2-3' }), React.createElement('path', { d: 'M2 5h12' }), React.createElement('path', { d: 'M7 2h1' }), React.createElement('path', { d: 'm22 22-5-10-5 10' }), React.createElement('path', { d: 'M14 18h6' })),
    label: 'Translation Toggle',
    description: 'Show/hide English translations beneath text',
    category: 'foreign-language',
    suggestedSubjects: ['LANGUAGE'],
    isPremium: false,
    panelKey: 'TranslationToggle',
  },

  // ---- Math Tools ----
  {
    id: 'fraction-manipulatives',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('circle', { cx: 12, cy: 12, r: 10 }), React.createElement('path', { d: 'M12 2v20' })),
    label: 'Fraction Manipulatives',
    description: 'Visual fraction bars, circles, mixed numbers & equivalent fractions',
    category: 'math-tools',
    suggestedSubjects: ['MATH'],
    isPremium: false,
    panelKey: 'FractionManipulative',
  },
  {
    id: 'unit-converter',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('polyline', { points: '17 1 21 5 17 9' }), React.createElement('path', { d: 'M3 11V9a4 4 0 0 1 4-4h14' }), React.createElement('polyline', { points: '7 23 3 19 7 15' }), React.createElement('path', { d: 'M21 13v2a4 4 0 0 1-4 4H3' })),
    label: 'Unit Converter',
    description: 'Convert length, weight, volume & temperature with visualization',
    category: 'math-tools',
    suggestedSubjects: ['MATH', 'SCIENCE'],
    isPremium: false,
    panelKey: 'UnitConverter',
  },
  {
    id: 'stats-chart',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('line', { x1: 18, y1: 20, x2: 18, y2: 10 }), React.createElement('line', { x1: 12, y1: 20, x2: 12, y2: 4 }), React.createElement('line', { x1: 6, y1: 20, x2: 6, y2: 14 })),
    label: 'Statistics Charts',
    description: 'Data table with auto-calculated mean, median, mode & live charts',
    category: 'math-tools',
    suggestedSubjects: ['MATH', 'SCIENCE'],
    isPremium: false,
    panelKey: 'StatsChartPanel',
  },
  {
    id: 'step-reveal',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('rect', { x: 3, y: 4, width: 18, height: 18, rx: 2, ry: 2 }), React.createElement('line', { x1: 16, y1: 2, x2: 16, y2: 6 }), React.createElement('line', { x1: 8, y1: 2, x2: 8, y2: 6 }), React.createElement('line', { x1: 3, y1: 10, x2: 21, y2: 10 })),
    label: 'Step Reveal',
    description: 'Step-by-step solver with progressive reveal for guided discovery',
    category: 'math-tools',
    suggestedSubjects: ['MATH', 'SCIENCE'],
    isPremium: false,
    panelKey: 'StepRevealPanel',
  },

  // ---- Science Tools ----
  {
    id: 'periodic-table',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('rect', { x: 3, y: 3, width: 7, height: 7, rx: 1 }), React.createElement('rect', { x: 14, y: 3, width: 7, height: 7, rx: 1 }), React.createElement('rect', { x: 3, y: 14, width: 7, height: 7, rx: 1 }), React.createElement('rect', { x: 14, y: 14, width: 7, height: 7, rx: 1 })),
    label: 'Periodic Table',
    description: 'Quick-insert elements with symbol, atomic # & mass',
    category: 'science-tools',
    suggestedSubjects: ['SCIENCE'],
    isPremium: false,
    panelKey: 'PeriodicTablePanel',
  },
  {
    id: 'punnett-square',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('rect', { x: 3, y: 3, width: 18, height: 18, rx: 2 }), React.createElement('line', { x1: 12, y1: 3, x2: 12, y2: 21 }), React.createElement('line', { x1: 3, y1: 12, x2: 21, y2: 12 })),
    label: 'Punnett Square',
    description: 'Genetics Punnett square builder with auto-calculated ratios',
    category: 'science-tools',
    suggestedSubjects: ['SCIENCE'],
    isPremium: false,
    panelKey: 'PunnettSquarePanel',
  },
  {
    id: 'lab-report',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }), React.createElement('polyline', { points: '14 2 14 8 20 8' })),
    label: 'Lab Report',
    description: 'Pre-formatted lab report template builder',
    category: 'science-tools',
    suggestedSubjects: ['SCIENCE'],
    isPremium: false,
    panelKey: 'LabReportTemplate',
  },

  // ---- History & Social Studies Tools ----
  {
    id: 'map-overlays',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('circle', { cx: 12, cy: 12, r: 10 }), React.createElement('line', { x1: 2, y1: 12, x2: 22, y2: 12 }), React.createElement('path', { d: 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' })),
    label: 'Map Overlays',
    description: 'World, US & Europe map annotation layers',
    category: 'history-tools',
    suggestedSubjects: ['GENERAL', 'LANGUAGE'],
    isPremium: false,
    panelKey: 'MapPanel',
  },
  {
    id: 'timeline-builder',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('circle', { cx: 12, cy: 12, r: 10 }), React.createElement('polyline', { points: '12 6 12 12 16 14' })),
    label: 'Timeline Builder',
    description: 'Zoomable timeline with color-coded era events',
    category: 'history-tools',
    suggestedSubjects: ['GENERAL', 'LANGUAGE'],
    isPremium: false,
    panelKey: 'TimelinePanel',
  },
  {
    id: 'cause-effect',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('line', { x1: 5, y1: 12, x2: 19, y2: 12 }), React.createElement('polyline', { points: '12 5 19 12 12 19' })),
    label: 'Cause & Effect',
    description: 'Visual cause-effect chain builder with flowchart arrows',
    category: 'history-tools',
    suggestedSubjects: ['GENERAL', 'LANGUAGE'],
    isPremium: false,
    panelKey: 'CauseEffectPanel',
  },
  {
    id: 'dbq-workspace',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }), React.createElement('polyline', { points: '14 2 14 8 20 8' })),
    label: 'DBQ Workspace',
    description: 'Multi-document workspace with thesis & evidence organizer',
    category: 'history-tools',
    suggestedSubjects: ['GENERAL', 'LANGUAGE'],
    isPremium: false,
    panelKey: 'DBQWorkspace',
  },

  // ---- General Tutoring ----
  // ...existing 4 tools...

  // ---- English & Reading Gap Tools ----
  {
    id: 'text-markup',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('path', { d: 'M12 20h9' }), React.createElement('path', { d: 'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' })),
    label: 'Text Markup',
    description: 'Structured close reading annotation with color-coded highlighter legend',
    category: 'english-reading',
    suggestedSubjects: ['LANGUAGE', 'GENERAL'],
    isPremium: false,
    panelKey: 'TextMarkupPanel',
  },
  {
    id: 'standards-tracker',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('path', { d: 'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20' })),
    label: 'Standards Tracker',
    description: 'CCSS/TEKS standards tracking with per-activity tagging and coverage reports',
    category: 'english-reading',
    suggestedSubjects: ['LANGUAGE', 'MATH', 'SCIENCE', 'GENERAL'],
    isPremium: false,
    panelKey: 'StandardsTrackerPanel',
  },
  {
    id: 'phoneme-grapheme',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('circle', { cx: 12, cy: 12, r: 10 }), React.createElement('path', { d: 'M8 12h8M12 8v8' })),
    label: 'Phoneme-Grapheme Map',
    description: 'Word-level phonics decoding with color-coded grapheme mapping for K-3',
    category: 'english-reading',
    suggestedSubjects: ['LANGUAGE'],
    isPremium: false,
    panelKey: 'PhonemeGraphemePanel',
  },
  {
    id: 'peer-review',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }), React.createElement('circle', { cx: 9, cy: 7, r: 4 }), React.createElement('path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' })),
    label: 'Peer Review',
    description: 'Structured peer review workflow with anchored comments and rubric prompts',
    category: 'english-reading',
    suggestedSubjects: ['LANGUAGE', 'GENERAL'],
    isPremium: false,
    panelKey: 'PeerReviewPanel',
  },

  // ---- Math Gap Tools ----
  {
    id: 'function-plotter',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('path', { d: 'm22 12-4-4' }), React.createElement('path', { d: 'M6 2l4 4' }), React.createElement('path', { d: 'M22 12c0 4-4 6-10 6S2 16 2 12s4-6 10-6 10 2 10 6z' })),
    label: 'Function Plotter',
    description: 'Interactive function grapher with adjustable parameters and real-time updates',
    category: 'math-tools',
    suggestedSubjects: ['MATH', 'SCIENCE'],
    isPremium: false,
    panelKey: 'FunctionPlotterPanel',
  },
  {
    id: 'coord-plane',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('line', { x1: 12, y1: 2, x2: 12, y2: 22 }), React.createElement('line', { x1: 2, y1: 12, x2: 22, y2: 12 })),
    label: 'Coordinate Plane',
    description: 'Pre-built coordinate plane with labeled axes and snap-to-grid drawing',
    category: 'math-tools',
    suggestedSubjects: ['MATH'],
    isPremium: false,
    panelKey: 'CoordPlanePanel',
  },
  {
    id: 'proof-builder',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('line', { x1: 8, y1: 6, x2: 21, y2: 6 }), React.createElement('line', { x1: 8, y1: 12, x2: 21, y2: 12 }), React.createElement('line', { x1: 8, y1: 18, x2: 21, y2: 18 }), React.createElement('line', { x1: 3, y1: 6, x2: 3.01, y2: 6 }), React.createElement('line', { x1: 3, y1: 12, x2: 3.01, y2: 12 }), React.createElement('line', { x1: 3, y1: 18, x2: 3.01, y2: 18 })),
    label: 'Proof Builder',
    description: 'Two-column geometry proof builder with selectable justifications',
    category: 'math-tools',
    suggestedSubjects: ['MATH'],
    isPremium: false,
    panelKey: 'ProofBuilderPanel',
  },
  {
    id: 'bar-model',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('rect', { x: 3, y: 12, width: 4, height: 9, rx: 1 }), React.createElement('rect', { x: 10, y: 8, width: 4, height: 13, rx: 1 }), React.createElement('rect', { x: 17, y: 4, width: 4, height: 17, rx: 1 })),
    label: 'Bar Model',
    description: 'Visual bar modeling for word problem translation and part-part-whole relationships',
    category: 'math-tools',
    suggestedSubjects: ['MATH'],
    isPremium: false,
    panelKey: 'BarModelPanel',
  },
  {
    id: 'number-line',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('line', { x1: 2, y1: 12, x2: 22, y2: 12 }), React.createElement('circle', { cx: 7, cy: 12, r: 2 }), React.createElement('circle', { cx: 12, cy: 12, r: 2 }), React.createElement('circle', { cx: 17, cy: 12, r: 2 })),
    label: 'Number Line',
    description: 'Customizable number line with zoom, negatives, fractions, and jump annotations',
    category: 'math-tools',
    suggestedSubjects: ['MATH'],
    isPremium: false,
    panelKey: 'NumberLinePanel',
  },

  // ---- Science Gap Tools ----
  {
    id: 'diagram-templates',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('rect', { x: 3, y: 3, width: 18, height: 18, rx: 2 }), React.createElement('circle', { cx: 8.5, cy: 8.5, r: 1.5 }), React.createElement('path', { d: 'M21 15l-5-5L5 21' })),
    label: 'Diagram Templates',
    description: 'Pre-built science diagrams: cell, energy pyramid, water cycle, circuits, body systems',
    category: 'science-tools',
    suggestedSubjects: ['SCIENCE'],
    isPremium: false,
    panelKey: 'DiagramTemplatesPanel',
  },
  {
    id: 'lewis-dot',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('circle', { cx: 12, cy: 12, r: 3 }), React.createElement('circle', { cx: 5, cy: 5, r: 1 }), React.createElement('circle', { cx: 19, cy: 5, r: 1 }), React.createElement('circle', { cx: 5, cy: 19, r: 1 }), React.createElement('circle', { cx: 19, cy: 19, r: 1 })),
    label: 'Lewis Dot Builder',
    description: 'Interactive Lewis dot structure tool with octet rule checking and formal charges',
    category: 'science-tools',
    suggestedSubjects: ['SCIENCE'],
    isPremium: false,
    panelKey: 'LewisDotPanel',
  },

  // ---- History Gap Tools ----
  {
    id: 'gov-flowcharts',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('rect', { x: 2, y: 7, width: 6, height: 10, rx: 1 }), React.createElement('rect', { x: 9, y: 4, width: 6, height: 16, rx: 1 }), React.createElement('rect', { x: 17, y: 7, width: 5, height: 10, rx: 1 })),
    label: 'Government Flowcharts',
    description: 'Civic process flowcharts: bill to law, electoral process, amendment process',
    category: 'history-tools',
    suggestedSubjects: ['GENERAL', 'LANGUAGE'],
    isPremium: false,
    panelKey: 'GovFlowchartPanel',
  },
  {
    id: 'supply-demand',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('path', { d: 'M3 20L12 4l9 16' }), React.createElement('path', { d: 'M3 8l9 12 9-12' })),
    label: 'Supply & Demand',
    description: 'Interactive economics graph with draggable curves and equilibrium visualization',
    category: 'history-tools',
    suggestedSubjects: ['GENERAL', 'LANGUAGE'],
    isPremium: false,
    panelKey: 'SupplyDemandPanel',
  },

  // ---- Foreign Language Gap Tools ----
  {
    id: 'pronunciation-compare',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('path', { d: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z' }), React.createElement('path', { d: 'M19 10v2a7 7 0 0 1-14 0v-2' })),
    label: 'Pronunciation Compare',
    description: 'Side-by-side audio recording comparison for pronunciation practice',
    category: 'foreign-language',
    suggestedSubjects: ['LANGUAGE'],
    isPremium: false,
    panelKey: 'PronunciationComparePanel',
  },
  {
    id: 'image-vocab',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('rect', { x: 3, y: 3, width: 18, height: 18, rx: 2 }), React.createElement('circle', { cx: 8.5, cy: 8.5, r: 1.5 }), React.createElement('path', { d: 'M21 15l-5-5L5 21' })),
    label: 'Image Vocab Builder',
    description: 'Quick image search paired with vocabulary for visual flashcard creation',
    category: 'foreign-language',
    suggestedSubjects: ['LANGUAGE'],
    isPremium: false,
    panelKey: 'ImageVocabPanel',
  },

  // ---- General Gap Tools ----
  {
    id: 'student-portfolio',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('rect', { x: 2, y: 2, width: 20, height: 20, rx: 2 }), React.createElement('path', { d: 'M2 7h20M2 12h20M7 2v20' })),
    label: 'Student Portfolio',
    description: 'Persistent student work gallery across sessions with tagged exemplary work',
    category: 'general-tutoring',
    suggestedSubjects: ['MATH', 'SCIENCE', 'LANGUAGE', 'GENERAL'],
    isPremium: false,
    panelKey: 'StudentPortfolioPanel',
  },
  {
    id: 'multi-student',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }), React.createElement('circle', { cx: 9, cy: 7, r: 4 }), React.createElement('path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' })),
    label: 'Multi-Student Mode',
    description: 'Tutor multiple students simultaneously with individual attention panels',
    category: 'general-tutoring',
    suggestedSubjects: ['MATH', 'SCIENCE', 'LANGUAGE', 'GENERAL'],
    isPremium: true,
    panelKey: 'MultiStudentPanel',
  },
  {
    id: 'sticker-reward',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('polygon', { points: '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' })),
    label: 'Sticker Rewards',
    description: 'Digital stickers and badges for student motivation and engagement',
    category: 'general-tutoring',
    suggestedSubjects: ['MATH', 'SCIENCE', 'LANGUAGE', 'GENERAL'],
    isPremium: false,
    panelKey: 'StickerRewardPanel',
  },
  {
    id: 'ai-misconception',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('circle', { cx: 12, cy: 12, r: 10 }), React.createElement('path', { d: 'M12 16v-4M12 8h.01' })),
    label: 'AI Misconception',
    description: 'Claude-powered real-time analysis detecting common student misconceptions',
    category: 'general-tutoring',
    suggestedSubjects: ['MATH', 'SCIENCE', 'LANGUAGE', 'GENERAL'],
    isPremium: true,
    panelKey: 'AIMisconceptionPanel',
  },

  // ---- PE Tools ----
  {
    id: 'sports-play',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('circle', { cx: 12, cy: 12, r: 10 }), React.createElement('path', { d: 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' })),
    label: 'Sports Play Diagram',
    description: 'Field/court templates with player positions, movement arrows, and formation builder',
    category: 'pe-tools',
    suggestedSubjects: ['PE'],
    isPremium: false,
    panelKey: 'SportsPlayPanel',
  },
  {
    id: 'workout-plan',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('path', { d: 'M18 20V10M12 20V4M6 20v-6' })),
    label: 'Workout Plan',
    description: 'Structured exercise plan builder with sets, reps, duration, and muscle targeting',
    category: 'pe-tools',
    suggestedSubjects: ['PE'],
    isPremium: false,
    panelKey: 'WorkoutPlanPanel',
  },
  {
    id: 'fitness-tracker',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('path', { d: 'M22 12h-4l-3 9L9 3l-3 9H2' })),
    label: 'Fitness Tracker',
    description: 'Student fitness data tracker with progress charts and goal setting',
    category: 'pe-tools',
    suggestedSubjects: ['PE'],
    isPremium: false,
    panelKey: 'FitnessTrackerPanel',
  },

  // ---- Health Tools ----
  {
    id: 'food-label',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }), React.createElement('polyline', { points: '14 2 14 8 20 8' })),
    label: 'Food Label Reader',
    description: 'Interactive nutrition label reading with macro breakdown and quiz mode',
    category: 'health-tools',
    suggestedSubjects: ['HEALTH'],
    isPremium: false,
    panelKey: 'FoodLabelPanel',
  },
  {
    id: 'mood-journal',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('path', { d: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' })),
    label: 'Mood & Wellness Journal',
    description: 'Private student wellness journal with mood tracking and guided reflection',
    category: 'health-tools',
    suggestedSubjects: ['HEALTH'],
    isPremium: false,
    panelKey: 'MoodJournalPanel',
  },
  {
    id: 'body-systems',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('circle', { cx: 12, cy: 5, r: 3 }), React.createElement('path', { d: 'M12 8v4M8 12h8M10 16h4M10 20h4' })),
    label: 'Body Systems',
    description: 'Labeled anatomical diagrams for skeletal, muscular, digestive, and other systems',
    category: 'health-tools',
    suggestedSubjects: ['HEALTH', 'SCIENCE'],
    isPremium: false,
    panelKey: 'BodySystemsPanel',
  },

  // ---- Arts Tools ----
  {
    id: 'color-theory',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('circle', { cx: 12, cy: 12, r: 10 }), React.createElement('circle', { cx: 12, cy: 8, r: 2 }), React.createElement('circle', { cx: 8, cy: 14, r: 2 }), React.createElement('circle', { cx: 16, cy: 14, r: 2 })),
    label: 'Color Theory',
    description: 'Interactive color wheel, value scale, and harmonious color selector',
    category: 'arts-tools',
    suggestedSubjects: ['ARTS'],
    isPremium: false,
    panelKey: 'ColorTheoryPanel',
  },
  {
    id: 'art-compare',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('rect', { x: 2, y: 3, width: 8, height: 18, rx: 1 }), React.createElement('rect', { x: 14, y: 3, width: 8, height: 18, rx: 1 })),
    label: 'Art Comparison',
    description: 'Side-by-side artwork comparison with annotation and structured critique prompts',
    category: 'arts-tools',
    suggestedSubjects: ['ARTS'],
    isPremium: false,
    panelKey: 'ArtComparePanel',
  },
  {
    id: 'staff-notation',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('path', { d: 'M9 18V5l12-2v13' }), React.createElement('circle', { cx: 6, cy: 18, r: 3 }), React.createElement('circle', { cx: 18, cy: 16, r: 3 })),
    label: 'Staff Notation',
    description: 'Interactive music staff with note placement, intervals, scales, and chord building',
    category: 'arts-tools',
    suggestedSubjects: ['ARTS'],
    isPremium: false,
    panelKey: 'StaffNotationPanel',
  },
  {
    id: 'perspective-grid',
    icon: () => React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React.createElement('path', { d: 'M3 20L12 3l9 17' }), React.createElement('path', { d: 'M3 8l9-5 9 5' })),
    label: 'Perspective Grid',
    description: 'One-point and two-point perspective grid overlays for drawing instruction',
    category: 'arts-tools',
    suggestedSubjects: ['ARTS'],
    isPremium: false,
    panelKey: 'PerspectiveGridPanel',
  },
];

export function getToolsByCategory(category: ToolCategory): ToolRegistration[] {
  return TOOL_REGISTRY.filter(t => t.category === category);
}

export function getToolsForSubject(subject: Subject): ToolRegistration[] {
  // Return tools suggested for this subject first, then all others
  const suggested = TOOL_REGISTRY.filter(t => t.suggestedSubjects.includes(subject));
  const others = TOOL_REGISTRY.filter(t => !t.suggestedSubjects.includes(subject));
  return [...suggested, ...others];
}

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  'english-reading': 'English & Reading',
  'foreign-language': 'Foreign Language',
  'general-tutoring': 'General Tutoring',
  'math-tools': 'Math Tools',
  'science-tools': 'Science Tools',
  'history-tools': 'History & Social Studies',
  'pe-tools': 'Physical Education',
  'health-tools': 'Health Education',
  'arts-tools': 'Arts',
};

export const CATEGORY_COLORS: Record<ToolCategory, string> = {
  'english-reading': '#6366f1',
  'foreign-language': '#10b981',
  'general-tutoring': '#f59e0b',
  'math-tools': '#3b82f6',
  'science-tools': '#8b5cf6',
  'history-tools': '#f97316',
  'pe-tools': '#ef4444',
  'health-tools': '#ec4899',
  'arts-tools': '#a855f7',
};
