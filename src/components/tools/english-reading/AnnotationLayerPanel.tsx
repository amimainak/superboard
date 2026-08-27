// ============================================================
// AnnotationLayerPanel — Layer Management Overlay
// ============================================================
// Category: English & Reading
// Provides separate annotation layers for tutor and student,
// with visibility toggles and active layer selection.
// ============================================================

'use client';

import React from 'react';
import { useAppStore } from '@/store/app-store';
import { Eye, EyeOff, Layers, Pen } from 'lucide-react';

export default function AnnotationLayerPanel() {
  const { room, toggleAnnotationLayer, setActiveAnnotationLayer } = useAppStore();
  const { annotationLayers, activeAnnotationLayer } = room;

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
        padding: 8,
        borderRadius: 12,
        background: 'rgba(255,255,255,0.97)',
        border: '1px solid rgba(0,0,0,0.1)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        minWidth: 180,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 2 }}>
        <Layers style={{ width: 14, height: 14 }} />
        Annotation Layers
      </div>

      {/* Layers */}
      {annotationLayers.map((layer) => (
        <div
          key={layer.id}
          onClick={() => setActiveAnnotationLayer(layer.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 8px',
            borderRadius: 8,
            border: activeAnnotationLayer === layer.id ? `2px solid ${layer.color}` : '2px solid transparent',
            background: activeAnnotationLayer === layer.id ? `${layer.color}10` : 'rgba(0,0,0,0.03)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {/* Layer color dot */}
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: layer.color,
              flexShrink: 0,
            }}
          />
          {/* Layer name */}
          <span style={{ flex: 1, fontSize: 12, fontWeight: activeAnnotationLayer === layer.id ? 600 : 400, color: '#374151' }}>
            {layer.type === 'tutor' ? 'My Annotations' : 'Student Annotations'}
          </span>
          {/* Active indicator */}
          {activeAnnotationLayer === layer.id && (
            <Pen style={{ width: 12, height: 12, color: layer.color }} />
          )}
          {/* Visibility toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleAnnotationLayer(layer.id);
            }}
            style={{
              width: 24, height: 24, borderRadius: 6, border: 'none',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title={layer.visible ? 'Hide layer' : 'Show layer'}
          >
            {layer.visible
              ? <Eye style={{ width: 14, height: 14, color: '#6b7280' }} />
              : <EyeOff style={{ width: 14, height: 14, color: '#d1d5db' }} />
            }
          </button>
        </div>
      ))}

      {/* Export hint */}
      <div style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center', marginTop: 4 }}>
        Click a layer to draw on it
      </div>
    </div>
  );
}
