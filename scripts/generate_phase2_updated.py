#!/usr/bin/env python3
"""Generate Superboard Phase 2 Updated Detailed Plan PDF — Incorporates all locked decisions"""

import sys, os, hashlib
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'skills', 'pdf', 'scripts'))

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm, mm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, CondPageBreak, HRFlowable,
    ListFlowable, ListItem
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.platypus.tableofcontents import TableOfContents

# ── Fonts ──
FONT_DIR = '/usr/share/fonts'
pdfmetrics.registerFont(TTFont('NotoSerifSC', f'{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSC-Bold', f'{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif', f'{FONT_DIR}/truetype/freefont/FreeSerif.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif-Bold', f'{FONT_DIR}/truetype/freefont/FreeSerifBold.ttf'))
registerFontFamily('NotoSerifSC', normal='NotoSerifSC', bold='NotoSerifSC-Bold')
registerFontFamily('FreeSerif', normal='FreeSerif', bold='FreeSerif-Bold')

# ━━ Cascade Palette ━━
PAGE_BG       = colors.HexColor('#f0f0ef')
SECTION_BG    = colors.HexColor('#e9e9e6')
CARD_BG       = colors.HexColor('#efeeeb')
TABLE_STRIPE  = colors.HexColor('#f5f4f3')
HEADER_FILL   = colors.HexColor('#786c48')
COVER_BLOCK   = colors.HexColor('#756b4e')
BORDER        = colors.HexColor('#cbc6b7')
ICON          = colors.HexColor('#928255')
ACCENT        = colors.HexColor('#92761f')
ACCENT_2      = colors.HexColor('#3597b7')
TEXT_PRIMARY   = colors.HexColor('#151513')
TEXT_MUTED     = colors.HexColor('#827f78')
SEM_SUCCESS   = colors.HexColor('#4f9366')
SEM_WARNING   = colors.HexColor('#9b7e44')
SEM_ERROR     = colors.HexColor('#924b45')
SEM_INFO      = colors.HexColor('#466889')

# ── Page Setup ──
PAGE_W, PAGE_H = A4
MARGIN = 50
AVAILABLE_W = PAGE_W - MARGIN * 2
output_path = '/home/z/my-project/download/Superboard_Phase2_Updated_Plan.pdf'
os.makedirs(os.path.dirname(output_path), exist_ok=True)

# ── Styles ──
def make_style(name, **kwargs):
    return ParagraphStyle(name, **kwargs)

sH1 = make_style('H1', fontName='FreeSerif-Bold', fontSize=20, leading=26,
                 textColor=HEADER_FILL, spaceBefore=18, spaceAfter=8)
sH2 = make_style('H2', fontName='FreeSerif-Bold', fontSize=14, leading=19,
                 textColor=ACCENT, spaceBefore=14, spaceAfter=6)
sH3 = make_style('H3', fontName='FreeSerif-Bold', fontSize=11.5, leading=16,
                 textColor=TEXT_PRIMARY, spaceBefore=10, spaceAfter=4)
sBody = make_style('Body', fontName='FreeSerif', fontSize=10, leading=16,
                  textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY, spaceAfter=6)
sBodyBold = make_style('BodyBold', fontName='FreeSerif-Bold', fontSize=10, leading=16,
                      textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY, spaceAfter=6)
sBullet = make_style('Bullet', fontName='FreeSerif', fontSize=10, leading=15,
                     textColor=TEXT_PRIMARY, leftIndent=20, bulletIndent=8, spaceAfter=3)
sCaption = make_style('Caption', fontName='FreeSerif', fontSize=8.5, leading=12,
                     textColor=TEXT_MUTED, alignment=TA_LEFT, spaceAfter=10, spaceBefore=2)
sSectionIntro = make_style('SectionIntro', fontName='FreeSerif', fontSize=10.5, leading=16,
                           textColor=ACCENT, spaceBefore=4, spaceAfter=8)
sNote = make_style('Note', fontName='FreeSerif', fontSize=9.5, leading=14,
                   textColor=SEM_INFO, leftIndent=15, borderColor=ACCENT_2,
                   borderWidth=1, borderPadding=6, spaceAfter=8,
                   backColor=colors.HexColor('#f0f7fa'))
sTocL0 = make_style('TocL0', fontName='FreeSerif-Bold', fontSize=12, leading=22,
                    textColor=TEXT_PRIMARY)
sTocL1 = make_style('TocL1', fontName='FreeSerif', fontSize=10.5, leading=20,
                    textColor=TEXT_MUTED, leftIndent=20)
sTocL2 = make_style('TocL2', fontName='FreeSerif', fontSize=9.5, leading=18,
                    textColor=TEXT_MUTED, leftIndent=40)

def heading1(text):
    key = f'h_{hashlib.md5(text.encode()).hexdigest()[:8]}'
    p = Paragraph(f'<a name="{key}"/>{text}', sH1)
    p.bookmark_name = key
    p.bookmark_level = 0
    p.bookmark_text = text
    p.bookmark_key = key
    return p

def heading2(text):
    key = f'h_{hashlib.md5(text.encode()).hexdigest()[:8]}'
    p = Paragraph(f'<a name="{key}"/>{text}', sH2)
    p.bookmark_name = key
    p.bookmark_level = 1
    p.bookmark_text = text
    p.bookmark_key = key
    return p

def heading3(text):
    key = f'h_{hashlib.md5(text.encode()).hexdigest()[:8]}'
    p = Paragraph(f'<a name="{key}"/>{text}', sH3)
    p.bookmark_name = key
    p.bookmark_level = 2
    p.bookmark_text = text
    p.bookmark_key = key
    return p

def body(text):
    return Paragraph(text, sBody)

def note(text):
    return Paragraph(text, sNote)

def bullet_list(items):
    """Build bullet list from list of strings."""
    elements = []
    for item in items:
        elements.append(Paragraph(f'<bullet>&bull;</bullet>{item}', sBullet))
    return elements

def make_table(headers, rows, col_widths=None):
    """Create a styled table."""
    all_data = [headers] + rows
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'FreeSerif-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTNAME', (0, 1), (-1, -1), 'FreeSerif'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('LEADING', (0, 0), (-1, -1), 13),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.4, BORDER),
        ('LINEBELOW', (0, 0), (-1, 0), 1, HEADER_FILL),
    ]
    for i in range(1, len(all_data)):
        if i % 2 == 0:
            style_cmds.append(('BACKGROUND', (0, i), (-1, i), TABLE_STRIPE))
        else:
            style_cmds.append(('BACKGROUND', (0, i), (-1, i), colors.white))
    t = Table(all_data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle(style_cmds))
    return t

# ── TOC DocTemplate ──
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

# ── Page number callback ──
def add_page_number(canvas_obj, doc_obj):
    """Draw page number in footer, skip cover page."""
    page_num = doc_obj.page
    if page_num <= 2:  # Skip cover and TOC pages
        return
    canvas_obj.saveState()
    canvas_obj.setFont('FreeSerif', 8)
    canvas_obj.setFillColor(TEXT_MUTED)
    canvas_obj.drawCentredString(PAGE_W / 2, 25, str(page_num - 2))
    canvas_obj.restoreState()

# ── Build Document ──
from reportlab.platypus import PageTemplate, Frame
content_frame = Frame(MARGIN, MARGIN, PAGE_W - 2*MARGIN, PAGE_H - 2*MARGIN, id='normal')
cover_frame = Frame(MARGIN, MARGIN, PAGE_W - 2*MARGIN, PAGE_H - 2*MARGIN, id='cover')

doc = TocDocTemplate(
    output_path,
    pagesize=A4,
    leftMargin=MARGIN, rightMargin=MARGIN,
    topMargin=MARGIN, bottomMargin=MARGIN,
    title='Superboard Phase 2 - Updated Detailed Implementation Plan',
    author='Superboard',
    subject='Phase 2 Classroom Features - Widget Architecture, Supabase, Hocuspocus+Yjs, Oracle Cloud VPS'
)

story = []

# ══════════════════════════════════════════════════════════
# COVER
# ══════════════════════════════════════════════════════════
story.append(Spacer(1, 120))
story.append(Paragraph('Phase 2', make_style('CoverTitle', fontName='FreeSerif-Bold',
    fontSize=52, leading=60, textColor=HEADER_FILL)))
story.append(Spacer(1, 8))
story.append(Paragraph('Classroom Features', make_style('CoverSub', fontName='FreeSerif',
    fontSize=28, leading=36, textColor=ACCENT)))
story.append(Spacer(1, 16))
story.append(HRFlowable(width='30%', thickness=2, color=ACCENT, spaceAfter=20))
story.append(Paragraph('Updated Implementation Plan', make_style('CoverDesc',
    fontName='FreeSerif', fontSize=15, leading=21, textColor=TEXT_MUTED)))
story.append(Spacer(1, 6))
story.append(Paragraph('Widget Architecture | Supabase | Hocuspocus + Yjs | Oracle Cloud VPS | Self-Hosted LiveKit',
    make_style('CoverTags', fontName='FreeSerif', fontSize=10, leading=15, textColor=TEXT_MUTED)))
story.append(Spacer(1, 80))
story.append(Paragraph('Superboard Collaborative Whiteboard', make_style('CoverFooter',
    fontName='FreeSerif', fontSize=10, leading=14, textColor=TEXT_MUTED, alignment=TA_CENTER)))
story.append(Paragraph('August 2026', make_style('CoverDate',
    fontName='FreeSerif', fontSize=10, leading=14, textColor=TEXT_MUTED, alignment=TA_CENTER)))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════
# TABLE OF CONTENTS
# ══════════════════════════════════════════════════════════
story.append(heading1('Table of Contents'))
story.append(Spacer(1, 8))
toc = TableOfContents()
toc.levelStyles = [sTocL0, sTocL1, sTocL2]
story.append(toc)
story.append(PageBreak())

# ══════════════════════════════════════════════════════════
# 1. PHASE 2 OVERVIEW
# ══════════════════════════════════════════════════════════
story.append(heading1('1. Phase 2 Overview'))
story.append(Spacer(1, 4))
story.append(Paragraph('Turning a Standalone Whiteboard into a Live Virtual Classroom', sSectionIntro))
story.append(body(
    'Phase 2 transforms the Superboard whiteboard (delivered in Phase 1 as a fully functional standalone SVG drawing '
    'application deployed on Vercel) into a real-time collaborative virtual classroom. Where Phase 1 gave tutors a '
    'powerful canvas with drawing tools, shape recognition, multiple colors, and a help center, Phase 2 adds the '
    'classroom layer on top: user authentication, multi-user real-time collaboration via Hocuspocus and Yjs, '
    'video and audio calling through self-hosted LiveKit, text chat, AI-powered tutor assistance widgets, '
    'subject-specific toolkits, and persistent board storage. Every new feature is built as a modular widget that '
    'tutors can toggle on or off, ensuring the whiteboard canvas always remains the primary interaction surface.'
))
story.append(body(
    'The guiding architectural principle for Phase 2 is: <b>"The whiteboard is the classroom, and everything else '
    'orbits around it."</b> Video, chat, AI panels, student management, and subject toolkits all exist as dockable, '
    'resizable widget panels around the central SVG canvas. They never replace or obscure the whiteboard. A tutor '
    'teaching a math lesson might activate the GeoGebra graphing widget, the AI equation solver, and the video widget, '
    'while a language tutor might instead activate the highlighter toolkit, the mind-map widget, and the text chat. '
    'Each session is a unique combination of widgets chosen by the tutor for that specific lesson.'
))
story.append(body(
    'This document provides the single source of truth for Phase 2 implementation. It incorporates all architectural '
    'decisions locked during planning: custom SVG whiteboard engine (retained from Phase 1), Supabase for all '
    'database and authentication needs (no SQLite, no local databases), Hocuspocus and Yjs for real-time collaboration, '
    'Oracle Cloud Free Tier ARM instance as the VPS, three-subdomain DNS architecture, and self-hosted LiveKit for '
    'video and audio. It also carries forward core directives from the project blueprint: AI assists the teacher only '
    '(never the student), zero PII collected from students (anonymous identifiers via Yjs awareness), lean whiteboard '
    'SaaS scope (no homework, scheduling, or native recording), and COPPA compliance through zero-PII design.'
))

story.append(Spacer(1, 8))
story.append(heading2('1.1 Locked Architectural Decisions'))
story.append(body(
    'Before any code is written, the following decisions are final and must not be revisited during Phase 2 '
    'implementation. They were made during the planning phase and represent the product, technical, and business '
    'constraints that shape every feature in this document.'
))

decisions = [
    ['Decision', 'Choice', 'Rationale'],
    ['Whiteboard Engine', 'Custom SVG Canvas', 'Already built and deployed in Phase 1. Functional, tested, and working at superboard-three.vercel.app.'],
    ['Real-Time Sync', 'Hocuspocus + Yjs', 'Battle-tested CRDT sync for collaborative editing. Persistent WebSocket connections require a dedicated VPS, not serverless.'],
    ['VPS Hosting', 'Oracle Cloud Free Tier (ARM)', '4 OCPU / 24GB RAM ARM instance. More powerful than the $15/month Hetzner blueprint spec. Free. Migrate when scale demands.'],
    ['DNS Architecture', 'Three Subdomains', 'app (Vercel), ws (Hocuspocus WSS), turn (LiveKit TURN TCP 443). Essential for K-12 school firewall compatibility.'],
    ['Video / Audio', 'Self-Hosted LiveKit', 'Full control over TURN config. No per-minute costs. Never LiveKit Cloud. Self-hosted on Oracle Cloud VPS.'],
    ['Database', 'Supabase (Postgres + Auth + Storage + RLS)', 'Replaces all SQLite references. Auth, database, file storage, and row-level security in one platform.'],
    ['Feature Architecture', 'Widget-Based', 'All Phase 2+ features are toggleable widget panels. Tutors decide which widgets to activate per session.'],
    ['Student Privacy', 'Zero PII (Anonymous IDs)', 'Students identified as Student 1, Student 2 via Yjs awareness. No names, no signup, no data persistence. COPPA-safe.'],
    ['AI Direction', 'Tutor-Only AI Assistance', 'AI assists the teacher, never the student. Students never see AI controls, prompts, or results.'],
    ['Recording', 'No Native Recording (V2+)', 'Defer to third-party tools (Loom, OBS, QuickTime). Eliminates browser memory crashes and Safari issues.'],
]
cw_dec = [AVAILABLE_W * 0.18, AVAILABLE_W * 0.28, AVAILABLE_W * 0.54]
story.append(make_table(decisions[0], decisions[1:], cw_dec))
story.append(Spacer(1, 3))
story.append(Paragraph('Table 1: Locked architectural decisions for Phase 2', sCaption))

story.append(CondPageBreak(80))

story.append(heading2('1.2 Phase 2 Scope and Sprint Structure'))
story.append(body(
    'Phase 2 is organized into 10 sprints over approximately 20 weeks. Each sprint delivers a functional increment '
    'that can be tested and validated independently before proceeding to the next. The first two sprints focus on '
    'infrastructure and authentication, which form the foundation for all subsequent features. Sprints 3-4 add '
    'real-time collaboration and session management. Sprints 5-7 introduce the classroom interaction layer: video, '
    'chat, student management, and the widget framework. Sprints 8-10 add AI features, subject toolkits, and '
    'persistence. This ordering ensures that each sprint builds on proven, tested infrastructure from previous sprints.'
))

scope = [
    ['Sprint', 'Feature Area', 'Key Deliverables', 'Priority'],
    ['1-2', 'Infrastructure + Auth', 'VPS setup, Docker, DNS, Supabase, Tutor auth (email + OAuth)', 'Critical'],
    ['3-4', 'Sessions + Collaboration', 'Room system, Yjs sync, multi-user cursors, offline resilience', 'Critical'],
    ['5-6', 'Video + Student System', 'Self-hosted LiveKit, PiP video widget, anonymous student flow, raise hand', 'High'],
    ['7', 'Chat + Widget Framework', 'Text chat widget, widget dock/panel system, widget registry', 'High'],
    ['8-9', 'AI Widget + Subject Toolkits', 'Tutor AI panel, equation solver, Math/Science/Language widgets', 'Medium'],
    ['10', 'Persistence + Templates', 'Auto-save, version history, board templates, export, 7-day auto-purge', 'Medium'],
]
cw_scope = [AVAILABLE_W * 0.08, AVAILABLE_W * 0.20, AVAILABLE_W * 0.47, AVAILABLE_W * 0.12]
# Adjust to fill available width
cw_scope = [AVAILABLE_W * 0.08, AVAILABLE_W * 0.20, AVAILABLE_W * 0.48, AVAILABLE_W * 0.10]
story.append(Spacer(1, 6))
story.append(make_table(scope[0], scope[1:], cw_scope))
story.append(Spacer(1, 3))
story.append(Paragraph('Table 2: Phase 2 sprint structure and feature areas', sCaption))

story.append(PageBreak())

# ══════════════════════════════════════════════════════════
# 2. INFRASTRUCTURE SETUP
# ══════════════════════════════════════════════════════════
story.append(heading1('2. Infrastructure Setup (Sprint 1)'))
story.append(Spacer(1, 4))
story.append(Paragraph('VPS, Docker, DNS, and Supabase Foundation', sSectionIntro))
story.append(body(
    'Before any classroom features can be built, the infrastructure layer must be provisioned and configured. This '
    'sprint establishes the Oracle Cloud VPS as the home for all real-time services, configures the three-subdomain '
    'DNS architecture, sets up Supabase as the database and authentication backend, and creates the Docker containers '
    'that will run Hocuspocus, LiveKit, and the AI proxy. Everything deployed during this sprint must be production-ready '
    'with auto-restart policies, health checks, and the keepalive mechanism to prevent Oracle Cloud from reclaiming '
    'idle Always Free VM instances.'
))

story.append(heading2('2.1 Oracle Cloud VPS Provisioning'))
story.append(body(
    'The Oracle Cloud Free Tier provides an ARM instance (Ampere A1) with 4 OCPUs and 24GB of RAM, which significantly '
    'exceeds the 4-core / 8GB specification from the original blueprint. This generous allocation means Hocuspocus, '
    'LiveKit, Caddy reverse proxy, and the AI proxy container can all run comfortably on a single VM with ample '
    'headroom. The instance runs Oracle Linux 8 or Ubuntu 22.04 (ARM), with Docker Engine and Docker Compose installed '
    'for container orchestration. All containers use the <b>restart: unless-stopped</b> policy so they automatically '
    'recover if the VM is rebooted or if Oracle reclaims the instance and it is later restarted.'
))
story.append(body(
    'A critical operational detail: Oracle Cloud has been known to reclaim Always Free VMs that show near-zero CPU '
    'usage over extended periods. To prevent this, a lightweight keepalive cron job runs every 5 minutes, executing '
    'a trivial computation (generating a checksum of random data) that registers minimal CPU activity without consuming '
    'meaningful resources. This keeps the VM classified as "active" in Oracle\'s monitoring system, preventing automatic '
    'reclamation while using virtually zero CPU time per execution.'
))

story.append(heading2('2.2 Docker Container Architecture'))
story.append(body(
    'Four Docker containers run on the VPS, orchestrated via a single docker-compose.yml file. Each container has '
    'a specific role, internal port, and health check configuration. Caddy serves as the reverse proxy and TLS '
    'terminator, handling all incoming traffic on ports 80 and 443 and routing to the appropriate container based '
    'on the subdomain. This architecture ensures clean separation of concerns while minimizing the number of '
    'exposed ports and simplifying the firewall configuration.'
))

containers = [
    ['Container', 'Internal Port', 'Purpose', 'External Access'],
    ['Hocuspocus', '3001', 'WebSocket server for Yjs whiteboard sync', 'wss://ws.superboard.app (via Caddy)'],
    ['LiveKit Server', '7880/7881/5000-5100', 'Self-hosted SFU for video/audio with TURN', 'turn.superboard.app (TCP 443 via Caddy)'],
    ['AI Proxy (Express)', '3002', 'Routes AI requests to OpenAI/Google, bypasses Vercel timeout', 'wss://ws.superboard.app/api/ai/* (via Caddy)'],
    ['Caddy', '80/443', 'Reverse proxy, TLS termination, L4 TCP pass-through for TURN', 'All subdomains point here'],
]
cw_cont = [AVAILABLE_W * 0.15, AVAILABLE_W * 0.18, AVAILABLE_W * 0.42, AVAILABLE_W * 0.25]
story.append(make_table(containers[0], containers[1:], cw_cont))
story.append(Spacer(1, 3))
story.append(Paragraph('Table 3: Docker container architecture on Oracle Cloud VPS', sCaption))

story.append(heading2('2.3 Three-Subdomain DNS Architecture'))
story.append(body(
    'Three DNS records are configured at the domain registrar, each pointing to a specific service. Misconfiguring '
    'any one breaks a core feature. The app subdomain routes to Vercel for the Next.js frontend and fast API routes. '
    'The ws subdomain routes to the VPS IP address where Caddy terminates TLS and proxies WebSocket connections to '
    'Hocuspocus. The turn subdomain routes to the VPS IP address where Caddy performs raw L4 TCP pass-through to '
    'the LiveKit TURN server on port 5349, bypassing TLS termination entirely. This dedicated subdomain is essential '
    'for K-12 school networks that block outbound UDP traffic, as LiveKit\'s TURN TCP 443 fallback allows video '
    'connections to succeed where they would otherwise silently fail.'
))

dns_records = [
    ['Subdomain', 'DNS Record', 'Points To', 'Protocol', 'Purpose'],
    ['app.superboard.app', 'CNAME to Vercel', 'Vercel edge network', 'HTTPS (443)', 'Next.js frontend + API routes'],
    ['ws.superboard.app', 'A record to VPS IP', 'VPS (Caddy)', 'WSS (443)', 'Hocuspocus WebSocket connections'],
    ['turn.superboard.app', 'A record to VPS IP', 'VPS (Caddy L4)', 'TCP (443)', 'LiveKit TURN TCP 443 fallback'],
]
cw_dns = [AVAILABLE_W * 0.16, AVAILABLE_W * 0.16, AVAILABLE_W * 0.16, AVAILABLE_W * 0.14, AVAILABLE_W * 0.38]
story.append(make_table(dns_records[0], dns_records[1:], cw_dns))
story.append(Spacer(1, 3))
story.append(Paragraph('Table 4: Three-subdomain DNS architecture', sCaption))

story.append(heading2('2.4 Supabase Project Setup'))
story.append(body(
    'All database, authentication, and file storage needs for Phase 2 are handled by Supabase. A new Supabase project '
    'is created with the following services enabled: PostgreSQL database (with Row Level Security policies), '
    'Supabase Auth (email/password and OAuth providers), and Supabase Storage (for file uploads, PDF exports, and '
    'agency branding assets). The Supabase project URL and anon key are stored as environment variables in both the '
    'Vercel project (for frontend and API routes) and the VPS .env file (for Hocuspocus hooks and the AI proxy). '
    'The service role key is stored only on the VPS server, never exposed to the frontend, as it bypasses RLS policies.'
))
story.append(body(
    'Row Level Security (RLS) is enabled on every table. The RLS policies enforce that tutors can only access their '
    'own rooms and templates, and that agency owners can access rooms belonging to tutors in their agency. Supabase '
    'Auth handles user registration, login, email verification, password reset, and OAuth flows (Google and Microsoft). '
    'JWT tokens issued by Supabase Auth are used for authenticating API requests on Vercel, WebSocket connections '
    'to Hocuspocus, and AI proxy requests on the VPS. This unified auth token eliminates the need for separate '
    'authentication systems across the infrastructure.'
))

story.append(CondPageBreak(80))

story.append(heading2('2.5 Supabase Database Schema'))
story.append(body(
    'The database schema is deliberately minimal and lean. Following the blueprint\'s directive of "lean whiteboard '
    'SaaS, not an LMS," there is no Student model (student state is purely ephemeral via Yjs awareness), no Homework '
    'model, no Scheduling model, no Invoice model, and no Recording model. The schema contains only what the '
    'classroom SaaS core requires. All tables use UUID primary keys, timestamps, and appropriate foreign key '
    'relationships with CASCADE deletion to maintain referential integrity.'
))

schema_tables = [
    ['Model', 'Key Fields', 'Purpose'],
    ['User', 'id, email, name, tier (FREE/PRO/AGENCY), stripeCustomerId, fingerprintHash, parentAgencyId', 'Tutor accounts only. Students are anonymous.'],
    ['Room', 'id, tutorId, subject, isActive, startedAt, endedAt, durationMinutes, brandingLogo, brandingColor', 'Session rooms. Auto-purged after 7 days.'],
    ['BoardPage', 'id, roomId, pageIndex, snapshot (JSONB)', 'SVG element snapshots per page. Yjs sync writes here.'],
    ['Template', 'id, tutorId, name, subject, snapshot (JSONB)', 'Reusable board templates saved by tutors.'],
    ['AgencyInvite', 'id, agencyId, code, invitedEmail, status, expiresAt', 'Agency tier: sub-tutor invitation codes.'],
    ['UsageLog', 'id, userId, periodStartDate, videoMinutesUsed, aiCreditsUsed, estimatedAiSpendCents', 'Monthly usage tracking for billing and throttle.'],
]
cw_schema = [AVAILABLE_W * 0.12, AVAILABLE_W * 0.55, AVAILABLE_W * 0.33]
story.append(make_table(schema_tables[0], schema_tables[1:], cw_schema))
story.append(Spacer(1, 3))
story.append(Paragraph('Table 5: Supabase database schema (PostgreSQL)', sCaption))

story.append(heading2('2.6 7-Day Auto-Purge (pg_cron)'))
story.append(body(
    'Inactive rooms and their associated board pages are automatically purged 7 days after the session ends. This '
    'is implemented as a Supabase pg_cron job that runs daily at 3 AM UTC. The purge deletes BoardPage records '
    'for rooms that are inactive and older than 7 days, then deletes the Room records themselves. This design ensures '
    'that no session data persists indefinitely, reduces database bloat on the Supabase free tier, and supports the '
    'COPPA compliance posture of minimal data retention. Tutors who want permanent access to their boards can save '
    'them as templates before the session ends, which are stored independently and not subject to auto-purge.'
))

story.append(PageBreak())

# ══════════════════════════════════════════════════════════
# 3. AUTHENTICATION & USER SYSTEM
# ══════════════════════════════════════════════════════════
story.append(heading1('3. Authentication and User System (Sprint 1-2)'))
story.append(Spacer(1, 4))
story.append(Paragraph('Supabase Auth for Tutors, Anonymous Access for Students', sSectionIntro))
story.append(body(
    'Authentication is the foundation of the classroom. Without user accounts, there are no roles, no sessions, '
    'no permissions, and no persistence. This section covers the complete authentication system built on Supabase Auth, '
    'including email/password signup, OAuth providers, profile management, role selection, and JWT token management. '
    'A critical design decision: only tutors authenticate. Students never sign up, never log in, and never provide '
    'any personal information. Student identity is handled entirely through the Yjs awareness protocol, which assigns '
    'anonymous numerical identifiers (Student 1, Student 2) based on connection order within a session.'
))

story.append(heading2('3.1 Tutor Sign Up (Email/Password)'))
story.append(body(
    'New tutors create an account with an email address and password. The signup form collects email, password '
    '(minimum 8 characters, must include uppercase, lowercase, and number), display name (optional, can be set later '
    'in profile), and account type selection (Personal Tutor, Tutoring Agency, School/Institution). After form '
    'submission, Supabase Auth sends a verification email with a time-limited confirmation link that expires in 24 '
    'hours. The user must verify their email before they can create or join sessions. Supabase Auth handles all '
    'password hashing (bcrypt), rate limiting (5 signup attempts per email per hour, 10 login attempts per account '
    'per 15 minutes), and session token management natively, reducing the implementation burden significantly compared '
    'to a custom auth system.'
))

story.append(heading2('3.2 OAuth Providers (Google and Microsoft)'))
story.append(body(
    'One-click signup via Google OAuth 2.0 and Microsoft OAuth 2.0. Google OAuth is critical for reducing signup '
    'friction, as industry data shows OAuth signup converts 30-50% higher than email/password alone. Microsoft OAuth '
    'serves institutional users (teachers and students with school or university Microsoft 365 accounts) and is '
    'essential for future enterprise adoption in Phase 5. Both OAuth flows redirect to the provider\'s consent screen, '
    'return an authorization code, which is exchanged server-side for access tokens. The system extracts name, email, '
    'and profile picture. If the email already exists, the OAuth account is linked. Supabase Auth provides built-in '
    'OAuth configuration for both providers, requiring only the OAuth client ID and secret to be added to the Supabase '
    'dashboard. The frontend uses Supabase\'s signInWithOAuth() method with the appropriate provider.'
))

story.append(heading2('3.3 Tutor Profile and Roles'))
story.append(body(
    'Each tutor has a profile page accessible from the top-right user menu in the whiteboard interface. The profile '
    'includes avatar (uploaded image or initials-based auto-generated avatar), display name, bio (up to 280 characters), '
    'timezone (auto-detected from browser), subject expertise tags (Math, Physics, English, Music, etc.), and '
    'notification preferences. During signup, the tutor selects their primary role: Personal Tutor, Tutoring Agency, '
    'or School/Institution. This determines the default experience, available features, and billing tier. Roles can be '
    'changed later in profile settings. Agency owners can invite sub-tutors via invitation codes, and School/Institution '
    'accounts get admin controls and compliance features in later phases.'
))

story.append(heading2('3.4 JWT Token Management'))
story.append(body(
    'Authentication uses Supabase\'s built-in JWT system. Access tokens expire after 1 hour (Supabase default) and '
    'are automatically refreshed by the Supabase client library. The JWT payload includes user ID, email, role, email '
    'verification status, and tier. The token is used for three purposes: authenticating Next.js API routes on Vercel '
    '(passed as Bearer token in Authorization header), authenticating Hocuspocus WebSocket connections (passed as query '
    'parameter in the WebSocket URL), and authenticating AI proxy requests on the VPS (passed as Bearer token). '
    'Server-side token verification uses the Supabase JWT secret, which is stored as an environment variable on both '
    'Vercel and the VPS. For API routes, the JWT is extracted from httpOnly cookies set by Supabase Auth to prevent '
    'XSS theft.'
))

story.append(heading2('3.5 Student Flow (Unauthenticated, Anonymous)'))
story.append(body(
    'There is no Student database model. Student state is purely ephemeral via Yjs awareness. When a student clicks '
    'a room URL, they see a branded waiting room with the tutor\'s name (or agency name), the subject, and a loading '
    'indicator. The client establishes a Yjs connection to Hocuspocus and monitors awareness for the tutor\'s presence. '
    'When the Yjs awareness protocol detects the tutor\'s client ID with isTutor set to true, the student is '
    'automatically transitioned to the main whiteboard view. No name entry, no signup, no text input of any kind. '
    'The Yjs awareness protocol automatically assigns the student an anonymous identifier based on connection order: '
    'Student 1, Student 2, etc. A random cursor color is assigned from a predefined palette. This design eliminates '
    'COPPA and GDPR-K verifiable parental consent requirements entirely, as no personal information is collected from '
    'children.'
))
story.append(note(
    '<b>Permission model:</b> Students CAN draw on the active page, use basic drawing tools, and see the tutor\'s '
    'cursor. Students CANNOT change pages, clear the board, upload files, access AI, record, or modify room settings. '
    'These restrictions are enforced client-side (the UI does not render the controls) since Yjs CRDT sync is '
    'inherently permission-less for drawing operations. The only destructive operations (page switch, board clear, '
    'file upload) are enforced server-side via Hocuspocus hooks.'
))

story.append(CondPageBreak(80))

auth_summary = [
    ['Feature', 'Priority', 'Implementation', 'Estimate'],
    ['Email/Password Signup', 'P0', 'Supabase Auth (built-in)', '1 day'],
    ['Google OAuth', 'P0', 'Supabase Auth (built-in, configure dashboard)', '0.5 day'],
    ['Microsoft OAuth', 'P1', 'Supabase Auth (built-in, configure dashboard)', '0.5 day'],
    ['Profile Page', 'P1', 'Next.js page + Supabase storage for avatar', '2 days'],
    ['Role Selection', 'P0', 'Signup form field + User table tier column', '0.5 day'],
    ['Password Reset', 'P0', 'Supabase Auth (built-in email flow)', '0.5 day'],
    ['Email Verification', 'P0', 'Supabase Auth (built-in)', '0 day (automatic)'],
    ['JWT Token Management', 'P0', 'Supabase Auth (built-in)', '0 day (automatic)'],
    ['Anonymous Student Flow', 'P0', 'Yjs awareness protocol (no backend)', '2 days'],
]
cw_auth = [AVAILABLE_W * 0.25, AVAILABLE_W * 0.10, AVAILABLE_W * 0.42, AVAILABLE_W * 0.12]
story.append(heading2('3.6 Authentication Feature Summary'))
story.append(make_table(auth_summary[0], auth_summary[1:], cw_auth))
story.append(Spacer(1, 3))
story.append(Paragraph('Table 6: Authentication features, priorities, and estimates', sCaption))

story.append(PageBreak())

# ══════════════════════════════════════════════════════════
# 4. SESSION MANAGEMENT
# ══════════════════════════════════════════════════════════
story.append(heading1('4. Session Management (Sprint 3-4)'))
story.append(Spacer(1, 4))
story.append(Paragraph('Room Creation, Invite Links, Waiting Room, and Session Lifecycle', sSectionIntro))
story.append(body(
    'Session management controls how tutors create learning rooms, invite students, manage the session lifecycle, '
    'and handle session termination. A "room" is the core organizational unit in Superboard. Each room has a unique '
    'UUID, belongs to a tutor, has a subject designation, and contains a set of board pages. Rooms are ephemeral by '
    'design: they are created when a tutor starts a session, marked inactive when the session ends, and automatically '
    'purged from the database 7 days after termination. This ephemeral design aligns with the lean whiteboard SaaS '
    'philosophy and minimizes data retention compliance burden.'
))

story.append(heading2('4.1 Room Creation Flow'))
story.append(body(
    'A tutor clicks "Start Session" from the dashboard. The system prompts for subject selection (Math, Science, '
    'Language, General), which determines the available widget toolkits. The system generates a UUID v4 Room ID, '
    'creates a Room record in Supabase (isActive = true, subject, tutorId, branding snapshot if applicable), and '
    'redirects the tutor to /room/{roomId}. The room URL is the shareable link that tutors send to students. Agency '
    'tutors can optionally apply their agency\'s branding preset (colors, logo, name), which is snapshotted at room '
    'creation so subsequent agency setting changes do not affect active sessions. The entire creation flow completes '
    'in under 2 seconds, as it involves only a single Supabase insert and a client-side redirect.'
))

story.append(heading2('4.2 Invite Links and Waiting Room'))
story.append(body(
    'The room URL serves as the invite link. Tutors share it via email, messaging apps, or classroom management '
    'tools. When a student clicks the link, they see a branded waiting room. The waiting room displays the tutor\'s '
    'name (or agency name), the subject, and a loading indicator. The waiting room theme matches agency branding if '
    'applicable. The student\'s browser establishes a Yjs connection to Hocuspocus in the background and monitors '
    'awareness for the tutor\'s presence. When the tutor\'s client is detected (via Yjs awareness with isTutor: true), '
    'the student is automatically and seamlessly transitioned to the main whiteboard view. No manual "admit student" '
    'action is required by the tutor, reducing friction and enabling students to join mid-lesson without disruption.'
))

story.append(heading2('4.3 Session Termination'))
story.append(body(
    'The tutor clicks "End Lesson" to terminate the session. The frontend sends a POST request to /api/room/{roomId}/end '
    'on Vercel. The API route verifies the tutor\'s JWT, confirms the user is the room\'s tutor, sets room.isActive = false, '
    'records endedAt and durationMinutes, severs the Yjs WebSocket and LiveKit connections, and redirects to a summary '
    'page. The room URL becomes inert: any visitor sees "This session has ended." All student ephemeral data (anonymous '
    'IDs, cursor positions, awareness state) evaporates immediately. The Room record and BoardPage snapshots remain in '
    'Supabase PostgreSQL until the pg_cron auto-purge job deletes them after 7 days. Tutors are prompted to save their '
    'board as a template before ending if they want permanent access to the content.'
))

session_features = [
    ['Feature', 'Priority', 'Details', 'Estimate'],
    ['Room Creation', 'P0', 'UUID generation, subject selection, Supabase insert, redirect', '1 day'],
    ['Invite Link Sharing', 'P0', 'Room URL as shareable link, copy-to-clipboard button', '0.5 day'],
    ['Branded Waiting Room', 'P1', 'Tutor/agency name, subject, loading indicator, Yjs awareness monitoring', '2 days'],
    ['Auto-Transition to Board', 'P0', 'Detect tutor presence via Yjs awareness, seamless transition', '1 day'],
    ['Session End', 'P0', 'JWT verification, isActive flag, connection severing, inert URL', '1 day'],
    ['Session Summary', 'P2', 'Duration, pages used, save-as-template prompt', '1 day'],
    ['Agency Branding Snapshot', 'P2', 'Snapshot branding at room creation, apply to waiting room and PDF exports', '1 day'],
]
cw_sess = [AVAILABLE_W * 0.20, AVAILABLE_W * 0.10, AVAILABLE_W * 0.50, AVAILABLE_W * 0.10]
story.append(Spacer(1, 6))
story.append(make_table(session_features[0], session_features[1:], cw_sess))
story.append(Spacer(1, 3))
story.append(Paragraph('Table 7: Session management features', sCaption))

story.append(PageBreak())

# ══════════════════════════════════════════════════════════
# 5. REAL-TIME COLLABORATION
# ══════════════════════════════════════════════════════════
story.append(heading1('5. Real-Time Collaboration (Sprint 3-4)'))
story.append(Spacer(1, 4))
story.append(Paragraph('Yjs CRDT Sync via Hocuspocus, Multi-User Cursors, Offline Resilience', sSectionIntro))
story.append(body(
    'Real-time collaboration is the heart of Phase 2. It transforms the single-user whiteboard into a multi-user '
    'canvas where a tutor and multiple students can draw simultaneously. The sync layer is built on Yjs, a CRDT '
    '(Conflict-free Replicated Data Type) library that guarantees eventual consistency without requiring a central '
    'server to resolve conflicts. Hocuspocus serves as the WebSocket relay that connects all clients to the same '
    'shared Yjs document for a given room. When a tutor draws a stroke on the SVG canvas, the stroke data is encoded '
    'as a Yjs update and broadcast to all connected clients within milliseconds. Each client applies the update to '
    'their local copy of the document, rendering the stroke in real-time.'
))

story.append(heading2('5.1 Yjs Document Structure for SVG Canvas'))
story.append(body(
    'The Yjs document for each room contains three shared data types that map to the whiteboard\'s state. First, a '
    'Y.Map of Y.Array objects, where each key is a page index string ("0", "1", "2") and each value is an array of '
    'SVG element objects representing the drawing elements on that page. Each SVG element is serialized as a plain '
    'JavaScript object with properties like type, points, strokeColor, fillColor, strokeWidth, width, height, and '
    'rotation. Second, a shared Y.Number for activePageIndex that only the tutor\'s client can mutate, controlling '
    'which page all clients see. Third, a Y.Map for awareness state, which tracks each connected client\'s cursor '
    'position, cursor color, display name (or anonymous ID for students), and isTutor flag. This awareness data powers '
    'the multi-user cursor display.'
))

story.append(heading2('5.2 Hocuspocus Authentication'))
story.append(body(
    'Every WebSocket connection to Hocuspocus is authenticated. The browser passes the Supabase JWT as a query '
    'parameter in the WebSocket URL: wss://ws.superboard.app/rooms/{roomId}?token={jwt}. The Hocuspocus '
    'onAuthenticate hook extracts the token, calls Supabase\'s getUser(jwt) to verify the JWT signature and retrieve '
    'the user, then performs a three-tier authorization check: is the connecting user the room\'s tutor (allow), '
    'is the user the agency owner via parentAgencyId chain (allow), or does the user have an accepted AgencyInvite '
    'where the agencyId matches the tutor\'s agency (allow). If none match, the connection is terminated with an error. '
    'For student connections, which are unauthenticated, the Hocuspocus hook checks for the absence of a token and '
    'allows the connection as a read-write peer (drawing only, no destructive operations).'
))

story.append(heading2('5.3 Multi-User Cursor Display'))
story.append(body(
    'Each connected client\'s cursor position and identity are broadcast via Yjs awareness. The whiteboard canvas '
    'renders remote cursors as colored circles with name labels (tutor name or "Student 1", "Student 2"). Cursor '
    'positions update at 60fps during mouse movement but are throttled to 10 updates per second over the WebSocket '
    'to prevent network flooding. When a user is idle (no pointer movement for 3 seconds), their cursor fades to '
    '50% opacity. After 30 seconds of inactivity, the cursor disappears entirely until movement resumes. The tutor\'s '
    'cursor is visually distinct from student cursors: it uses a filled circle with a directional indicator, while '
    'student cursors use simple colored dots. Each user gets a unique cursor color from a predefined palette of 12 '
    'high-contrast colors that work on both light and dark canvas backgrounds.'
))

story.append(heading2('5.4 Offline Resilience (y-indexeddb)'))
story.append(body(
    'The client includes y-indexeddb as a persistence layer for the Yjs document. When a student\'s WiFi drops for '
    '5-10 seconds (common in K-12 environments), the student can continue drawing. Changes are stored locally in the '
    'browser\'s IndexedDB. When the WebSocket reconnects, y-indexeddb automatically syncs the local changes to the '
    'Hocuspocus server and merges them with any changes made by other peers during the disconnection. This is a '
    'one-line integration with the existing Yjs provider setup: adding the IndexedDB persistence provider alongside '
    'the WebSocket provider. The merge is handled by Yjs CRDT algorithms, which guarantee consistency without conflicts '
    'even when multiple users were drawing simultaneously during the disconnection period.'
))

collab_features = [
    ['Feature', 'Priority', 'Details', 'Estimate'],
    ['Yjs Document Binding', 'P0', 'Map SVG elements to Yjs shared types, encode/decode', '3 days'],
    ['Hocuspocus Connection', 'P0', 'WebSocket provider, room-based document isolation', '2 days'],
    ['JWT Authentication Hook', 'P0', 'onAuthenticate with Supabase verification, 3-tier check', '1 day'],
    ['Multi-User Cursors', 'P0', 'Awareness protocol, cursor rendering, color palette', '2 days'],
    ['Page Sync Protocol', 'P0', 'Shared activePageIndex, page-switch flush, undo/redo reset', '2 days'],
    ['Offline Resilience', 'P1', 'y-indexeddb integration, auto-sync on reconnect', '1 day'],
    ['Cursor Throttling', 'P2', '60fps local, 10fps network, idle fade/disappear', '0.5 day'],
]
cw_collab = [AVAILABLE_W * 0.22, AVAILABLE_W * 0.10, AVAILABLE_W * 0.48, AVAILABLE_W * 0.12]
story.append(Spacer(1, 6))
story.append(make_table(collab_features[0], collab_features[1:], cw_collab))
story.append(Spacer(1, 3))
story.append(Paragraph('Table 8: Real-time collaboration features', sCaption))

story.append(PageBreak())

# ══════════════════════════════════════════════════════════
# 6. VIDEO AND AUDIO
# ══════════════════════════════════════════════════════════
story.append(heading1('6. Video and Audio Widget (Sprint 5-6)'))
story.append(Spacer(1, 4))
story.append(Paragraph('Self-Hosted LiveKit, Picture-in-Picture Widget, School Firewall Compatibility', sSectionIntro))
story.append(body(
    'Video and audio calling is implemented as a toggleable widget panel, consistent with the widget-based '
    'architecture. The widget uses LiveKit, a self-hosted Selective Forwarding Unit (SFU) running on the Oracle '
    'Cloud VPS. LiveKit was chosen over PeerJS or simple WebRTC peer connections because an SFU architecture '
    'scales efficiently to multiple participants (the tutor plus up to 5 students in a session) without the '
    'N-squared bandwidth problem of peer-to-peer connections. The LiveKit server runs as a Docker container on the '
    'VPS alongside Hocuspocus, with Caddy handling TLS termination for the signaling WebSocket and L4 TCP pass-through '
    'for the TURN server on port 443.'
))

story.append(heading2('6.1 Picture-in-Picture Video Panel'))
story.append(body(
    'The video widget renders as a draggable, floating panel overlaying the canvas (bottom-right corner by default). '
    'The panel can be dragged to any screen position, resized by dragging the corner handles, and minimized to a '
    'small thumbnail showing only the remote participant\'s video. The panel uses absolute positioning with pointer '
    'event handling to ensure dragging does not trigger whiteboard drawing actions underneath. In grid mode (when '
    'multiple participants are connected), the panel expands to show a 2x2 or 3x3 grid of video feeds. The panel '
    'is touch-optimized for iPad and Chromebook use, with larger drag handles and touch-friendly resize corners. '
    'There is NO native record button in the UI. Tutors who wish to record are informed via a help tooltip: '
    '"To record this session, use Loom, QuickTime, or OBS." This eliminates browser memory crashes, Safari '
    'incompatibility, and the entire chunked-upload test matrix.'
))

story.append(heading2('6.2 LiveKit Token Generation'))
story.append(body(
    'The Next.js API route /api/livekit/token generates LiveKit access tokens server-side. The route verifies the '
    'tutor\'s JWT, checks video usage against the weekly limit (120 minutes/week for FREE tier, unlimited for PRO '
    'and AGENCY), creates a LiveKit room if it does not exist, and returns a LiveKit JWT token granting access to '
    'that room. Students do not need tokens to join video; instead, the room is created with the join rule set to '
    'allow anonymous participants. The LiveKit token endpoint also checks the UsageLog table to enforce weekly video '
    'minute limits for FREE tier users, returning a 429 status code with a friendly error message when the limit '
    'is reached.'
))

story.append(heading2('6.3 TURN TCP 443 Fallback for School Firewalls'))
story.append(body(
    'Many K-12 school networks block outbound UDP traffic, which is the default transport for WebRTC. Without a TCP '
    'fallback, video calls silently fail for students connecting from school. The turn.superboard.app subdomain '
    'provides TCP 443 fallback: Caddy performs raw L4 TCP pass-through to the LiveKit TURN server on port 5349 '
    'without TLS termination or HTTP parsing. This dedicated subdomain is necessary because Caddy cannot perform '
    'both HTTP proxying and raw TCP pass-through on the same domain. The LiveKit server is configured with the TURN '
    'domain as turn.superboard.app:443 with TCP transport. When a student\'s browser attempts a WebRTC connection '
    'and UDP fails, it automatically falls back to TURN TCP 443, which traverses the school firewall because TCP '
    'port 443 is almost universally open (it is the HTTPS port).'
))

story.append(heading2('6.4 Video Heartbeat and Usage Tracking'))
story.append(body(
    'A 60-second heartbeat mechanism tracks active video usage. The frontend sends a POST request to '
    '/api/room/{roomId}/video-heartbeat every 60 seconds while video is active. The API route increments the '
    'videoMinutesUsed counter in the UsageLog table for the current billing period. If a FREE tier user exceeds '
    '120 minutes in a week, the API route returns a warning and the frontend automatically disables the video widget '
    'with a friendly message: "You have reached your weekly video limit. Upgrade to Pro for unlimited video." This '
    'heartbeat also serves as a liveness check: if the heartbeat stops for 5 minutes, the backend assumes the user '
    'has disconnected and stops counting minutes.'
))

video_features = [
    ['Feature', 'Priority', 'Details', 'Estimate'],
    ['PiP Video Panel', 'P0', 'Draggable, resizable, minimizable floating widget', '3 days'],
    ['LiveKit Token Endpoint', 'P0', 'JWT verification, room creation, weekly limit check', '1 day'],
    ['Self-Hosted LiveKit Server', 'P0', 'Docker container on VPS, TURN configuration', '2 days'],
    ['TURN TCP 443 Fallback', 'P0', 'L4 Caddy pass-through, turn subdomain, firewall traversal', '1 day'],
    ['Grid View (Multi-Participant)', 'P1', '2x2, 3x3 layout for multiple video feeds', '2 days'],
    ['Video Heartbeat', 'P0', '60-second heartbeat, usage tracking, FREE tier limit enforcement', '1 day'],
    ['Touch Optimization', 'P2', 'Larger drag handles, touch resize for iPad/Chromebook', '1 day'],
]
cw_video = [AVAILABLE_W * 0.22, AVAILABLE_W * 0.10, AVAILABLE_W * 0.48, AVAILABLE_W * 0.12]
story.append(Spacer(1, 6))
story.append(make_table(video_features[0], video_features[1:], cw_video))
story.append(Spacer(1, 3))
story.append(Paragraph('Table 9: Video and audio widget features', sCaption))

story.append(PageBreak())

# ══════════════════════════════════════════════════════════
# 7. TEXT CHAT WIDGET
# ══════════════════════════════════════════════════════════
story.append(heading1('7. Text Chat Widget (Sprint 7)'))
story.append(Spacer(1, 4))
story.append(Paragraph('Real-Time Messaging, File Sharing, and Session Communication', sSectionIntro))
story.append(body(
    'The text chat widget provides a real-time messaging channel between the tutor and all connected students. '
    'It is implemented as a toggleable widget panel, typically docked on the right side of the canvas or floating '
    'as an overlay. The chat uses Supabase Realtime channels for message broadcasting, which integrates seamlessly '
    'with the existing Supabase infrastructure and does not require additional server-side components. Messages are '
    'stored in a Supabase table with room ID, sender ID (or anonymous student ID), message content, timestamp, and '
    'message type (text, file, reaction). This provides message history within a session without the overhead of a '
    'dedicated chat server.'
))

story.append(heading2('7.1 Chat Features'))
story.append(body(
    'The chat widget supports plain text messages, file attachments (images, PDFs, documents up to 10MB, stored in '
    'Supabase Storage), emoji reactions on messages, and read receipts (tutor can see if students have seen a '
    'message). The chat panel shows a list of participants (tutor name + anonymous student IDs) with online/offline '
    'status indicators. Students can send text messages and share files but cannot share links (to prevent malicious '
    'URL sharing in a K-12 context). The tutor can pin messages, delete inappropriate messages, and mute individual '
    'students from chatting (which only hides their messages from other participants, not from themselves). File '
    'attachments appear as thumbnails in the chat stream and can be clicked to open in a new browser tab. The chat '
    'panel is resizable and can be collapsed to show only the unread message count badge.'
))

story.append(heading2('7.2 Chat Data Model'))
chat_model = [
    ['Field', 'Type', 'Description'],
    ['id', 'UUID', 'Primary key'],
    ['roomId', 'UUID (FK to Room)', 'Which room the message belongs to'],
    ['senderId', 'UUID or NULL', 'Tutor user ID, or NULL for anonymous students'],
    ['senderLabel', 'String', '"Tutor Name" or "Student 1", "Student 2"'],
    ['content', 'Text', 'Message text content'],
    ['fileUrl', 'String (nullable)', 'Supabase Storage URL if file attachment'],
    ['fileName', 'String (nullable)', 'Original file name'],
    ['isPinned', 'Boolean', 'Whether the tutor has pinned this message'],
    ['createdAt', 'Timestamp', 'Auto-generated'],
]
cw_chat = [AVAILABLE_W * 0.15, AVAILABLE_W * 0.25, AVAILABLE_W * 0.60]
story.append(make_table(chat_model[0], chat_model[1:], cw_chat))
story.append(Spacer(1, 3))
story.append(Paragraph('Table 10: ChatMessage data model (Supabase)', sCaption))

story.append(PageBreak())

# ══════════════════════════════════════════════════════════
# 8. WIDGET FRAMEWORK
# ══════════════════════════════════════════════════════════
story.append(heading1('8. Widget Framework (Sprint 7)'))
story.append(Spacer(1, 4))
story.append(Paragraph('Dockable, Resizable, Toggleable Panel System for All Classroom Features', sSectionIntro))
story.append(body(
    'The widget framework is the architectural backbone of Phase 2. Every classroom feature beyond the base '
    'whiteboard, whether it is video, chat, AI, a subject toolkit, a timer, or a poll, is implemented as a '
    'widget that conforms to a common interface. The widget framework provides the docking system, resize handles, '
    'drag behavior, minimize/maximize/restore states, and a widget registry that tracks which widgets are active '
    'in the current session. Tutors activate widgets from a widget palette (accessible via a toolbar button or '
    'keyboard shortcut) and arrange them around the canvas according to their preference for that lesson.'
))

story.append(heading2('8.1 Widget Interface Contract'))
story.append(body(
    'Every widget implements a common React interface: IWidget. The interface defines: id (unique widget identifier), '
    'title (display name shown in the widget header), icon (toolbar icon), defaultPosition (initial dock position: '
    'left, right, bottom, or floating), defaultSize (initial width/height as percentage of viewport), '
    'minWidth/minHeight (resize constraints), and render() (returns the widget\'s React component tree). The widget '
    'framework manages the lifecycle of each widget: creating it when activated, persisting its state (position, '
    'size, minimized state) in the Yjs shared document so it syncs across clients, and destroying it when deactivated. '
    'Widget state is stored in a dedicated Y.Map within the room\'s Yjs document, allowing all connected clients to '
    'see the same widget layout.'
))

story.append(heading2('8.2 Widget Layout Modes'))
story.append(body(
    'Widgets support three layout modes. In <b>docked mode</b>, the widget is attached to a side of the canvas '
    '(left panel, right panel, or bottom panel) and the canvas automatically resizes to accommodate it. Multiple '
    'widgets can be docked to the same side, appearing as tabbed panels. In <b>floating mode</b>, the widget is '
    'an absolute-positioned overlay that can be dragged anywhere on the screen and resized freely. Floating widgets '
    'do not cause the canvas to resize. In <b>minimized mode</b>, the widget collapses to a small icon in the '
    'widget tray at the bottom of the screen. Clicking the tray icon restores the widget to its previous layout '
    'mode and position. The tutor can switch between modes by clicking the dock/float/minimize buttons in the '
    'widget\'s title bar.'
))

story.append(heading2('8.3 Widget Registry'))
story.append(body(
    'The widget registry is a Zustand store that maintains the list of available widgets and the list of active '
    'widgets for the current session. Available widgets are statically defined in the application code (video, chat, '
    'ai, math-toolkit, science-toolkit, language-toolkit, geogebra, timer, poll, whiteboard-pages). Active widgets '
    'are stored in the Yjs shared document and synced across clients. When a tutor activates a widget, the registry '
    'creates an instance, adds it to the active list, and the framework renders it in the appropriate position. '
    'When a tutor deactivates a widget, the registry removes it from the active list, persists the state change via '
    'Yjs, and the framework unmounts the component. The registry also handles widget persistence: if a tutor '
    'refreshes the page, all previously active widgets are restored from the Yjs document.'
))

widgets_list = [
    ['Widget', 'Default Mode', 'Default Size', 'Subject', 'Sprint'],
    ['Video / Audio', 'Floating (bottom-right)', '320 x 240px', 'All', '5-6'],
    ['Text Chat', 'Docked (right)', '30% viewport width', 'All', '7'],
    ['AI Assistant', 'Docked (right, tabbed with chat)', '30% viewport width', 'All', '8-9'],
    ['Math Toolkit', 'Docked (left)', '250px width', 'Math', '8-9'],
    ['Science Toolkit', 'Docked (left)', '250px width', 'Science', '8-9'],
    ['Language Toolkit', 'Docked (left)', '250px width', 'Language', '8-9'],
    ['GeoGebra Graphing', 'Docked (right, 35%)', '35% viewport width', 'Math', '9'],
    ['Timer / Stopwatch', 'Floating', '200 x 100px', 'All', '9'],
    ['Poll / Quiz', 'Floating', '300 x 400px', 'All', '9'],
    ['Page Navigator', 'Docked (left)', '200px width', 'All', '3-4'],
]
cw_widgets = [AVAILABLE_W * 0.20, AVAILABLE_W * 0.25, AVAILABLE_W * 0.22, AVAILABLE_W * 0.10, AVAILABLE_W * 0.10]
story.append(Spacer(1, 6))
story.append(heading2('8.4 Available Widgets'))
story.append(make_table(widgets_list[0], widgets_list[1:], cw_widgets))
story.append(Spacer(1, 3))
story.append(Paragraph('Table 11: Complete widget inventory for Phase 2', sCaption))

story.append(PageBreak())

# ══════════════════════════════════════════════════════════
# 9. AI WIDGET
# ══════════════════════════════════════════════════════════
story.append(heading1('9. AI Assistant Widget (Sprint 8-9)'))
story.append(Spacer(1, 4))
story.append(Paragraph('Tutor-Only AI Assistance, Budget-Compliant Inference, Confirmation Modals', sSectionIntro))
story.append(body(
    'The AI assistant widget is the implementation of the core directive: "AI assists the teacher, not the student." '
    'Every AI feature is triggered by and serves the tutor. Students never see AI controls, prompts, or results. '
    'The AI widget is a panel (docked right, tabbed with chat) that provides subject-specific AI tools: equation '
    'recognition and graphing for math, diagram generation for science, grammar checking and vocabulary quizzes for '
    'language, and generic summarization and quiz generation for general subjects. All AI inference uses budget-compliant '
    'models only: GPT-4o-mini or Gemini 1.5 Flash. No Claude Sonnet, no GPT-4o, no expensive models at any tier.'
))

story.append(heading2('9.1 AI Budget Compliance'))
story.append(body(
    'AI inference is routed through the AI proxy container on the VPS (Express.js, port 3002). This proxy validates '
    'the tutor\'s JWT, checks their AI credit balance against the UsageLog table, forwards the request to OpenAI or '
    'Google AI APIs, and returns the response. The proxy exists because Vercel\'s serverless functions have a 10-second '
    'timeout, which is insufficient for AI inference that can take 5-30 seconds. The proxy also tracks estimated AI '
    'spend per request based on actual token usage from the API response, incrementing estimatedAiSpendCents in '
    'UsageLog. A soft throttle mechanism activates at $3.00/month for PRO users and $15.00/month for AGENCY users, '
    'returning a warning when the limit is reached. FREE users get 10 AI credits per week (reset every Monday).'
))

story.append(heading2('9.2 AI Confirmation Modal'))
story.append(body(
    'When AI vision reads handwritten math content and generates an interpretation (e.g., "y = 2x + 5"), the system '
    'does NOT act on it automatically. Instead, it opens a confirmation modal: "Did you write: y = 2x + 5?" The tutor '
    'must click "Yes" before the system graphs the equation, generates step-by-step solutions, or creates an answer '
    'key. This confirmation exists because GPT-4o-mini has a 5-15% error rate on handwritten mathematical expressions. '
    'Acting on an incorrect interpretation during a live tutoring session would actively harm the lesson. The one-second '
    'confirmation delay is an acceptable trade-off for accuracy. The same confirmation pattern applies to AI diagram '
    'generation: the tutor reviews the AI\'s interpretation before it is rendered on the whiteboard.'
))

story.append(heading2('9.3 Subject-Specific AI Features'))
ai_features = [
    ['Subject', 'AI Feature', 'Model', 'Confirmation Required'],
    ['Math', 'Handwritten equation recognition + graphing', 'GPT-4o-mini Vision', 'Yes (equation confirmation)'],
    ['Math', 'Step-by-step solution generation', 'GPT-4o-mini', 'No (tutor-initiated)'],
    ['Math', 'Answer key generation from board content', 'GPT-4o-mini Vision', 'Yes (content confirmation)'],
    ['Math', 'Equation typing + KaTeX rendering ($0)', 'Client-side', 'No (manual input)'],
    ['Science', 'AI diagram generator from description', 'GPT-4o-mini + DALL-E', 'Yes (diagram confirmation)'],
    ['Science', 'Labelled diagram recognition', 'GPT-4o-mini Vision', 'Yes (label confirmation)'],
    ['Language', 'AI grammar check on text elements', 'GPT-4o-mini', 'No (inline suggestions)'],
    ['Language', 'AI vocabulary quiz generation', 'GPT-4o-mini', 'No (tutor reviews before sharing)'],
    ['General', 'AI summary of board content', 'GPT-4o-mini Vision', 'No (tutor-initiated)'],
    ['General', 'AI quiz generation from board content', 'GPT-4o-mini Vision', 'Yes (question review)'],
]
cw_ai = [AVAILABLE_W * 0.12, AVAILABLE_W * 0.38, AVAILABLE_W * 0.22, AVAILABLE_W * 0.28]
story.append(make_table(ai_features[0], ai_features[1:], cw_ai))
story.append(Spacer(1, 3))
story.append(Paragraph('Table 12: AI features by subject with model and confirmation requirements', sCaption))

story.append(heading2('9.4 AI Prompt Sanitization'))
story.append(body(
    'Every AI prompt passes through a sanitizePrompt() function before being sent to any external API. The function '
    'performs four operations: (1) truncates the prompt to 50,000 characters to prevent token overflow, (2) scans '
    'against 10+ known injection patterns (case-insensitive regex for phrases like "ignore previous instructions", '
    '"you are now", "jailbreak", "DAN mode", "system prompt"), (3) replaces all matches with [FILTERED], and (4) '
    'logs the sanitization event to Sentry without the original prompt content. This prevents prompt injection attacks '
    'where a student might draw text on the whiteboard attempting to manipulate the AI system. Since students cannot '
    'trigger AI actions directly, this is a defense-in-depth measure, but it protects against scenarios where a tutor '
    'inadvertently includes student-written text in an AI request.'
))

story.append(PageBreak())

# ══════════════════════════════════════════════════════════
# 10. SUBJECT-SPECIFIC TOOLKITS
# ══════════════════════════════════════════════════════════
story.append(heading1('10. Subject-Specific Toolkits (Sprint 8-9)'))
story.append(Spacer(1, 4))
story.append(Paragraph('Dynamic Toolbar Widgets for Math, Science, Language, and General Subjects', sSectionIntro))
story.append(body(
    'Subject toolkits are widget panels that extend the whiteboard toolbar with subject-specific tools, backgrounds, '
    'and AI integrations. The toolkit loaded depends on the subject selected during room creation. Base tools (pen, '
    'rectangle, ellipse, line, arrow, text, eraser, selection) are always available regardless of subject. Subject '
    'tools are loaded as separate React components and appear as additional widget panels or toolbar extensions. '
    'A tutor teaching a math lesson gets graph paper backgrounds, protractor stamps, a GeoGebra graphing panel, and '
    'math AI features. A language tutor gets colored highlighters, mind map tools, and grammar checking. This '
    'differentiation ensures that the whiteboard interface stays clean and relevant for each subject without '
    'overwhelming the tutor with tools they do not need.'
))

toolkits = [
    ['Subject', 'Extra Tools', 'Backgrounds', 'AI Integration'],
    ['Math', 'Graph paper toggle, protractor/compass stamps, ruler overlay', 'Graph paper, isometric dot, blank', 'Equation recognition, graphing, answer keys, step-by-step solutions'],
    ['Science', 'Vector arrows (adjustable angle/magnitude), lab equipment SVGs', 'Periodic table, lab notebook lines', 'AI diagram generator, labeled diagram recognition'],
    ['Language', '4 translucent highlighters, mind map node creator', 'Lined paper, handwriting guide', 'Grammar check, vocabulary quiz, reading comprehension'],
    ['General', 'Standard tools, timeline builder, sticky notes', 'Blank, dot grid, ruled', 'Summary generation, quiz generation'],
]
cw_toolkits = [AVAILABLE_W * 0.10, AVAILABLE_W * 0.30, AVAILABLE_W * 0.25, AVAILABLE_W * 0.35]
story.append(make_table(toolkits[0], toolkits[1:], cw_toolkits))
story.append(Spacer(1, 3))
story.append(Paragraph('Table 13: Subject-specific toolkit features', sCaption))

story.append(heading2('10.1 GeoGebra Graphing Panel'))
story.append(body(
    'The GeoGebra graphing panel is a widget that opens a resizable panel on the right side (35% viewport width by '
    'default). The SVG canvas automatically shrinks to 65% width to accommodate the panel. This DOM separation is '
    'mandatory because both the whiteboard canvas and GeoGebra listen for mouse and touch events. Overlapping them '
    'would cause drawing actions to accidentally manipulate GeoGebra elements and vice versa. GeoGebra state '
    '(equations, points, constructions) is saved as a stringified JSON snapshot in a dedicated Yjs shared type, '
    'so the state persists when the panel is closed and reopened, and persists independently across page switches. '
    'The tutor can plot functions by typing equations (parsed and rendered via KaTeX), by handwriting equations on '
    'the whiteboard and using AI vision recognition (with confirmation modal), or by using the AI action "Plot this '
    'function" from the AI widget panel.'
))

story.append(PageBreak())

# ══════════════════════════════════════════════════════════
# 11. PERSISTENCE AND TEMPLATES
# ══════════════════════════════════════════════════════════
story.append(heading1('11. Persistence and Templates (Sprint 10)'))
story.append(Spacer(1, 4))
story.append(Paragraph('Auto-Save, Version History, Board Templates, Export, and Auto-Purge', sSectionIntro))
story.append(body(
    'Persistence turns the ephemeral real-time whiteboard into a persistent resource that tutors can revisit, reuse, '
    'and share. This sprint adds auto-save of board state to Supabase, version history for undo beyond the current '
    'session, a template system for reusable lesson layouts, and export capabilities (PNG, PDF, SVG). The persistence '
    'layer writes board page snapshots (the serialized SVG element arrays from the Yjs document) to the BoardPage table '
    'in Supabase every 5 seconds during an active session. This ensures that even if the browser crashes or the '
    'tutor accidentally closes the tab, no more than 5 seconds of work is lost. On page refresh or reconnect, the '
    'client loads the latest snapshot from Supabase and merges it with any pending Yjs updates.'
))

story.append(heading2('11.1 Auto-Save Mechanism'))
story.append(body(
    'The auto-save mechanism runs on a 5-second interval using a React effect hook. On each tick, it serializes the '
    'current page\'s SVG elements from the Yjs document and upserts the BoardPage record for the current room and page '
    'index. The upsert uses Supabase\'s ON CONFLICT DO UPDATE to avoid creating duplicate records. The serialization '
    'is incremental: only pages that have changed since the last save are written, reducing database load. The '
    'auto-save indicator in the UI shows a small dot next to the page number: green when saved, yellow when there '
    'are unsaved changes, and red when a save fails (with automatic retry after 10 seconds). After session end, '
    'a final save is triggered to capture the last state before the room goes inactive.'
))

story.append(heading2('11.2 Template System'))
story.append(body(
    'Tutors can save the current board state as a reusable template. The template captures all pages, their elements, '
    'and the subject designation. Templates are stored in the Template table in Supabase and are accessible from '
    'the tutor\'s dashboard. When starting a new session, the tutor can optionally load a template instead of starting '
    'with a blank board. Loading a template initializes the Yjs document with the template\'s page data and sets '
    'the room\'s subject to match the template\'s subject. Templates are private to the tutor who created them. '
    'Agency templates (shared across tutors in an agency) are a Phase 3 feature. Template names are limited to 50 '
    'characters and can include emoji for visual identification in the template picker.'
))

story.append(heading2('11.3 Export Capabilities'))
story.append(body(
    'Tutors can export the current board (or all pages) as PNG, PDF, or SVG. PNG export uses the browser\'s canvas '
    'API to render the SVG elements to a raster image at 2x resolution for print quality. PDF export generates a '
    'multi-page PDF with one board page per PDF page, using ReportLab on the client side (or a serverless function '
    'on Vercel for larger boards). SVG export serializes the SVG elements directly to an .svg file that can be '
    'opened in any vector graphics editor. For PRO and AGENCY tiers, PDF exports include agency branding (logo, '
    'name, and color) in the header and footer. FREE tier exports are unbranded. Export is triggered from the '
    'toolbar "Export" button and shows a format picker modal.'
))

persistence_features = [
    ['Feature', 'Priority', 'Details', 'Estimate'],
    ['Auto-Save (5s interval)', 'P0', 'Upsert BoardPage records, incremental save, save indicator', '2 days'],
    ['Template Save', 'P1', 'Serialize all pages, store in Template table, template picker UI', '2 days'],
    ['Template Load', 'P1', 'Initialize Yjs from template data, set room subject', '1 day'],
    ['PNG Export', 'P1', 'Canvas API, 2x resolution, single page or all pages', '1 day'],
    ['PDF Export', 'P2', 'Multi-page PDF, agency branding for PRO/AGENCY', '2 days'],
    ['SVG Export', 'P2', 'Direct SVG serialization, single page or all pages', '0.5 day'],
    ['Version History', 'P2', 'Timestamped snapshots, browse and restore previous versions', '2 days'],
    ['7-Day Auto-Purge', 'P0', 'pg_cron job, delete inactive rooms older than 7 days', '0.5 day'],
]
cw_persist = [AVAILABLE_W * 0.22, AVAILABLE_W * 0.10, AVAILABLE_W * 0.48, AVAILABLE_W * 0.12]
story.append(Spacer(1, 6))
story.append(make_table(persistence_features[0], persistence_features[1:], cw_persist))
story.append(Spacer(1, 3))
story.append(Paragraph('Table 14: Persistence and template features', sCaption))

story.append(PageBreak())

# ══════════════════════════════════════════════════════════
# 12. SECURITY AND COMPLIANCE
# ══════════════════════════════════════════════════════════
story.append(heading1('12. Security and Compliance'))
story.append(Spacer(1, 4))
story.append(Paragraph('CSRF, CSP, Zod Validation, AI Sanitization, COPPA Zero-PII', sSectionIntro))
story.append(body(
    'Security is implemented throughout the stack, not as an afterthought. This section covers the security measures '
    'that apply across all Phase 2 features. Every API endpoint on Vercel uses Zod v3 validation with strict mode to '
    'reject malformed input. CSRF protection uses double-submit cookie pattern. Content Security Policy headers are '
    'dynamically generated with per-request nonces. AI prompts are sanitized before being sent to external APIs. '
    'And the entire system is designed around zero PII collection from students, making COPPA compliance automatic '
    'rather than procedural.'
))

story.append(heading2('12.1 COPPA / GDPR-K Compliance via Zero-PII Design'))
story.append(body(
    'The application does not ask for, display, or collect any student personal information. Students are identified '
    'solely by anonymous numerical labels (Student 1, Student 2) assigned automatically via the Yjs awareness protocol. '
    'No text input is presented to students at any point in the flow. No student data is written to any database, '
    'log, or storage system. Student state exists only in the volatile memory of connected WebSocket clients and is '
    'permanently destroyed when the session ends. This design eliminates COPPA\'s verifiable parental consent requirement '
    'because no personal information is collected from children. The FTC\'s COPPA FAQ explicitly states that the '
    'regulation applies to operators that "collect personal information from children." If no personal information is '
    'collected, COPPA\'s requirements do not trigger.'
))
story.append(note(
    '<b>Legal disclaimer:</b> This is a product design recommendation based on publicly available FTC guidance, '
    'not legal advice. The founder should consult a K-12 privacy attorney ($500-2,000 initial consultation) before '
    'a US market launch. However, the zero-PII approach represents the lowest-risk compliance position available '
    'without legal counsel.'
))

story.append(heading2('12.2 Input Validation (Zod v3)'))
story.append(body(
    '100% of API endpoints use a validateInput() helper with strict Zod v3 schemas. Every schema enforces: string '
    'length limits (min/max), UUID format validation, regex patterns for emails and color codes, enum validation '
    'for tier and subject fields, and .strict() mode to reject unknown properties. No raw req.body access is '
    'permitted outside the validateInput wrapper. This prevents injection attacks, malformed data from reaching the '
    'database, and ensures that all data stored in Supabase conforms to expected formats. The validateInput helper '
    'returns parsed, typed data that TypeScript can infer, eliminating type coercion bugs between API routes and '
    'the database layer.'
))

security_measures = [
    ['Measure', 'Implementation', 'Scope'],
    ['CSRF Protection', 'Double-submit cookie (crypto.randomUUID), timingSafeEqual comparison', 'All POST/PUT/PATCH/DELETE routes'],
    ['Content Security Policy', 'Dynamic per-request nonce, approved domain allowlist', 'All responses'],
    ['Input Validation', 'Zod v3 strict schemas, validateInput() wrapper on every endpoint', 'All API routes'],
    ['AI Prompt Sanitization', 'Truncation, injection pattern scan, [FILTERED] replacement', 'All AI requests'],
    ['AI Soft Throttle', 'Spend tracking per user, $3 PRO / $15 AGENCY monthly cap', 'AI proxy'],
    ['COPPA Zero-PII', 'Anonymous student IDs, no student database model, ephemeral state', 'Entire application'],
    ['7-Day Auto-Purge', 'pg_cron daily at 3 AM UTC, delete inactive rooms + pages', 'Supabase database'],
    ['Right to Deletion', 'Stripe webhook on subscription.deleted, hard delete all user data', 'User data'],
]
cw_sec = [AVAILABLE_W * 0.18, AVAILABLE_W * 0.52, AVAILABLE_W * 0.30]
story.append(Spacer(1, 6))
story.append(make_table(security_measures[0], security_measures[1:], cw_sec))
story.append(Spacer(1, 3))
story.append(Paragraph('Table 15: Security and compliance measures', sCaption))

story.append(PageBreak())

# ══════════════════════════════════════════════════════════
# 13. MONETIZATION
# ══════════════════════════════════════════════════════════
story.append(heading1('13. Monetization and Feature Gating'))
story.append(Spacer(1, 4))
story.append(Paragraph('Three-Tier Model: FREE, PRO ($19/mo), AGENCY ($39/mo)', sSectionIntro))
story.append(body(
    'Server-side feature gating is implemented via a hasFeature(featureName, userTier) function. Every premium '
    'feature check passes through this function, which returns a boolean. The frontend mirrors this logic client-side '
    'to hide or disable UI elements for features the user does not have access to, but the server-side check is always '
    'authoritative. The three tiers are FREE (individual tutor, basic features), PRO ($19/month, full feature access), '
    'and AGENCY ($39/month, multi-tutor with white-labeling). Billing is handled by Stripe with monthly subscriptions '
    '(no metered billing, to keep the Stripe integration simple). Stripe webhooks listen for subscription events and '
    'update the user\'s tier in Supabase accordingly.'
))

tiers = [
    ['Feature', 'FREE', 'PRO ($19/mo)', 'AGENCY ($39/mo)'],
    ['Video Calling', '120 min/week', 'Unlimited', 'Unlimited'],
    ['AI Credits', '10/week', '100/month', '100/month'],
    ['Basic Drawing Tools', 'Yes', 'Yes', 'Yes'],
    ['Subject Toolkits', 'Current subject only', 'All subjects', 'All subjects'],
    ['File Uploads', 'No', 'Yes', 'Yes'],
    ['Save / Load Boards', 'No', 'Yes', 'Yes'],
    ['Templates', 'No', 'Yes', 'Yes'],
    ['GeoGebra Panel', 'No', 'Yes', 'Yes'],
    ['AI Math OCR', 'No', 'Yes', 'Yes'],
    ['Math Type ($0 Fallback)', 'Yes', 'Yes', 'Yes'],
    ['PDF Export', 'No', 'Yes (branded)', 'Yes (white-label)'],
    ['Deep White-Labeling', 'No', 'No', 'Yes (CSS, waiting room, PDF)'],
    ['Sub-Tutor Invites', 'No', 'No', 'Yes'],
    ['AI Soft Throttle', 'N/A', '$3/month cap', '$15/month cap'],
]
cw_tiers = [AVAILABLE_W * 0.25, AVAILABLE_W * 0.22, AVAILABLE_W * 0.25, AVAILABLE_W * 0.28]
story.append(make_table(tiers[0], tiers[1:], cw_tiers))
story.append(Spacer(1, 3))
story.append(Paragraph('Table 16: Three-tier monetization model and feature gating', sCaption))

story.append(heading2('13.1 Cost of Goods Sold (COGS) Analysis'))
story.append(body(
    'The total production infrastructure cost is $0/month for Phase 2 (Oracle Cloud Free Tier for VPS, Supabase Free '
    'Tier for database, Vercel Hobby for frontend). The only variable costs are AI inference and Stripe payment '
    'processing fees. For a PRO user ($19/month), the estimated COGS is approximately $2.00-2.80/month, yielding a '
    'contribution margin of 85-89%. The AI soft throttle mechanism provides an additional safeguard: even if a PRO '
    'user maximizes AI usage, the system caps estimated spend at $3.00/month, ensuring the contribution margin never '
    'drops below 84%. This economic model is sustainable at scale and requires only a handful of paying users to cover '
    'any future infrastructure costs when the free tiers are outgrown.'
))

cogs = [
    ['Cost Component', 'Per-Unit Cost', 'Max Monthly Usage', 'Monthly COGS'],
    ['VPS (Oracle Free Tier)', '$0/month', 'Included', '$0'],
    ['Supabase (Free Tier)', '$0/month', 'Within free limits', '$0'],
    ['Vercel Hobby', '$0/month', 'Within free limits', '$0'],
    ['GPT-4o-mini / Gemini Flash', '~$0.15/1M tokens', '~50 requests', '~$0.50-1.00'],
    ['GPT-4o-mini Vision', '~$0.30/1M tokens', '~10 requests', '~$0.20-0.50'],
    ['Stripe Fees', '2.9% + $0.30', '1 transaction', '~$0.85'],
    ['Total Estimated COGS', '', '', '~$1.55-2.35/month'],
    ['Contribution Margin', '', '', '~89-92%'],
]
cw_cogs = [AVAILABLE_W * 0.25, AVAILABLE_W * 0.20, AVAILABLE_W * 0.25, AVAILABLE_W * 0.22]
story.append(Spacer(1, 6))
story.append(make_table(cogs[0], cogs[1:], cw_cogs))
story.append(Spacer(1, 3))
story.append(Paragraph('Table 17: Per-user COGS analysis (PRO tier, worst case)', sCaption))

story.append(PageBreak())

# ══════════════════════════════════════════════════════════
# 14. ACCEPTANCE CRITERIA
# ══════════════════════════════════════════════════════════
story.append(heading1('14. Acceptance Criteria'))
story.append(Spacer(1, 4))
story.append(Paragraph('Phase 2 Completion Requires All P0 Criteria to Pass', sSectionIntro))
story.append(body(
    'Each acceptance criterion must pass manual testing, automated E2E testing (where applicable), and be validated '
    'by at least one real tutor user before Phase 2 is considered complete. Priority P0 criteria are blocking: Phase 2 '
    'cannot be considered complete until all P0 criteria pass. P1 criteria should pass but can be deferred to a Phase '
    '2.1 patch release if timeline pressure requires. P2 criteria are nice-to-have and can be moved to Phase 3 if needed.'
))

criteria = [
    ['ID', 'Criterion', 'Priority'],
    ['AC-01', 'A tutor can create an account, log in, and create a session within 2 minutes', 'P0'],
    ['AC-02', 'A student can join a session via invite link and see the whiteboard within 5 seconds', 'P0'],
    ['AC-03', 'Two users can draw on the board simultaneously with sub-200ms latency', 'P0'],
    ['AC-04', 'The teacher can mute a student and verify they cannot chat', 'P0'],
    ['AC-05', 'Video/audio works with 2 participants with sub-500ms audio latency', 'P1'],
    ['AC-06', 'A student can raise hand and the teacher sees it within 1 second', 'P1'],
    ['AC-07', 'The teacher can create a poll and students can vote in real-time', 'P1'],
    ['AC-08', 'The board auto-saves every 5 seconds and survives page refresh without data loss', 'P0'],
    ['AC-09', 'A disconnected user can reconnect and resume without losing their unsent drawings', 'P1'],
    ['AC-10', 'The teacher can export the board as PNG and PDF', 'P2'],
    ['AC-11', 'Session templates can be saved and loaded across different sessions', 'P2'],
    ['AC-12', 'AI equation recognition works with confirmation modal and plots correct graph', 'P1'],
    ['AC-13', 'Inactive rooms are auto-purged after 7 days by pg_cron', 'P0'],
    ['AC-14', 'Zero student PII: no names, no database records, no logs for students', 'P0'],
    ['AC-15', 'TURN TCP 443 fallback allows video calls through simulated firewall', 'P1'],
]
cw_ac = [AVAILABLE_W * 0.08, AVAILABLE_W * 0.74, AVAILABLE_W * 0.10]
story.append(make_table(criteria[0], criteria[1:], cw_ac))
story.append(Spacer(1, 3))
story.append(Paragraph('Table 18: Phase 2 acceptance criteria', sCaption))

story.append(Spacer(1, 20))

# ══════════════════════════════════════════════════════════
# BUILD
# ══════════════════════════════════════════════════════════
doc.multiBuild(story, onLaterPages=add_page_number)
print(f'PDF generated: {output_path} ({os.path.getsize(output_path)} bytes)')
