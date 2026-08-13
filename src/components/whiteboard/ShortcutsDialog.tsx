'use client'

import React from 'react'
import { X } from 'lucide-react'

interface ShortcutsDialogProps {
  onClose: () => void
}

const shortcutSections = [
  {
    title: 'Tools',
    shortcuts: [
      { keys: 'V', action: 'Select' },
      { keys: 'H', action: 'Hand / Pan' },
      { keys: 'D', action: 'Draw' },
      { keys: 'E', action: 'Eraser' },
      { keys: 'A', action: 'Arrow' },
      { keys: 'L', action: 'Line' },
      { keys: 'T', action: 'Text' },
      { keys: 'N', action: 'Sticky Note' },
      { keys: 'R', action: 'Rectangle' },
      { keys: 'O', action: 'Ellipse' },
      { keys: 'F', action: 'Frame' },
      { keys: 'K', action: 'Laser Pointer' },
      { keys: 'Shift + D', action: 'Highlighter' },
      { keys: 'Ctrl + U', action: 'Insert Media' },
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
      { keys: 'Delete / Backspace', action: 'Delete Selected' },
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
      { keys: 'Shift + 2', action: 'Zoom to Selection' },
      { keys: 'Space (hold)', action: 'Pan Canvas' },
      { keys: 'Alt + \u2190 / \u2192', action: 'Previous / Next Page' },
    ],
  },
  {
    title: 'Arrange',
    shortcuts: [
      { keys: 'Alt + A', action: 'Align Left' },
      { keys: 'Alt + H', action: 'Align Center H' },
      { keys: 'Alt + D', action: 'Align Right' },
      { keys: 'Alt + W', action: 'Align Top' },
      { keys: 'Alt + S', action: 'Align Bottom' },
      { keys: ']', action: 'Bring to Front' },
      { keys: '[', action: 'Send to Back' },
      { keys: 'Shift + L', action: 'Toggle Lock' },
      { keys: 'Shift + .', action: 'Rotate Clockwise' },
      { keys: 'Shift + ,', action: 'Rotate Counter-CW' },
    ],
  },
  {
    title: 'Export & Other',
    shortcuts: [
      { keys: 'Ctrl + Shift + C', action: 'Export as SVG' },
      { keys: 'Ctrl + I', action: 'Insert Embed / Edit Link' },
      { keys: 'Ctrl + /', action: 'Keyboard Shortcuts' },
      { keys: 'Shift + F', action: 'Flatten to Image' },
      { keys: 'Ctrl + Alt + G', action: 'Frame Selection' },
    ],
  },
]

export function ShortcutsDialog({ onClose }: ShortcutsDialogProps) {
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
          background: '#ffffff',
          borderRadius: 16,
          width: 520,
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px 12px',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>
              Keyboard Shortcuts
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
              Press Ctrl + / to toggle this dialog
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              background: '#f9fafb',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
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
                  color: '#059669',
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
                    <span style={{ fontSize: 13, color: '#374151' }}>{s.action}</span>
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
                              border: '1px solid #d1d5db',
                              background: '#f9fafb',
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#374151',
                              fontFamily: 'monospace',
                            }}
                          >
                            {key.trim()}
                          </kbd>
                          {i < s.keys.split(' + ').length - 1 && (
                            <span style={{ color: '#9ca3af', fontSize: 11 }}>+</span>
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
