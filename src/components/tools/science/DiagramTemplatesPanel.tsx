'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, Layout, Atom, Droplets, Zap, Bone } from 'lucide-react';

interface Props { editor?: unknown; }

interface Template {
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

interface Category {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  templates: Template[];
}

const CATEGORIES: Category[] = [
  {
    id: 'cells',
    name: 'Atoms',
    icon: Atom,
    color: '#16a34a',
    templates: [
      { name: 'Plant Atom', description: 'Atom wall, chloroplasts, central vacuole, nucleus', icon: Atom, color: '#16a34a' },
      { name: 'Animal Atom', description: 'Atom membrane, mitochondria, ER, Golgi, nucleus', icon: Atom, color: '#059669' },
      { name: 'Bacterial Atom', description: 'Capsule, cell wall, plasmid, flagellum, nucleoid', icon: Atom, color: '#0d9488' },
    ],
  },
  {
    id: 'earth-science',
    name: 'Earth Science',
    icon: Droplets,
    color: '#0284c7',
    templates: [
      { name: 'Water Cycle', description: 'Evaporation, condensation, precipitation, collection', icon: Droplets, color: '#0284c7' },
      { name: 'Rock Cycle', description: 'Igneous, sedimentary, metamorphic transformations', icon: Droplets, color: '#0369a1' },
      { name: 'Tectonic Plates', description: 'Convergent, divergent, transform boundaries', icon: Droplets, color: '#075985' },
    ],
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    icon: Zap,
    color: '#d97706',
    templates: [
      { name: 'Atom Model', description: 'Protons, neutrons, electron shells', icon: Zap, color: '#d97706' },
      { name: 'Chemical Bond', description: 'Ionic, covalent, metallic bonding diagrams', icon: Zap, color: '#b45309' },
      { name: 'Periodic Table Block', description: 'Element tile with atomic info layout', icon: Zap, color: '#92400e' },
    ],
  },
  {
    id: 'physics',
    name: 'Physics',
    icon: Zap,
    color: '#7c3aed',
    templates: [
      { name: 'Electrical Circuit', description: 'Series and parallel circuits with components', icon: Zap, color: '#7c3aed' },
      { name: 'Force Diagram', description: 'Free body diagram with force vectors', icon: Zap, color: '#6d28d9' },
      { name: 'Wave Properties', description: 'Amplitude, wavelength, frequency visualization', icon: Zap, color: '#5b21b6' },
    ],
  },
  {
    id: 'human-body',
    name: 'Human Body',
    icon: Bone,
    color: '#dc2626',
    templates: [
      { name: 'Skeletal System', description: 'Major bones and joints overview', icon: Bone, color: '#dc2626' },
      { name: 'Circulatory System', description: 'Heart, arteries, veins, blood flow path', icon: Bone, color: '#b91c1c' },
      { name: 'Digestive System', description: 'Organs from mouth to intestines', icon: Bone, color: '#991b1b' },
    ],
  },
];

export default function DiagramTemplatesPanel({ editor: _editor }: Props) {
  const store = useAppStore();
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0].id);

  if (!store.room.diagramTemplatesOpen) return null;

  const currentCategory = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0];
  const CatIcon = currentCategory.icon;

  return (
    <div style={{ position: 'absolute', top: 50, right: 16, zIndex: 1001, display: 'flex', flexDirection: 'column', gap: 4, padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.1)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: 260, maxHeight: 480, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Diagram Templates</span>
        <button onClick={() => store.toggleDiagramTemplates()} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X style={{ width: 14, height: 14 }} /></button>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 6, border: activeCategory === cat.id ? `1.5px solid ${cat.color}` : '1px solid #e5e7eb', background: activeCategory === cat.id ? `${cat.color}15` : '#f9fafb', color: activeCategory === cat.id ? cat.color : '#6b7280', fontSize: 10, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
            >
              <Icon style={{ width: 11, height: 11 }} />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Category header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 8, background: `${currentCategory.color}10`, border: `1px solid ${currentCategory.color}30`, marginBottom: 4 }}>
        <CatIcon style={{ width: 14, height: 14, color: currentCategory.color }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: currentCategory.color }}>{currentCategory.name}</span>
        <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 'auto' }}>{currentCategory.templates.length} templates</span>
      </div>

      {/* Template list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {currentCategory.templates.map(tpl => {
          const TplIcon = tpl.icon;
          return (
            <div key={tpl.name} style={{ padding: '8px', borderRadius: 8, background: '#f9fafb', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: `${tpl.color}15`, border: `1px solid ${tpl.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <TplIcon style={{ width: 14, height: 14, color: tpl.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{tpl.name}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af', lineHeight: 1.3, marginTop: 1 }}>{tpl.description}</div>
                </div>
              </div>
              <button
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '4px 0', borderRadius: 6, border: `1px solid ${tpl.color}40`, background: `${tpl.color}10`, color: tpl.color, fontSize: 10, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${tpl.color}20`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${tpl.color}10`; }}
              >
                <Layout style={{ width: 10, height: 10 }} /> Insert on Canvas
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
