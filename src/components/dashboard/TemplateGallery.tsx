// ============================================================
// TemplateGallery — Pre-built template gallery dialog
// ============================================================
// Phase 3A: Whiteboard Templates Gallery
// - Search/filter bar at top
// - Subject filter tabs (All, Math, Science, Language, General)
// - Responsive grid of template cards
// - Each card: icon, title, description, subject badge, "Use Template" button
// ============================================================
'use client';

import React, { useState, useMemo } from 'react';
import type { Subject } from '@/types';
import { subjectMeta } from '@/lib/subject-meta';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Grid3x3,
  Calculator,
  Triangle,
  PieChart,
  FlaskConical,
  Atom,
  Zap,
  FileText,
  BookOpen,
  Library,
  NotebookPen,
  Brain,
  ClipboardList,
  CalendarDays,
  Search,
  LayoutTemplate,
  ChevronRight,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  subject: Subject;
  icon: string; // lucide icon name
}

interface TemplateGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: TemplateInfo) => void;
}

// ============================================================
// Icon mapping
// ============================================================

const ICON_MAP: Record<string, React.ElementType> = {
  Grid3x3,
  Calculator,
  Triangle,
  PieChart,
  FlaskConical,
  Atom,
  Zap,
  FileText,
  BookOpen,
  Library,
  NotebookPen,
  Brain,
  ClipboardList,
  CalendarDays,
};

function getIconComponent(iconName: string): React.ElementType {
  return ICON_MAP[iconName] ?? LayoutTemplate;
}

// ============================================================
// Pre-built template data
// ============================================================

const PREBUILT_TEMPLATES: TemplateInfo[] = [
  { id: 'graph-paper', name: 'Graph Paper', description: 'Standard grid for graphing functions and plotting data points', subject: 'MATH', icon: 'Grid3x3' },
  { id: 'algebra-worksheet', name: 'Algebra Worksheet', description: 'Structured layout for solving equations step by step', subject: 'MATH', icon: 'Calculator' },
  { id: 'geometry-proof', name: 'Geometry Proof', description: 'Two-column proof format with statement and reason columns', subject: 'MATH', icon: 'Triangle' },
  { id: 'fractions-practice', name: 'Fractions Practice', description: 'Visual fraction bars and number line for fraction operations', subject: 'MATH', icon: 'PieChart' },
  { id: 'lab-report', name: 'Lab Report', description: 'Structured sections for hypothesis, observations, and conclusions', subject: 'SCIENCE', icon: 'FlaskConical' },
  { id: 'periodic-table', name: 'Periodic Table Review', description: 'Element identification and property mapping template', subject: 'SCIENCE', icon: 'Atom' },
  { id: 'physics-diagram', name: 'Physics Diagram', description: 'Free-body diagram and force analysis layout', subject: 'SCIENCE', icon: 'Zap' },
  { id: 'essay-outline', name: 'Essay Outline', description: 'Five-paragraph essay structure with thesis and evidence slots', subject: 'LANGUAGE', icon: 'FileText' },
  { id: 'vocab-practice', name: 'Vocabulary Practice', description: 'Word, definition, part of speech, and example sentence columns', subject: 'LANGUAGE', icon: 'BookOpen' },
  { id: 'reading-comp', name: 'Reading Comprehension', description: 'Passage area with questions and answer space below', subject: 'LANGUAGE', icon: 'Library' },
  { id: 'cornell-notes', name: 'Cornell Notes', description: 'Three-section note-taking: cues, notes, and summary', subject: 'GENERAL', icon: 'NotebookPen' },
  { id: 'mind-map', name: 'Mind Map', description: 'Central concept with branching topic areas', subject: 'GENERAL', icon: 'Brain' },
  { id: 'kwl-chart', name: 'KWL Chart', description: 'Know, Want to Know, Learned — three-column organizer', subject: 'GENERAL', icon: 'ClipboardList' },
  { id: 'weekly-planner', name: 'Weekly Planner', description: 'Day-by-day layout for weekly lesson planning', subject: 'GENERAL', icon: 'CalendarDays' },
];

// ============================================================
// Subject filter tabs
// ============================================================

type FilterTab = 'ALL' | Subject;

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'MATH', label: 'Math' },
  { value: 'SCIENCE', label: 'Science' },
  { value: 'LANGUAGE', label: 'Language' },
  { value: 'GENERAL', label: 'General' },
];

// ============================================================
// Component
// ============================================================

export function TemplateGallery({
  open,
  onOpenChange,
  onSelectTemplate,
}: TemplateGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  // Filter templates by search query and active subject tab
  const filteredTemplates = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return PREBUILT_TEMPLATES.filter((template) => {
      // Subject filter
      if (activeTab !== 'ALL' && template.subject !== activeTab) {
        return false;
      }

      // Search filter
      if (query) {
        const matchesName = template.name.toLowerCase().includes(query);
        const matchesDescription = template.description
          .toLowerCase()
          .includes(query);
        const matchesSubject = template.subject.toLowerCase().includes(query);
        return matchesName || matchesDescription || matchesSubject;
      }

      return true;
    });
  }, [searchQuery, activeTab]);

  // Reset filters when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setSearchQuery('');
      setActiveTab('ALL');
    }
    onOpenChange(newOpen);
  };

  const handleSelectTemplate = (template: TemplateInfo) => {
    onSelectTemplate(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl max-w-3xl w-[calc(100%-2rem)] max-h-[85vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
          <DialogTitle className="text-xl flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-sm">
              <LayoutTemplate className="w-4 h-4 text-white" />
            </div>
            Template Gallery
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Choose a pre-built template to get started quickly, or start from a blank canvas.
          </DialogDescription>
        </DialogHeader>

        {/* Search bar */}
        <div className="px-6 pt-4 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="pl-9 rounded-xl h-10 border-gray-200"
            />
          </div>
        </div>

        {/* Subject filter tabs */}
        <div className="px-6 pt-3 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {FILTER_TABS.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`
                    px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all
                    ${
                      isActive
                        ? 'gradient-primary text-white shadow-sm shadow-emerald-500/20'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                    }
                  `}
                >
                  {tab.label}
                  {tab.value !== 'ALL' && (
                    <span className="ml-1 opacity-70">
                      {PREBUILT_TEMPLATES.filter((t) => t.subject === tab.value)
                        .length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Template grid */}
        <div className="px-6 pt-4 pb-6 overflow-y-auto custom-scrollbar flex-1">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-700">
                No templates found
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredTemplates.map((template) => {
                const meta = subjectMeta[template.subject] ?? subjectMeta.GENERAL;
                const IconComponent = getIconComponent(template.icon);

                return (
                  <div
                    key={template.id}
                    className="
                      group relative flex flex-col rounded-2xl border border-gray-200
                      bg-white hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-500/5
                      transition-all duration-200 overflow-hidden
                    "
                  >
                    {/* Card content */}
                    <div className="flex flex-col p-4 flex-1">
                      {/* Top row: icon + subject badge */}
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className={`w-10 h-10 rounded-xl ${meta.gradient} flex items-center justify-center shadow-sm`}
                        >
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-100"
                        >
                          {meta.label}
                        </Badge>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-1">
                        {template.name}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                        {template.description}
                      </p>
                    </div>

                    {/* Use Template button */}
                    <div className="px-4 pb-4 pt-0">
                      <Button
                        size="sm"
                        onClick={() => handleSelectTemplate(template)}
                        className="
                          w-full rounded-xl h-9 text-xs font-semibold
                          gradient-primary border-0 text-white
                          shadow-md shadow-emerald-500/20
                          hover:shadow-emerald-500/30
                          opacity-90 group-hover:opacity-100 transition-opacity
                        "
                      >
                        Use Template
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer count */}
        <div className="px-6 py-3 border-t border-gray-100 shrink-0">
          <p className="text-[11px] text-muted-foreground text-center">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
            {searchQuery && ` for "${searchQuery}"`}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
