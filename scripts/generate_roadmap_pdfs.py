#!/usr/bin/env python3
"""Generate Superboard Phase Overview PDF and Detailed Phase Plan PDF."""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY

FONT_DIR = '/usr/share/fonts'

# ---- Colors ----
PRIMARY = HexColor('#059669')
PRIMARY_DARK = HexColor('#047857')
PRIMARY_LIGHT = HexColor('#d1fae5')
DARK = HexColor('#111827')
MUTED = HexColor('#6b7280')
BORDER = HexColor('#e5e7eb')
BG_LIGHT = HexColor('#f0fdf4')
WHITE = HexColor('#ffffff')
ACCENT_BLUE = HexColor('#3b82f6')
ACCENT_PURPLE = HexColor('#8b5cf6')
ACCENT_ORANGE = HexColor('#f97316')
ACCENT_RED = HexColor('#ef4444')
ACCENT_TEAL = HexColor('#0ea5e9')
PHASE_COLORS = ['#059669', '#3b82f6', '#8b5cf6', '#f97316', '#ef4444', '#0ea5e9']
PHASE_LABELS = [
    'Phase 1: Core Whiteboard',
    'Phase 2: Virtual Classroom',
    'Phase 3: Monetization',
    'Phase 4: SDK & Marketplace',
    'Phase 5: Enterprise',
    'Phase 6: Ecosystem',
]

# ---- Font Registration ----
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

pdfmetrics.registerFont(TTFont('DejaVuSans', f'{FONT_DIR}/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', f'{FONT_DIR}/truetype/dejavu/DejaVuSans-Bold.ttf'))
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans-Bold')

# ---- Styles ----
styles = getSampleStyleSheet()

def make_styles():
    s = {}
    s['title'] = ParagraphStyle('Title', fontName='DejaVuSans-Bold', fontSize=28, leading=34, textColor=DARK, spaceAfter=6, alignment=TA_LEFT)
    s['subtitle'] = ParagraphStyle('Subtitle', fontName='DejaVuSans', fontSize=14, leading=20, textColor=MUTED, spaceAfter=20)
    s['h1'] = ParagraphStyle('H1', fontName='DejaVuSans-Bold', fontSize=20, leading=26, textColor=DARK, spaceBefore=20, spaceAfter=10)
    s['h2'] = ParagraphStyle('H2', fontName='DejaVuSans-Bold', fontSize=15, leading=20, textColor=PRIMARY_DARK, spaceBefore=14, spaceAfter=8)
    s['h3'] = ParagraphStyle('H3', fontName='DejaVuSans-Bold', fontSize=12, leading=16, textColor=DARK, spaceBefore=10, spaceAfter=6)
    s['body'] = ParagraphStyle('Body', fontName='DejaVuSans', fontSize=10, leading=15, textColor=DARK, alignment=TA_JUSTIFY, spaceAfter=8)
    s['body_sm'] = ParagraphStyle('BodySmall', fontName='DejaVuSans', fontSize=9, leading=13, textColor=MUTED, alignment=TA_JUSTIFY, spaceAfter=6)
    s['bullet'] = ParagraphStyle('Bullet', fontName='DejaVuSans', fontSize=10, leading=15, textColor=DARK, leftIndent=18, bulletIndent=6, spaceAfter=4)
    s['caption'] = ParagraphStyle('Caption', fontName='DejaVuSans', fontSize=8, leading=11, textColor=MUTED)
    return s

# ---- Helper Functions ----
def phase_header(number, title, color_hex):
    color = HexColor(color_hex)
    data = [[Paragraph(f'<font color="{color_hex}">Phase {number}</font>', ParagraphStyle('ph', fontName='DejaVuSans-Bold', fontSize=13, leading=16, textColor=color)),
             Paragraph(f'<b>{title}</b>', ParagraphStyle('pt', fontName='DejaVuSans-Bold', fontSize=13, leading=16, textColor=DARK))]]
    t = Table(data, colWidths=[90, 380])
    t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (0,0), 12),
        ('BACKGROUND', (0,0), (0,0), HexColor(color_hex + '18')),
        ('LINEBELOW', (0,0), (-1,-1), 1, HexColor(color_hex + '40')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    return t

def feature_table(features):
    """features: list of (name, description) tuples"""
    data = [['Feature', 'Description']]
    for name, desc in features:
        data.append([Paragraph(f'<b>{name}</b>', ParagraphStyle('fn', fontName='DejaVuSans-Bold', fontSize=9, leading=12, textColor=DARK)),
                     Paragraph(desc, ParagraphStyle('fd', fontName='DejaVuSans', fontSize=9, leading=12, textColor=MUTED))])
    t = Table(data, colWidths=[120, 350])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), HexColor('#f3f4f6')),
        ('FONTNAME', (0,0), (-1,0), 'DejaVuSans-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('TEXTCOLOR', (0,0), (-1,0), DARK),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, HexColor('#fafafa')]),
    ]))
    return t

def bullet_list(items, style=None):
    elements = []
    for item in items:
        elements.append(Paragraph(f'<bullet>&bull;</bullet> {item}', style or styles['bullet']))
    return elements

# =====================================================================
# PDF 1: ALL PHASES OVERVIEW
# =====================================================================

def build_pdf1():
    output_path = '/home/z/my-project/download/Superboard-All-Phases-Overview.pdf'
    st = make_styles()
    story = []

    # ---- Cover ----
    story.append(Spacer(1, 100))
    story.append(Paragraph('Superboard', ParagraphStyle('cover-title', fontName='DejaVuSans-Bold', fontSize=42, leading=50, textColor=PRIMARY)))
    story.append(Paragraph('Product Roadmap', ParagraphStyle('cover-sub', fontName='DejaVuSans', fontSize=22, leading=28, textColor=DARK)))
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width='60%', thickness=2, color=PRIMARY, spaceAfter=12))
    story.append(Paragraph('6-Phase Strategy: From Whiteboard to Virtual Classroom Ecosystem', st['subtitle']))
    story.append(Spacer(1, 40))
    story.append(Paragraph('A comprehensive overview of all development phases, key milestones, and strategic vision for building an infinitely customizable whiteboard foundation into a self-contained virtual classroom platform with SDK extensibility and marketplace ecosystem.', st['body']))
    story.append(Spacer(1, 60))
    story.append(Paragraph('Confidential  |  2026', st['caption']))
    story.append(PageBreak())

    # ---- Introduction ----
    story.append(Paragraph('Introduction', st['h1']))
    story.append(Paragraph(
        'Superboard is not just another whiteboard application. It is an infinitely customizable collaborative canvas designed to serve as the foundational layer for a complete virtual classroom platform. The product vision extends far beyond basic drawing tools: Superboard aims to become the definitive platform for online tutoring, academic collaboration, and interactive learning experiences. This roadmap outlines a six-phase strategy that progresses from a rock-solid core whiteboard through classroom features, monetization, SDK extraction, enterprise deployment, and finally a full ecosystem with marketplace and community.',
        st['body']
    ))
    story.append(Paragraph(
        'Each phase is designed to be self-contained and deliverable, with clear milestones and measurable outcomes. The phases are sequential but overlapping: Phase 2 planning begins while Phase 1 is being polished, and Phase 3 monetization experiments can start as soon as core classroom features are stable. The ultimate competitive moat is not the whiteboard itself, but the tutoring-specific classroom context that no general-purpose tool provides: role-based permissions, session management, student progress tracking, assessment tools, and the deep integrations that make a virtual classroom feel like a real classroom rather than a glorified Zoom call with a shared canvas.',
        st['body']
    ))

    # ---- Phase Summaries Table ----
    story.append(Spacer(1, 10))
    story.append(Paragraph('Phase Summary', st['h1']))
    summary_data = [['Phase', 'Focus', 'Key Outcome', 'Timeline']]
    summary_data.append(['1', 'Core Whiteboard', 'Production-ready infinite canvas with all tools', 'Current'])
    summary_data.append(['2', 'Virtual Classroom', 'Real-time collaboration, auth, video, chat', '3-4 months'])
    summary_data.append(['3', 'Monetization', 'Subscription tiers, usage billing, freemium', '1-2 months'])
    summary_data.append(['4', 'SDK & Marketplace', 'Plugin system, public SDK, developer portal', '2-3 months'])
    summary_data.append(['5', 'Enterprise', 'SSO, admin dashboards, compliance, analytics', '2-3 months'])
    summary_data.append(['6', 'Ecosystem', 'Community, curriculum marketplace, API platform', 'Ongoing'])

    st = make_styles()
    summary_table = Table(summary_data, colWidths=[40, 110, 220, 80])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('TEXTCOLOR', (0,0), (-1,0), WHITE),
        ('FONTNAME', (0,0), (-1,0), 'DejaVuSans-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, HexColor('#f0fdf4')]),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 6))
    story.append(Paragraph('Table 1: Six-phase roadmap summary with estimated timelines', st['caption']))
    story.append(PageBreak())

    # ---- Phase 1 ----
    story.append(phase_header(1, 'Core Whiteboard', PHASE_COLORS[0]))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        'Phase 1 is the foundation upon which everything else is built. The whiteboard must be infinitely customizable because every future feature, from assessment widgets to video embeds to collaborative cursors, will either live on or around the canvas. This means the architecture must support a widget/plugin system from day one, even if the public SDK is not extracted until Phase 4. The whiteboard itself must be flawless: smooth drawing with stylus pressure sensitivity, all shape tools, text editing, sticky notes, image embedding, multi-page support, undo/redo, export to PNG/SVG/JSON, keyboard shortcuts, presentation mode, and both light and dark themes.',
        st['body']
    ))
    story.append(Paragraph(
        'The Phase 1 audit identified and fixed several categories of issues: a critical XSS vulnerability in text and sticky note rendering (now sanitized), broken export support for freehand strokes and complex shapes (now fully supported), a non-functional upload image button in the top bar menu (now working), a shortcuts dialog that advertised unimplemented features like alignment shortcuts and media embedding (now cleaned to only show real shortcuts), performance issues from whole-store Zustand subscriptions (now using selector slices), and orphaned elements left behind when pages are deleted (now properly cleaned up). Additional minor fixes included removing dead proxy code, synchronizing sticky note color lists between components, and adding dark mode support to the shortcuts dialog.',
        st['body']
    ))
    story.append(feature_table([
        ('Drawing Engine', 'Freehand pen with stylus pressure simulation, highlighter with transparency, eraser with point-level splitting'),
        ('Shape Tools', 'Rectangle, ellipse, diamond, triangle, line, arrow, frame with shift-constrain'),
        ('Text & Sticky', 'Rich text editing with font/size/alignment, sticky notes with color picker'),
        ('Multi-Page', 'Add, rename, delete, switch between unlimited pages'),
        ('Export', 'PNG, JPEG, SVG, JSON with full element type support'),
        ('Collaboration-Ready', 'Zustand architecture designed for real-time sync, element locking, cursors'),
    ]))
    story.append(PageBreak())

    # ---- Phase 2 ----
    story.append(phase_header(2, 'Virtual Classroom', PHASE_COLORS[1]))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        'Phase 2 transforms the whiteboard into a virtual classroom. This is where Superboard differentiates from every generic whiteboard on the market. The feature set spans ten major categories: authentication and role-based access control (tutor, student, admin roles with permission tiers), session management (scheduled sessions with start/end, waiting rooms, session recordings), real-time collaboration (multiplayer cursors, presence indicators, element locking, conflict resolution), student management (rosters, profiles, progress tracking), video and audio (WebRTC integration, grid/speaker/gallery layouts), chat (text, emoji reactions, file sharing, pinned messages), interactive widgets (polls, quizzes, timers, breakouts), whiteboard-specific classroom tools (laser pointers with presenter-only visibility, spotlight mode, page-based presentations), recording and playback (session recording with whiteboard state timeline, student review access), and persistent boards (save/resume across sessions, template library, shared boards).',
        st['body']
    ))
    story.append(Paragraph(
        'The strategic decision to build the product first and extract the SDK later is critical here. Phase 2 features will inform the SDK API design: if real-time collaboration requires fine-grained element locking, the SDK must expose those primitives. If assessment widgets need custom rendering hooks, the plugin system must support them. Every Phase 2 feature is a use case that validates and refines the underlying architecture.',
        st['body']
    ))
    story.append(feature_table([
        ('Auth & Roles', 'Email/password, OAuth, role-based access: tutor, student, admin with permission tiers'),
        ('Sessions', 'Scheduling, waiting rooms, timed sessions, session state persistence'),
        ('Real-Time Collab', 'Multiplayer cursors, presence indicators, element locking, conflict resolution'),
        ('Video/Audio', 'WebRTC integration with grid, speaker, and gallery layouts'),
        ('Chat & Reactions', 'Text chat, emoji reactions, file sharing, pinned messages'),
        ('Widgets', 'Polls, quizzes, countdown timers, breakout rooms, screen sharing'),
        ('Recording', 'Session recording with whiteboard state timeline for playback'),
        ('Persistent Boards', 'Save/resume boards across sessions, board templates, shared libraries'),
    ]))
    story.append(PageBreak())

    # ---- Phase 3 ----
    story.append(phase_header(3, 'Monetization', PHASE_COLORS[2]))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        'Phase 3 introduces revenue generation through a multi-tier subscription model. The pricing strategy targets three segments: individual tutors ($15-25/month) with core classroom features, small academies ($49-99/month) with team management and analytics, and enterprise institutions ($299+/month) with custom integrations and dedicated support. A freemium tier offers limited sessions and basic whiteboard access to drive adoption. The subscription system uses Stripe for billing with usage-based metering for recording storage, session hours, and board storage. Annual billing offers a 20% discount to reduce churn. The key principle is that the whiteboard itself remains free and unlimited as a standalone tool; monetization comes from classroom-specific features that provide clear value to paying users.',
        st['body']
    ))
    story.append(feature_table([
        ('Tutor Plan ($15-25/mo)', 'Unlimited sessions, recording, all widgets, basic analytics'),
        ('Academy Plan ($49-99/mo)', 'Team management, student roster, advanced analytics, custom branding'),
        ('Enterprise Plan ($299+/mo)', 'SSO, API access, dedicated support, SLA, custom integrations'),
        ('Freemium Tier', 'Basic whiteboard, 3 sessions/month, limited recording, no widgets'),
        ('Billing Engine', 'Stripe integration, usage metering, annual discount, invoice management'),
    ]))
    story.append(Spacer(1, 10))

    # ---- Phase 4 ----
    story.append(phase_header(4, 'SDK & Marketplace', PHASE_COLORS[3]))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        'Phase 4 extracts the whiteboard engine into a free, open-source SDK and launches a marketplace for paid plugins. The SDK decision is strategic: the SDK is free forever to maximize adoption and ecosystem growth, while revenue comes from the classroom subscription tiers and a 30% commission on marketplace plugins. The plugin system supports three types: renderers (custom element types like LaTeX formulas or music notation), tools (custom toolbar items like protractors or graphing calculators), and extensions (features that modify canvas behavior like auto-layout or snap-to-grid enhancements). A developer portal provides documentation, API reference, plugin templates, sandbox testing, and analytics on plugin installs and revenue.',
        st['body']
    ))
    story.append(feature_table([
        ('Open SDK', 'Free, well-documented SDK for embedding whiteboard in any web application'),
        ('Plugin System', 'Three plugin types: renderers, tools, extensions with sandboxed execution'),
        ('Marketplace', 'Plugin store with ratings, reviews, revenue sharing (70/30 split)'),
        ('Developer Portal', 'API docs, plugin templates, sandbox, analytics dashboard'),
        ('Versioning', 'Semantic versioning, backward compatibility guarantees, migration guides'),
    ]))
    story.append(PageBreak())

    # ---- Phase 5 ----
    story.append(phase_header(5, 'Enterprise', PHASE_COLORS[4]))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        'Phase 5 targets institutional adoption with enterprise-grade features: SSO integration (SAML 2.0, OIDC, Active Directory), LMS integration (Canvas, Moodle, Blackboard), admin dashboards with usage analytics and compliance reporting, data residency controls, audit logging, and dedicated account management. Enterprise customers require reliability guarantees: 99.9% uptime SLA, SOC 2 Type II compliance, GDPR compliance, and FERPA compliance for educational data. The enterprise tier also includes custom branding (white-label options), advanced analytics (engagement metrics, learning outcome correlations), and priority support with dedicated customer success managers.',
        st['body']
    ))
    story.append(feature_table([
        ('SSO Integration', 'SAML 2.0, OpenID Connect, Active Directory, Google Workspace'),
        ('LMS Connectors', 'Canvas LTI, Moodle, Blackboard, Google Classroom integration'),
        ('Admin Dashboard', 'Usage analytics, user management, compliance reporting, audit logs'),
        ('Compliance', 'SOC 2 Type II, GDPR, FERPA, data residency controls'),
        ('SLA & Support', '99.9% uptime, dedicated CSM, priority support, onboarding'),
    ]))
    story.append(Spacer(1, 10))

    # ---- Phase 6 ----
    story.append(phase_header(6, 'Ecosystem', PHASE_COLORS[5]))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        'Phase 6 is the long-term vision: transforming Superboard from a product into an ecosystem. This includes a curriculum marketplace where educators share and sell lesson templates, a community platform with forums, tutorials, and user-generated content, an API platform for third-party integrations, mobile SDKs for iOS and Android, and AI-powered features like smart tutoring assistance, automated lesson generation, and real-time feedback. The ecosystem phase also includes internationalization (multi-language support, RTL layouts), accessibility (WCAG 2.1 AA compliance, screen reader support), and advanced collaboration features like branching boards for group work, cross-session analytics, and longitudinal student progress tracking across multiple tutoring engagements.',
        st['body']
    ))
    story.append(feature_table([
        ('Curriculum Marketplace', 'Share and sell lesson templates, worksheets, interactive exercises'),
        ('Community Platform', 'Forums, tutorials, user-generated content, mentorship programs'),
        ('Mobile SDKs', 'Native iOS and Android SDKs with offline support and sync'),
        ('AI Features', 'Smart tutoring assistance, automated lesson generation, real-time feedback'),
        ('I18n & Accessibility', 'Multi-language, RTL, WCAG 2.1 AA, screen reader support'),
    ]))

    # ---- Build ----
    doc = SimpleDocTemplate(output_path, pagesize=A4, topMargin=25*mm, bottomMargin=20*mm, leftMargin=20*mm, rightMargin=20*mm)
    doc.build(story)
    print(f'PDF 1 saved: {output_path}')
    return output_path

# =====================================================================
# PDF 2: DETAILED PHASE PLAN
# =====================================================================

def build_pdf2():
    output_path = '/home/z/my-project/download/Superboard-Detailed-Phase-Plan.pdf'
    st = make_styles()
    story = []

    # ---- Cover ----
    story.append(Spacer(1, 100))
    story.append(Paragraph('Superboard', ParagraphStyle('cover-title', fontName='DejaVuSans-Bold', fontSize=42, leading=50, textColor=PRIMARY)))
    story.append(Paragraph('Detailed Phase Plan', ParagraphStyle('cover-sub', fontName='DejaVuSans', fontSize=22, leading=28, textColor=DARK)))
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width='60%', thickness=2, color=PRIMARY, spaceAfter=12))
    story.append(Paragraph('Extensive Feature Specifications, Technical Architecture, and Implementation Details for All Six Development Phases', st['subtitle']))
    story.append(Spacer(1, 40))
    story.append(Paragraph('This document provides the comprehensive technical and strategic blueprint for each phase of Superboard development. It is intended as the definitive reference for implementation planning, resource allocation, and milestone tracking throughout the product lifecycle.', st['body']))
    story.append(Spacer(1, 60))
    story.append(Paragraph('Confidential  |  2026', st['caption']))
    story.append(PageBreak())

    # ---- Table of Contents (manual since no TocDocTemplate) ----
    story.append(Paragraph('Table of Contents', st['h1']))
    toc_items = [
        '1. Phase 1: Core Whiteboard (Current)',
        '    1.1 Architecture Overview',
        '    1.2 Feature Inventory and Status',
        '    1.3 Audit Results and Fixes Applied',
        '    1.4 Remaining Improvements',
        '2. Phase 2: Virtual Classroom',
        '    2.1 Authentication and Role System',
        '    2.2 Session Management',
        '    2.3 Real-Time Collaboration',
        '    2.4 Student Management',
        '    2.5 Video and Audio Integration',
        '    2.6 Chat System',
        '    2.7 DejaVuactive Widgets',
        '    2.8 Recording and Playback',
        '    2.9 Persistent Boards',
        '3. Phase 3: Monetization',
        '4. Phase 4: SDK and Marketplace',
        '5. Phase 5: Enterprise',
        '6. Phase 6: Ecosystem',
    ]
    for item in toc_items:
        indent = 30 if item.startswith('    ') else 10
        s = ParagraphStyle('toc', fontName='DejaVuSans', fontSize=10, leading=16, textColor=DARK, leftIndent=indent, spaceAfter=2)
        story.append(Paragraph(item.strip(), s))
    story.append(PageBreak())

    # =================================================================
    # PHASE 1: DETAILED
    # =================================================================
    story.append(phase_header(1, 'Core Whiteboard (Current Phase)', PHASE_COLORS[0]))
    story.append(Spacer(1, 8))

    story.append(Paragraph('1.1 Architecture Overview', st['h2']))
    story.append(Paragraph(
        'Superboard is built on a modern web stack: Next.js 16 with React Server Components, TypeScript for type safety, Zustand for state management, Tailwind CSS for utility styling, and Vercel for deployment. The canvas rendering uses SVG with the perfect-freehand library for natural-looking pen strokes. The architecture follows a clear separation of concerns: the Zustand store holds all application state (elements, camera, tools, history, pages), the WhiteboardCanvas component handles pointer events and dispatches to the store, the ElementRenderer converts element data to SVG elements, and the LeftToolbar/StylePanel/TopBar handle user interface controls. This separation ensures that each component can be tested, replaced, or extended independently.',
        st['body']
    ))
    story.append(Paragraph(
        'The state management uses Zustand with selector slices for performance optimization. Each component subscribes only to the specific state slices it needs, preventing unnecessary re-renders when unrelated state changes. The history system uses a 50-entry undo/redo stack with JSON deep-cloning for snapshot immutability. The camera system supports smooth animated zoom and pan using requestAnimationFrame with ease-out cubic interpolation. Multi-page support stores elements with a pageIndex property, allowing seamless switching between pages with full state preservation.',
        st['body']
    ))

    story.append(Paragraph('1.2 Feature Inventory and Status', st['h2']))
    story.append(Paragraph(
        'The current implementation supports 16 distinct element types, each with full rendering, selection, manipulation, and export support. The drawing engine supports both mouse and stylus input with automatic pressure simulation for mouse users (consistent line width) and real pressure sensitivity for stylus users (natural variation via thinning parameter). The eraser uses a sophisticated point-level splitting algorithm that divides freehand strokes at eraser boundaries, preserving the smooth curve of the remaining segments rather than simply removing entire strokes. Palm rejection prevents accidental drawing from touch events by checking pointer type and contact area dimensions.',
        st['body']
    ))

    feature_status = [
        ['Freehand Pen', 'Complete', 'Pressure simulation, smooth SVG paths, full export'],
        ['Highlighter', 'Complete', 'Semi-transparent, multiply blend mode, flat pressure'],
        ['Eraser', 'Complete', 'Point-level splitting, configurable sizes, visual cursor'],
        ['Rectangle', 'Complete', 'Shift-constrain to square, resize handles, export'],
        ['Ellipse', 'Complete', 'Shift-constrain to circle, resize handles, export'],
        ['Diamond', 'Complete', 'SVG path generation, resize handles, export'],
        ['Triangle', 'Complete', 'SVG path generation, resize handles, export'],
        ['Line', 'Complete', 'Two-point, resize/move, export'],
        ['Arrow', 'Complete', 'Arrowhead rendering, resize/move, export'],
        ['Text', 'Complete', 'Rich text, font/size/alignment, double-click edit'],
        ['Sticky Note', 'Complete', 'Color picker, text editing, shadow rendering'],
        ['Image', 'Complete', 'Upload, scale, aspect ratio, drag to place'],
        ['Frame', 'Complete', 'Dashed border, named, auto-placed'],
        ['Laser Pointer', 'Complete', 'Red glow, fade-out animation, no export'],
        ['Select', 'Complete', 'Hit testing, multi-select, box select, alignment guides'],
        ['Hand/Pan', 'Complete', 'Space+drag, middle-mouse, pinch-to-zoom'],
    ]
    data = [['Tool', 'Status', 'Details']]
    for row in feature_status:
        status_color = '#059669' if row[1] == 'Complete' else '#f97316'
        data.append([
            Paragraph(f'<b>{row[0]}</b>', ParagraphStyle('tn', fontName='DejaVuSans-Bold', fontSize=9, leading=12)),
            Paragraph(f'<font color="{status_color}">{row[1]}</font>', ParagraphStyle('ts', fontName='DejaVuSans-Bold', fontSize=9, leading=12)),
            Paragraph(row[2], ParagraphStyle('td', fontName='DejaVuSans', fontSize=8, leading=11, textColor=MUTED)),
        ])
    t = Table(data, colWidths=[90, 60, 320])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), HexColor('#f3f4f6')),
        ('FONTNAME', (0,0), (-1,0), 'DejaVuSans-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, HexColor('#fafafa')]),
    ]))
    story.append(t)
    story.append(Spacer(1, 6))
    story.append(Paragraph('Table 1: Complete feature inventory with implementation status', st['caption']))

    story.append(Paragraph('1.3 Audit Results and Fixes Applied', st['h2']))
    story.append(Paragraph(
        'A comprehensive Phase 1 audit was conducted covering all whiteboard source files. The audit identified 1 critical issue, 33 important issues, and 15 minor issues. All critical and important issues have been resolved, and key minor issues have been addressed. The following summarizes the major findings and their resolutions:',
        st['body']
    ))

    audit_items = [
        ('<b>Critical - XSS Vulnerability:</b> Text and sticky note elements used dangerouslySetInnerHTML with unsanitized user content, allowing potential script injection. Fixed by adding a sanitizeText() function that escapes HTML special characters (&lt;, &gt;, &amp;, &quot;, &#039;) before rendering. This sanitization is applied in both the ElementRenderer component and the export module.'),
        ('<b>Text Double-Click Editing:</b> The onDoubleClick handler attempted to query elements by a data-element-id attribute that was never set on the SVG groups. Fixed by wrapping each ElementRenderer in a g element with data-element-id, updating the double-click handler to find the contenteditable div within that group, and adding cursor placement logic to position the caret at the end of existing text.'),
        ('<b>Export Coverage:</b> The buildExportSvg function had a default case that fell back to basic rect representation for freehand strokes, arrows, diamonds, and triangles. Fixed by adding explicit SVG generation for all element types: freehand paths via getFreehandPath(), diamond and triangle via their path functions, arrows with arrowhead rendering, and proper camera transform application.'),
        ('<b>Upload Image Button:</b> The "Upload Image" menu item in the top bar had an empty onClick handler. Fixed by programmatically creating a file input element, triggering the native file picker, and passing the selected file to the existing handleFileUpload handler via DataTransfer.'),
        ('<b>Shortcuts Dialog:</b> The shortcuts dialog advertised unimplemented features like "Insert Media" (Ctrl+U), "Zoom to Selection" (Shift+2), alignment shortcuts, rotate shortcuts, and "Flatten to Image". Fixed by removing all non-functional entries and adding dark mode support to the dialog styling.'),
        ('<b>Zustand Performance:</b> All components used whole-store Zustand subscriptions (useWhiteboardStore() without selectors), causing re-renders on any state change. Fixed by converting all 60+ store subscriptions to individual selector slices, ensuring each component only re-renders when its specific slice changes.'),
        ('<b>Orphaned Elements:</b> Deleting a page did not remove elements belonging to that page, leaving ghost elements visible on other pages. Fixed by filtering out elements with the deleted page index and re-indexing elements on subsequent pages.'),
        ('<b>Sticky Color Inconsistency:</b> The STICKY_COLORS array in the store (6 colors) did not match the STICKY_COLOR_OPTIONS in the renderer (5 colors). Fixed by synchronizing both arrays to include all 6 colors: yellow, green, blue, red, purple, and orange.'),
        ('<b>Dead Code:</b> The proxy.ts file contained a no-op middleware function with no references. Deleted the file entirely.'),
    ]
    for item in audit_items:
        story.append(Paragraph(f'<bullet>&bull;</bullet> {item}', st['bullet']))

    story.append(Paragraph('1.4 Remaining Improvements', st['h2']))
    story.append(Paragraph(
        'While all critical and important issues have been resolved, there are several enhancement opportunities for future refinement. These are not bugs but areas where the whiteboard experience can be elevated to production-grade quality before Phase 2 begins. The selection system currently lacks snap-to-element guides (snapping to other elements edges and centers in addition to the existing alignment guide lines). The text tool does not show a cursor immediately when the text tool is selected; users must click to create a text element first. Highlighter differentiation could be improved with a distinct toolbar icon and cursor. Shape rotation is not yet supported for non-freehand elements. Sticky notes do not support resize handles. A minimap for navigation when zoomed in on complex boards would improve usability. Dark mode transitions could be smoother with CSS transitions rather than instant toggles. PDF export with proper pagination support for multi-page boards is planned but not yet implemented.',
        st['body']
    ))
    story.append(PageBreak())

    # =================================================================
    # PHASE 2: DETAILED
    # =================================================================
    story.append(phase_header(2, 'Virtual Classroom', PHASE_COLORS[1]))
    story.append(Spacer(1, 8))

    story.append(Paragraph('2.1 Authentication and Role System', st['h2']))
    story.append(Paragraph(
        'The authentication system will support multiple sign-in methods: email/password with JWT tokens, Google OAuth for convenience, and magic links for passwordless access. User accounts include profile information (name, avatar, timezone, language preference) and role assignment. The role-based access control (RBAC) system defines three primary roles: Tutor, Student, and Admin. Tutors have full control over their sessions, boards, and content. They can create sessions, invite students, manage recordings, and customize their classroom environment. Students can view boards, participate in chat, respond to polls and quizzes, use the whiteboard with tutor-granted permissions, and review recordings. Admins manage organizational settings, user accounts, billing, and analytics across all tutors and students in the organization.',
        st['body']
    ))
    story.append(Paragraph(
        'The permission system is granular: each feature can be independently enabled or disabled per role. For example, a tutor can allow students to draw on the whiteboard but prevent them from using the eraser, or allow text input but not sticky notes. Permissions are stored as a bitmask on each session, allowing per-session customization. The API layer validates permissions on every request, preventing unauthorized actions even if the UI fails to hide a control. Session tokens include the user role and permissions, enabling the frontend to adjust the interface without additional API calls.',
        st['body']
    ))

    story.append(Paragraph('2.2 Session Management', st['h2']))
    story.append(Paragraph(
        'Sessions are the core organizational unit of the classroom platform. A session represents a scheduled tutoring engagement with a start time, end time, assigned tutor, invited students, and associated whiteboard state. Sessions can be one-time or recurring (weekly, bi-weekly). Each session gets a unique join link that students can click to enter the classroom. Before a session starts, students see a waiting room with a countdown timer and any pre-loaded materials the tutor has prepared. When the tutor starts the session, all waiting students are admitted simultaneously. Sessions have configurable duration with automatic end warnings (5-minute and 1-minute alerts). When a session ends, the whiteboard state is automatically saved, and if recording was enabled, the recording begins processing.',
        st['body']
    ))

    story.append(Paragraph('2.3 Real-Time Collaboration', st['h2']))
    story.append(Paragraph(
        'Real-time collaboration uses WebSocket connections through a dedicated collaboration server (built on Node.js with ws or Socket.IO). Each connected user sends pointer position updates (throttled to 30fps), element creation/modification/deletion operations, and cursor metadata (name, color, tool selection). The server broadcasts changes to all other participants using a last-writer-wins conflict resolution strategy for simple operations and operational transformation (OT) or conflict-free replicated data types (CRDTs) for concurrent text editing. Element locking prevents simultaneous editing of the same element: when a user selects an element, a lock request is sent to the server, which grants the lock if no other user holds it. Locks are released on deselect or after a 30-second timeout to prevent deadlocks.',
        st['body']
    ))
    story.append(Paragraph(
        'Presence indicators show each connected user as a named cursor on the canvas with their chosen color. The user list panel displays all participants with their connection status, current tool, and last activity time. The tutor can see an aggregate view of student engagement metrics: who is active, who is idle, and who has disconnected. If a student disconnects and reconnects, the canvas state is automatically synchronized to the latest version, with any changes that occurred during the disconnection applied incrementally.',
        st['body']
    ))

    story.append(Paragraph('2.4 Student Management', st['h2']))
    story.append(Paragraph(
        'The student management system provides a centralized roster for each tutor or organization. Student profiles include contact information, enrollment history, session attendance records, and progress tracking data. Progress tracking aggregates metrics across sessions: time spent in sessions, number of sessions attended, whiteboard contributions (elements created, text entered, drawings made), quiz scores, and engagement indicators. Tutors can view individual student dashboards showing learning trajectories and can flag students who may need additional attention based on declining engagement or performance metrics. The system supports bulk operations: importing student lists via CSV, creating groups for differentiated instruction, and sending automated session reminders via email.',
        st['body']
    ))

    story.append(Paragraph('2.5 Video and Audio Integration', st['h2']))
    story.append(Paragraph(
        'Video and audio are implemented using WebRTC through a TURN/STUN server infrastructure. The default layout is a sidebar configuration: the whiteboard occupies the main canvas area while video thumbnails are displayed in a collapsible right panel. Alternative layouts include gallery view (equal-sized video tiles with a smaller whiteboard area), speaker view (large video of the active speaker with whiteboard overlay), and fullscreen whiteboard with audio-only mode. The tutor controls which layout is active and can switch between them during a session. Audio features include mute/unmute per participant, background noise suppression using the Web Audio API, and volume normalization. Video features include virtual backgrounds (pre-selected images or blurred background), screen sharing (for the tutor to share their desktop or a specific application window), and picture-in-picture mode for tutors who want to show their face while screen sharing.',
        st['body']
    ))

    story.append(Paragraph('2.6 Chat System', st['h2']))
    story.append(Paragraph(
        'The chat system provides real-time text communication alongside the whiteboard and video. It supports public messages visible to all participants and private direct messages between tutor and individual students. Messages support emoji reactions, file attachments (images, PDFs, documents), and rich text formatting. The tutor can pin important messages to keep them visible throughout the session. Chat messages are included in session recordings for later review. The chat panel is collapsible to maximize whiteboard space and supports keyboard shortcuts for quick sending without disrupting whiteboard interaction.',
        st['body']
    ))

    story.append(Paragraph('2.7 DejaVuactive Widgets', st['h2']))
    story.append(Paragraph(
        'DejaVuactive widgets extend the whiteboard with classroom-specific tools that go beyond basic drawing. Polls allow the tutor to create multiple-choice questions that appear on student screens; results are aggregated in real-time and can be displayed as a bar chart on the whiteboard. Quizzes support timed questions, score tracking, and automatic grading. A countdown timer widget can be placed on the whiteboard for timed activities. Breakout rooms allow the tutor to split the class into smaller groups, each with their own whiteboard space, and cycle between rooms to monitor progress. Screen sharing widgets allow students to share their screens with the tutor for troubleshooting or presentation purposes.',
        st['body']
    ))

    story.append(Paragraph('2.8 Recording and Playback', st['h2']))
    story.append(Paragraph(
        'Session recording captures the complete classroom experience: whiteboard state changes (element operations with timestamps), video and audio streams, chat messages, and widget interactions. Recordings are stored in WebM format with a custom metadata track that encodes the whiteboard state timeline. During playback, users can scrub through the timeline, and the whiteboard reconstructs the exact state at any point. Recordings are processed after the session ends: the video is transcoded for efficient streaming, the whiteboard timeline is indexed for random access, and the recording is made available in the session history. Storage is metered as part of the subscription plan, with older recordings automatically archived to cold storage.',
        st['body']
    ))

    story.append(Paragraph('2.9 Persistent Boards', st['h2']))
    story.append(Paragraph(
        'Persistent boards allow whiteboard content to survive beyond individual sessions. Each board is saved with its complete element state, camera position, page structure, and metadata (creation date, last modified, associated session). Boards can be organized into folders, tagged for searchability, and shared between sessions. A template system allows tutors to create pre-structured boards with placeholder elements (heading frames, exercise areas, diagram outlines) that are duplicated for each new session. Shared boards enable collaborative preparation where multiple tutors contribute to a single board before a team-teaching session. Board versioning keeps a history of changes, allowing tutors to revert to previous versions if needed.',
        st['body']
    ))
    story.append(PageBreak())

    # =================================================================
    # PHASE 3: DETAILED
    # =================================================================
    story.append(phase_header(3, 'Monetization', PHASE_COLORS[2]))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        'The monetization strategy is built on a fundamental principle: the core whiteboard remains free and fully functional as a standalone tool. This ensures maximum adoption and provides the widest possible funnel for the paid classroom features. The free tier includes unlimited personal whiteboard use, up to 3 classroom sessions per month, 1 hour of recording storage, and basic collaboration (up to 2 participants per session). This is sufficient for users to experience the value proposition before committing to a paid plan.',
        st['body']
    ))
    story.append(Paragraph(
        'The Tutor plan ($15-25/month, billed annually at 20% discount) removes session limits, adds unlimited recording storage (up to 50GB), enables all interactive widgets, provides student management for up to 50 students, and includes basic analytics. The Academy plan ($49-99/month) adds team management with multiple tutor accounts, student rosters up to 500 students, advanced analytics with cohort comparisons, custom branding (logo, colors, session join page), and priority email support. The Enterprise plan ($299+/month) includes everything in Academy plus SSO integration, LMS connectors, dedicated account management, 99.9% uptime SLA, SOC 2 compliance, and custom development support for integration with proprietary systems.',
        st['body']
    ))
    story.append(Paragraph(
        'The billing infrastructure uses Stripe with a usage-based metering system. Key metered dimensions include session hours (charged per-minute after a monthly allowance), recording storage (charged per GB-month for excess storage), and participant count (charged per-participant-minute for sessions exceeding the plan limit). This approach ensures that casual users pay a predictable monthly fee while power users only pay for what they actually use. The Stripe integration handles all payment complexities: subscription lifecycle management, prorated billing for plan changes, failed payment recovery with dunning emails, and tax calculation for international customers.',
        st['body']
    ))
    story.append(PageBreak())

    # =================================================================
    # PHASE 4: DETAILED
    # =================================================================
    story.append(phase_header(4, 'SDK and Marketplace', PHASE_COLORS[3]))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        'The SDK extraction is an engineering refactoring exercise: the whiteboard engine is factored out of the Next.js application into a standalone npm package. The SDK provides a programmatic API for creating, configuring, and controlling a whiteboard instance within any React application. Key API surfaces include the Whiteboard component (render target), the useWhiteboard hook (state access and mutation), the plugin registration system (extending functionality), and the event system (listening to and reacting to whiteboard events). The SDK is published as an npm package with full TypeScript type definitions, comprehensive documentation with interactive examples, and a Storybook-based component showcase.',
        st['body']
    ))
    story.append(Paragraph(
        'The plugin system defines three extension points. Renderers register new element types with custom SVG rendering logic, enabling plugins like LaTeX formula rendering, music notation, chemical structure diagrams, or code syntax highlighting. Tools register new toolbar items with custom pointer event handling, enabling plugins like protractors, rulers, compasses, graphing calculators, or specialized drawing tools for specific disciplines. Extensions modify canvas behavior without adding new elements, enabling plugins like auto-layout algorithms, snap-to-grid enhancements, smart connector routing, or accessibility overlays. All plugins run in a sandboxed execution context with limited API access to prevent security vulnerabilities.',
        st['body']
    ))
    story.append(Paragraph(
        'The marketplace is a curated store where developers list their plugins for other users to install. The revenue model is a 70/30 split: plugin developers keep 70% of sales, and Superboard retains 30% to cover marketplace infrastructure, payment processing, and marketing. The marketplace features plugin ratings and reviews, usage analytics for developers (installs, active users, revenue), automated security scanning of submitted plugins, and featured placements for high-quality plugins. The developer portal provides everything needed to create, test, submit, and monetize plugins.',
        st['body']
    ))
    story.append(PageBreak())

    # =================================================================
    # PHASE 5: DETAILED
    # =================================================================
    story.append(phase_header(5, 'Enterprise', PHASE_COLORS[4]))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        'Enterprise features address the requirements of educational institutions deploying Superboard at scale. SSO integration supports SAML 2.0 for enterprise identity providers, OpenID Connect for modern cloud identity systems, and Active Directory synchronization for Windows-based institutions. The LMS integration layer uses LTI (Learning Tools DejaVuoperability) standards to embed Superboard within Canvas, Moodle, Blackboard, and Google Classroom. This allows teachers to create Superboard sessions directly from their LMS course pages, automatically sync student rosters, and pass grades from Superboard quizzes back to the LMS gradebook.',
        st['body']
    ))
    story.append(Paragraph(
        'The admin dashboard provides institutional administrators with a comprehensive view of usage across their organization: active users, session counts, storage consumption, engagement metrics, and cost allocation by department or course. Compliance features include SOC 2 Type II audit controls, GDPR data processing agreements and data subject request handling, FERPA compliance for educational records, and data residency controls that allow institutions to specify geographic regions for data storage. The enterprise SLA guarantees 99.9% uptime with financial credits for downtime, dedicated customer success managers for onboarding and ongoing support, and priority escalation for technical issues.',
        st['body']
    ))
    story.append(PageBreak())

    # =================================================================
    # PHASE 6: DETAILED
    # =================================================================
    story.append(phase_header(6, 'Ecosystem', PHASE_COLORS[5]))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        'The ecosystem phase represents the long-term vision of transforming Superboard from a product into a platform. The curriculum marketplace allows educators to create, share, and sell complete lesson packages: pre-structured whiteboard templates, accompanying quiz banks, instructional sequences, and resource collections. Educators set their own prices and earn revenue from each sale, with Superboard taking a marketplace commission. Quality control is maintained through user ratings, editorial curation, and automated content review for accuracy and pedagogical soundness.',
        st['body']
    ))
    story.append(Paragraph(
        'AI-powered features represent the most ambitious aspect of Phase 6. Smart tutoring assistance uses language models to provide real-time hints and suggestions to both tutors and students during sessions. For tutors, the AI can suggest lesson structures, identify common student misconceptions based on interaction patterns, and recommend engagement strategies for disengaged students. For students, the AI can provide step-by-step guidance on problems, generate practice exercises based on the current topic, and offer explanations when the tutor is busy with other students. All AI features are designed to augment rather than replace human tutoring, maintaining the irreplaceable value of personal attention.',
        st['body']
    ))
    story.append(Paragraph(
        'DejaVunationalization extends Superboard to global markets with multi-language interface support (initially English, Spanish, Mandarin, Hindi, Arabic), right-to-left layout support for Arabic and Hebrew, locale-specific number and date formatting, and culturally appropriate content recommendations. Accessibility compliance targets WCAG 2.1 AA standards with full keyboard navigation, screen reader support through ARIA labels and semantic HTML, high contrast mode, and reduced motion alternatives for all animations. Mobile SDKs for iOS and Android bring the core whiteboard experience to tablets and phones with touch-optimized interfaces, offline board caching with background sync, and push notification integration for session reminders and messages.',
        st['body']
    ))

    # ---- Build ----
    doc = SimpleDocTemplate(output_path, pagesize=A4, topMargin=25*mm, bottomMargin=20*mm, leftMargin=20*mm, rightMargin=20*mm)
    doc.build(story)
    print(f'PDF 2 saved: {output_path}')
    return output_path

# ---- Run ----
if __name__ == '__main__':
    build_pdf1()
    build_pdf2()
    print('Both PDFs generated successfully!')
