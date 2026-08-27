'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, ListOrdered, Plus, CheckCircle } from 'lucide-react';

interface Props { editor?: unknown; }

interface ProofStep {
  id: string;
  statement: string;
  reason: string;
}

const REASONS = [
  'Given',
  'Definition of Congruence',
  'Definition of Midpoint',
  'Definition of Bisector',
  'Definition of Perpendicular',
  'Reflexive Property',
  'Symmetric Property',
  'Transitive Property',
  'Addition Property',
  'Subtraction Property',
  'Multiplication Property',
  'Division Property',
  'Substitution Property',
  'Distributive Property',
  'SAS',
  'SSS',
  'ASA',
  'AAS',
  'HL',
  'CPCTC',
  'Corresponding Angles',
  'Alternate Interior Angles',
  'Vertical Angles',
  'Linear Pair',
  'Triangle Sum Theorem',
  'Base Angles Theorem',
  'Converse of Base Angles',
  'Pythagorean Theorem',
  'Converse of Pythagorean Thm',
];

export default function ProofBuilderPanel({ editor: _editor }: Props) {
  const store = useAppStore();
  const [given, setGiven] = useState('');
  const [steps, setSteps] = useState<ProofStep[]>([]);
  const [newStatement, setNewStatement] = useState('');
  const [newReason, setNewReason] = useState(REASONS[0]);
  const [checkResult, setCheckResult] = useState<string | null>(null);

  if (!store.room.proofBuilderOpen) return null;

  const addStep = () => {
    if (!newStatement.trim()) return;
    setSteps(prev => [...prev, {
      id: `step-${Date.now()}` as any,
      statement: newStatement.trim(),
      reason: newReason,
    }]);
    setNewStatement('');
    setCheckResult(null);
  };

  const removeStep = (id: string) => {
    setSteps(prev => prev.filter(s => s.id !== id));
    setCheckResult(null);
  };

  const checkProof = () => {
    if (!given.trim() || steps.length === 0) {
      setCheckResult('error');
      return;
    }
    // Simple heuristic check: every step should have both statement and reason
    const allValid = steps.every(s => s.statement.trim() && s.reason);
    setCheckResult(allValid ? 'valid' : 'error');
  };

  return (
    <div style={{ position: 'absolute', top: 50, right: 16, zIndex: 1001, display: 'flex', flexDirection: 'column', gap: 4, padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.1)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: 260, maxHeight: 480, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Two-Column Proof Builder</span>
        <button onClick={() => store.toggleProofBuilder()} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X style={{ width: 14, height: 14 }} /></button>
      </div>

      {/* Given input */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <ListOrdered style={{ width: 12, height: 12, color: '#16a34a' }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Given</span>
        </div>
        <input
          value={given}
          onChange={e => { setGiven(e.target.value); setCheckResult(null); }}
          placeholder='e.g. AB = CD, BC = BC'
          style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 11, outline: 'none', color: '#374151' }}
        />
      </div>

      {/* Column headers */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 4, padding: '0 4px' }}>
        <span style={{ flex: 1, fontSize: 10, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 }}>Statements</span>
        <span style={{ flex: 1, fontSize: 10, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 }}>Reasons</span>
      </div>

      {/* Steps list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 180, overflowY: 'auto', marginBottom: 8 }}>
        {steps.length === 0 && (
          <div style={{ textAlign: 'center', padding: '12px 0', color: '#9ca3af', fontSize: 11 }}>No steps yet. Add steps below.</div>
        )}
        {steps.map((step, i) => (
          <div key={step.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px', borderRadius: 6, background: '#f9fafb', border: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', width: 16, textAlign: 'center', flexShrink: 0 }}>{i + 1}.</span>
            <span style={{ flex: 1, fontSize: 11, color: '#374151' }}>{step.statement}</span>
            <span style={{ flex: 1, fontSize: 10, color: '#6366f1', fontWeight: 500 }}>{step.reason}</span>
            <button onClick={() => removeStep(step.id)} style={{ width: 18, height: 18, borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <X style={{ width: 10, height: 10, color: '#9ca3af' }} />
            </button>
          </div>
        ))}
      </div>

      {/* Add step row */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        <input
          value={newStatement}
          onChange={e => setNewStatement(e.target.value)}
          placeholder='Statement...'
          onKeyDown={e => e.key === 'Enter' && addStep()}
          style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 11, outline: 'none', color: '#374151' }}
        />
        <select
          value={newReason}
          onChange={e => setNewReason(e.target.value)}
          style={{ width: 90, padding: '5px 4px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 10, outline: 'none', color: '#374151', background: '#fff' }}
        >
          {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Add Step button */}
      <button
        onClick={addStep}
        disabled={!newStatement.trim()}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px 0', borderRadius: 8, border: 'none', background: newStatement.trim() ? '#f3f4f6' : '#f9fafb', color: newStatement.trim() ? '#374151' : '#9ca3af', fontSize: 11, fontWeight: 600, cursor: newStatement.trim() ? 'pointer' : 'not-allowed', marginBottom: 6 }}
      >
        <Plus style={{ width: 12, height: 12 }} /> Add Step
      </button>

      {/* Check Proof button */}
      <button
        onClick={checkProof}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '7px 0', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#15803d'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#16a34a'; }}
      >
        <CheckCircle style={{ width: 12, height: 12 }} /> Check Proof
      </button>

      {/* Check result */}
      {checkResult && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 8px', borderRadius: 6, marginTop: 4, background: checkResult === 'valid' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${checkResult === 'valid' ? '#bbf7d0' : '#fecaca'}` }}>
          <CheckCircle style={{ width: 14, height: 14, color: checkResult === 'valid' ? '#16a34a' : '#ef4444' }} />
          <span style={{ fontSize: 11, fontWeight: 500, color: checkResult === 'valid' ? '#16a34a' : '#ef4444' }}>
            {checkResult === 'valid' ? 'Proof structure looks complete!' : 'Please fill in all statements and reasons.'}
          </span>
        </div>
      )}
    </div>
  );
}
