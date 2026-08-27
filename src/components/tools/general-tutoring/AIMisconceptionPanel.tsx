'use client';
import React, { useState, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, Brain, AlertTriangle, Lightbulb, Sparkles } from 'lucide-react';

interface Props {
  editor?: unknown;
}

type Severity = 'low' | 'medium' | 'high' | 'critical';

interface Misconception {
  id: string;
  description: string;
  severity: Severity;
  subject: string;
  type: string;
  intervention: string;
}

const SUBJECTS = ['Math', 'Science', 'English', 'History', 'General'];

const MISCONCEPTION_TYPES = [
  { value: 'math-sign-error', label: 'Math Sign Error', subjects: ['Math'] },
  { value: 'fraction-misconception', label: 'Fraction Misconception', subjects: ['Math'] },
  { value: 'order-of-operations', label: 'Order of Operations', subjects: ['Math'] },
  { value: 'negative-number-error', label: 'Negative Number Error', subjects: ['Math'] },
  { value: 'science-misconception', label: 'Science Misconception', subjects: ['Science'] },
  { value: 'cause-correlation', label: 'Cause vs Correlation', subjects: ['Science', 'History'] },
  { value: 'reading-comprehension', label: 'Reading Comprehension', subjects: ['English'] },
  { value: 'grammar-error', label: 'Grammar Misconception', subjects: ['English'] },
];

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string }> = {
  low: { label: 'Low', color: '#059669', bg: '#d1fae5' },
  medium: { label: 'Medium', color: '#f59e0b', bg: '#fef3c7' },
  high: { label: 'High', color: '#ea580c', bg: '#ffedd5' },
  critical: { label: 'Critical', color: '#dc2626', bg: '#fee2e2' },
};

const PLACEHOLDER_RESULTS: Misconception[] = [
  {
    id: 'm1',
    description: 'Student appears to be adding fractions by adding numerators and denominators separately (a/b + c/d = (a+c)/(b+d)).',
    severity: 'high',
    subject: 'Math',
    type: 'Fraction Misconception',
    intervention: 'Use visual fraction models to show that only numerators are added when denominators are the same. Practice finding common denominators with area models.',
  },
  {
    id: 'm2',
    description: 'Sign error detected: negative signs may be dropped when distributing or combining like terms.',
    severity: 'medium',
    subject: 'Math',
    type: 'Math Sign Error',
    intervention: 'Have the student use colored markers for negative signs. Practice with substitution checks after each step.',
  },
  {
    id: 'm3',
    description: 'Student may confuse correlation with causation based on the pattern observed in their data analysis.',
    severity: 'low',
    subject: 'Science',
    type: 'Cause vs Correlation',
    intervention: 'Discuss examples of spurious correlations. Have student identify confounding variables in their analysis.',
  },
];

export default function AIMisconceptionPanel({ editor }: Props) {
  const store = useAppStore();
  const [selectedSubject, setSelectedSubject] = useState('Math');
  const [selectedType, setSelectedType] = useState('fraction-misconception');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<Misconception[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredTypes = MISCONCEPTION_TYPES.filter(
    (t) => t.subjects.includes(selectedSubject) || selectedSubject === 'General'
  );

  const handleAnalyze = useCallback(() => {
    setAnalyzing(true);
    setResults([]);
    setExpandedId(null);
    // Placeholder for Claude API call
    setTimeout(() => {
      const filtered = PLACEHOLDER_RESULTS.filter(
        (r) => r.subject === selectedSubject || selectedSubject === 'General'
      );
      setResults(filtered.length > 0 ? filtered : PLACEHOLDER_RESULTS);
      setAnalyzing(false);
    }, 2000);
  }, [selectedSubject, selectedType]);

  if (!store.room.aiMisconceptionOpen) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 50,
        right: 16,
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: 12,
        borderRadius: 12,
        background: 'rgba(255,255,255,0.97)',
        border: '1px solid rgba(0,0,0,0.1)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        minWidth: 280,
        maxHeight: 480,
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Brain style={{ width: 14, height: 14 }} />
          AI Misconception Detection
        </span>
        <button
          onClick={() => store.toggleAIMisconception()}
          style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      {/* Subject Selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: '#6b7280' }}>Subject</span>
        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {SUBJECTS.map((subj) => (
            <button
              key={subj}
              onClick={() => setSelectedSubject(subj)}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                border: selectedSubject === subj ? '1px solid #7c3aed' : '1px solid rgba(0,0,0,0.1)',
                background: selectedSubject === subj ? '#f5f3ff' : '#fff',
                color: selectedSubject === subj ? '#7c3aed' : '#374151',
                fontSize: 11,
                fontWeight: selectedSubject === subj ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* Misconception Type Dropdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: '#6b7280' }}>Misconception Type</span>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            border: '1px solid rgba(0,0,0,0.1)',
            fontSize: 12,
            outline: 'none',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          {filteredTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={analyzing}
        style={{
          padding: '8px 12px',
          borderRadius: 8,
          border: 'none',
          background: analyzing ? '#c4b5fd' : '#7c3aed',
          color: '#fff',
          fontSize: 12,
          fontWeight: 600,
          cursor: analyzing ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        {analyzing ? (
          <>
            <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
            Analyzing Canvas...
          </>
        ) : (
          <>
            <Sparkles style={{ width: 12, height: 12 }} />
            Analyze Canvas
          </>
        )}
      </button>

      {/* Results */}
      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 500, color: '#6b7280' }}>
            <AlertTriangle style={{ width: 11, height: 11, display: 'inline', marginRight: 4 }} />
            Detected Misconceptions ({results.length})
          </span>
          {results.map((misconception) => {
            const sev = SEVERITY_CONFIG[misconception.severity];
            const isExpanded = expandedId === misconception.id;
            return (
              <div
                key={misconception.id}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${isExpanded ? '#7c3aed' : 'rgba(0,0,0,0.06)'}`,
                  background: isExpanded ? '#faf5ff' : '#fafafa',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onClick={() => setExpandedId(isExpanded ? null : misconception.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isExpanded ? 6 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: sev.bg,
                        color: sev.color,
                        fontSize: 9,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {sev.label.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {misconception.type}
                    </span>
                  </div>
                  <span style={{ fontSize: 9, color: '#9ca3af', flexShrink: 0 }}>{misconception.subject}</span>
                </div>

                <p style={{ fontSize: 10, color: '#4b5563', lineHeight: 1.5, marginBottom: isExpanded ? 6 : 0, display: isExpanded ? 'block' : '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {misconception.description}
                </p>

                {isExpanded && (
                  <div
                    style={{
                      padding: '8px 10px',
                      background: '#f0fdf4',
                      borderRadius: 6,
                      border: '1px solid #bbf7d0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                      <Lightbulb style={{ width: 11, height: 11, color: '#059669' }} />
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#059669' }}>Suggested Intervention</span>
                    </div>
                    <p style={{ fontSize: 10, color: '#166534', lineHeight: 1.5 }}>{misconception.intervention}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!analyzing && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af', fontSize: 11 }}>
          Select a subject and misconception type, then analyze the canvas to detect potential issues.
        </div>
      )}
    </div>
  );
}
