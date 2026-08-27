'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, Users, Star, MessageSquare, Send } from 'lucide-react';

interface Props { editor?: unknown; }

interface RubricCriterion {
  name: string;
  score: number;
}

interface ReviewEntry {
  id: string;
  reviewer: string;
  scores: RubricCriterion[];
  total: number;
  comment: string;
}

const DEFAULT_CRITERIA: RubricCriterion[] = [
  { name: 'Thesis Clarity', score: 0 },
  { name: 'Evidence Use', score: 0 },
  { name: 'Organization', score: 0 },
  { name: 'Conventions', score: 0 },
];

export default function PeerReviewPanel({ editor: _editor }: Props) {
  const store = useAppStore();
  const [reviewer, setReviewer] = useState('');
  const [criteria, setCriteria] = useState<RubricCriterion[]>(DEFAULT_CRITERIA.map(c => ({ ...c })));
  const [comment, setComment] = useState('');
  const [reviews, setReviews] = useState<ReviewEntry[]>([]);

  if (!store.room.peerReviewOpen) return null;

  const updateScore = (index: number, score: number) => {
    setCriteria(prev => prev.map((c, i) => i === index ? { ...c, score } : c));
  };

  const totalScore = criteria.reduce((sum, c) => sum + c.score, 0);
  const maxScore = criteria.length * 4;

  const submitReview = () => {
    if (!reviewer.trim() || totalScore === 0) return;
    const entry: ReviewEntry = {
      id: `rev-${Date.now()}` as any,
      reviewer: reviewer.trim(),
      scores: criteria.map(c => ({ ...c })),
      total: totalScore,
      comment: comment.trim(),
    };
    setReviews(prev => [...prev, entry]);
    setReviewer('');
    setCriteria(DEFAULT_CRITERIA.map(c => ({ ...c })));
    setComment('');
  };

  const renderStars = (score: number, onChange: (s: number) => void) => (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4].map(n => (
        <button
          key={n}
          onClick={() => onChange(n === score ? 0 : n)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
          aria-label={`Score ${n}`}
        >
          <Star style={{ width: 14, height: 14, color: n <= score ? '#f59e0b' : '#d1d5db', fill: n <= score ? '#f59e0b' : 'none' }} />
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ position: 'absolute', top: 50, right: 16, zIndex: 1001, display: 'flex', flexDirection: 'column', gap: 4, padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.1)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: 260, maxHeight: 480, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Peer Review</span>
        <button onClick={() => store.togglePeerReview()} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X style={{ width: 14, height: 14 }} /></button>
      </div>

      {/* Reviewer name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e7eb', marginBottom: 6 }}>
        <Users style={{ width: 14, height: 14, color: '#8b5cf6', flexShrink: 0 }} />
        <input
          value={reviewer}
          onChange={e => setReviewer(e.target.value)}
          placeholder='Reviewer name...'
          style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 12, outline: 'none', color: '#374151' }}
        />
      </div>

      {/* Rubric criteria */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Rubric Criteria</span>
        {criteria.map((c, i) => (
          <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', borderRadius: 6, background: '#f9fafb', border: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: 11, color: '#374151', fontWeight: 500 }}>{c.name}</span>
            {renderStars(c.score, (s) => updateScore(i, s))}
          </div>
        ))}
      </div>

      {/* Total score */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', borderRadius: 6, background: '#fef3c7', border: '1px solid #fde68a', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#92400e' }}>Total Score</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>{totalScore} / {maxScore}</span>
      </div>

      {/* Comments */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <MessageSquare style={{ width: 12, height: 12, color: '#8b5cf6' }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Comments</span>
        </div>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder='Write your feedback...'
          rows={2}
          style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 11, outline: 'none', color: '#374151', resize: 'vertical', fontFamily: 'inherit' }}
        />
      </div>

      {/* Submit */}
      <button
        onClick={submitReview}
        disabled={!reviewer.trim() || totalScore === 0}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '7px 0', borderRadius: 8, border: 'none', background: reviewer.trim() && totalScore > 0 ? '#8b5cf6' : '#d1d5db', color: '#fff', fontSize: 12, fontWeight: 600, cursor: reviewer.trim() && totalScore > 0 ? 'pointer' : 'not-allowed', transition: 'background 0.15s', marginBottom: 8 }}
      >
        <Send style={{ width: 12, height: 12 }} /> Submit Review
      </button>

      {/* Review history */}
      {reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '8px 0', color: '#9ca3af', fontSize: 10 }}>No reviews submitted yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Review History</span>
          {reviews.map(r => (
            <div key={r.id} style={{ padding: '6px 8px', borderRadius: 8, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{r.reviewer}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6' }}>{r.total}/{r.scores.length * 4}</span>
              </div>
              {r.comment && <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2, lineHeight: 1.3 }}>&quot;{r.comment}&quot;</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
