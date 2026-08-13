'use client'

import React from 'react'
import { X } from 'lucide-react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import './whiteboard.css'

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
  const d = isDark ? 'dark' : 'light'

  return (
    <div
      className="wb-shortcuts-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div
        className={`wb-shortcuts-card wb-shortcuts-card-${d}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`wb-shortcuts-header wb-shortcuts-header-${d}`}>
          <div>
            <h2 className={`wb-shortcuts-title wb-shortcuts-title-${d}`}>
              Keyboard Shortcuts
            </h2>
            <p className={`wb-shortcuts-subtitle wb-shortcuts-subtitle-${d}`}>
              Press Ctrl + / to toggle this dialog
            </p>
          </div>
          <button
            onClick={onClose}
            className={`wb-shortcuts-close wb-shortcuts-close-${d}`}
            aria-label="Close shortcuts dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="wb-shortcuts-body">
          {shortcutSections.map((section) => (
            <div key={section.title} style={{ marginBottom: 20 }}>
              <h3 className={`wb-shortcuts-section-title wb-shortcuts-section-title-${d}`}>
                {section.title}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {section.shortcuts.map((s) => (
                  <div
                    key={s.keys}
                    className="wb-shortcuts-row"
                  >
                    <span className={`wb-shortcuts-action-${d}`}>
                      {s.action}
                    </span>
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
                          <kbd className={`wb-shortcuts-kbd wb-shortcuts-kbd-${d}`}>
                            {key.trim()}
                          </kbd>
                          {i < s.keys.split(' + ').length - 1 && (
                            <span className={`wb-shortcuts-plus wb-shortcuts-plus-${d}`}>+</span>
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
