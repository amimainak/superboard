'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, Trophy, Users, Move, Square } from 'lucide-react';

interface Props {
  editor?: unknown;
}

type FieldType = 'basketball' | 'soccer' | 'football' | 'volleyball' | 'tennis';

interface Player {
  id: string;
  x: number;
  y: number;
  color: string;
  label: string;
}

const FIELD_CONFIGS: Record<FieldType, { width: number; height: number; bgColor: string; lineColor: string; label: string }> = {
  basketball: { width: 280, height: 300, bgColor: '#c2772e', lineColor: '#fff', label: 'Basketball' },
  soccer: { width: 320, height: 220, bgColor: '#1a7a3a', lineColor: '#fff', label: 'Soccer' },
  football: { width: 320, height: 200, bgColor: '#2d6a2e', lineColor: '#fff', label: 'Football' },
  volleyball: { width: 280, height: 300, bgColor: '#d4a843', lineColor: '#fff', label: 'Volleyball' },
  tennis: { width: 260, height: 320, bgColor: '#2563eb', lineColor: '#fff', label: 'Tennis' },
};

const TEAM_COLORS = ['#ef4444', '#3b82f6'];

export default function SportsPlayPanel({ editor }: Props) {
  const store = useAppStore();
  const isOpen = store.room.sportsPlayOpen;
  const toggle = store.toggleSportsPlay;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [fieldType, setFieldType] = useState<FieldType>('basketball');
  const [players, setPlayers] = useState<Player[]>([
    { id: 'p1', x: 60, y: 150, color: TEAM_COLORS[0], label: '1' },
    { id: 'p2', x: 100, y: 100, color: TEAM_COLORS[0], label: '2' },
    { id: 'p3', x: 200, y: 150, color: TEAM_COLORS[1], label: '3' },
  { id: 'p4', x: 240, y: 100, color: TEAM_COLORS[1], label: '4' },
  ]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [arrows, setArrows] = useState<{ from: Player; to: Player }[]>([]);
  const [drawArrow, setDrawArrow] = useState(false);
  const [arrowStart, setArrowStart] = useState<string | null>(null);

  const config = FIELD_CONFIGS[fieldType];

  const drawField = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, 320, 340);
    const ox = (320 - config.width) / 2;
    const oy = (340 - config.height) / 2;

    // Background
    ctx.fillStyle = config.bgColor;
    ctx.fillRect(ox, oy, config.width, config.height);

    ctx.strokeStyle = config.lineColor;
    ctx.lineWidth = 2;

    // Outer border
    ctx.strokeRect(ox, oy, config.width, config.height);

    if (fieldType === 'basketball') {
      // Center line
      ctx.beginPath();
      ctx.moveTo(ox + config.width / 2, oy);
      ctx.lineTo(ox + config.width / 2, oy + config.height);
      ctx.stroke();
      // Center circle
      ctx.beginPath();
      ctx.arc(ox + config.width / 2, oy + config.height / 2, 40, 0, Math.PI * 2);
      ctx.stroke();
      // Boxes
      ctx.strokeRect(ox, oy + config.height / 2 - 40, 50, 80);
      ctx.strokeRect(ox + config.width - 50, oy + config.height / 2 - 40, 50, 80);
    } else if (fieldType === 'soccer') {
      ctx.beginPath();
      ctx.moveTo(ox + config.width / 2, oy);
      ctx.lineTo(ox + config.width / 2, oy + config.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ox + config.width / 2, oy + config.height / 2, 35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeRect(ox, oy + config.height / 2 - 45, 55, 90);
      ctx.strokeRect(ox + config.width - 55, oy + config.height / 2 - 45, 55, 90);
    } else if (fieldType === 'football') {
      // Yard lines
      for (let i = 1; i < 10; i++) {
        const lx = ox + (config.width / 10) * i;
        ctx.beginPath();
        ctx.moveTo(lx, oy);
        ctx.lineTo(lx, oy + config.height);
        ctx.stroke();
      }
      ctx.strokeRect(ox + config.width / 2 - 15, oy + config.height / 2 - 25, 30, 50);
    } else if (fieldType === 'volleyball') {
      ctx.beginPath();
      ctx.moveTo(ox, oy + config.height / 2);
      ctx.lineTo(ox + config.width, oy + config.height / 2);
      ctx.stroke();
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(ox + config.width / 2, oy + config.height / 2, 40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (fieldType === 'tennis') {
      ctx.beginPath();
      ctx.moveTo(ox, oy + config.height / 2);
      ctx.lineTo(ox + config.width, oy + config.height / 2);
      ctx.stroke();
      ctx.strokeRect(ox + 30, oy + 20, config.width - 60, config.height / 2 - 20);
      ctx.strokeRect(ox + 30, oy + config.height / 2, config.width - 60, config.height / 2 - 20);
    }
  }, [fieldType, config]);

  const drawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawField(ctx);

    // Draw arrows
    arrows.forEach((arrow) => {
      const dx = arrow.to.x - arrow.from.x;
      const dy = arrow.to.y - arrow.from.y;
      const angle = Math.atan2(dy, dx);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(arrow.from.x, arrow.from.y);
      ctx.lineTo(arrow.to.x, arrow.to.y);
      ctx.stroke();
      // Arrowhead
      ctx.beginPath();
      ctx.moveTo(arrow.to.x, arrow.to.y);
      ctx.lineTo(arrow.to.x - 10 * Math.cos(angle - 0.4), arrow.to.y - 10 * Math.sin(angle - 0.4));
      ctx.moveTo(arrow.to.x, arrow.to.y);
      ctx.lineTo(arrow.to.x - 10 * Math.cos(angle + 0.4), arrow.to.y - 10 * Math.sin(angle + 0.4));
      ctx.stroke();
    });

    // Draw players
    players.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.label, p.x, p.y);
    });
  }, [drawField, arrows, players]);

  React.useEffect(() => { drawAll(); }, [drawAll]);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (drawArrow) {
      const clicked = players.find((p) => Math.hypot(p.x - mx, p.y - my) <= 14);
      if (clicked) {
        if (!arrowStart) {
          setArrowStart(clicked.id);
        } else if (clicked.id !== arrowStart) {
          const from = players.find((p) => p.id === arrowStart);
          if (from) setArrows((prev) => [...prev, { from, to: clicked }]);
          setArrowStart(null);
        }
      }
      return;
    }

    const clicked = players.find((p) => Math.hypot(p.x - mx, p.y - my) <= 14);
    if (clicked) {
      setDragging(clicked.id);
      setDragOffset({ x: mx - clicked.x, y: my - clicked.y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setPlayers((prev) => prev.map((p) => (p.id === dragging ? { ...p, x: mx - dragOffset.x, y: my - dragOffset.y } : p)));
  };

  const handleCanvasMouseUp = () => {
    setDragging(null);
  };

  const addPlayer = () => {
    const team = players.length % 2;
    const ox = (320 - config.width) / 2;
    const oy = (340 - config.height) / 2;
    setPlayers((prev) => [
      ...prev,
      { id: `p${Date.now()}` as any, x: ox + config.width / 2, y: oy + config.height / 2, color: TEAM_COLORS[team], label: String(prev.length + 1) },
    ]);
  };

  const removePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setArrows((prev) => prev.filter((a) => a.from.id !== id && a.to.id !== id));
  };

  const clearArrows = () => setArrows([]);

  if (!isOpen) return null;

  const fieldBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.1)', background: active ? '#16a34a' : 'white',
    color: active ? 'white' : '#374151', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
  });

  const iconBtnStyle = (active: boolean, color?: string): React.CSSProperties => ({
    padding: '5px 8px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.1)', background: active ? (color || '#6366f1') : 'white',
    color: active ? 'white' : '#374151', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s',
  });

  return (
    <div style={{ position: 'absolute', top: 50, right: 16, zIndex: 1001, width: 340, maxHeight: 'calc(100vh - 60px)', overflowY: 'auto', borderRadius: 12, background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.1)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px 0 12px' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Trophy style={{ width: 14, height: 14, color: '#16a34a' }} />
          Sports Play Diagrammer
        </span>
        <button onClick={toggle} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      <div style={{ padding: '8px 12px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Field selector */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {Object.entries(FIELD_CONFIGS).map(([key, cfg]) => (
            <button key={key} onClick={() => setFieldType(key as FieldType)} style={fieldBtnStyle(fieldType === key)}>
              {cfg.label}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button onClick={addPlayer} style={iconBtnStyle(false, '#16a34a')} onMouseEnter={(e) => { if (!(e.currentTarget as HTMLElement).dataset.active) (e.currentTarget as HTMLElement).style.background = '#f0fdf4'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'white'; }}>
            <Users style={{ width: 12, height: 12 }} /> Add Player
          </button>
          <button onClick={() => { setDrawArrow(!drawArrow); setArrowStart(null); }} style={iconBtnStyle(drawArrow, '#f59e0b')}>
            <Move style={{ width: 12, height: 12 }} /> {drawArrow ? 'Cancel' : 'Arrow'}
          </button>
          <button onClick={clearArrows} style={iconBtnStyle(false)}>
            <Square style={{ width: 12, height: 12 }} /> Clear
          </button>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={320}
          height={340}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          style={{ borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', cursor: dragging ? 'grabbing' : drawArrow ? 'crosshair' : 'grab', display: 'block', margin: '0 auto', background: '#f9fafb' }}
        />

        {drawArrow && (
          <div style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center' }}>Click two players to draw a movement arrow</div>
        )}

        {/* Player list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {players.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 6, background: '#f9fafb', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 500, flex: 1 }}>Player {p.label}</span>
              <span style={{ fontSize: 9, color: '#9ca3af' }}>({Math.round(p.x)}, {Math.round(p.y)})</span>
              <button onClick={() => removePlayer(p.id)} style={{ width: 20, height: 20, borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', fontSize: 10 }}>x</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
