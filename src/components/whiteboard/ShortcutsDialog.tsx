'use client'

import React from 'react'
import { X } from 'lucide-react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

interface ShortcutsDialogProps {
  onClose: () => void
}

const shortcutSections = [
  {
    title: 'Tools',
    shortcuts: [
      { keys: 'V', action: 'Select' },
      { keys: 'H', action: 'Hand / Pan' },
      { keys: 'D', action: 'Draw / Pen' },
      { keys: 'Shift + D', action: 'Highlighter' },
      { keys: 'E', action: 'Eraser' },
      { keys: 'A', action: 'Arrow' },
      { keys: 'L', action: 'Line' },
      { keys: 'T', action: 'Text' },
      { keys: 'N', action: 'Sticky Note' },
      { keys: 'R', action: 'Rectangle' },
      { keys: 'Shift + R', action: 'Diamond' },
      { keys: 'O', action: 'Ellipse' },
      { keys: 'F', action: 'Frame' },
      { keys: 'K', action: 'Laser Pointer' },
    ],
  },
  {
    title: 'Actions',
    shortcuts: [
      { keys: 'Ctrl + Z', action: 'Undo' },
      { keys: 'Ctrl + Shift + Z', action: 'Redo' },
      { keys: 'Ctrl + D', action: 'Duplicate' },
      { keys: 'Ctrl + G', action: 'Group' },
      { keys: 'Ctrl + Shift + G', action: 'Ungroup' },
      { keys: 'Ctrl + A', action: 'Select All' },
      { keys: 'Delete', action: 'Delete Selected' },
      { keys: 'Ctrl + C', action: 'Copy' },
      { keys: 'Ctrl + X', action: 'Cut' },
      { keys: 'Ctrl + V', action: 'Paste' },
    ],
  },
  {
    title: 'View & Navigation',
    shortcuts: [
      { keys: 'Ctrl + =', action: 'Zoom In' },
      { keys: 'Ctrl + -', action: 'Zoom Out' },
      { keys: 'Shift + 0', action: 'Zoom to 100%' },
      { keys: 'Shift + 1', action: 'Zoom to Fit' },
      { keys: 'Space (hold)', action: 'Pan Canvas' },
      { keys: 'P', action: 'Presentation Mode' },
      { keys: 'Esc', action: 'Exit / Deselect' },
    ],
  },
  {
    title: 'Arrange',
    shortcuts: [
      { keys: ']', action: 'Bring to Front' },
      { keys: '[', action: 'Send to Back' },
      { keys: 'Shift + L', action: 'Toggle Lock' },
      { keys: 'Shift (hold)', action: 'Constrain Proportions' },
    ],
  },
  {
    title: 'Other',
    shortcuts: [
      { keys: 'Ctrl + /', action: 'Keyboard Shortcuts' },
    ],
  },
]

export function ShortcutsDialog({ onClose }: ShortcutsDialogProps) {
  const isDark = useWhiteboardStore((s) => s.isDark)

  const colors = isDark
    ? { bg: '#1e293b', border: '#334155', headerBorder: '#374151', text: '#e5e7eb', subtext: '#9ca3af', sectionTitle: '#10b981', kbdBg: '#0f172a', kbdBorder: '#475569', kbdText: '#d1d5db', closeBg: '#0f172a', closeBorder: '#475569', closeColor: '#9ca3af' }
    : { bg: '#ffffff', border: '#e5e7eb', headerBorder: '#e5e7eb', text: '#111827', subtext: '#6b7280', sectionTitle: '#059669', kbdBg: '#f9fafb', kbdBorder: '#d1d5db', kbdText: '#374151', closeBg: '#f9fafb', closeBorder: '#e5e7eb', closeColor: '#6b7280' }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.bg,
          borderRadius: 16,
          width: 520,
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${colors.border}`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px 12px',
            borderBottom: `1px solid ${colors.headerBorder}`,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.text }}>
              Keyboard Shortcuts
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: colors.subtext }}>
              Press Ctrl + / to toggle this dialog
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${colors.closeBorder}`,
              background: colors.closeBg,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.closeColor,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Shortcuts List */}
        <div style={{ padding: '16px 24px 24px', overflow: 'auto' }}>
          {shortcutSections.map((section) => (
            <div key={section.title} style={{ marginBottom: 20 }}>
              <h3
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: colors.sectionTitle,
                  marginBottom: 8,
                }}
              >
                {section.title}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {section.shortcuts.map((s) => (
                  <div
                    key={s.keys}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 0',
                    }}
                  >
                    <span style={{ fontSize: 13, color: colors.text }}>{s.action}</span>
                    <div
                      style={{
                        display: 'flex',
                        gap: 3,
                        flexShrink: 0,
                        marginLeft: 16,
                      }}
                    >
                      {s.keys.split(' + ').map((key, i) => (
                        <React.Fragment key={i}>
                          <kbd
                            style={{
                              display: 'inline-block',
                              padding: '2px 6px',
                              borderRadius: 4,
                              border: `1px solid ${colors.kbdBorder}`,
                              background: colors.kbdBg,
                              fontSize: 11,
                              fontWeight: 600,
                              color: colors.kbdText,
                              fontFamily: 'monospace',
                            }}
                          >
                            {key.trim()}
                          </kbd>
                          {i < s.keys.split(' + ').length - 1 && (
                            <span style={{ color: colors.subtext, fontSize: 11 }}>+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
