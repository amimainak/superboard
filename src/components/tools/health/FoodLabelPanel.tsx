'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, Apple, UtensilsCrossed, BarChart3 } from 'lucide-react';

interface Props {
  editor?: unknown;
}

interface NutritionData {
  servingSize: string;
  calories: number;
  totalFat: number;
  carbs: number;
  protein: number;
  sodium: number;
}

const DAILY_VALUES: Record<string, number> = {
  totalFat: 78,
  carbs: 275,
  protein: 50,
  sodium: 2300,
};

const QUIZ_QUESTIONS = [
  { q: 'What nutrient should you limit for heart health?', a: 'Sodium and Total Fat' },
  { q: 'How many calories are in a gram of protein?', a: '4 calories' },
  { q: 'What % daily value of sodium is considered high?', a: '20% or more per serving' },
  { q: 'Which nutrient helps build muscle?', a: 'Protein' },
  { q: 'What is the recommended daily fiber intake?', a: '25-30 grams' },
];

export default function FoodLabelPanel({ editor }: Props) {
  const store = useAppStore();
  const isOpen = store.room.foodLabelOpen;
  const toggle = store.toggleFoodLabel;

  const [data, setData] = useState<NutritionData>({
    servingSize: '1 cup (240ml)',
    calories: 200,
    totalFat: 8,
    carbs: 32,
    protein: 12,
    sodium: 450,
  });
  const [quizMode, setQuizMode] = useState(false);
  const [showAnswer, setShowAnswer] = useState<number | null>(null);

  const update = (field: keyof NutritionData, value: string | number) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const pct = (value: number, dv: number) => Math.min(100, Math.round((value / dv) * 100));
  const barColor = (p: number) => (p > 20 ? '#ef4444' : p > 10 ? '#f59e0b' : '#22c55e');

  if (!isOpen) return null;

  const inputStyle: React.CSSProperties = { padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.15)', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { fontSize: 10, color: '#6b7280', marginBottom: 2, display: 'block' };

  return (
    <div style={{ position: 'absolute', top: 50, right: 16, zIndex: 1001, width: 320, maxHeight: 'calc(100vh - 60px)', overflowY: 'auto', borderRadius: 12, background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.1)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px 0 12px' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Apple style={{ width: 14, height: 14, color: '#ef4444' }} />
          Food Label Reader
        </span>
        <button onClick={toggle} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      <div style={{ padding: '8px 12px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setQuizMode(false)} style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.1)', background: !quizMode ? '#ef4444' : 'white', color: !quizMode ? 'white' : '#374151', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <UtensilsCrossed style={{ width: 12, height: 12 }} /> Label View
          </button>
          <button onClick={() => setQuizMode(true)} style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.1)', background: quizMode ? '#ef4444' : 'white', color: quizMode ? 'white' : '#374151', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <BarChart3 style={{ width: 12, height: 12 }} /> Quiz Mode
          </button>
        </div>

        {!quizMode ? (
          <>
            <div>
              <label style={labelStyle}>Serving Size</label>
              <input value={data.servingSize} onChange={(e) => update('servingSize', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Calories</label>
              <input type="number" value={data.calories} onChange={(e) => update('calories', parseFloat(e.target.value) || 0)} style={inputStyle} min={0} />
            </div>
            {(['totalFat', 'carbs', 'protein', 'sodium'] as const).map((nutrient) => {
              const dv = DAILY_VALUES[nutrient];
              const percentage = pct(data[nutrient], dv);
              const labels: Record<string, string> = { totalFat: 'Total Fat (g)', carbs: 'Total Carbs (g)', protein: 'Protein (g)', sodium: 'Sodium (mg)' };
              return (
                <div key={nutrient}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={labelStyle}>{labels[nutrient]}</label>
                    <span style={{ fontSize: 10, fontWeight: 600, color: barColor(percentage) }}>{percentage}% DV</span>
                  </div>
                  <input type="number" value={data[nutrient]} onChange={(e) => update(nutrient, parseFloat(e.target.value) || 0)} style={inputStyle} min={0} />
                  <div style={{ width: '100%', height: 6, background: '#f3f4f6', borderRadius: 3, marginTop: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${percentage}%`, height: '100%', background: barColor(percentage), borderRadius: 3, transition: 'width 0.3s' }} />
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {QUIZ_QUESTIONS.map((item, i) => (
              <div key={i} style={{ padding: '8px', borderRadius: 8, background: '#fef2f2', border: '1px solid rgba(239,68,68,0.15)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#1f2937' }}>{item.q}</div>
                <button onClick={() => setShowAnswer(showAnswer === i ? null : i)} style={{ marginTop: 6, padding: '4px 10px', borderRadius: 4, border: 'none', background: showAnswer === i ? '#ef4444' : 'white', color: showAnswer === i ? 'white' : '#ef4444', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
                  {showAnswer === i ? 'Hide Answer' : 'Show Answer'}
                </button>
                {showAnswer === i && (
                  <div style={{ marginTop: 6, fontSize: 11, color: '#16a34a', fontWeight: 500 }}>{item.a}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
