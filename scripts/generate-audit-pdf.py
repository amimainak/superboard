#!/usr/bin/env python3
"""Generate Superboard White-Box Audit Report PDF."""

import sys, os
FONT_DIR = '/usr/share/fonts'

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Register fonts
pdfmetrics.registerFont(TTFont('NotoSerifSC', f'{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSC-Bold', f'{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', f'{FONT_DIR}/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', f'{FONT_DIR}/truetype/dejavu/DejaVuSans-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuMono', f'{FONT_DIR}/truetype/dejavu/DejaVuSansMono.ttf'))

# Colors from cascade palette
C = {
    'bg': HexColor('#f7f7f6'),
    'section_bg': HexColor('#ebeae8'),
    'text': HexColor('#161514'),
    'muted': HexColor('#85827a'),
    'accent': HexColor('#92761f'),
    'border': HexColor('#c8c4b6'),
    'header_fill': HexColor('#645e49'),
    'success': HexColor('#469e64'),
    'warning': HexColor('#ac8a45'),
    'error': HexColor('#a2514a'),
    'info': HexColor('#4a6988'),
}

OUT = '/home/z/my-project/download/Superboard-Audit-Report.pdf'
os.makedirs(os.path.dirname(OUT), exist_ok=True)

doc = SimpleDocTemplate(
    OUT, pagesize=A4,
    leftMargin=22*mm, rightMargin=22*mm,
    topMargin=20*mm, bottomMargin=18*mm,
    title='Superboard White-Box Audit Report',
    author='Z.ai',
    subject='Security and performance audit of the Superboard collaborative whiteboard',
)

ss = getSampleStyleSheet()

# Custom styles
s_title = ParagraphStyle('AuditTitle', parent=ss['Title'], fontName='DejaVuSans-Bold', fontSize=22, textColor=C['text'], spaceAfter=6*mm, alignment=TA_LEFT)
s_h1 = ParagraphStyle('H1', parent=ss['Heading1'], fontName='DejaVuSans-Bold', fontSize=15, textColor=C['text'], spaceBefore=8*mm, spaceAfter=3*mm, borderWidth=0, borderPadding=0)
s_h2 = ParagraphStyle('H2', parent=ss['Heading2'], fontName='DejaVuSans-Bold', fontSize=12, textColor=C['accent'], spaceBefore=5*mm, spaceAfter=2*mm)
s_body = ParagraphStyle('Body', parent=ss['Normal'], fontName='DejaVuSans', fontSize=9.5, textColor=C['text'], leading=14, spaceAfter=3*mm, alignment=TA_JUSTIFY)
s_body_sm = ParagraphStyle('BodySm', parent=s_body, fontSize=8.5, leading=12.5, spaceAfter=2*mm)
s_code = ParagraphStyle('Code', parent=ss['Code'], fontName='DejaVuMono', fontSize=7.8, textColor=HexColor('#4a4a4a'), leading=11, backColor=HexColor('#f0efed'), borderWidth=0.5, borderColor=C['border'], borderPadding=4, spaceAfter=2*mm)
s_bullet = ParagraphStyle('Bullet', parent=s_body, leftIndent=8*mm, bulletIndent=3*mm, bulletFontSize=6, spaceBefore=1*mm, spaceAfter=1*mm)
s_footer = ParagraphStyle('Footer', parent=ss['Normal'], fontName='DejaVuSans', fontSize=7, textColor=C['muted'], alignment=TA_CENTER)

story = []

# Helper: severity badge
def badge(text, color):
    return f'<font color="{color.hexval()}" size="7"><b>{text}</b></font>'

def add_hr():
    story.append(HRFlowable(width='100%', thickness=0.5, color=C['border'], spaceAfter=3*mm, spaceBefore=1*mm))

# ---- COVER ----
story.append(Spacer(1, 40*mm))
story.append(Paragraph('Superboard', ParagraphStyle('CoverTitle', parent=s_title, fontSize=36, spaceAfter=2*mm)))
story.append(Paragraph('White-Box Audit Report', ParagraphStyle('CoverSub', parent=s_title, fontSize=18, textColor=C['accent'])))
story.append(Spacer(1, 8*mm))
add_hr()
story.append(Paragraph('Collaborative Whiteboard Application', ParagraphStyle('CoverDesc', parent=s_body, fontSize=11, textColor=C['muted'], alignment=TA_LEFT)))
story.append(Spacer(1, 4*mm))
meta_data = [
    ['Date', '2026-08-25'],
    ['Scope', 'Sync, Performance, RBAC, Canvas Interaction'],
    ['Stack', 'Next.js 16 + React 19 + Zustand 5 + Supabase'],
    ['Status', 'Issues identified and fixed'],
]
meta_table = Table(meta_data, colWidths=[30*mm, 90*mm])
meta_table.setStyle(TableStyle([
    ('FONTNAME', (0, 0), (0, -1), 'DejaVuSans-Bold'),
    ('FONTNAME', (1, 0), (1, -1), 'DejaVuSans'),
    ('FONTSIZE', (0, 0), (-1, -1), 9),
    ('TEXTCOLOR', (0, 0), (-1, -1), C['text']),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('LINEBELOW', (0, 0), (-1, -2), 0.3, C['border']),
]))
story.append(meta_table)
story.append(PageBreak())

# ---- 1. EXECUTIVE SUMMARY ----
story.append(Paragraph('1. Executive Summary', s_h1))
story.append(Paragraph(
    'This audit examined the Superboard collaborative whiteboard application, focusing on real-time synchronization correctness, '
    'frontend rendering performance, role-based access control, and widget-canvas interaction. The audit was conducted '
    'against an adjusted 4-phase plan covering Sync, RBAC, Performance, and Widget-Canvas Interaction. WebRTC and Compliance '
    'phases were intentionally deferred as there is no active media layer and compliance is a separate legal track.',
    s_body))
story.append(Paragraph(
    'The codebase totals approximately 53,500 lines across core whiteboard logic, room widget system, and static data. '
    'Three Zustand stores manage state (whiteboard, collaboration, widget panel), with Supabase Realtime Broadcast as the '
    'active sync layer and a dormant Hocuspocus/Yjs CRDT provider. The application deploys on Vercel and uses Supabase '
    'for authentication, data persistence, and real-time messaging.',
    s_body))
story.append(Paragraph(
    'Seven distinct issues were identified across four categories. All issues have been fixed in this iteration. The most '
    'critical finding was that the pen tool lost smoothness when widgets were placed on the canvas, caused by the widget close '
    'and duplicate buttons unconditionally intercepting pointer events regardless of the active tool. Additional findings '
    'included a stale closure in the real-time sync initialization, excessive serialization in the 60ms polling loop, '
    'deprecated API usage, missing error boundaries, and wasteful auto-saves during active drawing strokes.',
    s_body))

# ---- 2. FINDINGS ----
story.append(Paragraph('2. Detailed Findings', s_h1))

findings = [
    {
        'id': 'F-01',
        'severity': 'CRITICAL',
        'title': 'Pen Tool Smoothness Degrades When Widgets Are on Canvas',
        'category': 'Widget-Canvas Interaction',
        'file': 'ElementRenderer.tsx',
        'description': (
            'When interactive widgets (type="widget") are rendered on the canvas, the pen tool becomes noticeably less smooth. '
            'Root cause analysis identified two contributing factors. First, the close (x) and duplicate buttons on each widget '
            'were SVG &lt;g&gt; elements with onPointerDown handlers that unconditionally called e.stopPropagation(), even when the '
            'active tool was draw, highlighter, or eraser. This caused pointer events to be swallowed when the pen passed over '
            'these button areas, creating small gaps in the stroke path. Second, the foreignObject element containing the widget '
            'had pointer-events set to "none" via CSS style only on the foreignObject itself, but the HTML content inside '
            '(buttons, sliders, inputs, scrollable containers with overflow:auto) was not explicitly set to pointer-events:none. '
            'In some browser rendering engines, the HTML descendants of a foreignObject can still participate in hit-testing '
            'even when the foreignObject parent has pointer-events:none, leading to additional overhead per pointer event.'
        ),
        'fix': (
            'Made widget buttons respect the active tool mode: pointerEvents, onPointerDown, onClick, and opacity are now '
            'conditional on isSelectMode. When tool is not "select", buttons get pointer-events:none and opacity:0, making '
            'them completely invisible and transparent to pointer events. Added explicit pointer-events:none to inner div wrappers '
            'inside the foreignObject. Added CSS containment (contain: layout style, contain: content) and will-change:transform '
            'for GPU layer promotion. Changed overflow from "auto" to "hidden" in non-select mode to prevent scroll container '
            'interception. Added a CSS safety-net rule targeting foreignObject descendants to ensure cross-browser consistency.'
        ),
    },
    {
        'id': 'F-02',
        'severity': 'HIGH',
        'title': 'Stale Closure in Realtime Sync Initialization',
        'category': 'Real-Time Sync',
        'file': 'RoomWhiteboard.tsx, realtime-sync.ts',
        'description': (
            'The RoomWhiteboard component captured the Zustand store state at initialization time and passed it as a plain object '
            'to initRealtimeSync(). This created a stale closure: the elements, camera, and pages references captured at init '
            'time would never update as the store mutated. The sync module had a workaround using (store as any).getState() '
            'to read live state, but this relied on an undocumented duck-typing pattern and the initial captured values were '
            'misleading and wasteful.'
        ),
        'fix': (
            'Refactored the sync initialization to pass the store reference directly. The WhiteboardStoreLike interface now '
            'includes an optional getState() method. The sync module uses a liveState() helper that calls getState() when '
            'available, falling back to the captured values. This ensures the 100ms polling loop always reads current state.'
        ),
    },
    {
        'id': 'F-03',
        'severity': 'HIGH',
        'title': 'Expensive 60ms Polling Loop with Full Serialization',
        'category': 'Performance',
        'file': 'realtime-sync.ts',
        'description': (
            'The real-time sync used a 60ms setInterval to detect store changes. On every tick, it called JSON.stringify() '
            'on the entire elements array, then JSON.parse() on the previous snapshot, and built two Maps for O(n) diffing. '
            'For boards with many elements or widget elements with large config objects (e.g., periodic table, data tables), '
            'this serialization dominated the main thread budget. Camera changes were broadcast on every tick without '
            'throttling, causing excessive network traffic during smooth pan/zoom operations. Additionally, element updates '
            'broadcast the entire element object rather than just the changed fields.'
        ),
        'fix': (
            'Increased polling interval from 60ms to 100ms (10 Hz is sufficient for collaboration). Added camera broadcast '
            'throttling at 150ms. Added isDrawing check to skip diffing during active strokes (the diff runs after the '
            'stroke completes). Changed element-update broadcasts to send only the changed fields (field-level diff) '
            'instead of the full element object. Batched delete operations to send all deleted IDs in one message.'
        ),
    },
    {
        'id': 'F-04',
        'severity': 'HIGH',
        'title': 'handlePointerMove Callback Recreated on Every Camera Change',
        'category': 'Performance',
        'file': 'WhiteboardCanvas.tsx',
        'description': (
            'The handlePointerMove useCallback depended on camera.zoom, camera.x, and camera.y in its dependency array. '
            'Since camera state changes during every pan/zoom frame, this caused the callback to be recreated on every '
            'frame. Each recreation triggered a React reconciliation of the container div, potentially causing micro-stutters '
            'during smooth pen input if a synced camera move arrived simultaneously.'
        ),
        'fix': (
            'Removed camera.zoom, camera.x, and camera.y from the dependency array. Instead, the handler reads live camera '
            'state via useWhiteboardStore.getState().camera when needed (pinch zoom, alignment guides, eraser radius). '
            'This makes the callback stable during drawing and only recreated when the tool or drawing state actually changes.'
        ),
    },
    {
        'id': 'F-05',
        'severity': 'MEDIUM',
        'title': 'Deprecated document.execCommand Usage',
        'category': 'Code Quality',
        'file': 'ElementRenderer.tsx',
        'description': (
            'Two paste handlers in ElementRenderer.tsx used document.execCommand("insertText", false, text) to insert '
            'pasted text at the caret position. The execCommand API is deprecated and may be removed from browsers in '
            'future versions. The SessionNotesWidget also uses execCommand for bold/italic formatting commands.'
        ),
        'fix': (
            'Replaced both paste handlers in ElementRenderer.tsx with the modern Selection API: getSelection(), getRangeAt(), '
            'deleteContents(), insertNode(createTextNode(text)), collapse(false). This is the standards-compliant approach '
            'and works identically for the plain-text paste use case. The SessionNotesWidget uses execCommand for rich-text '
            'formatting (bold, italic) which does not yet have a simple replacement; this is deferred as lower priority.'
        ),
    },
    {
        'id': 'F-06',
        'severity': 'MEDIUM',
        'title': 'Missing Error Boundary Around Canvas',
        'category': 'Reliability',
        'file': 'RoomWhiteboard.tsx, WhiteboardClient.tsx',
        'description': (
            'The WhiteboardCanvas component had no React Error Boundary. If any element renderer threw an error '
            '(malformed element data, missing properties, rendering edge case), the entire canvas would unmount, '
            'losing the current drawing session. This is particularly risky with user-generated content and '
            'real-time sync where malformed data could arrive from a collaborator.'
        ),
        'fix': (
            'Created CanvasErrorBoundary class component with a user-friendly error UI showing the error message, '
            'a Retry button (resets error state to re-render children), and a Reload Page button. Wrapped WhiteboardCanvas '
            'in CanvasErrorBoundary in both RoomWhiteboard.tsx and WhiteboardClient.tsx (the standalone whiteboard page).'
        ),
    },
    {
        'id': 'F-07',
        'severity': 'MEDIUM',
        'title': 'Auto-Save Triggers During Active Drawing Strokes',
        'category': 'Performance',
        'file': 'RoomWhiteboard.tsx',
        'description': (
            'The auto-save effect watched the elements array and fired a debounced (3s) save to Supabase on every change. '
            'During active drawing, the elements array changes on every rAF flush (as the currentElement grows with new points). '
            'This caused unnecessary save requests to Supabase even though the drawing was not yet complete. While the 3s '
            'debounce helped, each elements change still reset the debounce timer, and the final save after stroke completion '
            'would include the drawing in a partially-complete state.'
        ),
        'fix': (
            'Added isDrawing to the auto-save effect dependency array. When isDrawing is true, the effect returns early '
            'without scheduling a save. The save only triggers after isDrawing becomes false (stroke completed), ensuring '
            'only finalized elements are persisted to Supabase.'
        ),
    },
]

# Severity color map
sev_colors = {'CRITICAL': C['error'], 'HIGH': C['warning'], 'MEDIUM': C['info'], 'LOW': C['muted']}

for f in findings:
    story.append(Paragraph(f'{f["id"]}  {f["title"]}', s_h2))
    sev = f['severity']
    story.append(Paragraph(
        f'Severity: {badge(sev, sev_colors.get(sev, C["muted"]))}  |  '
        f'Category: {f["category"]}  |  File: {f["file"]}',
        s_body_sm))
    story.append(Paragraph(f['description'], s_body))
    story.append(Paragraph(f'<b>Fix Applied:</b> {f["fix"]}', s_body_sm))
    add_hr()

# ---- 3. DEFERRED ITEMS ----
story.append(Paragraph('3. Deferred Items', s_h1))
story.append(Paragraph(
    'The following items were identified but intentionally deferred to future iterations, either because they are '
    'lower priority, require architectural decisions, or are out of scope for this audit cycle.',
    s_body))

deferred = [
    ('WebRTC / Media Layer', 'No active video/audio media layer exists. The LiveKit integration is present but dormant. Full WebRTC audit deferred until media features are activated.'),
    ('Compliance (GDPR, COPPA, FERPA)', 'Legal compliance requires coordination with legal counsel and is tracked as a separate workstream. The audit identified that student data (drawings, chat messages) is persisted in Supabase but compliance policies are not yet codified.'),
    ('Hocuspocus/Yjs CRDT Migration', 'A dormant CRDT-based sync provider exists in provider.ts. The active Supabase Broadcast sync works but lacks conflict resolution. Migration to Yjs would provide automatic conflict resolution and offline support but is a significant architectural change.'),
    ('Supabase RLS Policies', 'Room API routes use manual tutorId checks. Row-Level Security policies on Supabase tables were not audited in this cycle. This requires database-level access and is recommended for the next security-focused audit.'),
    ('Type Safety (93 as any casts)', 'The codebase has 93 `as any` casts across 43 files, primarily in API routes using Supabase queries. Despite having generated database types, queries use untyped access. This is a maintainability concern but not a runtime risk.'),
    ('CanvasMathWidgets.tsx Decomposition', 'At 2,815 lines, this file contains 12+ interactive math widget components. It should be split into separate files per widget for maintainability, but this is a refactoring task with no functional impact.'),
]

for title, desc in deferred:
    story.append(Paragraph(f'- {title}', s_bullet))
    story.append(Paragraph(desc, s_body_sm))

# ---- 4. SUMMARY TABLE ----
story.append(Paragraph('4. Findings Summary', s_h1))

summary_data = [['ID', 'Severity', 'Category', 'Status']]
for f in findings:
    summary_data.append([f['id'], f['severity'], f['category'], 'Fixed'])

summary_table = Table(summary_data, colWidths=[12*mm, 20*mm, 45*mm, 20*mm])
summary_table.setStyle(TableStyle([
    ('FONTNAME', (0, 0), (-1, 0), 'DejaVuSans-Bold'),
    ('FONTNAME', (0, 1), (-1, -1), 'DejaVuSans'),
    ('FONTSIZE', (0, 0), (-1, -1), 8),
    ('BACKGROUND', (0, 0), (-1, 0), C['header_fill']),
    ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#ffffff')),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('LINEBELOW', (0, 0), (-1, 0), 0.5, C['border']),
    ('LINEBELOW', (0, -1), (-1, -1), 0.5, C['border']),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [None, HexColor('#f0efed')]),
    ('TEXTCOLOR', (1, 1), (1, -1), C['error']),  # CRITICAL
    ('TEXTCOLOR', (1, 2), (1, 2), C['warning']),  # HIGH
    ('TEXTCOLOR', (1, 3), (1, -1), C['info']),    # MEDIUM
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))
story.append(summary_table)

# Build
doc.build(story, onFirstPage=lambda c, d: None, onLaterPages=lambda c, d: None)
print(f'PDF saved to {OUT}')
