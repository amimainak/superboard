#!/usr/bin/env python3
"""Generate Superboard Roadmap Overview PDF — All 6 Phases"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'skills', 'pdf', 'scripts'))

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm, mm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, CondPageBreak, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ── Fonts ──
FONT_DIR = '/usr/share/fonts'
pdfmetrics.registerFont(TTFont('NotoSerifSC', f'{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSC-Bold', f'{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('NotoSansSC', f'{FONT_DIR}/truetype/chinese/SarasaMonoSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSansSC-Bold', f'{FONT_DIR}/truetype/chinese/SarasaMonoSC-Bold.ttf'))
registerFontFamily('NotoSerifSC', normal='NotoSerifSC', bold='NotoSerifSC-Bold')
registerFontFamily('NotoSansSC', normal='NotoSansSC', bold='NotoSansSC-Bold')

# ── Palette ──
PAGE_BG       = colors.HexColor('#f5f5f5')
SECTION_BG    = colors.HexColor('#f2f1f0')
CARD_BG       = colors.HexColor('#f0efed')
TABLE_STRIPE  = colors.HexColor('#ececea')
HEADER_FILL   = colors.HexColor('#554e39')
COVER_BLOCK   = colors.HexColor('#7f7861')
BORDER        = colors.HexColor('#d5cfbd')
ICON          = colors.HexColor('#a48c43')
ACCENT        = colors.HexColor('#897129')
ACCENT_2      = colors.HexColor('#5da6be')
TEXT_PRIMARY   = colors.HexColor('#23221f')
TEXT_MUTED     = colors.HexColor('#7c7972')
SEM_SUCCESS   = colors.HexColor('#46865c')
SEM_WARNING   = colors.HexColor('#917a4c')
SEM_ERROR     = colors.HexColor('#9a473f')
SEM_INFO      = colors.HexColor('#4978a8')

# ── Page setup ──
W, H = A4
MARGIN = 1.0 * inch
AVAILABLE_W = W - 2 * MARGIN

# ── Styles ──
styles = getSampleStyleSheet()

sH1 = ParagraphStyle('H1', fontName='NotoSansSC-Bold', fontSize=28, leading=34,
    textColor=HEADER_FILL, spaceAfter=8, spaceBefore=4)
sH2 = ParagraphStyle('H2', fontName='NotoSansSC-Bold', fontSize=18, leading=24,
    textColor=ACCENT, spaceAfter=6, spaceBefore=14)
sH3 = ParagraphStyle('H3', fontName='NotoSansSC-Bold', fontSize=14, leading=20,
    textColor=TEXT_PRIMARY, spaceAfter=4, spaceBefore=10)
sBody = ParagraphStyle('Body', fontName='NotoSansSC', fontSize=10.5, leading=17,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK')
sBullet = ParagraphStyle('Bullet', fontName='NotoSansSC', fontSize=10.5, leading=16,
    textColor=TEXT_PRIMARY, leftIndent=18, bulletIndent=6, wordWrap='CJK')
sPhaseTitle = ParagraphStyle('PhaseTitle', fontName='NotoSansSC-Bold', fontSize=20, leading=26,
    textColor=HEADER_FILL, spaceAfter=6, spaceBefore=8)
sPhaseSub = ParagraphStyle('PhaseSub', fontName='NotoSansSC', fontSize=11, leading=17,
    textColor=TEXT_MUTED, spaceAfter=10)
sTableCell = ParagraphStyle('TableCell', fontName='NotoSansSC', fontSize=9.5, leading=14,
    wordWrap='CJK', textColor=TEXT_PRIMARY)
sTableHeader = ParagraphStyle('TableHeader', fontName='NotoSansSC-Bold', fontSize=9.5, leading=14,
    textColor=colors.white, wordWrap='CJK')
sCaption = ParagraphStyle('Caption', fontName='NotoSansSC', fontSize=9, leading=13,
    textColor=TEXT_MUTED, alignment=TA_CENTER, spaceAfter=6)

# ── Helpers ──
def heading1(text):
    return Paragraph(text, sH1)

def heading2(text):
    return Paragraph(text, sH2)

def heading3(text):
    text_str = text
    return Paragraph(text_str, sH3)

def body(text):
    return Paragraph(text, sBody)

def bullet(text):
    return Paragraph(f'<bullet>&bull;</bullet> {text}', sBullet)

def phase_block(phase_num, title, subtitle, features, status_color=None):
    """Build a phase block with header and bullet features."""
    elements = []
    elements.append(KeepTogether([
        Paragraph(f'<font color="{ACCENT.hexval()}">{phase_num}</font>  {title}', sPhaseTitle),
        Paragraph(subtitle, sPhaseSub),
    ]))
    for f in features:
        elements.append(bullet(f))
    elements.append(Spacer(1, 8))
    return elements

def make_table(headers, rows, col_widths=None):
    """Create a styled table."""
    header_row = [Paragraph(h, sTableHeader) for h in headers]
    data = [header_row]
    for row in rows:
        data.append([Paragraph(str(c), sTableCell) for c in row])
    
    if col_widths is None:
        col_widths = [AVAILABLE_W / len(headers)] * len(headers)
    
    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'NotoSansSC-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9.5),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style_cmds.append(('BACKGROUND', (0, i), (-1, i), TABLE_STRIPE))
    t.setStyle(TableStyle(style_cmds))
    return t

def hr():
    return HRFlowable(width='100%', thickness=0.5, color=BORDER, spaceAfter=10, spaceBefore=10)

# ── Build Document ──
output_path = '/home/z/my-project/download/Superboard_Roadmap_Overview.pdf'
os.makedirs(os.path.dirname(output_path), exist_ok=True)

doc = SimpleDocTemplate(
    output_path,
    pagesize=A4,
    leftMargin=MARGIN, rightMargin=MARGIN,
    topMargin=MARGIN, bottomMargin=0.8*inch,
    title='Superboard Virtual Classroom - Product Roadmap',
    author='Superboard',
    subject='Product Roadmap Overview - All 6 Phases'
)

story = []

# ──────────────── COVER ────────────────
story.append(Spacer(1, 120))
story.append(Paragraph('Superboard', ParagraphStyle('CoverTitle',
    fontName='NotoSansSC-Bold', fontSize=48, leading=56, textColor=HEADER_FILL)))
story.append(Spacer(1, 8))
story.append(Paragraph('Virtual Classroom', ParagraphStyle('CoverSub',
    fontName='NotoSansSC', fontSize=28, leading=36, textColor=ACCENT)))
story.append(Spacer(1, 24))
story.append(HRFlowable(width='40%', thickness=2, color=ACCENT, spaceAfter=20))
story.append(Paragraph('Product Roadmap Overview', ParagraphStyle('CoverDesc',
    fontName='NotoSansSC', fontSize=16, leading=22, textColor=TEXT_MUTED)))
story.append(Spacer(1, 12))
story.append(Paragraph('Phases 1 through 6: From Whiteboard Core to Global Ecosystem', ParagraphStyle('CoverDetail',
    fontName='NotoSansSC', fontSize=12, leading=18, textColor=TEXT_MUTED)))
story.append(Spacer(1, 80))
story.append(Paragraph('August 2026', ParagraphStyle('CoverDate',
    fontName='NotoSansSC', fontSize=11, leading=16, textColor=TEXT_MUTED, alignment=TA_CENTER)))

story.append(PageBreak())

# ──────────────── EXECUTIVE SUMMARY ────────────────
story.append(heading1('Executive Summary'))
story.append(Spacer(1, 4))
story.append(body(
    'Superboard is a self-contained virtual classroom platform built on an infinitely extensible whiteboard foundation. '
    'Unlike existing tutoring platforms that offer rigid, closed systems, Superboard positions the whiteboard as the '
    'operating system of the virtual classroom, with every feature layered on top of or around it. This document outlines '
    'the complete product roadmap spanning six phases, from the foundational whiteboard engine through to a global '
    'ecosystem with marketplace, developer SDK, and enterprise integrations.'
))
story.append(Spacer(1, 6))
story.append(body(
    'The roadmap is designed with a clear build-first, then extract philosophy: each phase builds upon the previous '
    'one, ensuring that the product is always usable and revenue-generating before investing in infrastructure. '
    'Phase 1 delivers a functional whiteboard. Phase 2 transforms it into a collaborative classroom. Phase 3 makes it a '
    'commercial product with monetization. Phase 4 extracts the whiteboard as a developer SDK with a plugin marketplace. '
    'Phase 5 scales to enterprise and institutional deployments. Phase 6 establishes the ecosystem moat that makes '
    'Superboard the platform online tutoring runs on.'
))
story.append(Spacer(1, 6))
story.append(body(
    'The target market is the global online tutoring industry, estimated at over $12 billion by 2027. Current solutions '
    'like Koala Go, BitPaper, and TutorPad are closed systems with no extensibility. Superboard\'s unique value '
    'proposition is that it does not compete feature-by-feature; it competes on platform potential, offering educators '
    'and developers the ability to build custom tools on top of the whiteboard canvas.'
))

story.append(Spacer(1, 10))

# ──────────────── PHASE TIMELINE ────────────────
story.append(heading1('Phase Timeline'))
story.append(Spacer(1, 4))
story.append(body(
    'Each phase builds incrementally on the last, with clear milestones and deliverables. The estimated timeline assumes '
    'a small focused team. Phases can overlap where dependencies allow, but the core deliverable of each phase must be '
    'complete before the next begins.'
))

timeline_data = [
    ['Phase', 'Name', 'Focus', 'Est. Duration'],
    ['Phase 1', 'Whiteboard Core', 'Drawing engine, tools, UI', 'Current (completed)'],
    ['Phase 2', 'Classroom Features', 'Auth, collaboration, video, widgets', '12 weeks'],
    ['Phase 3', 'Product & Monetization', 'Landing page, billing, dashboards', '8 weeks'],
    ['Phase 4', 'SDK & Marketplace', 'Plugin system, developer portal', '10 weeks'],
    ['Phase 5', 'Scale & Enterprise', 'LMS, SSO, compliance, mobile', '12 weeks'],
    ['Phase 6', 'Ecosystem & Moat', 'API, community, certifications', 'Ongoing'],
]

story.append(Spacer(1, 6))
cw = [AVAILABLE_W * 0.10, AVAILABLE_W * 0.25, AVAILABLE_W * 0.40, AVAILABLE_W * 0.25]
story.append(make_table(timeline_data[0], timeline_data[1:], cw))
story.append(Spacer(1, 4))
story.append(Paragraph('Table 1: Phase timeline overview with estimated durations', sCaption))

story.append(Spacer(1, 12))

# ──────────────── PHASE 1 ────────────────
story.append(heading1('Phase 1: Whiteboard Core'))
story.append(Spacer(1, 2))
story.append(Paragraph('<font color="#46865c">COMPLETED</font>', ParagraphStyle('Status',
    fontName='NotoSansSC-Bold', fontSize=10, textColor=SEM_SUCCESS)))
story.append(Spacer(1, 4))
story.append(body(
    'Phase 1 delivers a fully functional infinite canvas whiteboard with a comprehensive set of drawing tools, '
    'style customization, and multi-page support. This is the foundation upon which the entire virtual classroom is built. '
    'The whiteboard uses an SVG-based rendering engine with a Zustand state store, supporting freehand drawing via the '
    'perfect-freehand library, geometric shapes, text, sticky notes, images, laser pointer, and an eraser with freehand '
    'path splitting. It includes undo/redo with a 50-step history stack, copy/cut/paste, duplicate, multi-page support, '
    'dark mode, grid patterns (dot and line), snap-to-grid, pan/zoom with pinch-to-zoom, and keyboard shortcuts.'
))
story.append(Spacer(1, 6))

p1_features = [
    'Drawing tools: Pen, Highlighter, Shapes (rectangle, ellipse, diamond, triangle), Lines, Arrows',
    'Text tool with contenteditable foreignObject, multiple fonts and sizes',
    'Sticky notes with 5 color options and inline editing',
    'Image placement via file upload with drag-to-position',
    'Frame tool for creating labeled regions on the canvas',
    'Eraser with freehand path splitting for precise erasure',
    'Laser pointer with auto-fade animation',
    'Selection with click, shift-click, and box-select; move, resize, and z-order controls',
    'Style panel: 16 stroke colors, 16 fill colors, 6 stroke widths, 4 dash patterns',
    'Text styling: 3 font families, 5 font sizes, alignment, bold, italic',
    'Opacity slider (0-100%) with inline display',
    'Undo/redo with 50-step history stack (Ctrl+Z / Ctrl+Shift+Z)',
    'Copy, cut, paste, duplicate (Ctrl+C/X/V/D)',
    'Multi-page support with add, delete, rename, and switch',
    'Dark mode with system preference detection',
    'Grid patterns (dot and line) with configurable spacing',
    'Pan and zoom via scroll, pinch, space+drag, and toolbar buttons',
    'Keyboard shortcuts for all major tools and actions',
    'Export to PNG, JPEG, SVG, and JSON formats',
    'Group/ungroup, lock/unlock, bring to front/send to back',
    'Alignment guides during element movement',
]
for f in p1_features:
    story.append(bullet(f))

story.append(Spacer(1, 8))

p1_audit = [
    ['Category', 'Critical', 'Important', 'Minor'],
    ['UI/UX Bugs', '1 (XSS risk in text)', '12', '0'],
    ['Type Safety', '0', '3', '1'],
    ['Performance', '0', '4', '3'],
    ['Missing Features', '0', '11', '4'],
    ['Code Quality', '0', '3', '7'],
    ['Total', '1', '33', '15'],
]
cw2 = [AVAILABLE_W * 0.28, AVAILABLE_W * 0.24, AVAILABLE_W * 0.24, AVAILABLE_W * 0.24]
story.append(heading3('Phase 1 Audit Summary'))
story.append(make_table(p1_audit[0], p1_audit[1:], cw2))
story.append(Spacer(1, 4))
story.append(Paragraph('Table 2: Phase 1 code audit results by severity', sCaption))

story.append(CondPageBreak(100))

# ──────────────── PHASE 2 ────────────────
story.append(heading1('Phase 2: Classroom Features'))
story.append(Spacer(1, 4))
story.append(body(
    'Phase 2 transforms the standalone whiteboard into a collaborative virtual classroom. This is the most feature-dense '
    'phase, covering user authentication, role-based permissions, real-time multi-user collaboration, video and audio '
    'conferencing, text chat, classroom widgets, session recording, and persistent board storage. The goal is to deliver '
    'a product that a tutor can immediately use to teach a student online, with the whiteboard at the center and '
    'classroom features surrounding it.'
))
story.append(Spacer(1, 4))

p2_categories = [
    ('2A. User Accounts & Authentication', 'Sign up (email, Google, Microsoft OAuth), profile pages, role selection '
     '(tutor/student), password reset, email verification, JWT session tokens with refresh, and multiple account types '
     '(personal tutor, agency, school, student).'),
    ('2B. Role & Permission System', 'Four roles: Teacher (full control), Student (restricted drawing, tools, chat), '
     'Co-teacher (shared control minus session deletion), Observer (view-only). Tool-level permissions let teachers '
     'disable specific tools for students. Zone permissions define student-editable vs locked canvas areas. '
     'Object-level locking prevents students from moving or deleting specific elements.'),
    ('2C. Session Management', 'Create sessions with unique rooms, shareable invite links, 6-digit join codes, waiting '
     'rooms, session timers, scheduling with reminders, recurring sessions, board templates, and session lifecycle states '
     '(draft, scheduled, active, ended, archived).'),
    ('2D. Real-Time Collaboration', 'Multi-user cursors with name labels, live drawing sync with conflict resolution, '
     'user presence indicators, latency compensation via optimistic updates, reconnection handling, and full board '
     'state sync for users joining mid-session.'),
    ('2E. Student Management', 'Student roster, invite by email or link, remove students, mute/unmute drawing or chat, '
     'spotlight student work, student sandbox areas for private practice, and group assignment.'),
    ('2F. Video & Audio (WebRTC)', 'Teacher video (pinned or movable), student video thumbnail grid, audio and video '
     'toggle per participant, teacher-only audio mode, screen sharing, audio quality indicators, and low-bandwidth mode.'),
    ('2G. Text Chat', 'Real-time session chat, private messages, teacher-controlled chat permissions, chat history '
     'saved with session, emoji support, file sharing, and pinned messages.'),
    ('2H. Classroom Widgets', 'Raise hand queue, countdown timer, multiple-choice polls with live results, thumbs '
     'up/down voting, attention checks, noise meter, stopwatch, random student picker, score/points system, and '
     'progress bar.'),
    ('2I. Session Recording', 'Record session (drawing + audio), auto-record option, playback with play/pause/rewind, '
     'timeline scrubber, speed control (0.5x to 2x), recording list, shareable links, MP4 download, and chapter markers.'),
    ('2J. Persistent Boards', 'Auto-save every few seconds, save/load with custom names, board templates (graph paper, '
     'music staff, lined, grid, blank), custom templates from saved boards, version history, export as image/PDF, and '
     'multi-page boards within one session.'),
]

for title, desc in p2_categories:
    story.append(heading3(title))
    story.append(body(desc))

story.append(CondPageBreak(100))

# ──────────────── PHASE 3 ────────────────
story.append(heading1('Phase 3: Product & Monetization'))
story.append(Spacer(1, 4))
story.append(body(
    'Phase 3 converts the classroom into a commercial product. This means building the marketing presence, pricing '
    'infrastructure, user dashboards, onboarding flows, and subscription management that turn Superboard from a '
    'feature-rich tool into a revenue-generating SaaS platform. The focus is on creating a seamless path from discovery '
    'to first paid session for tutors, and from sign-up to first lesson for students.'
))
story.append(Spacer(1, 6))

p3_features = [
    ('Landing Page & Marketing Site', 'Professional landing page with value proposition, feature showcases, '
     'comparison vs competitors, testimonials, pricing section, and a clear call-to-action. SEO-optimized content '
     'targeting "online tutoring whiteboard" and related keywords.'),
    ('Pricing & Stripe Integration', 'Four tiers: Free (basic whiteboard, 2 users, 30-min sessions), Tutor '
     '($15-25/mo, unlimited sessions, 10 students), Academy ($49-99/mo, unlimited students, analytics, recording), '
     'Enterprise ($299+/mo, SSO, LMS integration, white-label). Stripe checkout with annual billing discount.'),
    ('Tutor Dashboard', 'Manage students, view upcoming and past sessions, access analytics (session count, student '
     'retention, revenue), manage subscription, customize profile and branding.'),
    ('Student Dashboard', 'View upcoming classes, access session history and recordings, manage subscription if '
     'applicable, view tutor ratings and feedback.'),
    ('Email Notifications', 'Session reminders, follow-up emails, payment receipts, new student notifications, '
     'weekly activity summaries, and re-engagement campaigns for inactive users.'),
    ('Onboarding Flow', 'Interactive onboarding for new tutors (step-by-step: set up profile, create first session, '
     'invite student, explore tools). Tooltips and contextual help for first-time users.'),
    ('Subscription Management', 'Upgrade, downgrade, cancel, view billing history, update payment method, manage team '
     'seats for agency accounts.'),
]

for title, desc in p3_features:
    story.append(heading3(title))
    story.append(body(desc))

story.append(CondPageBreak(100))

# ──────────────── PHASE 4 ────────────────
story.append(heading1('Phase 4: SDK & Marketplace'))
story.append(Spacer(1, 4))
story.append(body(
    'Phase 4 extracts the whiteboard engine as a standalone SDK and launches the plugin marketplace. This is the '
    'architecture pivot that transforms Superboard from a product into a platform. The SDK is free forever and open-source, '
    'serving as a customer acquisition channel. The marketplace generates passive revenue through a 70/30 revenue split '
    '(developer/Superboard) on paid plugins. This phase requires careful API design, security sandboxing, and developer '
    'experience optimization to attract plugin developers.'
))
story.append(Spacer(1, 6))

p4_features = [
    ('Whiteboard SDK (@superboard/core)', 'Extract the whiteboard engine as an npm package. Expose registerTool(), '
     'registerWidget(), useCanvas(), useSelection(), useRole(), useSession(), useStudents(), and useAssessment() hooks. '
     'Provide TypeScript types, documentation, and example projects. The SDK gives developers controlled access to the '
     'canvas, state, events, and permissions without exposing internals.'),
    ('Plugin Security Sandbox', 'Plugins run in an isolated context. They cannot access each other\'s data without '
     'permission, cannot break the core whiteboard, and are subject to resource limits (CPU, memory, network). A review '
     'process for published plugins ensures quality and security.'),
    ('Marketplace UI', 'Browse, search, install, review, and rate plugins. Categories: Math, Science, Language, Music, '
     'Assessment, Utility, Accessibility. One-click install per classroom or per user account. Teacher can pre-configure '
     'which plugins are available in their classroom.'),
    ('Developer Portal', 'Documentation site with API reference, quickstart guides, tutorial videos, example plugins, '
     'and a testing playground. CLI tools for plugin scaffolding, local testing, and publishing.'),
    ('Revenue Sharing', 'Developers list plugins as free or paid. Paid plugins are subscription-based or one-time '
     'purchase. Superboard takes a 30% cut, developer keeps 70%. Payouts via Stripe Connect on a monthly cycle.'),
]

for title, desc in p4_features:
    story.append(heading3(title))
    story.append(body(desc))

story.append(CondPageBreak(100))

# ──────────────── PHASE 5 ────────────────
story.append(heading1('Phase 5: Scale & Enterprise'))
story.append(Spacer(1, 4))
story.append(body(
    'Phase 5 focuses on scaling Superboard from individual tutors to institutions. This means LMS integrations (Moodle, '
    'Canvas, Google Classroom), SSO for schools, institutional admin dashboards, compliance with education regulations, '
    'mobile applications, breakout rooms with nested boards, and AI-powered features. This phase opens up the enterprise '
    'and K-12 markets, which represent the largest revenue opportunity.'
))
story.append(Spacer(1, 6))

p5_features = [
    ('LMS Integration', 'Connect Superboard to Moodle, Canvas, Google Classroom, and Blackboard. Teachers launch '
     'Superboard sessions directly from their LMS course page. Student grades and attendance sync back to the LMS '
     'gradebook. LTI 1.3 standard compliance for seamless single sign-on and grade passback.'),
    ('SSO & Identity', 'SAML 2.0 and OAuth 2.0 support for school districts and universities. Directory sync with '
     'Google Workspace, Microsoft Active Directory, and LDAP. Role mapping from institutional roles to Superboard roles.'),
    ('Admin Dashboard', 'Institutional admins manage teachers, students, and classrooms. View usage analytics across '
     'the organization. Enforce policies (recording requirements, tool restrictions, data retention). Bulk user import '
     'via CSV or SIS integration.'),
    ('Compliance', 'COPPA compliance for K-12 students (parental consent flows, data minimization). FERPA compliance '
     'for student records protection. GDPR-K for international data handling. SOC 2 Type II certification for '
     'enterprise trust. Data encryption at rest and in transit. Annual security audits.'),
    ('Mobile Apps', 'Native iOS and Android apps with full classroom functionality. Optimized for tablet use with '
     'Apple Pencil and S Pen support. Offline mode with sync when reconnected. Push notifications for session reminders '
     'and messages.'),
    ('Breakout Rooms', 'Teacher creates breakout groups, each with its own nested whiteboard board. Students can be '
     'assigned to groups manually or randomly. Teacher can peek into any room, broadcast messages to all rooms, and '
     'pull students back to the main room. Breakout boards can be saved and shared.'),
    ('AI Features', 'Auto-summarize session notes from whiteboard content. Smart suggestions for teaching resources '
     'based on lesson context. Automated attendance tracking via face recognition (with consent). Student engagement '
     'scoring based on participation patterns. Intelligent content recommendations.'),
]

for title, desc in p5_features:
    story.append(heading3(title))
    story.append(body(desc))

story.append(CondPageBreak(100))

# ──────────────── PHASE 6 ────────────────
story.append(heading1('Phase 6: Ecosystem & Moat'))
story.append(Spacer(1, 4))
story.append(body(
    'Phase 6 is the long-term moat-building phase. It transforms Superboard from a product into an ecosystem. This '
    'includes public APIs for third-party integrations, automation connectors (Zapier, Make), a tutor community with '
    'resource library, certification programs, partner programs for tutoring agencies, internationalization, offline '
    'mode, and advanced real-time collaboration features like CRDTs for conflict-free concurrent editing. Phase 6 '
    'is ongoing and evolves based on market feedback.'
))
story.append(Spacer(1, 6))

p6_features = [
    ('Public API & Integrations', 'RESTful and WebSocket APIs for third-party integrations. Zapier and Make connectors '
     'for workflow automation (e.g., "when a session ends, create a summary in Google Docs"). Webhooks for event-driven '
     'integrations. OAuth app registration for third-party developers.'),
    ('Tutor Community', 'Community forum for tutors to share resources, lesson plans, and best practices. Resource '
     'library with downloadable templates, worksheets, and teaching materials. Peer-to-peer support and mentoring '
     'program. User-generated content drives SEO and organic growth.'),
    ('Certification Program', 'Superboard Certified Tutor program: tutors complete training modules, pass assessments, '
     'and earn a badge displayed on their profile. Parents and students can filter by certified tutors. Creates a quality '
     'signal that differentiates Superboard from unmoderated platforms.'),
    ('Partner Program', 'Partnership program for tutoring agencies, school districts, and EdTech companies. Referral '
     'commissions, co-marketing opportunities, and API access for custom integrations. White-label options for large '
     'partners who want Superboard under their own brand.'),
    ('Internationalization', 'Multi-language support for UI, tutorials, and customer support. RTL language support for '
     'Arabic and Hebrew. Localized pricing and payment methods. Regional data centers for compliance and latency.'),
    ('Offline Mode', 'Full offline whiteboard functionality with local storage. Sync when reconnected with conflict '
     'resolution. Useful for areas with unreliable internet connectivity, a common scenario in developing markets.'),
    ('Advanced Real-Time', 'CRDT-based conflict resolution for truly concurrent editing without a central server '
     'bottleneck. Operational transform fallback for legacy compatibility. Sub-100ms latency target for global users '
     'via edge servers. Offline-first architecture with eventual consistency.'),
]

for title, desc in p6_features:
    story.append(heading3(title))
    story.append(body(desc))

story.append(CondPageBreak(100))

# ──────────────── REVENUE MODEL ────────────────
story.append(heading1('Revenue Model'))
story.append(Spacer(1, 4))
story.append(body(
    'Superboard generates revenue through four channels: platform subscriptions (primary), plugin marketplace revenue '
    'share, custom widget development services, and enterprise contracts. The subscription model is the bread and '
    'butter, targeting individual tutors and agencies. The marketplace is the margin amplifier. Custom development '
    'and enterprise deals represent high-value opportunities as the platform matures.'
))
story.append(Spacer(1, 6))

rev_data = [
    ['Channel', 'Model', 'Target', 'Timeline'],
    ['Platform Subscriptions', '$15-299/mo per user', 'Primary revenue', 'Phase 3+'],
    ['Plugin Marketplace', '30% cut on paid plugins', 'Passive revenue', 'Phase 4+'],
    ['Custom Development', '$5K-50K per engagement', 'Services revenue', 'Phase 4+'],
    ['Enterprise Contracts', '$299+/mo + setup fees', 'High-value deals', 'Phase 5+'],
]
cw3 = [AVAILABLE_W * 0.25, AVAILABLE_W * 0.30, AVAILABLE_W * 0.22, AVAILABLE_W * 0.23]
story.append(make_table(rev_data[0], rev_data[1:], cw3))
story.append(Spacer(1, 4))
story.append(Paragraph('Table 3: Revenue channels and targets', sCaption))

story.append(Spacer(1, 12))

proj_data = [
    ['Period', 'Active Tutors', 'Paying Users', 'Monthly Revenue', 'Key Milestones'],
    ['Year 1', '1,000', '0 (free tier)', '$0', 'Build core + launch free tier'],
    ['Year 2', '5,000', '500', '~$8,500/mo', 'Marketplace launch, 50 plugins'],
    ['Year 3', '25,000', '5,000+', '~$120K/mo', 'Enterprise deals, mobile apps'],
]
cw4 = [AVAILABLE_W * 0.12, AVAILABLE_W * 0.18, AVAILABLE_W * 0.18, AVAILABLE_W * 0.22, AVAILABLE_W * 0.30]
story.append(heading3('Projected Growth'))
story.append(make_table(proj_data[0], proj_data[1:], cw4))
story.append(Spacer(1, 4))
story.append(Paragraph('Table 4: Revenue projections over 3 years', sCaption))

story.append(CondPageBreak(80))

# ──────────────── STRATEGIC POSITIONING ────────────────
story.append(heading1('Strategic Positioning'))
story.append(Spacer(1, 4))
story.append(body(
    'Superboard\'s strategic advantage is that it does not compete feature-by-feature with existing tutoring whiteboards. '
    'Instead, it competes on platform potential. While competitors like Koala Go, BitPaper, TutorPad, and Explain Everything '
    'are closed systems with fixed feature sets, Superboard offers an infinitely extensible canvas where educators and '
    'developers can build custom tools. The whiteboard is the foundation, the classroom is the product, and the SDK is '
    'the ecosystem builder.'
))
story.append(Spacer(1, 6))

comp_data = [
    ['Feature', 'Superboard', 'Koala Go', 'BitPaper', 'Explain Everything'],
    ['Extensible (Plugin SDK)', 'Yes (Phase 4)', 'No', 'No', 'No'],
    ['Role-Based Permissions', 'Yes (Phase 2)', 'Limited', 'Basic', 'No'],
    ['Session Recording', 'Yes (Phase 2)', 'Yes', 'No', 'Yes'],
    ['Plugin Marketplace', 'Yes (Phase 4)', 'No', 'No', 'No'],
    ['LMS Integration', 'Yes (Phase 5)', 'No', 'Limited', 'No'],
    ['White-Label', 'Yes (Phase 5)', 'No', 'No', 'No'],
    ['API/Integrations', 'Yes (Phase 6)', 'No', 'No', 'No'],
]
cw5 = [AVAILABLE_W * 0.28, AVAILABLE_W * 0.18, AVAILABLE_W * 0.18, AVAILABLE_W * 0.18, AVAILABLE_W * 0.18]
story.append(make_table(comp_data[0], comp_data[1:], cw5))
story.append(Spacer(1, 4))
story.append(Paragraph('Table 5: Competitive feature comparison', sCaption))

# ──────────────── BUILD ────────────────
doc.build(story)
print(f'PDF generated: {output_path}')
