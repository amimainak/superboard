'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, Bone, Brain, Heart } from 'lucide-react';

interface Props {
  editor?: unknown;
}

type SystemType = 'skeletal' | 'muscular' | 'digestive' | 'respiratory' | 'circulatory' | 'nervous';

const SYSTEMS: Record<SystemType, { label: string; icon: typeof Bone; color: string; description: string; organs: string[] }> = {
  skeletal: {
    label: 'Skeletal System',
    icon: Bone,
    color: '#f5f5f4',
    description: 'The skeletal system is the body\'s framework, consisting of 206 bones. It provides structure, protects organs, anchors muscles, and stores calcium. Bones are living tissue that constantly break down and rebuild.',
    organs: ['Skull', 'Spine', 'Rib Cage', 'Pelvis', 'Femur', 'Tibia', 'Humerus', 'Phalanges', 'Scapula', 'Clavicle'],
  },
  muscular: {
    label: 'Muscular System',
    icon: Heart,
    color: '#ef4444',
    description: 'The muscular system has three types of muscle: skeletal (voluntary movement), smooth (involuntary, in organs), and cardiac (heart). Muscles make up about 40% of body weight and convert energy into motion.',
    organs: ['Biceps', 'Triceps', 'Quadriceps', 'Hamstrings', 'Pectorals', 'Deltoids', 'Abdominals', 'Glutes', 'Calves', 'Trapezius'],
  },
  digestive: {
    label: 'Digestive System',
    icon: Heart,
    color: '#f59e0b',
    description: 'The digestive system breaks down food into nutrients the body can absorb. It includes the GI tract and accessory organs. Digestion takes 24-72 hours from mouth to elimination.',
    organs: ['Mouth', 'Esophagus', 'Stomach', 'Small Intestine', 'Large Intestine', 'Liver', 'Pancreas', 'Gallbladder', 'Rectum', 'Appendix'],
  },
  respiratory: {
    label: 'Respiratory System',
    icon: Brain,
    color: '#06b6d4',
    description: 'The respiratory system brings oxygen into the body and removes carbon dioxide. An adult takes about 20,000 breaths per day. The lungs have about 300 million alveoli for gas exchange.',
    organs: ['Nasal Cavity', 'Pharynx', 'Larynx', 'Trachea', 'Bronchi', 'Bronchioles', 'Alveoli', 'Diaphragm', 'Lungs', 'Pleura'],
  },
  circulatory: {
    label: 'Circulatory System',
    icon: Heart,
    color: '#dc2626',
    description: 'The circulatory system is the body\'s transport network. The heart pumps about 2,000 gallons of blood daily through 60,000 miles of blood vessels, delivering oxygen and nutrients to every cell.',
    organs: ['Heart', 'Aorta', 'Arteries', 'Veins', 'Capillaries', 'Red Blood Cells', 'White Blood Cells', 'Platelets', 'Plasma', 'Vena Cava'],
  },
  nervous: {
    label: 'Nervous System',
    icon: Brain,
    color: '#8b5cf6',
    description: 'The nervous system is the body\'s command center, consisting of the brain, spinal cord, and nerves. It processes sensory information, controls movement, and enables thought and emotion.',
    organs: ['Brain', 'Cerebrum', 'Cerebellum', 'Brainstem', 'Spinal Cord', 'Nerves', 'Neurons', 'Synapses', 'Motor Cortex', 'Sensory Cortex'],
  },
};

export default function BodySystemsPanel({ editor }: Props) {
  const store = useAppStore();
  const isOpen = store.room.bodySystemsOpen;
  const toggle = store.toggleBodySystems;

  const [selectedSystem, setSelectedSystem] = useState<SystemType>('skeletal');
  const system = SYSTEMS[selectedSystem];
  const SystemIcon = system.icon;

  if (!isOpen) return null;

  return (
    <div style={{ position: 'absolute', top: 50, right: 16, zIndex: 1001, width: 340, maxHeight: 'calc(100vh - 60px)', overflowY: 'auto', borderRadius: 12, background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.1)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px 0 12px' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Bone style={{ width: 14, height: 14, color: '#8b5cf6' }} />
          Body Systems
        </span>
        <button onClick={toggle} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      <div style={{ padding: '8px 12px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* System selector */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {(Object.entries(SYSTEMS) as [SystemType, typeof system][]).map(([key, sys]) => {
            const Icon = sys.icon;
            return (
              <button
                key={key}
                onClick={() => setSelectedSystem(key)}
                style={{
                  padding: '4px 8px', borderRadius: 6, border: selectedSystem === key ? `1px solid ${sys.color}` : '1px solid rgba(0,0,0,0.1)',
                  background: selectedSystem === key ? `${sys.color}15` : 'white',
                  color: selectedSystem === key ? sys.color : '#6b7280',
                  fontSize: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s',
                }}
              >
                <Icon style={{ width: 11, height: 11 }} /> {sys.label.split(' ')[0]}
              </button>
            );
          })}
        </div>

        {/* Description */}
        <div style={{ padding: '10px', borderRadius: 8, background: '#f9fafb', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <SystemIcon style={{ width: 16, height: 16, color: system.color }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>{system.label}</span>
          </div>
          <p style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5, margin: 0 }}>{system.description}</p>
        </div>

        {/* Diagram placeholder */}
        <div style={{ borderRadius: 8, background: `${system.color}08`, border: `2px dashed ${system.color}40`, height: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <SystemIcon style={{ width: 32, height: 32, color: `${system.color}60` }} />
          <span style={{ fontSize: 10, color: '#9ca3af' }}>{system.label} Diagram</span>
          <span style={{ fontSize: 9, color: '#d1d5db' }}>Interactive diagram placeholder</span>
        </div>

        {/* Organs list */}
        <div>
          <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Key Parts</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {system.organs.map((organ, i) => (
              <span key={i} style={{ padding: '3px 8px', borderRadius: 12, background: `${system.color}15`, color: system.color, fontSize: 10, fontWeight: 500 }}>
                {organ}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
