// ============================================================
// ParentSummaryExport — Session Summary Generator
// ============================================================
// Category: General Tutoring
// One-click export: "Today we covered X, Student struggled
// with Y, Practice Z at home." Generates downloadable summary.
// ============================================================

'use client';

import React, { useState, useCallback } from 'react';
import { Editor } from '@tldraw/tldraw';
import { useAppStore } from '@/store/app-store';
import { FileText, Download, Copy, Check, X, Printer, Mail } from 'lucide-react';

interface ParentSummaryPanelProps {
  editor: Editor | null;
}

export default function ParentSummaryPanel({ editor }: ParentSummaryPanelProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { room } = useAppStore();

  const summaryData = {
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    subject: room.subject,
    studentName: room.participants[0]?.name || 'Student',
    topicsCovered: '',
    strengths: '',
    areasForImprovement: '',
    homework: '',
    notes: '',
  };

  const [data, setData] = useState(summaryData);

  const generateSummary = useCallback(() => {
    const lines = [
      `SESSION SUMMARY — ${data.date}`,
      `Subject: ${data.subject}`,
      `Student: ${data.studentName}`,
      '',
      '---',
      '',
    ];

    if (data.topicsCovered) {
      lines.push('Topics Covered:');
      lines.push(data.topicsCovered);
      lines.push('');
    }

    if (data.strengths) {
      lines.push('Strengths:');
      lines.push(data.strengths);
      lines.push('');
    }

    if (data.areasForImprovement) {
      lines.push('Areas for Improvement:');
      lines.push(data.areasForImprovement);
      lines.push('');
    }

    if (data.homework) {
      lines.push('Homework / Practice:');
      lines.push(data.homework);
      lines.push('');
    }

    if (data.notes) {
      lines.push('Additional Notes:');
      lines.push(data.notes);
    }

    return lines.join('\n');
  }, [data]);

  const handleCopy = useCallback(async () => {
    const text = generateSummary();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [generateSummary]);

  const handleDownload = useCallback(() => {
    const text = generateSummary();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-summary-${data.studentName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [generateSummary, data.studentName]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 50,
        right: 16,
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 12,
        borderRadius: 12,
        background: 'rgba(255,255,255,0.97)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(16,185,129,0.12)',
        minWidth: 300,
        maxHeight: '80vh',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#059669' }}>
          <FileText style={{ width: 14, height: 14 }} />
          Parent Summary
        </div>
        <button onClick={() => setOpen(false)} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X style={{ width: 12, height: 12 }} />
        </button>
      </div>

      {/* Date & student info */}
      <div style={{ fontSize: 10, color: '#9ca3af' }}>
        {data.date} | {data.studentName}
      </div>

      {/* Form fields */}
      {[
        { key: 'topicsCovered' as const, label: 'Topics Covered', placeholder: 'e.g., Chapter 5: Fractions, Word problems with mixed numbers' },
        { key: 'strengths' as const, label: 'Strengths', placeholder: 'e.g., Quickly grasped equivalent fractions, showed good number sense' },
        { key: 'areasForImprovement' as const, label: 'Areas for Improvement', placeholder: 'e.g., Needs more practice with borrowing in subtraction' },
        { key: 'homework' as const, label: 'Homework / Practice', placeholder: 'e.g., Complete worksheet p.45-46, Practice flashcards 10 min/day' },
        { key: 'notes' as const, label: 'Additional Notes', placeholder: 'e.g., Student was very engaged today, showed great improvement' },
      ].map(({ key, label, placeholder }) => (
        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: '#6b7280' }}>{label}</label>
          <textarea
            value={data[key]}
            onChange={(e) => setData((prev) => ({ ...prev, [key]: e.target.value }))}
            placeholder={placeholder}
            rows={2}
            style={{
              width: '100%', padding: '6px 8px', borderRadius: 6,
              border: '1px solid rgba(0,0,0,0.12)', fontSize: 11,
              resize: 'vertical', outline: 'none', fontFamily: 'inherit',
              lineHeight: 1.4,
            }}
          />
        </div>
      ))}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <button
          onClick={handleCopy}
          style={{
            flex: 1, padding: '7px 10px', borderRadius: 8, border: 'none',
            background: copied ? '#10b981' : '#6366f1', color: 'white',
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}
        >
          {copied ? <Check style={{ width: 12, height: 12 }} /> : <Copy style={{ width: 12, height: 12 }} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button
          onClick={handleDownload}
          style={{
            flex: 1, padding: '7px 10px', borderRadius: 8, border: 'none',
            background: '#059669', color: 'white',
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}
        >
          <Download style={{ width: 12, height: 12 }} />
          Download
        </button>
      </div>
    </div>
  );
}
