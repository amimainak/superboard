'use client';
import React, { useState, useRef, useCallback, useMemo } from 'react';

/* ------------------------------------------------------------------
   ShapeBuilderPanel – 2D shape builder for K-5 geometry
   • Toolbar: triangle, rectangle, square, circle, pentagon, hexagon
   • Click toolbar then click canvas to place
   • Drag shapes to reposition
   • Toggle dimensions & angle labels
   • Pastel, kid-friendly UI
   ------------------------------------------------------------------ */

// ---------- types ----------
type ShapeType = 'triangle' | 'rectangle' | 'square' | 'circle' | 'pentagon' | 'hexagon';

interface PlacedShape {
  id: number;
  type: ShapeType;
  x: number;
  y: number;
}

// ---------- shape metadata ----------
const SHAPE_META: Record<ShapeType, { name: string; sides: number; perimeter: string; color: string; stroke: string }> = {
  triangle:  { name: 'Triangle',  sides: 3, perimeter: 'a + b + c', color: '#fca5a5', stroke: '#ef4444' },
  rectangle: { name: 'Rectangle', sides: 4, perimeter: '2(l + w)', color: '#93c5fd', stroke: '#3b82f6' },
  square:    { name: 'Square',    sides: 4, perimeter: '4s',         color: '#86efac', stroke: '#22c55e' },
  circle:    { name: 'Circle',    sides: 0, perimeter: '2πr',        color: '#fde68a', stroke: '#eab308' },
  pentagon:  { name: 'Pentagon',  sides: 5, perimeter: '5s',         color: '#c4b5fd', stroke: '#8b5cf6' },
  hexagon:   { name: 'Hexagon',   sides: 6, perimeter: '6s',         color: '#fdba74', stroke: '#f97316' },
};

const SHAPE_TYPES: ShapeType[] = ['triangle', 'rectangle', 'square', 'circle', 'pentagon', 'hexagon'];

// Small SVG icons for toolbar buttons
function ShapeIcon({ type, size = 22 }: { type: ShapeType; size?: number }) {
  const m = SHAPE_META[type];
  const r = size * 0.4;
  const cx = size / 2, cy = size / 2;
  if (type === 'circle') {
    return <circle cx={cx} cy={cy} r={r} fill={m.color} stroke={m.stroke} strokeWidth={1.5} />;
  }
  if (type === 'rectangle') {
    return <rect x={cx - r} y={cy - r * 0.6} width={r * 2} height={r * 1.2} fill={m.color} stroke={m.stroke} strokeWidth={1.5} rx={2} />;
  }
  const n = type === 'square' ? 4 : type === 'pentagon' ? 5 : type === 'hexagon' ? 6 : 3;
  const verts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n - Math.PI / 2;
    verts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return <polygon points={verts.join(' ')} fill={m.color} stroke={m.stroke} strokeWidth={1.5} />;
}

// Generate regular polygon vertices
function polyVerts(n: number, cx: number, cy: number, r: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n - Math.PI / 2;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}

// Interior angle of a regular n-gon in degrees
function interiorAngle(n: number): number {
  return ((n - 2) * 180) / n;
}

// ---------- Canvas constants ----------
const CVS_W = 600;
const CVS_H = 340;
const SHAPE_R = 42; // base radius for regular polygons

export function ShapeBuilderPanel({ isDark }: { isDark: boolean }) {
  // Theme
  const bg = isDark ? '#0f172a' : '#ffffff';
  const text = isDark ? '#e2e8f0' : '#1e293b';
  const muted = isDark ? '#64748b' : '#94a3b8';
  const cardBg = isDark ? '#1e293b' : '#f8fafc';
  const border = isDark ? '#334155' : '#e2e8f0';

  // State
  const [shapes, setShapes] = useState<PlacedShape[]>([]);
  const [activeTool, setActiveTool] = useState<ShapeType | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showDims, setShowDims] = useState(false);
  const [showAngles, setShowAngles] = useState(false);
  const [dragging, setDragging] = useState<{ id: number; offX: number; offY: number } | null>(null);
  const idRef = useRef(0);
  const svgRef = useRef<SVGSVGElement>(null);

  // ---- Coordinate conversion ----
  const toSvg = useCallback((e: React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: ((e.clientX - rect.left) / rect.width) * CVS_W, y: ((e.clientY - rect.top) / rect.height) * CVS_H };
  }, []);

  // ---- Place a shape on canvas click ----
  const handleCanvasDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    // If dragging, ignore
    if (dragging) return;
    const { x, y } = toSvg(e);
    // Check if clicking on an existing shape
    const clicked = [...shapes].reverse().find((s) => {
      const dx = s.x - x, dy = s.y - y;
      return Math.sqrt(dx * dx + dy * dy) < SHAPE_R + 10;
    });
    if (clicked) {
      setSelectedId(clicked.id);
      setDragging({ id: clicked.id, offX: clicked.x - x, offY: clicked.y - y });
      setActiveTool(null);
      return;
    }
    // Place new shape if tool selected
    if (activeTool) {
      idRef.current += 1;
      setShapes((prev) => [...prev, { id: idRef.current, type: activeTool, x, y }]);
      setSelectedId(idRef.current);
    }
  }, [activeTool, dragging, shapes, toSvg]);

  // ---- Drag move ----
  const handleCanvasMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging) return;
    const { x, y } = toSvg(e);
    const nx = Math.max(SHAPE_R, Math.min(CVS_W - SHAPE_R, x + dragging.offX));
    const ny = Math.max(SHAPE_R, Math.min(CVS_H - SHAPE_R, y + dragging.offY));
    setShapes((prev) => prev.map((s) => s.id === dragging.id ? { ...s, x: nx, y: ny } : s));
  }, [dragging, toSvg]);

  const handleCanvasUp = useCallback(() => setDragging(null), []);

  // ---- Delete selected ----
  const deleteSelected = useCallback(() => {
    if (selectedId === null) return;
    setShapes((prev) => prev.filter((s) => s.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  // ---- Render a placed shape ----
  const renderShape = useCallback((s: PlacedShape) => {
    const meta = SHAPE_META[s.type];
    const isSelected = selectedId === s.id;
    const n = s.type === 'triangle' ? 3 : s.type === 'square' ? 4 : s.type === 'pentagon' ? 5 : s.type === 'hexagon' ? 6 : 0;

    // Selection glow
    const filter = isSelected ? 'drop-shadow(0 0 6px rgba(59,130,246,0.6))' : 'none';

    const shapeEl = (() => {
      if (s.type === 'circle') {
        return <circle cx={s.x} cy={s.y} r={SHAPE_R} fill={meta.color} stroke={meta.stroke} strokeWidth={2.5} />;
      }
      if (s.type === 'rectangle') {
        return <rect x={s.x - SHAPE_R * 1.2} y={s.y - SHAPE_R * 0.75} width={SHAPE_R * 2.4} height={SHAPE_R * 1.5} rx={3} fill={meta.color} stroke={meta.stroke} strokeWidth={2.5} />;
      }
      if (s.type === 'square') {
        return <rect x={s.x - SHAPE_R} y={s.y - SHAPE_R} width={SHAPE_R * 2} height={SHAPE_R * 2} rx={3} fill={meta.color} stroke={meta.stroke} strokeWidth={2.5} />;
      }
      const verts = polyVerts(n, s.x, s.y, SHAPE_R);
      const pts = verts.map((v) => `${v[0]},${v[1]}`).join(' ');
      return <polygon points={pts} fill={meta.color} stroke={meta.stroke} strokeWidth={2.5} />;
    })();

    // Dimension labels
    let dimsEl: React.ReactNode = null;
    if (showDims) {
      if (s.type === 'circle') {
        // Radius line and label
        dimsEl = <g>
          <line x1={s.x} y1={s.y} x2={s.x + SHAPE_R} y2={s.y} stroke={meta.stroke} strokeWidth={1} strokeDasharray="4 2" />
          <text x={s.x + SHAPE_R / 2} y={s.y - 6} textAnchor="middle" fill={text} fontSize={11} fontWeight={600}>r</text>
        </g>;
      } else if (s.type === 'rectangle') {
        const w = SHAPE_R * 2.4, h = SHAPE_R * 1.5;
        dimsEl = <g>
          <text x={s.x} y={s.y - SHAPE_R * 0.75 - 6} textAnchor="middle" fill={text} fontSize={11} fontWeight={600}>w</text>
          <text x={s.x + SHAPE_R * 1.2 + 10} y={s.y + 4} textAnchor="start" fill={text} fontSize={11} fontWeight={600}>l</text>
        </g>;
      } else if (n > 0) {
        const verts = polyVerts(n, s.x, s.y, SHAPE_R);
        const mids = verts.map((v, i) => {
 const next = verts[(i + 1) % n];
          return [(v[0] + next[0]) / 2, (v[1] + next[1]) / 2];
        });
        // Show "s" label on the first side midpoint only (to avoid clutter)
        dimsEl = <text x={mids[0][0]} y={mids[0][1] - 8} textAnchor="middle" fill={text} fontSize={11} fontWeight={600}>s</text>;
      }
    }

    // Angle labels at vertices
    let angleEl: React.ReactNode = null;
    if (showAngles && n > 2) {
      const angle = interiorAngle(n);
      const verts = polyVerts(n, s.x, s.y, SHAPE_R);
      const labelR = SHAPE_R + 14;
      const verts2 = polyVerts(n, s.x, s.y, labelR);
      angleEl = <g>
        {verts2.map((v, i) => (
          <text key={i} x={v[0]} y={v[1] + 4} textAnchor="middle" fill={isDark ? '#fbbf24' : '#b45309'} fontSize={10} fontWeight={700}>
            {Math.round(angle)}°
          </text>
        ))}
      </g>;
    }

    // Name label below shape
    const nameEl = <text x={s.x} y={s.y + SHAPE_R + 18} textAnchor="middle" fill={text} fontSize={11} fontWeight={600}>{meta.name}</text>;

    return <g key={s.id} style={{ filter, cursor: 'grab' }}>{shapeEl}{dimsEl}{angleEl}{nameEl}</g>;
  }, [selectedId, showDims, showAngles, isDark, text]);

  // Selected shape info
  const selectedShape = useMemo(() => shapes.find((s) => s.id === selectedId), [shapes, selectedId]);

  return (
    <div style={{ background: bg, color: text, padding: 16, borderRadius: 12, fontFamily: 'system-ui, sans-serif', minHeight: 500 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>🔷 Shape Builder</span>
        {selectedShape && (
          <button onClick={deleteSelected} style={{ padding: '3px 12px', borderRadius: 6, fontSize: 12, border: `1px solid #ef4444`, background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>🗑 Delete</button>
        )}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: muted, marginRight: 2 }}>Shapes:</span>
        {SHAPE_TYPES.map((t) => {
          const active = activeTool === t;
          return (
            <button key={t} onClick={() => setActiveTool(active ? null : t)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: `1.5px solid ${active ? SHAPE_META[t].stroke : border}`, background: active ? (isDark ? SHAPE_META[t].stroke + '33' : SHAPE_META[t].color + '66') : cardBg, color: text, cursor: 'pointer', transition: 'all 0.15s' }}>
              <svg width={20} height={20} viewBox="0 0 22 22"><ShapeIcon type={t} size={22} /></svg>
              {SHAPE_META[t].name}
            </button>
          );
        })}
      </div>

      {/* Toggles */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer', color: text }}>
          <input type="checkbox" checked={showDims} onChange={(e) => setShowDims(e.target.checked)} />
          📏 Show Dimensions
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer', color: text }}>
          <input type="checkbox" checked={showAngles} onChange={(e) => setShowAngles(e.target.checked)} />
          📐 Show Angles
        </label>
      </div>

      {/* Canvas */}
      <svg ref={svgRef} width="100%" viewBox={`0 0 ${CVS_W} ${CVS_H}`}
        style={{ background: cardBg, borderRadius: 10, border: `1px solid ${border}`, display: 'block', cursor: activeTool ? 'copy' : 'default', userSelect: 'none' }}
        onMouseDown={handleCanvasDown} onMouseMove={handleCanvasMove} onMouseUp={handleCanvasUp} onMouseLeave={handleCanvasUp}>

        {/* Grid dots for visual guidance */}
        {Array.from({ length: 12 }).map((_, row) =>
          Array.from({ length: 20 }).map((_, col) => (
            <circle key={`${row}-${col}`} cx={col * 30 + 15} cy={row * 30 + 15} r={1} fill={muted} opacity={0.3} />
          ))
        )}

        {shapes.map(renderShape)}

        {/* Empty state hint */}
        {shapes.length === 0 && (
          <text x={CVS_W / 2} y={CVS_H / 2} textAnchor="middle" fill={muted} fontSize={14} fontFamily="system-ui">
            Select a shape above, then click here to place it
          </text>
        )}
      </svg>

      {/* Info panel for selected shape */}
      {selectedShape && (
        <div style={{ marginTop: 10, padding: '8px 14px', borderRadius: 8, background: cardBg, border: `1px solid ${border}`, display: 'flex', gap: 20, fontSize: 13, flexWrap: 'wrap' }}>
          <span><strong>Name:</strong> {SHAPE_META[selectedShape.type].name}</span>
          <span><strong>Sides:</strong> {SHAPE_META[selectedShape.type].sides}</span>
          <span><strong>Perimeter:</strong> <em>{SHAPE_META[selectedShape.type].perimeter}</em></span>
          {selectedShape.type !== 'circle' && selectedShape.type !== 'rectangle' && (
            <span><strong>Interior angle:</strong> {interiorAngle(selectedShape.type === 'square' ? 4 : selectedShape.type === 'triangle' ? 3 : selectedShape.type === 'pentagon' ? 5 : 6)}°</span>
          )}
        </div>
      )}

      <p style={{ margin: '8px 0 0', fontSize: 11, color: muted }}>Click shape in toolbar, then click canvas to place · Drag to move · Select + Delete to remove</p>
    </div>
  );
}
