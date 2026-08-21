#!/usr/bin/env python3
"""Comprehensive visual design overhaul for Superboard.
Transforms the look from 'enterprise 2018' to 'premium 2025'."""

import re

# ============================================================
# 1. globals.css — Premium color tokens
# ============================================================

FILE = '/home/z/my-project/src/app/globals.css'
with open(FILE, 'r') as f:
    content = f.read()

# Light mode tokens — warmer, more contrast
old_light = """:root {
  --radius: 0.75rem;
  --background: #ffffff;
  --foreground: #111827;
  --card: #ffffff;
  --card-foreground: #111827;
  --popover: #ffffff;
  --popover-foreground: #111827;
  --primary: #059669;
  --primary-foreground: #ffffff;
  --secondary: #f0fdfa;
  --secondary-foreground: #134e4a;
  --muted: #f9fafb;
  --muted-foreground: #6b7280;
  --accent: #ecfdf5;
  --accent-foreground: #065f46;
  --destructive: #ef4444;
  --border: #e5e7eb;
  --input: #e5e7eb;
  --ring: #059669;
}"""

new_light = """:root {
  --radius: 0.75rem;
  --background: #f8fafc;
  --foreground: #0f172a;
  --card: #ffffff;
  --card-foreground: #0f172a;
  --popover: #ffffff;
  --popover-foreground: #0f172a;
  --primary: #059669;
  --primary-foreground: #ffffff;
  --secondary: #f0fdf4;
  --secondary-foreground: #14532d;
  --muted: #f1f5f9;
  --muted-foreground: #64748b;
  --accent: #ecfdf5;
  --accent-foreground: #065f46;
  --destructive: #ef4444;
  --border: #e2e8f0;
  --input: #e2e8f0;
  --ring: #059669;
}"""

if old_light in content:
    content = content.replace(old_light, new_light)
    print('Updated light mode tokens')
else:
    print('WARNING: Could not find light mode tokens')

# Dark mode tokens — deeper, richer, more premium
old_dark = """.dark {
  --background: oklch(0.14 0.015 166);
  --foreground: oklch(0.965 0.008 166);
  --card: oklch(0.19 0.02 166);
  --card-foreground: oklch(0.965 0.008 166);
  --popover: oklch(0.19 0.02 166);
  --popover-foreground: oklch(0.965 0.008 166);
  --primary: oklch(0.718 0.194 166.913);
  --primary-foreground: oklch(0.14 0.015 166);
  --secondary: oklch(0.25 0.03 166);
  --secondary-foreground: oklch(0.965 0.008 166);
  --muted: oklch(0.25 0.03 166);
  --muted-foreground: oklch(0.65 0.04 166);
  --accent: oklch(0.25 0.03 166);
  --accent-foreground: oklch(0.965 0.008 166);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.718 0.194 166.913);
}"""

new_dark = """.dark {
  --background: #09090b;
  --foreground: #f4f4f5;
  --card: #111113;
  --card-foreground: #f4f4f5;
  --popover: #111113;
  --popover-foreground: #f4f4f5;
  --primary: #10b981;
  --primary-foreground: #022c22;
  --secondary: #1c1c1f;
  --secondary-foreground: #e4e4e7;
  --muted: #18181b;
  --muted-foreground: #a1a1aa;
  --accent: #1c1c1f;
  --accent-foreground: #e4e4e7;
  --destructive: #ef4444;
  --border: rgba(255,255,255,0.07);
  --input: rgba(255,255,255,0.10);
  --ring: #10b981;
}"""

if old_dark in content:
    content = content.replace(old_dark, new_dark)
    print('Updated dark mode tokens')
else:
    print('WARNING: Could not find dark mode tokens')

# Room layout background — match the deep dark
content = content.replace(
    'background: #0f172a;',
    'background: #09090b;'
)
print('Updated room layout background')

with open(FILE, 'w') as f:
    f.write(content)


# ============================================================
# 2. whiteboard.css — Premium toolbar & chrome
# ============================================================

FILE2 = '/home/z/my-project/src/components/whiteboard/whiteboard.css'
with open(FILE2, 'r') as f:
    wc = f.read()

# --- Toolbar width & padding ---
wc = wc.replace(
    '.wb-toolbar {\n  width: 48px;\n  min-width: 48px;\n  height: 100%;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  padding: 8px 6px;\n  gap: 2px;',
    '.wb-toolbar {\n  width: 52px;\n  min-width: 52px;\n  height: 100%;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  padding: 10px 7px;\n  gap: 3px;'
)

# --- Dark toolbar: deeper, glass effect ---
wc = wc.replace(
    '.wb-toolbar-dark {\n  background: linear-gradient(180deg, #111827 0%, #0d1321 100%);\n  border-right: 1px solid rgba(255, 255, 255, 0.08);\n  box-shadow: 1px 0 12px rgba(0, 0, 0, 0.3);\n}',
    '.wb-toolbar-dark {\n  background: rgba(14, 14, 16, 0.92);\n  backdrop-filter: blur(20px) saturate(1.4);\n  border-right: 1px solid rgba(255, 255, 255, 0.06);\n  box-shadow: 1px 0 20px rgba(0, 0, 0, 0.4);\n}'
)

# --- Light toolbar: subtle shadow ---
wc = wc.replace(
    '.wb-toolbar-light {\n  background: #ffffff;\n  border-right: 1px solid rgba(0, 0, 0, 0.06);\n  box-shadow: 1px 0 4px rgba(0, 0, 0, 0.04);\n}',
    '.wb-toolbar-light {\n  background: rgba(255, 255, 255, 0.95);\n  backdrop-filter: blur(12px);\n  border-right: 1px solid rgba(0, 0, 0, 0.06);\n  box-shadow: 1px 0 8px rgba(0, 0, 0, 0.06);\n}'
)

# --- Style panel height ---
wc = wc.replace(
    '.wb-style-panel {\n  height: 42px;\n  min-height: 42px;',
    '.wb-style-panel {\n  height: 48px;\n  min-height: 48px;'
)

# --- Dark style panel ---
wc = wc.replace(
    '.wb-style-panel-dark {\n  background: linear-gradient(0deg, #111827 0%, #0d1321 100%);\n  border-top: 1px solid rgba(255, 255, 255, 0.08);\n  box-shadow: 0 -1px 12px rgba(0, 0, 0, 0.2);\n}',
    '.wb-style-panel-dark {\n  background: rgba(14, 14, 16, 0.92);\n  backdrop-filter: blur(20px) saturate(1.4);\n  border-top: 1px solid rgba(255, 255, 255, 0.06);\n  box-shadow: 0 -1px 20px rgba(0, 0, 0, 0.4);\n}'
)

# --- Light style panel ---
wc = wc.replace(
    '.wb-style-panel-light {\n  background: #ffffff;\n  border-top: 1px solid rgba(0, 0, 0, 0.06);\n  box-shadow: 0 -1px 4px rgba(0, 0, 0, 0.04);\n}',
    '.wb-style-panel-light {\n  background: rgba(255, 255, 255, 0.95);\n  backdrop-filter: blur(12px);\n  border-top: 1px solid rgba(0, 0, 0, 0.06);\n  box-shadow: 0 -1px 8px rgba(0, 0, 0, 0.06);\n}'
)

# --- Top bar height ---
wc = wc.replace(
    '.wb-top-bar {\n  height: 40px;\n  min-height: 40px;',
    '.wb-top-bar {\n  height: 44px;\n  min-height: 44px;'
)

# --- Dark top bar ---
wc = wc.replace(
    '.wb-top-bar-dark {\n  background: linear-gradient(90deg, #0d1117 0%, #111827 50%, #0d1117 100%);\n  border-bottom: 1px solid rgba(255, 255, 255, 0.08);\n  box-shadow: 0 1px 12px rgba(0, 0, 0, 0.3);\n}',
    '.wb-top-bar-dark {\n  background: rgba(14, 14, 16, 0.92);\n  backdrop-filter: blur(20px) saturate(1.4);\n  border-bottom: 1px solid rgba(255, 255, 255, 0.06);\n  box-shadow: 0 1px 20px rgba(0, 0, 0, 0.4);\n}'
)

# --- Light top bar ---
wc = wc.replace(
    '.wb-top-bar-light {\n  background: #ffffff;\n  border-bottom: 1px solid rgba(0, 0, 0, 0.06);\n  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);\n}',
    '.wb-top-bar-light {\n  background: rgba(255, 255, 255, 0.95);\n  backdrop-filter: blur(12px);\n  border-bottom: 1px solid rgba(0, 0, 0, 0.06);\n  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);\n}'
)

# --- Tool button size ---
wc = wc.replace(
    '.wb-tool-btn {\n  width: 36px;\n  height: 36px;\n  border-radius: 10px;',
    '.wb-tool-btn {\n  width: 38px;\n  height: 38px;\n  border-radius: 10px;'
)

# --- Dark tool button text: brighter ---
wc = wc.replace(
    '.wb-tool-btn-dark {\n  color: #b4c0d4;\n}',
    '.wb-tool-btn-dark {\n  color: #a1a1aa;\n}'
)

# --- Light tool button text: darker for contrast ---
wc = wc.replace(
    '.wb-tool-btn-light {\n  color: #64748b;\n}',
    '.wb-tool-btn-light {\n  color: #475569;\n}'
)

# --- Dark hover: more visible ---
wc = wc.replace(
    '.wb-tool-btn-dark:hover {\n  background: rgba(255, 255, 255, 0.08);\n  color: #e8ecf4;\n  box-shadow: 0 0 8px rgba(255, 255, 255, 0.03);\n}',
    '.wb-tool-btn-dark:hover {\n  background: rgba(255, 255, 255, 0.07);\n  color: #e4e4e7;\n  box-shadow: 0 0 12px rgba(255, 255, 255, 0.04);\n}'
)

# --- Light hover ---
wc = wc.replace(
    '.wb-tool-btn-light:hover {\n  background: rgba(0, 0, 0, 0.05);\n  color: #1e293b;\n}',
    '.wb-tool-btn-light:hover {\n  background: rgba(0, 0, 0, 0.04);\n  color: #0f172a;\n}'
)

# --- Active dark: more glow ---
wc = wc.replace(
    '.wb-tool-btn-active-dark {\n  background: rgba(16, 185, 129, 0.18) !important;\n  box-shadow: 0 0 12px rgba(16, 185, 129, 0.15), inset 0 0 8px rgba(16, 185, 129, 0.05) !important;\n}',
    '.wb-tool-btn-active-dark {\n  background: rgba(16, 185, 129, 0.15) !important;\n  box-shadow: 0 0 16px rgba(16, 185, 129, 0.2), inset 0 0 8px rgba(16, 185, 129, 0.05) !important;\n}'
)

# --- Active light: slightly more prominent ---
wc = wc.replace(
    '.wb-tool-btn-active-light {\n  background: rgba(16, 185, 129, 0.12) !important;\n  box-shadow: 0 0 8px rgba(16, 185, 129, 0.1) !important;\n}',
    '.wb-tool-btn-active-light {\n  background: rgba(16, 185, 129, 0.10) !important;\n  box-shadow: 0 0 12px rgba(16, 185, 129, 0.12) !important;\n}'
)

# --- Separator: more visible in dark ---
wc = wc.replace(
    '.wb-sep-h-dark {\n  background: rgba(255, 255, 255, 0.1);\n}',
    '.wb-sep-h-dark {\n  background: rgba(255, 255, 255, 0.08);\n}'
)

# --- Flyout panel dark: richer ---
wc = wc.replace(
    '.wb-flyout-panel-dark {\n  background: rgba(22, 30, 48, 0.92);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.04), 0 0 24px rgba(16, 185, 129, 0.04);\n}',
    '.wb-flyout-panel-dark {\n  background: rgba(17, 17, 19, 0.95);\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05), 0 0 30px rgba(16, 185, 129, 0.06);\n}'
)

# --- Flyout item dark: better contrast ---
wc = wc.replace(
    '.wb-flyout-item-dark {\n  color: #c8d1e0;\n}',
    '.wb-flyout-item-dark {\n  color: #d4d4d8;\n}'
)

wc = wc.replace(
    '.wb-flyout-item-dark:hover {\n  background: rgba(255, 255, 255, 0.08);\n  color: #e8ecf4;\n}',
    '.wb-flyout-item-dark:hover {\n  background: rgba(255, 255, 255, 0.07);\n  color: #f4f4f5;\n}'
)

# --- Flyout header: slightly bigger ---
wc = wc.replace(
    '.wb-flyout-header {\n  font-size: 10px;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.1em;\n  padding: 4px 12px 6px;\n}',
    '.wb-flyout-header {\n  font-size: 10.5px;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.08em;\n  padding: 6px 12px 8px;\n}'
)

wc = wc.replace(
    '.wb-flyout-header-dark {\n  color: #8b9ab4;\n}',
    '.wb-flyout-header-dark {\n  color: #71717a;\n}'
)

# --- Pocket button: bigger ---
wc = wc.replace(
    '.wb-pocket-btn {\n  height: 30px;\n  padding: 0 10px;\n  border-radius: 8px;\n  font-size: 11px;',
    '.wb-pocket-btn {\n  height: 32px;\n  padding: 0 11px;\n  border-radius: 8px;\n  font-size: 12px;'
)

wc = wc.replace(
    '.wb-pocket-btn-dark {\n  color: #b4c0d4;\n}',
    '.wb-pocket-btn-dark {\n  color: #a1a1aa;\n}'
)

wc = wc.replace(
    '.wb-pocket-btn-dark:hover {\n  background: rgba(255, 255, 255, 0.08);\n  color: #e8ecf4;\n}',
    '.wb-pocket-btn-dark:hover {\n  background: rgba(255, 255, 255, 0.07);\n  color: #e4e4e7;\n}'
)

wc = wc.replace(
    '.wb-pocket-btn-light {\n  color: #64748b;\n}',
    '.wb-pocket-btn-light {\n  color: #475569;\n}'
)

with open(FILE2, 'w') as f:
    f.write(wc)
print('Updated whiteboard.css')


# ============================================================
# 3. widgets.css — Premium sidebar, toggle bar, toolkits
# ============================================================

FILE3 = '/home/z/my-project/src/components/room/widgets/widgets.css'
with open(FILE3, 'r') as f:
    wwc = f.read()

# --- Widget panel: wider, richer dark bg ---
wwc = wwc.replace(
    '.widget-panel {\n  width: 320px;\n  min-width: 320px;\n  border-left: 1px solid rgba(255, 255, 255, 0.06);\n  background: rgba(15, 23, 42, 0.95);\n  backdrop-filter: blur(12px);',
    '.widget-panel {\n  width: 330px;\n  min-width: 330px;\n  border-left: 1px solid rgba(255, 255, 255, 0.06);\n  background: rgba(14, 14, 16, 0.96);\n  backdrop-filter: blur(20px) saturate(1.3);'
)

# --- Widget tab bar ---
wwc = wwc.replace(
    '.widget-tab-bar {\n  display: flex;\n  align-items: stretch;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.06);\n  background: rgba(15, 23, 42, 0.6);\n  min-height: 38px;',
    '.widget-tab-bar {\n  display: flex;\n  align-items: stretch;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.06);\n  background: rgba(11, 11, 13, 0.7);\n  min-height: 40px;'
)

# --- Widget tab: bigger text ---
wwc = wwc.replace(
    '.widget-tab {\n  flex: 1;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 6px;\n  padding: 0 12px;\n  font-size: 12px;\n  font-weight: 500;\n  color: #64748b;',
    '.widget-tab {\n  flex: 1;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 6px;\n  padding: 0 12px;\n  font-size: 12.5px;\n  font-weight: 500;\n  color: #71717a;'
)

# --- Tab hover ---
wwc = wwc.replace(
    '.widget-tab:hover {\n  color: #94a3b8;\n  background: rgba(255, 255, 255, 0.03);\n}',
    '.widget-tab:hover {\n  color: #a1a1aa;\n  background: rgba(255, 255, 255, 0.04);\n}'
)

# --- Tab active ---
wwc = wwc.replace(
    '.widget-tab-active {\n  color: #e2e8f0 !important;\n  border-bottom-color: #059669 !important;\n}',
    '.widget-tab-active {\n  color: #f4f4f5 !important;\n  border-bottom-color: #10b981 !important;\n}'
)

# --- Toggle bar: richer glass ---
wwc = wwc.replace(
    '.widget-toggle-bar {\n  position: absolute;\n  top: 52px;\n  right: 8px;\n  z-index: 1000;\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  padding: 8px;\n  border-radius: 10px;\n  background: rgba(15, 23, 42, 0.75);\n  border: 1px solid rgba(255, 255, 255, 0.06);\n  backdrop-filter: blur(12px);',
    '.widget-toggle-bar {\n  position: absolute;\n  top: 56px;\n  right: 8px;\n  z-index: 1000;\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  padding: 8px;\n  border-radius: 12px;\n  background: rgba(14, 14, 16, 0.82);\n  border: 1px solid rgba(255, 255, 255, 0.06);\n  backdrop-filter: blur(20px) saturate(1.3);'
)

# --- Toggle group label: bigger ---
wwc = wwc.replace(
    '.widget-toggle-group-label {\n  font-size: 9px;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.8px;\n  color: #475569;\n  padding: 0 10px 2px;\n}',
    '.widget-toggle-group-label {\n  font-size: 9.5px;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.7px;\n  color: #52525b;\n  padding: 2px 10px 3px;\n}'
)

# --- Toggle button: bigger, more premium ---
wwc = wwc.replace(
    '.widget-toggle-btn {\n  height: 36px;\n  padding: 0 10px;\n  border-radius: 8px;\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  background: rgba(15, 23, 42, 0.85);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  color: #94a3b8;\n  cursor: pointer;\n  backdrop-filter: blur(8px);\n  transition: all 0.15s ease;\n  white-space: nowrap;\n  pointer-events: auto;',
    '.widget-toggle-btn {\n  height: 38px;\n  padding: 0 12px;\n  border-radius: 9px;\n  display: flex;\n  align-items: center;\n  gap: 7px;\n  background: rgba(17, 17, 19, 0.88);\n  border: 1px solid rgba(255, 255, 255, 0.07);\n  color: #a1a1aa;\n  cursor: pointer;\n  backdrop-filter: blur(8px);\n  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);\n  white-space: nowrap;\n  pointer-events: auto;'
)

# --- Toggle label: bigger ---
wwc = wwc.replace(
    '.widget-toggle-label {\n  font-size: 11px;\n  font-weight: 600;\n  letter-spacing: 0.2px;\n  opacity: 0.9;\n}',
    '.widget-toggle-label {\n  font-size: 12px;\n  font-weight: 600;\n  letter-spacing: 0.1px;\n  opacity: 0.9;\n}'
)

# --- Toggle hover ---
wwc = wwc.replace(
    '.widget-toggle-btn:hover {\n  background: rgba(30, 41, 59, 0.95);\n  border-color: rgba(255, 255, 255, 0.2);\n  color: #e2e8f0;\n  transform: translateX(-2px);\n}',
    '.widget-toggle-btn:hover {\n  background: rgba(30, 30, 34, 0.95);\n  border-color: rgba(255, 255, 255, 0.14);\n  color: #e4e4e7;\n  transform: translateX(-2px);\n}'
)

# --- Toggle active: more vibrant ---
wwc = wwc.replace(
    '.widget-toggle-btn-active {\n  background: rgba(5, 150, 105, 0.25) !important;\n  border-color: rgba(5, 150, 105, 0.5) !important;\n  color: #34d399 !important;\n}',
    '.widget-toggle-btn-active {\n  background: rgba(16, 185, 129, 0.18) !important;\n  border-color: rgba(16, 185, 129, 0.4) !important;\n  color: #34d399 !important;\n  box-shadow: 0 0 12px rgba(16, 185, 129, 0.1);\n}'
)

# --- Room info bar ---
wwc = wwc.replace(
    '.room-info-bar {\n  position: absolute;\n  top: 52px;\n  left: 56px;\n  z-index: 999;\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  padding: 4px 12px;\n  border-radius: 6px;\n  background: rgba(15, 23, 42, 0.8);\n  backdrop-filter: blur(8px);\n  border: 1px solid rgba(255, 255, 255, 0.06);\n}',
    '.room-info-bar {\n  position: absolute;\n  top: 56px;\n  left: 60px;\n  z-index: 999;\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  padding: 5px 14px;\n  border-radius: 8px;\n  background: rgba(14, 14, 16, 0.85);\n  backdrop-filter: blur(16px);\n  border: 1px solid rgba(255, 255, 255, 0.06);\n}'
)

# --- Room info subject text ---
wwc = wwc.replace(
    '.room-info-subject {\n  font-size: 11px;\n  color: #94a3b8;\n  font-weight: 500;\n}',
    '.room-info-subject {\n  font-size: 12px;\n  color: #a1a1aa;\n  font-weight: 500;\n}'
)

# --- Toolkit section: more breathing room ---
wwc = wwc.replace(
    '.toolkit-section {\n  padding: 12px 0;\n}',
    '.toolkit-section {\n  padding: 16px 0;\n}'
)

# --- Toolkit section title: bigger, more refined ---
wwc = wwc.replace(
    '.toolkit-section-title {\n  padding: 4px 16px 8px;\n  font-size: 10px;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.5px;\n  color: #64748b;\n}',
    '.toolkit-section-title {\n  padding: 6px 16px 10px;\n  font-size: 11px;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.06em;\n  color: #71717a;\n}'
)

# --- Toolkit grid: more gap ---
wwc = wwc.replace(
    '.toolkit-grid {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 4px;\n  padding: 0 16px;\n}',
    '.toolkit-grid {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 5px;\n  padding: 0 16px;\n}'
)

# --- Toolkit chip hover: subtler ---
wwc = wwc.replace(
    '.toolkit-chip:hover {\n  background: rgba(255,255,255,0.1) !important;\n}',
    '.toolkit-chip:hover {\n  background: rgba(255,255,255,0.08) !important;\n}'
)

# --- Chat messages: slightly bigger text ---
wwc = wwc.replace(
    '.widget-messages {\n  flex: 1;\n  overflow-y: auto;\n  padding: 12px;\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}',
    '.widget-messages {\n  flex: 1;\n  overflow-y: auto;\n  padding: 14px;\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n}'
)

# --- AI empty title: bigger ---
wwc = wwc.replace(
    '.ai-empty-title {\n  font-size: 14px;\n  font-weight: 600;\n  color: #e2e8f0;\n  margin-bottom: 4px;\n}',
    '.ai-empty-title {\n  font-size: 15px;\n  font-weight: 600;\n  color: #f4f4f5;\n  margin-bottom: 6px;\n}'
)

# --- AI bubble: slightly bigger ---
wwc = wwc.replace(
    '.ai-bubble {\n  padding: 8px 12px;\n  border-radius: 8px;\n  max-width: 90%;\n  font-size: 13px;\n  line-height: 1.5;',
    '.ai-bubble {\n  padding: 10px 14px;\n  border-radius: 10px;\n  max-width: 92%;\n  font-size: 13.5px;\n  line-height: 1.55;'
)

# --- Widget panel float: match new style ---
wwc = wwc.replace(
    '.widget-panel-float {\n  position: absolute !important;\n  top: 52px;\n  right: 52px;\n  width: 360px !important;\n  min-width: 360px !important;\n  height: 480px;\n  border-radius: 12px;\n  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  z-index: 1001;\n}',
    '.widget-panel-float {\n  position: absolute !important;\n  top: 56px;\n  right: 56px;\n  width: 370px !important;\n  min-width: 370px !important;\n  height: 500px;\n  border-radius: 14px;\n  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);\n  border: 1px solid rgba(255, 255, 255, 0.07);\n  z-index: 1001;\n}'
)

# --- Widget panel minimized ---
wwc = wwc.replace(
    '.widget-panel-minimized {\n  position: absolute !important;\n  bottom: 52px;\n  right: 52px;\n  width: auto !important;\n  min-width: 180px;\n  border-radius: 10px;\n  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);\n  z-index: 1001;\n}',
    '.widget-panel-minimized {\n  position: absolute !important;\n  bottom: 56px;\n  right: 56px;\n  width: auto !important;\n  min-width: 180px;\n  border-radius: 12px;\n  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);\n  z-index: 1001;\n}'
)

with open(FILE3, 'w') as f:
    f.write(wwc)
print('Updated widgets.css')


# ============================================================
# 4. GridBackground.tsx — Subtler grid dots
# ============================================================

FILE4 = '/home/z/my-project/src/components/whiteboard/GridBackground.tsx'
with open(FILE4, 'r') as f:
    gc = f.read()

gc = gc.replace(
    "fill={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}",
    "fill={isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}"
)

gc = gc.replace(
    "stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}",
    "stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}"
)

with open(FILE4, 'w') as f:
    f.write(gc)
print('Updated GridBackground.tsx')


# ============================================================
# 5. Login page — check and improve if needed
# ============================================================

FILE5 = '/home/z/my-project/src/app/login/page.tsx'
with open(FILE5, 'r') as f:
    login = f.read()

# Check if login uses the old slate-900 bg
if 'bg-slate-900' in login or '#0f172a' in login:
    login = login.replace('bg-slate-900', 'bg-zinc-950')
    login = login.replace('#0f172a', '#09090b')
    with open(FILE5, 'w') as f:
        f.write(login)
    print('Updated login page dark background')
else:
    print('Login page background already OK or uses different approach')

print('\n=== Visual Overhaul Complete ===')
print('Key changes:')
print('  - Dark mode: deeper blacks (#09090b), zinc palette, glass morphism')
print('  - Light mode: warmer slate, better contrast')
print('  - Typography: +1-2px on labels, tabs, headers')
print('  - Spacing: larger toolbar (52px), bigger buttons (38px), more gaps')
print('  - Components: glow effects, glass blur, premium shadows')
print('  - Grid: subtler dots (0.07 opacity)')
print('  - Widget panel: wider (330px), richer surfaces')
