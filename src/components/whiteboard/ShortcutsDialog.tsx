'use client'

import React, { useState } from 'react'
import { X, Keyboard, Lightbulb } from 'lucide-react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import './whiteboard.css'

interface ShortcutsDialogProps {
  onClose: () => void
}

// ---- Keyboard Shortcuts data ----

const shortcutSections = [
  {
    title: 'Tools',
    shortcuts: [
      { keys: 'V', action: 'Select' },
      { keys: 'H', action: 'Hand / Pan' },
      { keys: 'D', action: 'Draw / Pen' },
      { keys: 'Shift + D', action: 'Highlighter' },
      { keys: 'E', action: 'Stroke Eraser' },
      { keys: 'Shift + E', action: 'Object Eraser' },
      { keys: 'A', action: 'Arrow' },
      { keys: 'L', action: 'Line' },
      { keys: 'T', action: 'Text' },
      { keys: 'N', action: 'Sticky Note' },
      { keys: 'R', action: 'Rectangle' },
      { keys: 'Shift + R', action: 'Diamond' },
      { keys: 'O', action: 'Ellipse' },
      { keys: 'F', action: 'Frame' },
      { keys: 'K', action: 'Laser Pointer' },
      { keys: 'U', action: 'Upload Image' },
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
    title: 'Help',
    shortcuts: [
      { keys: 'Ctrl + /', action: 'Open this Dialog' },
      { keys: 'Delete / Backspace', action: 'Clear Page (no selection)' },
    ],
  },
]

// ---- Tips & Tricks data ----

const tipSections = [
  {
    title: 'Drawing Shapes',
    tips: [
      {
        title: 'Perfect Squares & Circles',
        desc: 'Hold Shift while drawing a Rectangle to create a perfect square, or while drawing an Ellipse to create a perfect circle. This also works for Diamonds to keep equal proportions.',
      },
      {
        title: 'Constrain Proportions',
        desc: 'Hold Shift while drawing any shape to lock its aspect ratio. The shape will scale uniformly instead of stretching freely.',
      },
      {
        title: 'Stroke vs Fill',
        desc: 'The Stroke color controls the outline/border of shapes, while the Fill color controls the interior. Set Fill to "transparent" (default) for hollow outlined shapes. This applies to Rectangles, Ellipses, Diamonds, Triangles, and Frames.',
      },
      {
        title: 'Dashed Lines',
        desc: 'Use the dash style option in the bottom style bar to create dashed or dotted outlines on any shape or freehand drawing.',
      },
    ],
  },
  {
    title: 'Selection & Editing',
    tips: [
      {
        title: 'Multi-select with Shift',
        desc: 'Click on elements while holding Shift to add or remove them from your selection without deselecting others. This is essential for grouping, moving, or deleting multiple elements at once.',
      },
      {
        title: 'Double-click to Edit Text',
        desc: 'Double-click on any text element or sticky note to start editing its content directly. The cursor will be placed at the end of the existing text.',
      },
      {
        title: 'Lock Elements',
        desc: 'Select an element and press Shift + L to lock it in place. Locked elements cannot be moved or resized accidentally. Press Shift + L again to unlock.',
      },
      {
        title: 'Group & Ungroup',
        desc: 'Select multiple elements and press Ctrl + G to group them into a single unit. Move, resize, or transform the group as one. Press Ctrl + Shift + G to ungroup.',
      },
    ],
  },
  {
    title: 'Eraser Tools',
    tips: [
      {
        title: 'Two Eraser Modes',
        desc: 'Click the eraser tool in the toolbar to see two options: "Stroke Eraser" (E) erases freehand strokes along your brush path, while "Object Eraser" (Shift + E) deletes entire elements with a single click or drag.',
      },
      {
        title: 'Drag to Delete Multiple',
        desc: 'With the Object Eraser active, click and drag across multiple elements to delete them all in one motion. A single undo (Ctrl + Z) will restore everything from that stroke.',
      },
    ],
  },
  {
    title: 'Canvas Navigation',
    tips: [
      {
        title: 'Space to Pan',
        desc: 'Hold the Space bar to temporarily switch to pan mode. Drag to move around the canvas, then release Space to return to your current tool. No need to switch tools!',
      },
      {
        title: 'Pinch to Zoom (Touch)',
        desc: 'On touch devices, use a two-finger pinch gesture to zoom in and out. Two-finger drag also pans the canvas.',
      },
      {
        title: 'Zoom to Fit All',
        desc: 'Press Shift + 1 to instantly zoom out and fit all your content in view. Press Shift + 0 to reset to exactly 100% zoom.',
      },
      {
        title: 'Stylus Barrel Button',
        desc: 'If you are using a stylus/tablet, pressing the barrel button (side button) automatically switches to the eraser. Release it to return to your previous tool.',
      },
    ],
  },
  {
    title: 'Pages & Content',
    tips: [
      {
        title: 'Multiple Pages',
        desc: 'Use the page tabs at the bottom center to navigate between pages. Click the "+" button or go to More > Add Page to create new pages. Each page has its own set of elements.',
      },
      {
        title: 'Clear Page',
        desc: 'Press Delete or Backspace when nothing is selected to clear the entire current page. You can also find "Clear Page" in the More menu at the top.',
      },
      {
        title: 'Export Options',
        desc: 'Go to More > File to export your work as PNG, JPEG, SVG, or JSON. SVG and JSON preserve full editability. PNG and JPEG are for sharing.',
      },
    ],
  },
]

// ---- Tab button component ----

function TabBtn({
  active,
  isDark,
  onClick,
  children,
}: {
  active: boolean
  isDark: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  const d = isDark ? 'dark' : 'light'
  return (
    <button
      onClick={onClick}
      className={[
        'wb-help-tab',
        `wb-help-tab-${d}`,
        active ? `wb-help-tab-active wb-help-tab-active-${d}` : '',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

// ---- Main Component ----

export function ShortcutsDialog({ onClose }: ShortcutsDialogProps) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const d = isDark ? 'dark' : 'light'
  const [tab, setTab] = useState<'shortcuts' | 'tips'>('tips')

  return (
    <div
      className="wb-shortcuts-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Help"
    >
      <div
        className={`wb-shortcuts-card wb-shortcuts-card-${d}`}
        onClick={(e) => e.stopPropagation()}
        style={{ width: 580, maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className={`wb-shortcuts-header wb-shortcuts-header-${d}`}>
          <div>
            <h2 className={`wb-shortcuts-title wb-shortcuts-title-${d}`}>
              Help Center
            </h2>
            <p className={`wb-shortcuts-subtitle wb-shortcuts-subtitle-${d}`}>
              Keyboard shortcuts, tips, and hidden features
            </p>
          </div>
          <button
            onClick={onClose}
            className={`wb-shortcuts-close wb-shortcuts-close-${d}`}
            aria-label="Close help dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className={`wb-help-tabs wb-help-tabs-${d}`}>
          <TabBtn active={tab === 'tips'} isDark={isDark} onClick={() => setTab('tips')}>
            <Lightbulb size={13} style={{ marginRight: 6, opacity: 0.7 }} />
            Tips & Tricks
          </TabBtn>
          <TabBtn active={tab === 'shortcuts'} isDark={isDark} onClick={() => setTab('shortcuts')}>
            <Keyboard size={13} style={{ marginRight: 6, opacity: 0.7 }} />
            Keyboard Shortcuts
          </TabBtn>
        </div>

        {/* Content */}
        <div className="wb-shortcuts-body">
          {tab === 'tips' ? (
            <div>
              {tipSections.map((section) => (
                <div key={section.title} style={{ marginBottom: 22 }}>
                  <h3 className={`wb-shortcuts-section-title wb-shortcuts-section-title-${d}`}>
                    {section.title}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {section.tips.map((tip) => (
                      <div
                        key={tip.title}
                        className={`wb-help-tip wb-help-tip-${d}`}
                      >
                        <div className={`wb-help-tip-title wb-help-tip-title-${d}`}>
                          {tip.title}
                        </div>
                        <div className={`wb-help-tip-desc wb-help-tip-desc-${d}`}>
                          {tip.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
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
          )}
        </div>
      </div>
    </div>
  )
}
