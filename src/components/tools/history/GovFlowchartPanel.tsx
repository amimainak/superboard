'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, GitBranch, ChevronRight, Landmark } from 'lucide-react';

interface Props {
  editor?: unknown;
}

interface FlowStep {
  id: number;
  title: string;
  details: string;
}

interface FlowTemplate {
  id: string;
  name: string;
  icon: string;
  steps: FlowStep[];
}

const TEMPLATES: FlowTemplate[] = [
  {
    id: 'bill-to-law',
    name: 'Bill to Law',
    icon: '📋',
    steps: [
      { id: 1, title: 'Idea Proposed', details: 'A bill can be introduced by a member of Congress (House or Senate) or by the President.' },
      { id: 2, title: 'Committee Review', details: 'The bill is assigned to a committee for study, hearings, and amendments. Most bills die here.' },
      { id: 3, title: 'Floor Debate', details: 'If approved by committee, the bill goes to the full chamber for debate and voting.' },
      { id: 4, title: 'Other Chamber', details: 'The bill must pass both the House and Senate in identical form.' },
      { id: 5, title: 'Conference Committee', details: 'If chambers pass different versions, a conference committee resolves differences.' },
      { id: 6, title: 'Presidential Action', details: 'The President can sign (pass), veto (reject), or pocket veto (ignore after adjournment).' },
      { id: 7, title: 'Override or Law', details: 'Congress can override a veto with 2/3 majority in both chambers, or the bill becomes law.' },
    ],
  },
  {
    id: 'electoral-college',
    name: 'Electoral College',
    icon: '🗳️',
    steps: [
      { id: 1, title: 'Popular Vote', details: 'Citizens vote for President on Election Day (first Tuesday after first Monday in November).' },
      { id: 2, title: 'Electors Cast Votes', details: 'Electors meet in their states in mid-December to cast votes for President and Vice President.' },
      { id: 3, title: 'Votes Certified', details: 'Electoral votes are sealed and sent to the President of the Senate.' },
      { id: 4, title: 'Congress Counts', details: 'Congress meets in joint session on January 6 to open and count the electoral votes.' },
      { id: 5, title: 'Majority Wins', details: 'Candidate needs 270 of 538 electoral votes to win. If no majority, House decides.' },
    ],
  },
  {
    id: 'amendment-process',
    name: 'Amendment Process',
    icon: '📜',
    steps: [
      { id: 1, title: 'Proposal (2/3 Congress)', details: 'Two-thirds of both houses of Congress propose an amendment, OR a convention called by 2/3 of states.' },
      { id: 2, title: 'Proposal (2/3 Convention)', details: 'Alternatively, 2/3 of state legislatures can call a constitutional convention to propose amendments.' },
      { id: 3, title: 'Ratification (3/4 States)', details: 'Three-fourths (38) of state legislatures must ratify the proposed amendment.' },
      { id: 4, title: 'Ratification (3/4 Conventions)', details: 'Alternatively, ratifying conventions in 3/4 of states can approve the amendment.' },
      { id: 5, title: 'Certification', details: 'The National Archives certifies the amendment once enough states ratify it.' },
    ],
  },
  {
    id: 'federalism',
    name: 'Federalism',
    icon: '🏛️',
    steps: [
      { id: 1, title: 'Constitution', details: 'The Constitution divides power between the federal government and state governments.' },
      { id: 2, title: 'Enumerated Powers', details: 'Federal powers explicitly listed in Article I, Section 8 (coin money, regulate commerce, declare war).' },
      { id: 3, title: 'Reserved Powers', details: 'Powers not delegated to the federal government are reserved to the states (10th Amendment).' },
      { id: 4, title: 'Concurrent Powers', details: 'Powers shared by both levels (tax, build roads, establish courts, borrow money).' },
      { id: 5, title: 'Supremacy Clause', details: 'Federal law is supreme over state law when they conflict (Article VI).' },
      { id: 6, title: 'Necessary & Proper', details: 'Congress can make laws “necessary and proper” to carry out enumerated powers (elastic clause).' },
    ],
  },
];

export default function GovFlowchartPanel({ editor }: Props) {
  const store = useAppStore();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  if (!store.room.govFlowchartOpen) return null;

  const template = TEMPLATES.find((t) => t.id === selectedTemplate);

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
          <Landmark style={{ width: 14, height: 14 }} />
          Gov Process Flowcharts
        </span>
        <button
          onClick={() => store.toggleGovFlowchart()}
          style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      {/* Template Selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: '#6b7280', marginBottom: 2 }}>Select a Template</span>
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setSelectedTemplate(selectedTemplate === t.id ? null : t.id);
              setExpandedStep(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              borderRadius: 8,
              border: selectedTemplate === t.id ? '1.5px solid #7c3aed' : '1px solid rgba(0,0,0,0.08)',
              background: selectedTemplate === t.id ? '#f5f3ff' : 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 16 }}>{t.icon}</span>
            <GitBranch style={{ width: 14, height: 14, color: selectedTemplate === t.id ? '#7c3aed' : '#9ca3af', flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: selectedTemplate === t.id ? 600 : 400, color: selectedTemplate === t.id ? '#7c3aed' : '#374151' }}>
              {t.name}
            </span>
            <ChevronRight
              style={{
                width: 12,
                height: 12,
                marginLeft: 'auto',
                color: '#9ca3af',
                transform: selectedTemplate === t.id ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s',
              }}
            />
          </button>
        ))}
      </div>

      {/* Flowchart Steps */}
      {template && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 500, color: '#6b7280', marginBottom: 2 }}>{template.name} Steps</span>
          {template.steps.map((step, index) => (
            <div key={step.id}>
              <button
                onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: 'none',
                  background: expandedStep === step.id ? '#f9fafb' : 'transparent',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#7c3aed',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {step.id}
                </span>
                <span style={{ fontSize: 11, fontWeight: 500, color: '#374151', flex: 1 }}>{step.title}</span>
                <ChevronRight
                  style={{
                    width: 12,
                    height: 12,
                    color: '#9ca3af',
                    transform: expandedStep === step.id ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s',
                  }}
                />
              </button>
              {/* Arrow between steps */}
              {index < template.steps.length - 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '0 0 0 9' }}>
                  <div style={{ width: 2, height: 8, background: '#d1d5db', borderRadius: 1 }} />
                </div>
              )}
              {/* Expanded details */}
              {expandedStep === step.id && (
                <div
                  style={{
                    marginLeft: 28,
                    padding: '6px 10px',
                    fontSize: 11,
                    color: '#4b5563',
                    lineHeight: 1.5,
                    background: '#f9fafb',
                    borderRadius: 6,
                    marginTop: 2,
                    marginBottom: 4,
                  }}
                >
                  {step.details}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!selectedTemplate && (
        <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af', fontSize: 11 }}>
          Select a template to view the flowchart steps.
        </div>
      )}
    </div>
  );
}
