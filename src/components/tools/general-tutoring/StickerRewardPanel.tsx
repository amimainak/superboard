'use client';
import React, { useState, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, Star, Award, Gift, Trophy } from 'lucide-react';

interface Props {
  editor?: unknown;
}

interface Sticker {
  emoji: string;
  label: string;
}

interface RewardEntry {
  id: string;
  student: string;
  sticker: Sticker;
  timestamp: string;
}

const CATEGORIES: { id: string; name: string; icon: React.ReactNode; stickers: Sticker[] }[] = [
  {
    id: 'stars',
    name: 'Stars',
    icon: <Star style={{ width: 12, height: 12, color: '#f59e0b' }} />,
    stickers: [
      { emoji: '⭐', label: 'Gold Star' },
      { emoji: '🌟', label: 'Shining Star' },
      { emoji: '✨', label: 'Sparkles' },
      { emoji: '💫', label: 'Dizzy Star' },
      { emoji: '🌠', label: 'Shooting Star' },
      { emoji: '🌟', label: 'Glow Star' },
    ],
  },
  {
    id: 'achievement',
    name: 'Achievement',
    icon: <Award style={{ width: 12, height: 12, color: '#059669' }} />,
    stickers: [
      { emoji: '🏆', label: 'Trophy' },
      { emoji: '🥇', label: '1st Place' },
      { emoji: '🥈', label: '2nd Place' },
      { emoji: '🥉', label: '3rd Place' },
      { emoji: '🎖️', label: 'Medal' },
      { emoji: '🏅', label: 'Sports Medal' },
    ],
  },
  {
    id: 'subject',
    name: 'Subject',
    icon: <Gift style={{ width: 12, height: 12, color: '#7c3aed' }} />,
    stickers: [
      { emoji: '📐', label: 'Math Pro' },
      { emoji: '🔬', label: 'Science Star' },
      { emoji: '📚', label: 'Bookworm' },
      { emoji: '🌍', label: 'Geo Whiz' },
      { emoji: '🎨', label: 'Creative' },
      { emoji: '💻', label: 'Tech Guru' },
    ],
  },
  {
    id: 'fun',
    name: 'Fun',
    icon: <Trophy style={{ width: 12, height: 12, color: '#ec4899' }} />,
    stickers: [
      { emoji: '🎉', label: 'Celebrate' },
      { emoji: '👏', label: 'Great Job' },
      { emoji: '🦉', label: 'Wise Owl' },
      { emoji: '🚀', label: 'Rocket' },
      { emoji: '🌈', label: 'Rainbow' },
      { emoji: '🎯', label: 'Bullseye' },
    ],
  },
];

export default function StickerRewardPanel({ editor }: Props) {
  const store = useAppStore();
  const [activeCategory, setActiveCategory] = useState('stars');
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null);
  const [studentName, setStudentName] = useState('');
  const [rewardHistory, setRewardHistory] = useState<RewardEntry[]>([]);

  const currentCategory = CATEGORIES.find((c) => c.id === activeCategory);

  const handleAward = useCallback(() => {
    if (!selectedSticker || !studentName.trim()) return;
    const entry: RewardEntry = {
      id: `reward-${Date.now()}` as any,
      student: studentName.trim(),
      sticker: selectedSticker,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    setRewardHistory((prev) => [entry, ...prev]);
    setSelectedSticker(null);
  }, [selectedSticker, studentName]);

  const totalStickers = rewardHistory.length;

  if (!store.room.stickerRewardOpen) return null;

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
        minWidth: 260,
        maxHeight: 480,
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Trophy style={{ width: 14, height: 14 }} />
          Sticker Rewards
        </span>
        <button
          onClick={() => store.toggleStickerReward()}
          style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      {/* Total Stickers Count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#fffbeb', borderRadius: 6, border: '1px solid #fde68a' }}>
        <span style={{ fontSize: 11, color: '#92400e', fontWeight: 500 }}>Total Stickers Awarded</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>{totalStickers}</span>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 2 }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              flex: 1,
              padding: '5px 4px',
              borderRadius: 6,
              border: activeCategory === cat.id ? '1px solid #7c3aed' : '1px solid transparent',
              background: activeCategory === cat.id ? '#f5f3ff' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              transition: 'all 0.15s',
            }}
          >
            {cat.icon}
            <span style={{ fontSize: 9, color: activeCategory === cat.id ? '#7c3aed' : '#6b7280', fontWeight: activeCategory === cat.id ? 600 : 400 }}>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Sticker Grid */}
      {currentCategory && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
          {currentCategory.stickers.map((sticker, i) => (
            <button
              key={`${activeCategory}-${i}`}
              onClick={() => setSelectedSticker(selectedSticker?.label === sticker.label ? null : sticker)}
              style={{
                padding: '6px 4px',
                borderRadius: 8,
                border: selectedSticker?.label === sticker.label ? '1.5px solid #7c3aed' : '1px solid rgba(0,0,0,0.06)',
                background: selectedSticker?.label === sticker.label ? '#f5f3ff' : '#fafafa',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 22 }}>{sticker.emoji}</span>
              <span style={{ fontSize: 8, color: '#6b7280', fontWeight: 500 }}>{sticker.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Student Name */}
      <input
        type="text"
        value={studentName}
        onChange={(e) => setStudentName(e.target.value)}
        placeholder="Student name..."
        style={{
          padding: '6px 10px',
          borderRadius: 6,
          border: '1px solid rgba(0,0,0,0.1)',
          fontSize: 12,
          outline: 'none',
        }}
      />

      {/* Award Button */}
      <button
        onClick={handleAward}
        disabled={!selectedSticker || !studentName.trim()}
        style={{
          padding: '7px 10px',
          borderRadius: 6,
          border: 'none',
          background: (!selectedSticker || !studentName.trim()) ? '#e5e7eb' : '#7c3aed',
          color: '#fff',
          fontSize: 12,
          fontWeight: 600,
          cursor: (!selectedSticker || !studentName.trim()) ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <Award style={{ width: 12, height: 12 }} />
        Award Sticker
      </button>

      {/* Reward History */}
      {rewardHistory.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 11, fontWeight: 500, color: '#6b7280' }}>Reward History</span>
          <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {rewardHistory.map((entry) => (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 8px',
                  borderRadius: 6,
                  background: '#fafafa',
                  border: '1px solid rgba(0,0,0,0.04)',
                }}
              >
                <span style={{ fontSize: 16 }}>{entry.sticker.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#374151' }}>{entry.student}</div>
                  <div style={{ fontSize: 9, color: '#9ca3af' }}>{entry.sticker.label}</div>
                </div>
                <span style={{ fontSize: 9, color: '#9ca3af', flexShrink: 0 }}>{entry.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
