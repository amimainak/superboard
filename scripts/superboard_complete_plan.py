#!/usr/bin/env python3
"""Superboard Complete Phase Plan - Updated 7-Phase Roadmap PDF Generator"""

import hashlib, os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable, Image
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
import pypdf

# ━━ Font Registration ━━
FONT_DIR = '/usr/share/fonts'
pdfmetrics.registerFont(TTFont('Inter', f'{FONT_DIR}/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('Inter-Bold', f'{FONT_DIR}/truetype/dejavu/DejaVuSans-Bold.ttf'))
registerFontFamily('Inter', normal='Inter', bold='Inter-Bold')

# ━━ Cascade Palette ━━
PAGE_BG       = colors.HexColor('#f6f5f4')
SECTION_BG    = colors.HexColor('#eae9e6')
CARD_BG       = colors.HexColor('#ebeae7')
TABLE_STRIPE  = colors.HexColor('#f4f3f2')
HEADER_FILL   = colors.HexColor('#746c51')
COVER_BLOCK   = colors.HexColor('#675f47')
BORDER        = colors.HexColor('#d4ceba')
ICON          = colors.HexColor('#96834b')
ACCENT        = colors.HexColor('#94761d')
ACCENT_2      = colors.HexColor('#42a1c1')
TEXT_PRIMARY   = colors.HexColor('#151513')
TEXT_MUTED     = colors.HexColor('#85827b')
SEM_SUCCESS   = colors.HexColor('#467556')
SEM_WARNING   = colors.HexColor('#a2864d')

# ━━ Page Setup ━━
PAGE_W, PAGE_H = A4
LEFT_MARGIN = 50
RIGHT_MARGIN = 50
TOP_MARGIN = 50
BOTTOM_MARGIN = 50
CONTENT_W = PAGE_W - LEFT_MARGIN - RIGHT_MARGIN

# ━━ Styles ━━
styles = getSampleStyleSheet()

style_h1 = ParagraphStyle('H1', parent=styles['Heading1'],
    fontName='Inter-Bold', fontSize=22, leading=28,
    textColor=HEADER_FILL, spaceAfter=12, spaceBefore=20,
    borderWidth=0, borderPadding=0)

style_h2 = ParagraphStyle('H2', parent=styles['Heading2'],
    fontName='Inter-Bold', fontSize=15, leading=20,
    textColor=TEXT_PRIMARY, spaceAfter=8, spaceBefore=16)

style_h3 = ParagraphStyle('H3', parent=styles['Heading3'],
    fontName='Inter-Bold', fontSize=12, leading=16,
    textColor=ICON, spaceAfter=6, spaceBefore=12)

style_body = ParagraphStyle('Body', parent=styles['Normal'],
    fontName='Inter', fontSize=10, leading=15,
    textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY,
    spaceAfter=8, spaceBefore=2)

style_body_small = ParagraphStyle('BodySmall', parent=style_body,
    fontSize=9, leading=13, spaceAfter=6)

style_bullet = ParagraphStyle('Bullet', parent=style_body,
    fontSize=10, leading=14,
    leftIndent=20, bulletIndent=8,
    spaceAfter=4, spaceBefore=2)

style_sub_bullet = ParagraphStyle('SubBullet', parent=style_bullet,
    fontSize=9, leading=13,
    leftIndent=36, bulletIndent=24,
    spaceAfter=3)

style_caption = ParagraphStyle('Caption', parent=styles['Normal'],
    fontName='Inter', fontSize=8, leading=11,
    textColor=TEXT_MUTED, alignment=TA_LEFT,
    spaceAfter=4, spaceBefore=2)

style_toc_h1 = ParagraphStyle('TOCH1', fontName='Inter-Bold',
    fontSize=12, leading=18, leftIndent=0, textColor=HEADER_FILL)

style_toc_h2 = ParagraphStyle('TOCH2', fontName='Inter',
    fontSize=10, leading=16, leftIndent=20, textColor=TEXT_PRIMARY)

# ━━ Helper Functions ━━
def heading_hash(text):
    return hashlib.md5(text.encode()).hexdigest()[:8]

def add_heading(text, style, level=0, story=None):
    if story is None:
        story = []
    key = f'h_{heading_hash(text)}'
    p = Paragraph(f'<a name="{key}"/>{text}', style)
    p.bookmark_name = key
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    story.append(p)
    return story

def make_table(headers, rows, col_widths=None):
    """Create a styled table with the cascade palette."""
    header_row = [Paragraph(f'<b>{h}</b>', ParagraphStyle('TH', fontName='Inter-Bold',
        fontSize=9, leading=12, textColor=colors.white)) for h in headers]
    data = [header_row]
    cell_style = ParagraphStyle('TC', fontName='Inter', fontSize=9, leading=12,
        textColor=TEXT_PRIMARY)
    for row in rows:
        data.append([Paragraph(str(c), cell_style) for c in row])

    if col_widths is None:
        n = len(headers)
        col_widths = [CONTENT_W / n] * n

    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Inter-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('ALIGN', (0, 0), (-1, 0), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, TABLE_STRIPE]),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]
    t.setStyle(TableStyle(style_cmds))
    return t

def hr():
    return HRFlowable(width='100%', thickness=0.5, color=BORDER,
        spaceAfter=8, spaceBefore=8)

# ━━ TOC Template ━━
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

# ━━ Build Document Body ━━
story = []

# TOC
toc = TableOfContents()
toc.levelStyles = [style_toc_h1, style_toc_h2]
story.append(toc)
story.append(PageBreak())

# ═══════════════════════════════════════════════════════
# INTRODUCTION
# ═══════════════════════════════════════════════════════
add_heading('Introduction', style_h1, 0, story)
story.append(Paragraph(
    'Superboard is not just another whiteboard application. It is an infinitely customizable '
    'collaborative canvas designed to serve as the foundational layer for a complete virtual '
    'classroom platform built specifically for freelance tutors and small-group educators. The '
    'product vision extends far beyond basic drawing tools: Superboard aims to become the '
    'definitive platform for online tutoring, academic collaboration, and interactive learning '
    'experiences, with a particular focus on the underserved freelance tutoring market.',
    style_body))
story.append(Paragraph(
    'This updated roadmap expands the original six-phase strategy to seven phases, incorporating '
    'a dedicated AI phase (Phase 5) that introduces smart, subtle artificial intelligence features. '
    'The AI philosophy is deliberate: AI should feel like a helpful teaching assistant quietly '
    'working in the background, not a robotic presence that overwhelms the tutoring session. Every '
    'AI feature is designed to save the tutor 10-15 minutes per session without requiring any '
    'additional interaction or cognitive overhead.',
    style_body))
story.append(Paragraph(
    'The target audience is freelance tutors who teach one-on-one or in small groups of 2-8 '
    'students. These tutors currently cobble together fragmented toolsets (Zoom, Google Docs, '
    'physical whiteboards, Excalidraw) and waste valuable session time on setup. Superboard '
    'consolidates everything into a single professional tool. The infrastructure plan leverages '
    'Oracle Cloud Free Tier for LiveKit video/audio hosting, keeping costs near zero during the '
    'early growth phase while maintaining full portability for future migration.',
    style_body))
story.append(Paragraph(
    'The widget architecture is the cornerstone of the entire platform. Every classroom feature, '
    'from polls and timers to AI-generated quizzes, is built as a widget with a standardized '
    'lifecycle API. This means the widget API built for internal use in Phase 2 is identical to '
    'the public SDK released in Phase 6. Tutors can pick only the widgets they need for each '
    'session, save widget layouts as profiles, and toggle student-side widgets on or off with '
    'a single click. This flexibility is the core competitive advantage over platforms like '
    'Koala Go, which offer rigid, all-or-nothing feature sets.',
    style_body))

# Phase Summary Table
add_heading('Phase Summary', style_h2, 1, story)
story.append(make_table(
    ['Phase', 'Focus', 'Key Outcome', 'Timeline'],
    [
        ['1', 'Core Whiteboard', 'Production-ready infinite canvas with all tools', 'Complete'],
        ['2', 'Virtual Classroom', 'Collaboration, auth, video, chat, widgets', '3-4 months'],
        ['3', 'Monetization', 'Subscription tiers, freemium, usage billing', '1-2 months'],
        ['4', 'AI Features', 'Smart subtle AI: summaries, notes, quizzes', '2-3 months'],
        ['5', 'SDK and Marketplace', 'Plugin system, public SDK, developer portal', '2-3 months'],
        ['6', 'Enterprise', 'SSO, admin dashboards, compliance, analytics', '2-3 months'],
        ['7', 'Ecosystem', 'Community, curriculum marketplace, mobile SDKs', 'Ongoing'],
    ],
    [40, 110, 200, CONTENT_W - 350]
))
story.append(Spacer(1, 4))
story.append(Paragraph('Table 1: Seven-phase roadmap summary with estimated timelines', style_caption))

story.append(Paragraph(
    'Each phase is designed to be self-contained and deliverable, with clear milestones and '
    'measurable outcomes. The phases are sequential but overlapping: Phase 2 planning begins '
    'while Phase 1 is being polished, and Phase 3 monetization experiments can start as soon '
    'as core classroom features are stable. The ultimate competitive moat is not the whiteboard '
    'itself, but the tutoring-specific classroom context that no general-purpose tool provides: '
    'role-based permissions, session management, student progress tracking, AI-powered insights, '
    'and the deep integrations that make a virtual classroom feel like a real classroom rather '
    'than a glorified Zoom call with a shared canvas.',
    style_body))

# ═══════════════════════════════════════════════════════
# PHASE 1: CORE WHITEBOARD (COMPLETE)
# ═══════════════════════════════════════════════════════
story.append(PageBreak())
add_heading('Phase 1: Core Whiteboard', style_h1, 0, story)
story.append(Paragraph(
    'Phase 1 is the foundation upon which everything else is built. The whiteboard must be '
    'infinitely customizable because every future feature, from assessment widgets to video '
    'embeds to collaborative cursors, will either live on or around the canvas. This means the '
    'architecture must support a widget/plugin system from day one, even if the public SDK is '
    'not extracted until Phase 5. The whiteboard itself must be flawless: smooth drawing with '
    'stylus pressure sensitivity, all shape tools, text editing, sticky notes, image embedding, '
    'multi-page support, undo/redo, export to PNG/SVG/JSON, keyboard shortcuts, presentation '
    'mode, and both light and dark themes.',
    style_body))
story.append(Paragraph(
    'The Phase 1 audit identified and resolved several categories of critical issues. A high-severity '
    'XSS vulnerability in text and sticky note rendering was patched by replacing dangerouslySetInnerHTML '
    'with safe React rendering. Broken export support for freehand strokes and complex shapes was fully '
    'fixed. A non-functional upload image button in the top bar menu was repaired. The shortcuts dialog '
    'was cleaned to only advertise implemented shortcuts. Performance issues from whole-store Zustand '
    'subscriptions were resolved using fine-grained selector slices across all 73 subscriptions. '
    'Orphaned elements left behind when pages are deleted are now properly cleaned up.',
    style_body))

add_heading('Phase 1 Features', style_h2, 1, story)
story.append(make_table(
    ['Feature', 'Description'],
    [
        ['Drawing Engine', 'Freehand pen with stylus pressure simulation, highlighter with transparency, eraser with point-level splitting'],
        ['Shape Tools', 'Rectangle, ellipse, diamond, triangle, line, arrow, frame with shift-constrain'],
        ['Text and Sticky Notes', 'Rich text editing with font/size/alignment, sticky notes with color picker'],
        ['Multi-Page Support', 'Add, rename, delete, switch between unlimited pages with tab navigation'],
        ['Export System', 'PNG, JPEG, SVG, JSON export with full element type support including freehand strokes'],
        ['Collaboration-Ready Architecture', 'Zustand store with selector slices, element locking hooks, cursor presence ready'],
        ['Dark Mode', 'Full dark/light theme system via CSS suffix classes (-dark/-light)'],
        ['Accessibility', 'ARIA labels on all interactive elements, keyboard navigation support, focus management'],
    ],
    [120, CONTENT_W - 120]
))
story.append(Spacer(1, 4))
story.append(Paragraph('Table 2: Phase 1 feature summary', style_caption))

add_heading('Phase 1 Status', style_h2, 1, story)
story.append(Paragraph(
    'Phase 1 is fully complete and deployed to production at superboard-three.vercel.app. '
    'All 49 audit issues have been resolved, the whiteboard is production-ready with drawing, '
    'shapes, text, sticky notes, image embedding, multi-page, export, undo/redo, keyboard '
    'shortcuts, and dark mode all functioning correctly. The Zustand store architecture uses '
    'fine-grained selectors for all 73 subscriptions, ensuring optimal rendering performance '
    'even as the feature set grows in subsequent phases.',
    style_body))

# ═══════════════════════════════════════════════════════
# PHASE 2: VIRTUAL CLASSROOM
# ═══════════════════════════════════════════════════════
story.append(PageBreak())
add_heading('Phase 2: Virtual Classroom', style_h1, 0, story)
story.append(Paragraph(
    'Phase 2 transforms the standalone whiteboard into a fully functional virtual classroom. '
    'This is where Superboard differentiates from every generic whiteboard on the market. The '
    'feature set spans ten major categories, each of which is designed to integrate seamlessly '
    'with the existing whiteboard engine. Video, chat, widgets, and student management all exist '
    'as panels and overlays around the central canvas, never replacing it. The whiteboard remains '
    'the primary interaction surface at all times, embodying the principle that "the whiteboard is '
    'the classroom, and everything else orbits around it."',
    style_body))
story.append(Paragraph(
    'The strategic decision to build every feature as a widget from day one is critical here. '
    'Phase 2 features will inform the SDK API design: if real-time collaboration requires '
    'fine-grained element locking, the SDK must expose those primitives. If assessment widgets '
    'need custom rendering hooks, the plugin system must support them. Every Phase 2 feature is '
    'a use case that validates and refines the underlying widget architecture, ensuring that when '
    'the SDK is publicly released in Phase 5, the API has been battle-tested by real classroom usage.',
    style_body))

add_heading('Widget Architecture', style_h2, 1, story)
story.append(Paragraph(
    'The widget system is the architectural backbone of Phase 2 and the entire Superboard platform. '
    'Every classroom feature is implemented as a self-contained widget with a standardized lifecycle API. '
    'Widgets are categorized into four tiers based on their interaction model and placement within '
    'the application. Canvas widgets render directly on the whiteboard surface (polls, quizzes, embedded '
    'media). Panel widgets occupy dedicated sidebar or overlay areas (chat, student roster, session controls). '
    'Extension widgets modify canvas behavior without visible UI (auto-layout, snap-to-grid, alignment). '
    'Plugin widgets are third-party extensions that use the public SDK (custom renderers, specialized tools).',
    style_body))

story.append(make_table(
    ['Widget Tier', 'Placement', 'Examples', 'Discovery'],
    [
        ['Canvas Widget', 'On the whiteboard surface', 'Quick Polls, Countdown Timer, Score/Points', 'Widget Tray'],
        ['Panel Widget', 'Sidebar or overlay panel', 'Chat, Student Roster, Session Controls', 'Right sidebar'],
        ['Extension Widget', 'No visible UI, modifies behavior', 'Auto-layout, Snap-to-Grid, Smart Guides', 'Settings menu'],
        ['Plugin Widget', 'Third-party via SDK', 'LaTeX Renderer, Music Notation, Graphing Calc', 'Marketplace (Phase 5)'],
    ],
    [90, 120, 160, CONTENT_W - 370]
))
story.append(Spacer(1, 4))
story.append(Paragraph('Table 3: Widget tier hierarchy', style_caption))

add_heading('Widget Lifecycle API', style_h2, 1, story)
story.append(Paragraph(
    'Every widget implements a standardized lifecycle interface that governs its behavior from '
    'mounting to unmounting. This lifecycle is the foundation of the future SDK: any developer '
    'building a plugin will use the exact same API that internal widgets use. The lifecycle methods '
    'include onMount (initialize state, set up event listeners, request permissions), onUnmount '
    '(clean up resources, remove listeners, persist state), render (return the widget UI, called '
    'on every state change), handleEvent (respond to whiteboard events like element selection, page '
    'change, zoom), getState (return current widget state for persistence), and setState (update '
    'widget state, triggering re-render).',
    style_body))

add_heading('Widget Flexibility Model', style_h2, 1, story)
story.append(Paragraph(
    'A core design principle is that every widget is fully optional and removable. Tutors browse '
    'available classroom widgets in a Widget Tray (similar to an app store) and drag only the ones '
    'they need onto their toolbar for a given session. This means a math tutor might load Random '
    'Student Picker, Countdown Timer, and Quick Polls, while a language tutor prefers Thumbs Up/Down, '
    'Noise Meter, and Score/Points. Each session can have a completely different widget configuration '
    'with zero performance overhead from unused widgets.',
    style_body))
story.append(Paragraph(
    'Tutors can save widget layouts as persistent profiles. For example, a "Math Class Setup" profile '
    'might include Timer + Polls + Score, while a "Reading Group Setup" includes Thumbs + Progress Bar '
    '+ Notes. Switching between profiles takes one click. Student-side widgets (like Raise Hand or '
    'Thumbs Up/Down) are also tutor-controlled: the tutor can toggle any student widget on or off, '
    'and it appears or disappears from every student screen instantly.',
    style_body))

add_heading('Phase 2 Feature Categories', style_h2, 1, story)
story.append(make_table(
    ['Category', 'Features', 'Priority', 'Sprint'],
    [
        ['Authentication and Roles', 'Email/password, OAuth, role-based access: tutor, student, admin with permission tiers', 'Critical', 'Sprint 1-2'],
        ['Session Management', 'Scheduling, waiting rooms, timed sessions, session state persistence across reloads', 'Critical', 'Sprint 1-2'],
        ['Real-Time Collaboration', 'Multiplayer cursors, presence indicators, element locking, conflict resolution via CRDT', 'Critical', 'Sprint 2-3'],
        ['Video and Audio', 'WebRTC via LiveKit, grid/speaker/gallery layouts, screen sharing, recording toggle', 'High', 'Sprint 3-4'],
        ['Text Chat', 'Text messaging, emoji reactions, file sharing, pinned messages, chat history', 'Medium', 'Sprint 3-4'],
        ['Classroom Widgets', '10 tutor-facing widgets: Timer, Polls, Score, Thumbs, Progress, Raise Hand, etc.', 'High', 'Sprint 4-6'],
        ['Student Management', 'Rosters, profiles, progress tracking, parent access, attendance logs', 'Medium', 'Sprint 5-6'],
        ['Session Recording', 'Whiteboard state timeline, video recording, student playback access', 'Medium', 'Sprint 5-6'],
        ['Persistent Boards', 'Save/resume boards across sessions, board templates, shared libraries', 'Low', 'Sprint 6'],
    ],
    [100, 220, 55, CONTENT_W - 375]
))
story.append(Spacer(1, 4))
story.append(Paragraph('Table 4: Phase 2 feature categories with sprint assignments', style_caption))

add_heading('10 Classroom Widgets (Priority Order)', style_h2, 1, story)
story.append(Paragraph(
    'The 10 planned classroom widgets are prioritized based on value for the target audience '
    'of freelance tutors teaching one-on-one or small groups. Widgets most valuable for 1-on-1 '
    'sessions are built first, while group-specific widgets come later in the sprint cycle.',
    style_body))

story.append(make_table(
    ['Priority', 'Widget', 'Value for 1-on-1', 'Value for Groups', 'Sprint'],
    [
        ['1 (Highest)', 'Countdown Timer', 'Critical - session time management', 'Critical - activity pacing', 'Sprint 4'],
        ['2', 'Quick Polls', 'Critical - check understanding instantly', 'Critical - whole-class feedback', 'Sprint 4'],
        ['3', 'Score/Points', 'High - gamification and motivation', 'High - team competition', 'Sprint 4'],
        ['4', 'Thumbs Up/Down', 'Medium - quick feedback mechanism', 'High - silent class vote', 'Sprint 5'],
        ['5', 'Progress Bar', 'High - visual lesson pacing', 'Medium - shared progress tracking', 'Sprint 5'],
        ['6', 'Raise Hand', 'Low - only 1 student', 'Critical - manage speaking turns', 'Sprint 5'],
        ['7', 'Random Student Picker', 'Low - only 1 student', 'Critical - fair selection', 'Sprint 5'],
        ['8', 'Attention Check', 'Medium - engagement monitoring', 'Medium - disengagement detection', 'Sprint 6'],
        ['9', 'Noise Meter', 'Low - only 1 student', 'Medium - classroom noise management', 'Sprint 6'],
        ['10 (Lowest)', 'Stopwatch', 'Medium - timed exercises', 'Medium - timed activities', 'Sprint 6'],
    ],
    [65, 105, 115, 110, CONTENT_W - 395]
))
story.append(Spacer(1, 4))
story.append(Paragraph('Table 5: Classroom widgets prioritized by value for freelance tutor audience', style_caption))

add_heading('Video/Audio Infrastructure', style_h2, 1, story)
story.append(Paragraph(
    'Video and audio communication is powered by LiveKit, an open-source WebRTC SFU that provides '
    'high-quality, low-latency video conferencing. The infrastructure strategy prioritizes cost '
    'efficiency by leveraging Oracle Cloud Free Tier, which provides an ARM Ampere A1 instance '
    'with 4 OCPU cores and 24GB RAM at zero cost. A single ARM instance can comfortably handle '
    '20-30 concurrent video participants with ~50-100MB RAM per small room, making it more than '
    'sufficient for the target scale of 2-8 participants per room and 10-15 concurrent rooms.',
    style_body))
story.append(Paragraph(
    'The LiveKit deployment uses Docker Compose for maximum portability. The stack includes '
    'livekit-server (SFU), livekit-redis (signaling), and a reverse proxy (Caddy/Nginx) for SSL '
    'termination. Superboard connects to LiveKit via API keys and a WebSocket URL configured as '
    'environment variables, meaning the migration path to a paid VPS (Hetzner at $5.50/month, '
    'DigitalOcean at $24/month, or Oracle paid ARM at $30/month) requires updating only three '
    'environment variables with zero code changes on the application side.',
    style_body))

story.append(make_table(
    ['Provider', 'Specs', 'Monthly Cost', 'Recommended For'],
    [
        ['Oracle Free Tier', '4 ARM cores, 24GB RAM', '$0', 'Starting out, beta testing, 1-15 rooms'],
        ['Hetzner ARM', '4 cores, 16GB RAM', '~$5.50', 'Cost-conscious scaling, 15-50 rooms'],
        ['DigitalOcean', '2 cores, 4GB RAM', '$24', 'Managed simplicity, moderate scale'],
        ['Oracle Paid ARM', '4 cores, 24GB RAM', '~$30', 'Production scaling, 50+ rooms'],
        ['AWS Lightsail', '2 cores, 4GB RAM', '$20', 'AWS ecosystem preference'],
    ],
    [95, 105, 70, CONTENT_W - 270]
))
story.append(Spacer(1, 4))
story.append(Paragraph('Table 6: LiveKit hosting cost comparison', style_caption))

# ═══════════════════════════════════════════════════════
# PHASE 3: MONETIZATION
# ═══════════════════════════════════════════════════════
story.append(PageBreak())
add_heading('Phase 3: Monetization', style_h1, 0, story)
story.append(Paragraph(
    'Phase 3 introduces revenue generation through a multi-tier subscription model designed '
    'specifically for the freelance tutor market. The pricing strategy recognizes that freelance '
    'tutors are price-sensitive individuals, not enterprise procurement departments. The free tier '
    'must be generous enough to drive adoption and demonstrate value, while the paid tiers provide '
    'clear, tangible benefits that justify the subscription cost from the first week of use.',
    style_body))
story.append(Paragraph(
    'The billing system uses Stripe for payment processing with usage-based metering for '
    'recording storage, session hours, and board storage. Annual billing offers a 20% discount '
    'to reduce churn and improve predictability. The key principle is that the whiteboard itself '
    'remains free and unlimited as a standalone tool; monetization comes from classroom-specific '
    'features that provide clear, measurable value to paying users. A tutor paying $8/month '
    'should save at least 2 hours of setup time per month, which at typical tutoring rates of '
    '$20-50/hour represents a 5-12x return on investment.',
    style_body))

add_heading('Subscription Tiers', style_h2, 1, story)
story.append(make_table(
    ['Tier', 'Price', 'Features', 'Target User'],
    [
        ['Free', '$0', 'Basic whiteboard (unlimited), 3 sessions/month, 2 widgets, 2 hours/day max', 'Try-before-buy, occasional tutors'],
        ['Pro', '$5-8/month', 'Unlimited sessions, all 10 widgets, recording, session notes, AI summaries', 'Active freelance tutors (primary revenue)'],
        ['Studio', '$12-15/month', 'Everything in Pro + saved layouts, student roster, progress tracking, parent reports', 'Tutors with multiple regular students'],
        ['Academy', '$29-49/month', 'Team management, 5 tutor seats, shared student pool, analytics dashboard', 'Small tutoring academies (2-5 tutors)'],
    ],
    [55, 70, 220, CONTENT_W - 345]
))
story.append(Spacer(1, 4))
story.append(Paragraph('Table 7: Subscription tier structure targeting freelance tutor market', style_caption))

add_heading('Pricing Philosophy', style_h2, 1, story)
story.append(Paragraph(
    'The pricing is deliberately aggressive compared to competitors. Koala Go charges significantly '
    'more for comparable features, and platforms like Bramble focus on institutional pricing that '
    'is out of reach for individual freelancers. By keeping the Pro tier at $5-8/month, Superboard '
    'positions itself as an impulse-purchase upgrade rather than a budget deliberation. The target '
    'conversion rate from free to paid is 8-12% within the first 30 days, driven by widget access '
    'gating and the AI features that provide immediate, tangible value.',
    style_body))

# ═══════════════════════════════════════════════════════
# PHASE 4: AI FEATURES (NEW)
# ═══════════════════════════════════════════════════════
story.append(PageBreak())
add_heading('Phase 4: AI Features', style_h1, 0, story)
story.append(Paragraph(
    'Phase 4 introduces artificial intelligence features into Superboard with a deliberate '
    'philosophy: AI should be smart and subtle, never overwhelming. The guiding principle is '
    'that if the tutor notices the AI, it is doing too much. If the student notices the AI, '
    'it is definitely doing too much. Every AI feature operates invisibly in the background, '
    'producing outputs that make the tutor look professional and organized without requiring '
    'any additional interaction, cognitive overhead, or "AI chatbot" interfaces.',
    style_body))
story.append(Paragraph(
    'The AI stack prioritizes cost efficiency, using GPT-4o-mini for text generation and '
    'Whisper for transcription. The estimated cost per session is less than 2 cents for a '
    'full 60-minute tutoring session with all AI features active. Even with 500 sessions per '
    'month across the platform, total AI costs remain under $10/month, making the feature '
    'economically sustainable at the freemium pricing tier. This cost structure means AI can '
    'be included in the free tier with generous usage limits, driving adoption and conversion.',
    style_body))

add_heading('Tier 1: Invisible Helpers (Build First)', style_h2, 1, story)
story.append(Paragraph(
    'These features operate completely in the background, producing outputs without any tutor '
    'interaction. The tutor never presses an "AI" button, never sees a chatbot, and never needs '
    'to configure anything. The AI simply produces professional-quality outputs that appear after '
    'each session.',
    style_body))

story.append(make_table(
    ['Feature', 'What It Does', 'User Experience', 'Cost/Session'],
    [
        ['Session Auto-Summary', 'Generates 3-5 bullet point summary of topics covered, key concepts, and homework assigned', 'Post-session screen with "Send to Student" and "Send to Parent" checkboxes', '~$0.002'],
        ['Study Notes Export', 'Converts whiteboard content into structured, formatted PDF study notes', 'Export button produces clean notes with headings, diagrams, and key formulas', '~$0.003'],
        ['Handwriting to Text', 'Converts handwritten equations and text to typed, formatted output', 'One-tap "Clean Up" button on any whiteboard page', '~$0.001'],
    ],
    [90, 155, 140, CONTENT_W - 385]
))
story.append(Spacer(1, 4))
story.append(Paragraph('Table 8: Tier 1 AI features - invisible background helpers', style_caption))

add_heading('Tier 2: Smart Nudges (Build Next)', style_h2, 1, story)
story.append(Paragraph(
    'These features require minimal tutor interaction, typically a single button click. They '
    'appear as natural extensions of existing workflows rather than separate "AI features."',
    style_body))

story.append(make_table(
    ['Feature', 'What It Does', 'User Experience', 'Cost/Session'],
    [
        ['Quick Quiz Generator', 'Creates 3-5 quiz questions from whiteboard content covered in the session', 'One button in post-session screen: "Generate Quiz" - quiz appears as a shareable widget', '~$0.005'],
        ['Example Suggester', 'When tutor writes a problem, suggests similar practice problems in sidebar', 'Non-intrusive sidebar panel: tutor clicks to add to board or ignores', '~$0.003'],
        ['Smart Timer', 'Timer adjusts pacing suggestions based on content complexity and time remaining', 'Built into the Countdown Timer widget - no separate AI UI', '$0 (rule-based)'],
    ],
    [90, 145, 160, CONTENT_W - 395]
))
story.append(Spacer(1, 4))
story.append(Paragraph('Table 9: Tier 2 AI features - smart nudges with minimal interaction', style_caption))

add_heading('Tier 3: Behind-the-Scenes (Later)', style_h2, 1, story)
story.append(Paragraph(
    'These features operate entirely without tutor awareness, using telemetry and patterns to '
    'improve the tutoring experience passively.',
    style_body))

story.append(make_table(
    ['Feature', 'What It Does', 'Data Used', 'Cost/Session'],
    [
        ['Engagement Pulse', 'Detects student disengagement patterns (camera off, no interaction for 5+ min) and nudges tutor', 'Interaction telemetry, camera state', '~$0.01'],
        ['Parent Report', 'Weekly auto-generated progress report aggregating session summaries and quiz scores', 'Session data, quiz results, attendance', '~$0.01'],
        ['Voice Commands', 'Tutor says "clear board" or "next page" for hands-free operation during demos', 'Audio stream via Whisper', '~$0.004'],
    ],
    [85, 155, 110, CONTENT_W - 350]
))
story.append(Spacer(1, 4))
story.append(Paragraph('Table 10: Tier 3 AI features - behind-the-scenes intelligence', style_caption))

add_heading('AI Cost Analysis', style_h2, 1, story)
story.append(Paragraph(
    'The total AI cost per session is remarkably low, making it feasible to include AI features '
    'even in the free tier with reasonable usage limits. The following analysis shows the cost '
    'breakdown by session type, demonstrating that AI features add negligible operational expense '
    'while providing significant value differentiation.',
    style_body))

story.append(make_table(
    ['Session Type', 'AI Features Active', 'Estimated Cost', 'Monthly (500 sessions)'],
    [
        ['30-min 1-on-1', 'Summary + Notes', '~$0.005', '~$2.50'],
        ['60-min 1-on-1', 'Summary + Notes + Quiz', '~$0.010', '~$5.00'],
        ['60-min Group (4)', 'Summary + Notes + Quiz + Voice', '~$0.020', '~$10.00'],
        ['All features active', 'Full AI suite', '~$0.025', '~$12.50'],
    ],
    [100, 140, 90, CONTENT_W - 330]
))
story.append(Spacer(1, 4))
story.append(Paragraph('Table 11: AI cost analysis by session type', style_caption))

add_heading('AI Technology Stack', style_h2, 1, story)
story.append(make_table(
    ['Component', 'Provider', 'Purpose', 'Cost Model'],
    [
        ['Text Generation', 'GPT-4o-mini', 'Summaries, notes, quizzes, examples', '$0.15/1M input tokens'],
        ['Transcription', 'OpenAI Whisper API', 'Voice commands, session transcription', '$0.006/min'],
        ['Handwriting OCR', 'Tesseract (local) or Google Vision', 'Handwriting to text conversion', '$1.50/1000 images (cloud)'],
        ['Content Analysis', 'GPT-4o-mini', 'Engagement patterns, difficulty assessment', '$0.15/1M input tokens'],
        ['Embeddings', 'text-embedding-3-small', 'Content similarity for example suggestions', '$0.02/1M tokens'],
    ],
    [85, 115, 140, CONTENT_W - 340]
))
story.append(Spacer(1, 4))
story.append(Paragraph('Table 12: AI technology stack and cost model', style_caption))

# ═══════════════════════════════════════════════════════
# PHASE 5: SDK AND MARKETPLACE
# ═══════════════════════════════════════════════════════
story.append(PageBreak())
add_heading('Phase 5: SDK and Marketplace', style_h1, 0, story)
story.append(Paragraph(
    'Phase 5 extracts the whiteboard engine into a free, open-source SDK and launches a '
    'marketplace for paid plugins. The SDK decision is strategic: the SDK is free forever to '
    'maximize adoption and ecosystem growth, while revenue comes from the classroom subscription '
    'tiers and a 30% commission on marketplace plugins. Because every Phase 2 classroom feature '
    'was built using the widget lifecycle API, the SDK is simply the public version of the same '
    'API that internal widgets already use. There is no separate "SDK API" to maintain.',
    style_body))
story.append(Paragraph(
    'The plugin system supports three types of extensions. Renderers provide custom element types '
    'like LaTeX formulas, music notation, or molecular structures that render on the canvas. Tools '
    'add custom toolbar items like protractors, graphing calculators, or specialized drawing modes. '
    'Extensions modify canvas behavior through hooks: auto-layout engines, enhanced snap-to-grid, '
    'custom keyboard shortcuts, or accessibility overlays. Each plugin type follows the same widget '
    'lifecycle API (onMount, onUnmount, render, handleEvent, getState, setState) ensuring consistency.',
    style_body))

add_heading('Phase 5 Features', style_h2, 1, story)
story.append(make_table(
    ['Feature', 'Description'],
    [
        ['Open SDK', 'Free, well-documented SDK for embedding Superboard whiteboard in any web application with full API reference'],
        ['Plugin System', 'Three plugin types (renderers, tools, extensions) with sandboxed execution and defined permission scopes'],
        ['Marketplace', 'Plugin store with ratings, reviews, revenue sharing (70/30 split), featured plugins, and categories'],
        ['Developer Portal', 'API docs, plugin templates, sandbox testing environment, analytics dashboard for plugin developers'],
        ['Versioning', 'Semantic versioning with backward compatibility guarantees, migration guides, and deprecation warnings'],
        ['Plugin Permissions', 'Sandboxed execution with declared permissions: canvas access, network, storage, clipboard, notifications'],
    ],
    [100, CONTENT_W - 100]
))
story.append(Spacer(1, 4))
story.append(Paragraph('Table 13: Phase 5 SDK and Marketplace features', style_caption))

# ═══════════════════════════════════════════════════════
# PHASE 6: ENTERPRISE
# ═══════════════════════════════════════════════════════
story.append(PageBreak())
add_heading('Phase 6: Enterprise', style_h1, 0, story)
story.append(Paragraph(
    'Phase 6 targets institutional adoption with enterprise-grade features that small tutoring '
    'academies and educational organizations require. This includes SSO integration through '
    'industry-standard protocols (SAML 2.0, OpenID Connect, Active Directory), LMS connectors '
    'for popular learning management systems (Canvas LTI, Moodle, Blackboard, Google Classroom), '
    'admin dashboards with usage analytics and compliance reporting, and data residency controls '
    'for organizations with geographic data storage requirements.',
    style_body))
story.append(Paragraph(
    'Enterprise customers require reliability guarantees including 99.9% uptime SLA, SOC 2 Type II '
    'compliance for security, GDPR compliance for European data protection, and FERPA compliance '
    'for educational data privacy in the United States. The enterprise tier also includes custom '
    'branding options (white-label, custom domains, logo placement), advanced analytics with '
    'engagement metrics and learning outcome correlations, and priority support with dedicated '
    'customer success managers.',
    style_body))

add_heading('Phase 6 Features', style_h2, 1, story)
story.append(make_table(
    ['Feature', 'Description'],
    [
        ['SSO Integration', 'SAML 2.0, OpenID Connect, Active Directory, Google Workspace single sign-on'],
        ['LMS Connectors', 'Canvas LTI, Moodle, Blackboard, Google Classroom deep integration'],
        ['Admin Dashboard', 'Usage analytics, user management, compliance reporting, audit logs, billing management'],
        ['Compliance', 'SOC 2 Type II, GDPR, FERPA, data residency controls, encryption at rest and in transit'],
        ['SLA and Support', '99.9% uptime guarantee, dedicated customer success manager, priority support, onboarding assistance'],
        ['Custom Branding', 'White-label options, custom domains, logo placement, custom color themes'],
        ['Advanced Analytics', 'Engagement metrics, learning outcome correlations, tutor performance analytics, student progress dashboards'],
    ],
    [100, CONTENT_W - 100]
))
story.append(Spacer(1, 4))
story.append(Paragraph('Table 14: Phase 6 enterprise features', style_caption))

# ═══════════════════════════════════════════════════════
# PHASE 7: ECOSYSTEM
# ═══════════════════════════════════════════════════════
story.append(PageBreak())
add_heading('Phase 7: Ecosystem', style_h1, 0, story)
story.append(Paragraph(
    'Phase 7 is the long-term vision: transforming Superboard from a product into an ecosystem. '
    'This includes a curriculum marketplace where educators share and sell lesson templates, a '
    'community platform with forums, tutorials, and user-generated content, an API platform for '
    'third-party integrations, mobile SDKs for iOS and Android with offline support and sync, and '
    'advanced collaboration features like branching boards for group work and cross-session analytics.',
    style_body))
story.append(Paragraph(
    'The ecosystem phase also encompasses internationalization with multi-language support and '
    'right-to-left layouts, accessibility improvements to achieve WCAG 2.1 AA compliance with '
    'full screen reader support, and longitudinal student progress tracking across multiple '
    'tutoring engagements. This phase has no fixed timeline as it represents the ongoing evolution '
    'of the platform based on user feedback, market demands, and emerging technologies.',
    style_body))

add_heading('Phase 7 Features', style_h2, 1, story)
story.append(make_table(
    ['Feature', 'Description'],
    [
        ['Curriculum Marketplace', 'Educators share and sell lesson templates, worksheets, interactive exercises with royalty system'],
        ['Community Platform', 'Forums, video tutorials, user-generated content, mentorship programs, best practice guides'],
        ['Mobile SDKs', 'Native iOS and Android SDKs with offline whiteboard support and automatic sync when online'],
        ['I18n and Accessibility', 'Multi-language support, RTL layouts, WCAG 2.1 AA compliance, full screen reader support'],
        ['Advanced Analytics', 'Cross-session analytics, longitudinal student progress, learning outcome correlations'],
        ['Branching Boards', 'Group work support with individual student branches that merge back to the main board'],
    ],
    [100, CONTENT_W - 100]
))
story.append(Spacer(1, 4))
story.append(Paragraph('Table 15: Phase 7 ecosystem features', style_caption))

# ═══════════════════════════════════════════════════════
# COMPETITIVE POSITIONING
# ═══════════════════════════════════════════════════════
story.append(PageBreak())
add_heading('Competitive Positioning', style_h1, 0, story)
story.append(Paragraph(
    'Superboard occupies a unique position in the online tutoring tools market. Unlike generic '
    'whiteboards (Excalidraw, Miro) that lack classroom-specific features, and unlike dedicated '
    'classroom platforms (Koala Go, Bramble, TutorRoom) that offer rigid feature sets, Superboard '
    'provides the best of both worlds: a powerful whiteboard foundation with modular, optional '
    'classroom widgets that tutors can mix and match to suit their specific teaching style and '
    'student needs.',
    style_body))

add_heading('Competitive Comparison', style_h2, 1, story)
story.append(make_table(
    ['Feature', 'Koala Go', 'Bramble', 'Superboard'],
    [
        ['Widget customization', 'Fixed tool set', 'Limited customization', 'Pick only what you need'],
        ['Extensibility', 'Closed system', 'No plugin system', 'SDK + Plugin Marketplace'],
        ['Per-session layouts', 'Limited', 'Not available', 'Save/load profiles per session type'],
        ['Student widget control', 'All-or-nothing', 'Limited', 'Granular per-widget toggle'],
        ['Canvas + Panel mix', 'Mostly canvas', 'Split screen only', 'Canvas + Panel + Extension + Plugin'],
        ['Open architecture', 'Proprietary', 'Proprietary', 'SDK is open source'],
        ['AI features', 'Not available', 'Basic', 'Smart subtle AI (3 tiers)'],
        ['Pricing (individual)', '$15+/month', '$20+/month', '$5-8/month (Pro)'],
        ['Video hosting', 'Included', 'Included', 'Self-hosted (free on Oracle)'],
        ['Target audience', 'Tutors + schools', 'UK-focused tutors', 'Freelance tutors worldwide'],
    ],
    [90, 110, 110, CONTENT_W - 310]
))
story.append(Spacer(1, 4))
story.append(Paragraph('Table 16: Competitive feature comparison', style_caption))

# ═══════════════════════════════════════════════════════
# TECHNICAL ARCHITECTURE
# ═══════════════════════════════════════════════════════
add_heading('Technical Architecture', style_h1, 0, story)
story.append(Paragraph(
    'Superboard is built on a modern web stack optimized for real-time collaboration and extensibility. '
    'The frontend uses Next.js with React, Zustand for state management with fine-grained selectors, '
    'and a canvas rendering engine built on HTML5 Canvas with React reconciliation. The design system '
    'uses an emerald green accent color (#10b981) with 10px/8px border radius conventions and full '
    'dark/light mode support via CSS class suffixes.',
    style_body))

add_heading('Technology Stack', style_h2, 1, story)
story.append(make_table(
    ['Layer', 'Technology', 'Purpose'],
    [
        ['Frontend Framework', 'Next.js + React', 'SSR/SSG, routing, component architecture'],
        ['State Management', 'Zustand', '73 fine-grained selector subscriptions, real-time sync ready'],
        ['Canvas Engine', 'HTML5 Canvas + React', 'Infinite canvas rendering, element manipulation'],
        ['Video/Audio', 'LiveKit (WebRTC)', 'SFU-based video conferencing, screen sharing'],
        ['Real-Time Sync', 'WebSocket + CRDT', 'Multi-user collaboration, conflict resolution'],
        ['Database', 'PostgreSQL + Redis', 'Persistent storage, session state, caching'],
        ['Authentication', 'NextAuth.js', 'OAuth, email/password, role-based access'],
        ['AI Services', 'GPT-4o-mini + Whisper', 'Summaries, quizzes, notes, voice commands'],
        ['Hosting', 'Vercel (frontend) + Oracle (LiveKit)', 'Frontend deployment + video infrastructure'],
        ['Payment', 'Stripe', 'Subscription billing, usage metering, invoices'],
    ],
    [100, 130, CONTENT_W - 230]
))
story.append(Spacer(1, 4))
story.append(Paragraph('Table 17: Technology stack overview', style_caption))

add_heading('Widget Data Flow', style_h2, 1, story)
story.append(Paragraph(
    'The widget data flow follows a unidirectional architecture that ensures predictability and '
    'debuggability. User interactions trigger events that flow through the widget event bus, '
    'which dispatches to the appropriate widget handlers. Each widget maintains its own local state '
    'via the widget lifecycle API (getState/setState), with the option to persist state to the '
    'shared whiteboard store for cross-session recovery. The whiteboard store serves as the source '
    'of truth for all element data, page state, and collaboration presence information.',
    style_body))

story.append(Paragraph(
    'For real-time collaboration, widget state changes are serialized and broadcast through the '
    'WebSocket connection to all participants. CRDT (Conflict-free Replicated Data Types) handle '
    'concurrent edits to the same element without requiring a central authority for conflict '
    'resolution. Element locking provides an opt-in mechanism for tutors who want to prevent '
    'students from modifying specific areas of the whiteboard during a session.',
    style_body))

# ═══════════════════════════════════════════════════════
# BUILD ORDER AND TIMELINE
# ═══════════════════════════════════════════════════════
story.append(PageBreak())
add_heading('Build Order and Timeline', style_h1, 0, story)
story.append(Paragraph(
    'The build order prioritizes features that provide the most value to freelance tutors in the '
    'shortest time. Phase 2 (Virtual Classroom) is the immediate next milestone, with an estimated '
    'timeline of 12 weeks organized into six two-week sprints. Each sprint delivers a functional '
    'increment that can be tested and validated before proceeding. The subsequent phases are estimated '
    'based on complexity but will be refined as Phase 2 progresses.',
    style_body))

add_heading('Phase 2 Sprint Plan', style_h2, 1, story)
story.append(make_table(
    ['Sprint', 'Focus Areas', 'Key Deliverables'],
    [
        ['Sprint 1 (Weeks 1-2)', 'Auth + Session Foundation', 'User accounts, email/password login, OAuth, role-based permissions, session CRUD, waiting room'],
        ['Sprint 2 (Weeks 3-4)', 'Real-Time Collaboration Core', 'Multiplayer cursors, presence indicators, element locking, CRDT sync, conflict resolution'],
        ['Sprint 3 (Weeks 5-6)', 'Video/Audio + Chat', 'LiveKit integration, grid/speaker/gallery layouts, text chat, emoji reactions, file sharing'],
        ['Sprint 4 (Weeks 7-8)', 'High-Priority Widgets', 'Countdown Timer, Quick Polls, Score/Points widgets, widget tray UI, drag-to-toolbar'],
        ['Sprint 5 (Weeks 9-10)', 'Medium-Priority Widgets + Student Mgmt', 'Thumbs Up/Down, Progress Bar, Raise Hand, Random Picker, student roster, profiles'],
        ['Sprint 6 (Weeks 11-12)', 'Polish + Remaining Widgets', 'Attention Check, Noise Meter, Stopwatch, persistent boards, board templates, recording'],
    ],
    [90, 120, CONTENT_W - 210]
))
story.append(Spacer(1, 4))
story.append(Paragraph('Table 18: Phase 2 sprint plan', style_caption))

add_heading('Overall Timeline', style_h2, 1, story)
story.append(make_table(
    ['Phase', 'Duration', 'Start', 'End', 'Dependencies'],
    [
        ['Phase 2: Virtual Classroom', '12 weeks', 'Immediately', 'Month 3', 'Phase 1 complete'],
        ['Phase 3: Monetization', '6 weeks', 'Month 3', 'Month 4.5', 'Phase 2 core features'],
        ['Phase 4: AI Features', '10 weeks', 'Month 4', 'Month 6.5', 'Phase 2 sessions, recording'],
        ['Phase 5: SDK and Marketplace', '10 weeks', 'Month 6', 'Month 8.5', 'Phase 2 widget API stable'],
        ['Phase 6: Enterprise', '10 weeks', 'Month 8', 'Month 10.5', 'Phase 3 billing, Phase 5 SDK'],
        ['Phase 7: Ecosystem', 'Ongoing', 'Month 10+', 'Continuous', 'All prior phases'],
    ],
    [100, 55, 55, 55, CONTENT_W - 265]
))
story.append(Spacer(1, 4))
story.append(Paragraph('Table 19: Overall project timeline', style_caption))

add_heading('Success Criteria', style_h2, 1, story)
story.append(Paragraph(
    'Each phase has defined success criteria that must be met before proceeding to the next phase. '
    'Phase 2 is considered successful when a tutor can create a session, invite a student, conduct '
    'a 30-minute video tutoring session with at least 3 active widgets, and receive an AI-generated '
    'session summary afterward. Phase 3 is successful when the first 100 users convert from free '
    'to paid within 30 days of the monetization launch. Phase 4 is successful when AI features '
    'reduce post-session administrative time by at least 80% based on tutor surveys.',
    style_body))

story.append(make_table(
    ['Phase', 'Primary Success Metric', 'Target', 'Measurement Method'],
    [
        ['Phase 2', 'Complete tutoring session with video + 3 widgets', '90% of test sessions successful', 'QA testing + beta tutor feedback'],
        ['Phase 3', 'Free-to-paid conversion rate', '8-12% within 30 days', 'Stripe analytics dashboard'],
        ['Phase 4', 'Admin time reduction per session', '80% reduction in post-session admin', 'Tutor time-tracking surveys'],
        ['Phase 5', 'Third-party plugins published', '10+ plugins within 3 months', 'Marketplace analytics'],
        ['Phase 6', 'Enterprise contracts signed', '5+ academy accounts within 6 months', 'Sales CRM tracking'],
        ['Phase 7', 'Monthly active users', '10,000+ MAU within 12 months', 'Product analytics (Mixpanel)'],
    ],
    [60, 140, 115, CONTENT_W - 315]
))
story.append(Spacer(1, 4))
story.append(Paragraph('Table 20: Success criteria by phase', style_caption))

# ═══════════════════════════════════════════════════════
# BUILD AND SAVE
# ═══════════════════════════════════════════════════════
OUTPUT_DIR = '/home/z/my-project/download'
BODY_PATH = os.path.join(OUTPUT_DIR, 'superboard_plan_body.pdf')
COVER_PATH = '/home/z/my-project/scripts/superboard_plan_cover.pdf'
FINAL_PATH = os.path.join(OUTPUT_DIR, 'Superboard_Complete_Phase_Plan.pdf')

# Build body PDF with TOC
doc = TocDocTemplate(
    BODY_PATH,
    pagesize=A4,
    leftMargin=LEFT_MARGIN,
    rightMargin=RIGHT_MARGIN,
    topMargin=TOP_MARGIN,
    bottomMargin=BOTTOM_MARGIN,
    title='Superboard Complete Phase Plan',
    author='Superboard',
    subject='7-Phase Product Roadmap for Virtual Classroom Platform',
)
doc.multiBuild(story)
print(f'Body PDF: {BODY_PATH} ({os.path.getsize(BODY_PATH)} bytes)')

# Merge cover + body
from pypdf import PdfReader, PdfWriter
writer = PdfWriter()
cover_reader = PdfReader(COVER_PATH)
body_reader = PdfReader(BODY_PATH)
writer.add_page(cover_reader.pages[0])
for page in body_reader.pages:
    writer.add_page(page)
with open(FINAL_PATH, 'wb') as f:
    writer.write(f)
print(f'Final PDF: {FINAL_PATH} ({os.path.getsize(FINAL_PATH)} bytes)')
