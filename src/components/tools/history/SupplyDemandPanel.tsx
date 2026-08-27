'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface Props {
  editor?: unknown;
}

export default function SupplyDemandPanel({ editor }: Props) {
  const store = useAppStore();
  const [price, setPrice] = useState(50);
  const [quantity, setQuantity] = useState(50);
  const [demandShift, setDemandShift] = useState(0);
  const [supplyShift, setSupplyShift] = useState(0);
  const [showEquilibrium, setShowEquilibrium] = useState(true);

  if (!store.room.supplyDemandOpen) return null;

  // Simple equilibrium calculation
  const eqPrice = Math.round(50 + (supplyShift - demandShift) * 0.5);
  const eqQuantity = Math.round(50 + (demandShift + supplyShift) * 0.25);
  const clampedEqPrice = Math.max(1, Math.min(100, eqPrice));
  const clampedEqQuantity = Math.max(1, Math.min(100, eqQuantity));

  // Determine surplus/shortage
  let marketStatus: 'equilibrium' | 'surplus' | 'shortage' = 'equilibrium';
  let statusDetail = '';
  if (price > clampedEqPrice) {
    marketStatus = 'surplus';
    statusDetail = `Price is above equilibrium — quantity supplied exceeds quantity demanded`;
  } else if (price < clampedEqPrice) {
    marketStatus = 'shortage';
    statusDetail = `Price is below equilibrium — quantity demanded exceeds quantity supplied`;
  } else {
    statusDetail = `Market is in equilibrium at P=${clampedEqPrice}, Q=${clampedEqQuantity}`;
  }

  // SVG curve path helper
  const demandY = (x: number) => 90 - (x + demandShift) * 0.8;
  const supplyY = (x: number) => 10 + (x + supplyShift) * 0.8;

  const statusColor = marketStatus === 'surplus' ? '#059669' : marketStatus === 'shortage' ? '#dc2626' : '#7c3aed';
  const statusBg = marketStatus === 'surplus' ? '#d1fae5' : marketStatus === 'shortage' ? '#fee2e2' : '#f5f3ff';
  const statusLabel = marketStatus === 'surplus' ? 'SURPLUS' : marketStatus === 'shortage' ? 'SHORTAGE' : 'EQUILIBRIUM';

  const sliderStyle: React.CSSProperties = {
    width: '100%',
    height: 4,
    appearance: 'none' as React.CSSProperties['appearance'],
    background: '#e5e7eb',
    borderRadius: 2,
    outline: 'none',
    cursor: 'pointer',
  };

  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 500, color: '#374151', display: 'flex', alignItems: 'center', gap: 4 };
  const valueStyle: React.CSSProperties = { fontSize: 10, color: '#6b7280', marginLeft: 'auto' };

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
          <TrendingUp style={{ width: 14, height: 14 }} />
          Supply & Demand
        </span>
        <button
          onClick={() => store.toggleSupplyDemand()}
          style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      {/* Chart Area */}
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: 140, background: '#fafafa', borderRadius: 8, border: '1px solid rgba(0,0,0,0.06)' }}>
        {/* Axes */}
        <line x1="5" y1="95" x2="95" y2="95" stroke="#d1d5db" strokeWidth="0.5" />
        <line x1="5" y1="5" x2="5" y2="95" stroke="#d1d5db" strokeWidth="0.5" />
        <text x="95" y="99" fontSize="4" fill="#9ca3af" textAnchor="end">Q</text>
        <text x="2" y="8" fontSize="4" fill="#9ca3af">P</text>

        {/* Demand curve */}
        <polyline
          points={Array.from({ length: 20 }, (_, i) => {
            const x = 5 + i * 4.5;
            return `${x},${Math.max(5, Math.min(95, demandY(i * 5)))}`;
          }).join(' ')}
          fill="none"
          stroke="#dc2626"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <text x="82" y={Math.max(8, Math.min(92, demandY(85))) - 2} fontSize="4" fill="#dc2626">D</text>

        {/* Supply curve */}
        <polyline
          points={Array.from({ length: 20 }, (_, i) => {
            const x = 5 + i * 4.5;
            return `${x},${Math.max(5, Math.min(95, supplyY(i * 5)))}`;
          }).join(' ')}
          fill="none"
          stroke="#059669"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <text x="82" y={Math.max(8, Math.min(92, supplyY(85))) + 5} fontSize="4" fill="#059669">S</text>

        {/* Equilibrium point */}
        {showEquilibrium && (
          <>
            <line x1="5" y1={clampedEqPrice * 0.9} x2="50" y2={clampedEqPrice * 0.9} stroke="#7c3aed" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="50" y1="95" x2="50" y2={clampedEqPrice * 0.9} stroke="#7c3aed" strokeWidth="0.5" strokeDasharray="2 2" />
            <circle cx="50" cy={clampedEqPrice * 0.9} r="2" fill="#7c3aed" />
            <text x="53" y={clampedEqPrice * 0.9 - 2} fontSize="3.5" fill="#7c3aed">E</text>
          </>
        )}
      </svg>

      {/* Price Slider */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={labelStyle}><DollarSign style={{ width: 12, height: 12 }} /> Price</span>
          <span style={valueStyle}>${price}</span>
        </div>
        <input type="range" min={1} max={100} value={price} onChange={(e) => setPrice(Number(e.target.value))} style={sliderStyle} />
      </div>

      {/* Quantity Slider */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={labelStyle}><TrendingUp style={{ width: 12, height: 12 }} /> Quantity</span>
          <span style={valueStyle}>{quantity}</span>
        </div>
        <input type="range" min={1} max={100} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} style={sliderStyle} />
      </div>

      {/* Demand Shift Slider */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={labelStyle}><TrendingDown style={{ width: 12, height: 12, color: '#dc2626' }} /> Demand Shift</span>
          <span style={valueStyle}>{demandShift > 0 ? `+${demandShift}` : demandShift}</span>
        </div>
        <input type="range" min={-30} max={30} value={demandShift} onChange={(e) => setDemandShift(Number(e.target.value))} style={sliderStyle} />
      </div>

      {/* Supply Shift Slider */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={labelStyle}><TrendingUp style={{ width: 12, height: 12, color: '#059669' }} /> Supply Shift</span>
          <span style={valueStyle}>{supplyShift > 0 ? `+${supplyShift}` : supplyShift}</span>
        </div>
        <input type="range" min={-30} max={30} value={supplyShift} onChange={(e) => setSupplyShift(Number(e.target.value))} style={sliderStyle} />
      </div>

      {/* Show Equilibrium Checkbox */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#374151', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={showEquilibrium}
          onChange={(e) => setShowEquilibrium(e.target.checked)}
          style={{ width: 14, height: 14, accentColor: '#7c3aed' }}
        />
        Show Equilibrium
      </label>

      {/* Equilibrium Display */}
      {showEquilibrium && (
        <div
          style={{
            padding: '8px 10px',
            background: '#f5f3ff',
            borderRadius: 8,
            border: '1px solid #ede9fe',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#7c3aed', fontWeight: 600 }}>EQ. PRICE</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#7c3aed' }}>${clampedEqPrice}</div>
          </div>
          <div style={{ width: 1, background: '#ede9fe' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#7c3aed', fontWeight: 600 }}>EQ. QUANTITY</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#7c3aed' }}>{clampedEqQuantity}</div>
          </div>
        </div>
      )}

      {/* Surplus/Shortage Indicator */}
      <div
        style={{
          padding: '6px 10px',
          background: statusBg,
          borderRadius: 8,
          border: `1px solid ${statusColor}22`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: statusColor }}>{statusLabel}</span>
        </div>
        <p style={{ fontSize: 10, color: '#4b5563', marginTop: 2, lineHeight: 1.4 }}>{statusDetail}</p>
      </div>
    </div>
  );
}
