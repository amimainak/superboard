'use client'

import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { generateId } from '@/lib/whiteboard/utils'
import type { ArrowElement, TextElement, StickyElement } from '@/lib/whiteboard/types'
import { useShallow } from 'zustand/react/shallow'

interface ScienceToolkitProps {
  roomId?: string
}

const ARROW_LENGTH = 150

function getViewportCenter(camera: { x: number; y: number; zoom: number }) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  return {
    x: (vw / 2 - camera.x) / camera.zoom,
    y: (vh / 2 - camera.y) / camera.zoom,
  }
}

function getArrowEndpoint(cx: number, cy: number, angleDeg: number, length: number) {
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: cx + length * Math.cos(rad),
    y: cy - length * Math.sin(rad),
  }
}

function getArrowBounds(x1: number, y1: number, x2: number, y2: number) {
  const minX = Math.min(x1, x2)
  const minY = Math.min(y1, y2)
  const maxX = Math.max(x1, x2)
  const maxY = Math.max(y1, y2)
  return {
    x: minX,
    y: minY,
    width: maxX - minX || 2,
    height: maxY - minY || 2,
  }
}

export function ScienceToolkit({ roomId: _roomId }: ScienceToolkitProps) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const camera = useWhiteboardStore(useShallow((s) => s.camera))
  const style = useWhiteboardStore(useShallow((s) => s.style))
  const currentPageIndex = useWhiteboardStore((s) => s.currentPageIndex)
  const addElement = useWhiteboardStore((s) => s.addElement)
  const pushHistory = useWhiteboardStore((s) => s.pushHistory)

  const vectors = [
    { label: 'Arrow →', angle: 0 },
    { label: 'Arrow ↗', angle: 45 },
    { label: 'Arrow ↑', angle: 90 },
    { label: 'Arrow ↖', angle: 135 },
    { label: 'Arrow ←', angle: 180 },
    { label: 'Force (F)', label2: 'F' },
    { label: 'Velocity (v)', label2: 'v' },
    { label: 'Acceleration (a)', label2: 'a' },
  ]

  const labEquipment = [
    { label: 'Beaker', icon: '🧪' },
    { label: 'Thermometer', icon: '🌡️' },
    { label: 'Magnet', icon: '🧲' },
    { label: 'Atom', icon: '⚛️' },
    { label: 'Cell', icon: '🔬' },
    { label: 'Circuit', icon: '🔌' },
  ]

  const handleVectorClick = (vec: typeof vectors[number]) => {
    const center = getViewportCenter(camera)
    const angle = 'angle' in vec && typeof vec.angle === 'number' ? vec.angle : 0
    const end = getArrowEndpoint(center.x, center.y, angle, ARROW_LENGTH)
    const bounds = getArrowBounds(center.x, center.y, end.x, end.y)

    pushHistory()

    const arrow: ArrowElement = {
      id: generateId(),
      type: 'arrow',
      x: center.x,
      y: center.y,
      x2: end.x,
      y2: end.y,
      width: bounds.width,
      height: bounds.height,
      rotation: 0,
      opacity: style.opacity,
      strokeColor: style.strokeColor,
      fillColor: 'transparent',
      strokeWidth: style.strokeWidth || 2,
      arrowHead: 'arrow',
      locked: false,
      pageIndex: currentPageIndex,
    }
    addElement(arrow)

    // For labeled vectors (F, v, a), also place a TEXT element near the arrow
    if (vec.label2) {
      const labelOffsetX = 12
      const labelOffsetY = -16
      const labelX = (center.x + end.x) / 2 + labelOffsetX
      const labelY = (center.y + end.y) / 2 + labelOffsetY

      const text: TextElement = {
        id: generateId(),
        type: 'text',
        x: labelX,
        y: labelY,
        width: 40,
        height: 30,
        rotation: 0,
        opacity: style.opacity,
        strokeColor: 'transparent',
        fillColor: style.strokeColor,
        strokeWidth: 0,
        text: vec.label2,
        fontSize: 22,
        fontFamily: 'inherit',
        textAlign: 'center' as const,
        fontWeight: 'bold',
        fontStyle: 'italic',
        autoSize: true,
        locked: false,
        pageIndex: currentPageIndex,
      }
      addElement(text)
    }
  }

  const handleEquipmentClick = (item: typeof labEquipment[number]) => {
    const center = getViewportCenter(camera)
    const stickyW = 200
    const stickyH = 120

    pushHistory()

    const sticky: StickyElement = {
      id: generateId(),
      type: 'sticky',
      x: center.x - stickyW / 2,
      y: center.y - stickyH / 2,
      width: stickyW,
      height: stickyH,
      rotation: 0,
      opacity: 1,
      strokeColor: 'transparent',
      fillColor: '#fef9c3',
      strokeWidth: 0,
      text: item.icon + ' ' + item.label,
      fontSize: 18,
      noteColor: '#fef9c3',
      locked: false,
      pageIndex: currentPageIndex,
    }
    addElement(sticky)
  }

  return (
    <div className="widget-content toolkit-science">
      <div className="toolkit-section">
        <div className={'toolkit-section-title ' + (isDark ? '' : 'toolkit-section-title-light')}>Vectors</div>
        <div className="toolkit-grid">
          {vectors.map((vec) => (
            <button
              key={vec.label}
              className={'toolkit-chip ' + (isDark ? '' : 'toolkit-chip-light')}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontFamily: 'monospace',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.1)',
                color: isDark ? '#94a3b8' : '#475569',
                cursor: 'pointer' as const,
              }}
              onClick={() => handleVectorClick(vec)}
            >
              {vec.label2 || vec.label}
            </button>
          ))}
        </div>
      </div>

      <div className="toolkit-section">
        <div className={'toolkit-section-title ' + (isDark ? '' : 'toolkit-section-title-light')}>Lab Equipment</div>
        <div className="toolkit-grid">
          {labEquipment.map((item) => (
            <button
              key={item.label}
              className={'toolkit-chip ' + (isDark ? '' : 'toolkit-chip-light')}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                fontSize: 16,
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.1)',
                color: isDark ? '#94a3b8' : '#475569',
                cursor: 'pointer' as const,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              onClick={() => handleEquipmentClick(item)}
            >
              <span>{item.icon}</span>
              <span style={{ fontSize: 11 }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
