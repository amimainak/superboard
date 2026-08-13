#!/usr/bin/env python3
"""
Superboard Competitive Analysis — Full Market Comparison Report
Compares Superboard vs 26+ whiteboard products across the tutoring market
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm, inch
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable, Image
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.fonts import addMapping

# ── Register fonts ──
pdfmetrics.registerFont(TTFont('Inter', '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('InterBold', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'))
addMapping('Inter', 0, 0, 'Inter')
addMapping('Inter', 1, 0, 'InterBold')

# ── Colors ──
C_BG = HexColor('#f6f6f5')
C_PRIMARY = HexColor('#242320')
C_ACCENT = HexColor('#917520')
C_ACCENT2 = HexColor('#39a1c3')
C_MUTED = HexColor('#8f8d86')
C_BORDER = HexColor('#dbd5c6')
C_HEADER_BG = HexColor('#5e5744')
C_CARD = HexColor('#efedea')
C_WHITE = HexColor('#ffffff')
C_SUCCESS = HexColor('#4b9262')
C_WARNING = HexColor('#a7884a')
C_ERROR = HexColor('#92423a')
C_LIGHT_BG = HexColor('#ebeae8')

# ── Page setup ──
PAGE_W, PAGE_H = A4
MARGIN_L = 22 * mm
MARGIN_R = 22 * mm
MARGIN_T = 20 * mm
MARGIN_B = 22 * mm
CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R

# ── Styles ──
styles = getSampleStyleSheet()

s_title = ParagraphStyle('s_title', fontName='InterBold', fontSize=26, leading=32,
    textColor=C_PRIMARY, spaceAfter=6*mm, alignment=TA_LEFT)

s_h1 = ParagraphStyle('s_h1', fontName='InterBold', fontSize=18, leading=24,
    textColor=C_PRIMARY, spaceBefore=8*mm, spaceAfter=4*mm, keepWithNext=True)

s_h2 = ParagraphStyle('s_h2', fontName='InterBold', fontSize=14, leading=18,
    textColor=C_ACCENT, spaceBefore=5*mm, spaceAfter=3*mm, keepWithNext=True)

s_h3 = ParagraphStyle('s_h3', fontName='InterBold', fontSize=11, leading=15,
    textColor=C_PRIMARY, spaceBefore=3*mm, spaceAfter=2*mm, keepWithNext=True)

s_body = ParagraphStyle('s_body', fontName='Inter', fontSize=10, leading=15,
    textColor=C_PRIMARY, spaceAfter=3*mm, alignment=TA_JUSTIFY)

s_body_sm = ParagraphStyle('s_body_sm', fontName='Inter', fontSize=9, leading=13,
    textColor=C_PRIMARY, spaceAfter=2*mm, alignment=TA_JUSTIFY)

s_caption = ParagraphStyle('s_caption', fontName='Inter', fontSize=8, leading=11,
    textColor=C_MUTED, spaceAfter=2*mm)

s_bullet = ParagraphStyle('s_bullet', fontName='Inter', fontSize=10, leading=14,
    textColor=C_PRIMARY, leftIndent=12, bulletIndent=0, spaceAfter=1.5*mm)

s_table_header = ParagraphStyle('s_table_header', fontName='InterBold', fontSize=8.5,
    leading=11, textColor=C_WHITE, alignment=TA_CENTER)

s_table_cell = ParagraphStyle('s_table_cell', fontName='Inter', fontSize=8,
    leading=11, textColor=C_PRIMARY, alignment=TA_LEFT)

s_table_cell_c = ParagraphStyle('s_table_cell_c', fontName='Inter', fontSize=8,
    leading=11, textColor=C_PRIMARY, alignment=TA_CENTER)

s_verdict = ParagraphStyle('s_verdict', fontName='InterBold', fontSize=9,
    leading=13, textColor=C_ACCENT2, spaceAfter=2*mm)

# ── Helper functions ──

def heading1(text):
    return Paragraph(text, s_h1)

def heading2(text):
    return Paragraph(text, s_h2)

def heading3(text):
    return Paragraph(text, s_h3)

def body(text):
    return Paragraph(text, s_body)

def body_sm(text):
    return Paragraph(text, s_body_sm)

def bullet(text):
    return Paragraph(f'<bullet>&bull;</bullet> {text}', s_bullet)

def spacer(h=3):
    return Spacer(1, h * mm)

def divider():
    return HRFlowable(width='100%', thickness=0.5, color=C_BORDER, spaceAfter=3*mm, spaceBefore=2*mm)

def make_table(headers, rows, col_widths=None):
    """Create a styled table with header row and data rows."""
    header_row = [Paragraph(h, s_table_header) for h in headers]
    data = [header_row]
    for row in rows:
        data.append([Paragraph(str(c), s_table_cell) if i == 0 else Paragraph(str(c), s_table_cell_c) for i, c in enumerate(row)])

    if col_widths is None:
        col_widths = [CONTENT_W / len(headers)] * len(headers)

    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), C_HEADER_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), C_WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'InterBold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8.5),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
        ('TOPPADDING', (0, 1), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [C_WHITE, C_CARD]),
    ]
    t.setStyle(TableStyle(style_cmds))
    return t

def rating_table(rows):
    """Feature comparison table with Yes/No/Partial ratings."""
    headers = ['Feature', 'Superboard', 'Koala Go', 'Bitpaper', 'Miro', 'Zoom WB']
    col_w = [CONTENT_W * r for r in [0.30, 0.14, 0.14, 0.14, 0.14, 0.14]]
    return make_table(headers, rows, col_w)

def status_tag(status):
    colors = {
        'Active': C_SUCCESS,
        'Sunset': C_ERROR,
        'Active*': C_WARNING,
    }
    c = colors.get(status, C_MUTED)
    return f'<font color="#{c.hexval()[2:]}">{status}</font>'

# ── Build document ──
output_path = '/home/z/my-project/download/Superboard_Competitive_Analysis.pdf'

doc = SimpleDocTemplate(
    output_path,
    pagesize=A4,
    leftMargin=MARGIN_L,
    rightMargin=MARGIN_R,
    topMargin=MARGIN_T,
    bottomMargin=MARGIN_B,
    title='Superboard Competitive Analysis',
    author='Z.ai',
    subject='Comprehensive comparison of tutoring whiteboards',
)

story = []

# ═══════════════════════════════════════════════════════════════
# COVER PAGE
# ═══════════════════════════════════════════════════════════════

story.append(Spacer(1, 40*mm))
story.append(Paragraph('Superboard', ParagraphStyle('cover_title', fontName='InterBold',
    fontSize=42, leading=48, textColor=C_PRIMARY)))
story.append(Paragraph('Competitive Analysis', ParagraphStyle('cover_sub', fontName='Inter',
    fontSize=22, leading=28, textColor=C_ACCENT, spaceAfter=8*mm)))
story.append(HRFlowable(width='40%', thickness=2, color=C_ACCENT, spaceAfter=8*mm))
story.append(Paragraph('Comprehensive Comparison of Online Tutoring Whiteboards', ParagraphStyle('cover_desc',
    fontName='Inter', fontSize=13, leading=18, textColor=C_MUTED, spaceAfter=4*mm)))
story.append(Paragraph('From Legacy Twiddla to Ultramodern Koala Go', ParagraphStyle('cover_desc2',
    fontName='Inter', fontSize=11, leading=15, textColor=C_MUTED, spaceAfter=20*mm)))
story.append(Spacer(1, 30*mm))
story.append(Paragraph('August 2025', ParagraphStyle('cover_date', fontName='Inter',
    fontSize=10, leading=13, textColor=C_MUTED)))
story.append(Paragraph('Market Size: $5.3B (2025) growing to $7.3-11.1B by 2030-2035 at 7.3% CAGR',
    ParagraphStyle('cover_market', fontName='Inter', fontSize=9, leading=12, textColor=C_ACCENT2)))
story.append(PageBreak())

# ═══════════════════════════════════════════════════════════════
# EXECUTIVE SUMMARY
# ═══════════════════════════════════════════════════════════════

story.append(heading1('1. Executive Summary'))
story.append(body(
    'This report provides a comprehensive competitive analysis of the online tutoring whiteboard market, '
    'comparing Superboard against 26 products spanning four generations: legacy browser whiteboards (Twiddla, Scribblar), '
    'purpose-built tutoring platforms (Bitpaper, Ziteboard, Bramble, Lessonspace), next-generation all-in-one virtual '
    'classrooms (Koala Go, Explain Everything), and general-purpose collaboration tools (Miro, Microsoft Whiteboard, FigJam). '
    'The global interactive whiteboard market was valued at approximately $5.3 billion in 2025 and is projected to reach '
    '$7.3 to $11.1 billion by 2030-2035, growing at a compound annual growth rate of 7.3%. The tutoring-specific segment is '
    'being reshaped by three dominant trends: AI integration, all-in-one consolidation (whiteboard + video + scheduling), '
    'and the erosion of free tiers as products mature.'
))
story.append(body(
    'Superboard occupies a unique position in this landscape. It combines an SVG-based rendering engine with perfect-freehand '
    'stroke interpolation, palm rejection, pinch-to-zoom, stylus barrel button detection, and a minimalist pocket-based UI. '
    'However, it currently lacks several features that the market increasingly expects: real-time collaboration via WebSockets, '
    'video conferencing, session recording/playback, AI-assisted features, scheduling tools, and student permission controls. '
    'This analysis identifies where Superboard excels, where it falls short, and what strategic investments would position it '
    'competitively against both budget tutoring tools ($9-15/month) and premium all-in-one platforms ($26-89/month).'
))
story.append(divider())

# ═══════════════════════════════════════════════════════════════
# MARKET OVERVIEW
# ═══════════════════════════════════════════════════════════════

story.append(heading1('2. Market Overview'))
story.append(body(
    'The online tutoring whiteboard market has undergone a dramatic transformation over the past decade. What began as simple '
    'browser-based drawing canvases has evolved into sophisticated virtual classroom platforms that integrate real-time collaboration, '
    'video conferencing, AI-powered features, and comprehensive tutoring business management tools. The COVID-19 pandemic accelerated '
    'adoption dramatically, and even as in-person tutoring has returned, the convenience and scalability of online tutoring platforms '
    'have sustained strong growth. The market is segmented into three distinct pricing tiers that reflect different target audiences '
    'and feature expectations.'
))

story.append(heading2('2.1 Pricing Tiers'))
story.append(make_table(
    ['Tier', 'Price Range', 'Key Products', 'Target Audience'],
    [
        ['Free', '$0', 'Twiddla, iDroo Starter, MS Whiteboard,\nFreeform, Zoom WB', 'Casual tutors, students, budget users'],
        ['Budget', '$9-15/mo', 'Bitpaper ($15), Scribblar ($9-24),\niDroo Standard (EUR 9)', 'Individual tutors, small operations'],
        ['Mid-Market', '$19-29/mo', 'Lessonspace ($29), Koala Go ($26),\nBramble Pro (GBP 10)', 'Professional tutors, small businesses'],
        ['Premium', '$69-89/yr', 'Explain Everything ($69/yr),\nMiro, Mural', 'Content creators, enterprises'],
        ['Enterprise', 'Custom', 'Limnu Enterprise, Miro,\nConceptboard', 'Tutoring agencies, schools, franchises'],
    ],
    [CONTENT_W*0.12, CONTENT_W*0.12, CONTENT_W*0.40, CONTENT_W*0.36]
))

story.append(spacer(3))
story.append(body(
    'A critical trend observed across the market is the erosion of free tiers. BitPaper, once a favorite among budget-conscious '
    'tutors, moved from free access to a mandatory $15/month subscription in April 2025, generating significant user backlash. '
    'Google Jamboard, a widely-used free tool in education, is being sunset entirely, forcing schools and tutors to migrate to '
    'paid alternatives. This consolidation creates both risk and opportunity for new entrants like Superboard.'
))

story.append(heading2('2.2 Key Market Trends'))
story.append(bullet('<b>AI Integration</b> - iDroo offers an AI Tutor feature, while Koala Go generates AI-powered class notes. This is the fastest-growing differentiator in 2025-2026, with AI being used for handwriting recognition, equation solving, content summarization, and personalized learning recommendations.'))
story.append(bullet('<b>All-in-One Consolidation</b> - Tutors increasingly prefer a single tool that replaces their Zoom + whiteboard + scheduling stack. Koala Go explicitly markets "Goodbye Zoom Boredom" and bundles video, whiteboard, scheduling, and recording. Bramble and Lessonspace follow similar strategies.'))
story.append(bullet('<b>No-Login Student Access</b> - A must-have feature for tutors. Bitpaper, Ziteboard, and Zoom Whiteboard all allow students to join boards without creating accounts, reducing friction dramatically.'))
story.append(bullet('<b>Recording and Playback</b> - Bramble, Koala Go Pro, and TutorRoom all offer session recording and playback, allowing students to review lessons. This is rapidly becoming a baseline expectation, not a premium feature.'))
story.append(bullet('<b>Hardware Ecosystem</b> - Wacom (CTL-672 and later models) and XP-Pen are the dominant drawing tablet brands, with 4096+ pressure sensitivity levels now standard. Whiteboards that support pressure-sensitive input gain a significant quality advantage for handwriting-intensive subjects like math and science.'))
story.append(divider())

# ═══════════════════════════════════════════════════════════════
# PRODUCT ANALYSIS - LEGACY
# ═══════════════════════════════════════════════════════════════

story.append(heading1('3. Product Analysis: Legacy Whiteboards'))

# Twiddla
story.append(heading2('3.1 Twiddla'))
story.append(body(
    'Twiddla represents the first generation of browser-based collaborative whiteboards. Originally built in the Web 2.0 era, '
    'it allows users to mark up live websites, graphics, and photos directly in the browser without requiring any plugins. '
    'Its most distinctive feature remains the ability to annotate live web pages, a capability that very few modern whiteboards offer. '
    'However, the product shows its age significantly in both design and feature depth compared to modern alternatives.'
))
story.append(make_table(
    ['Attribute', 'Detail'],
    [
        ['Status', 'Active but showing age'],
        ['Pricing', 'Free tier + Pro at $14/month'],
        ['Target', 'Classrooms, general collaboration'],
        ['Unique Feature', 'Annotate live websites in-browser'],
        ['Limitations', 'Dated UI, limited tools, no video/audio'],
        ['Relevance to Superboard', 'Low - different era and target audience'],
    ],
    [CONTENT_W*0.25, CONTENT_W*0.75]
))

story.append(spacer(2))

# Scribblar
story.append(heading2('3.2 Scribblar'))
story.append(body(
    'Scribblar is one of the most established tutor-specific whiteboards, rated 4.9/5 by over 2,000 reviewers. It provides a '
    'focused, purpose-built toolset specifically for online tutoring: real-time collaborative drawing, integrated chat, and '
    'audio/video support. The Starter plan at $19/month supports 3 rooms with 3 users per room and unlimited lessons. '
    'Scribblar is notable for its simplicity and focus on the tutor workflow, avoiding the feature bloat that plagues '
    'general-purpose tools. Its weakness lies in limited integrations and room capacity constraints on lower tiers.'
))
story.append(make_table(
    ['Attribute', 'Detail'],
    [
        ['Status', 'Active; strong tutor-specific niche'],
        ['Pricing', 'Basic $9/mo, Starter $19/mo, Standard $24/mo'],
        ['Target', 'Individual tutors, small tutoring businesses'],
        ['Unique Feature', 'Purpose-built for tutoring; no downloads needed'],
        ['Limitations', 'Small room/user limits; limited integrations'],
        ['Relevance to Superboard', 'Medium - similar core canvas, but Scribblar has collaboration'],
    ],
    [CONTENT_W*0.25, CONTENT_W*0.75]
))

story.append(spacer(2))

# iDroo
story.append(heading2('3.3 iDroo'))
story.append(body(
    'iDroo has evolved from a simple whiteboard into an AI-enhanced tutoring platform. The Starter plan is free with 5 boards and '
    '50MB storage, while the Standard plan at EUR 9/user/month and Premium at EUR 25/user/month offer significantly more capacity. '
    'iDroo now features an AI Tutor, course and assignment management, family accounts, and board backups. Its generous free tier makes it '
    'accessible to individual tutors and families, while its emerging AI features position it well for the next generation of '
    'intelligent tutoring tools. The 50MB storage limit on the free tier is a notable constraint for image-heavy tutoring sessions.'
))
story.append(make_table(
    ['Attribute', 'Detail'],
    [
        ['Status', 'Active; evolving with AI features'],
        ['Pricing', 'Free (5 boards, 50MB) to EUR 25/user/mo'],
        ['Target', 'Individual tutors, tutoring families, small teams'],
        ['Unique Feature', 'AI Tutor integration; family accounts; course management'],
        ['Limitations', '50MB storage on free; less known outside European markets'],
        ['Relevance to Superboard', 'High - AI direction is a key growth path'],
    ],
    [CONTENT_W*0.25, CONTENT_W*0.75]
))

story.append(divider())

# ═══════════════════════════════════════════════════════════════
# PRODUCT ANALYSIS - MODERN
# ═══════════════════════════════════════════════════════════════

story.append(heading1('4. Product Analysis: Modern Tutoring Platforms'))

# Bitpaper
story.append(heading2('4.1 Bitpaper'))
story.append(body(
    'Bitpaper is widely regarded as having the best handwriting feel among browser-based whiteboards, making it particularly '
    'popular for math and science tutoring. It features multi-page "papers" with auto-save, unlimited whiteboard space, document '
    'imports, PDF exports, and real-time multi-user collaboration. Critically, students can join boards without logging in. '
    'The product works exceptionally well with graphics tablets (Wacom, XP-Pen) and drawing tablets. In April 2025, Bitpaper '
    'restructured its pricing from free/cheap access to a flat $15/month for all features, upsetting many long-time users but '
    'strengthening its business model. The lack of built-in video conferencing means tutors typically pair it with Zoom or Meet, '
    'adding to the overall cost and complexity of their setup.'
))
story.append(make_table(
    ['Attribute', 'Detail'],
    [
        ['Status', 'Active; pricing restructure (Apr 2025)'],
        ['Pricing', '$15/month (full access)'],
        ['Target', '1-on-1 tutors, handwriting-focused tutoring'],
        ['Unique Feature', 'Best-in-class handwriting; no student login required'],
        ['Limitations', 'No built-in video; pricing upset users; no scheduling'],
        ['Relevance to Superboard', 'Very High - direct handwriting/drawing competitor'],
    ],
    [CONTENT_W*0.25, CONTENT_W*0.75]
))

story.append(spacer(2))

# Ziteboard
story.append(heading2('4.2 Ziteboard'))
story.append(body(
    'Ziteboard offers a touch-friendly online whiteboard with real-time collaboration, an infinite zoomable canvas, and native '
    'iPad and Android apps alongside its browser version. Education-specific pricing makes it accessible to tutors, and like '
    'Bitpaper, students do not need to create accounts to join boards. Cross-platform availability (browser + iPad + Android) '
    'gives it flexibility that browser-only tools lack. Reviews on Capterra note that its shape recognition tool is "not easy '
    'to use," and like many tutor-focused whiteboards, it is typically paired with a separate video tool for full lesson delivery.'
))
story.append(make_table(
    ['Attribute', 'Detail'],
    [
        ['Status', 'Active; well-reviewed on Capterra and Google Play'],
        ['Pricing', 'Education-specific; free tier available'],
        ['Target', 'Remote tutoring (1-on-1), cross-platform users'],
        ['Unique Feature', 'Cross-platform (browser + iPad + Android); no student login'],
        ['Limitations', 'Shape recognition issues; usually paired with video tool'],
        ['Relevance to Superboard', 'High - cross-platform strategy worth considering'],
    ],
    [CONTENT_W*0.25, CONTENT_W*0.75]
))

story.append(spacer(2))

# Bramble
story.append(heading2('4.3 Bramble'))
story.append(body(
    'Bramble is a UK-focused online tutoring platform with a distinctive emphasis on session recording and playback. The free '
    'Basic Tutor plan includes unlimited lessons and recording, which is remarkably generous. The Pro plan at GBP 10/month adds '
    'additional features. Bramble is endorsed by Tutor Doctor, giving it credibility in the franchise tutoring market. '
    'Its recording/playback feature, export capabilities, and reporting for agencies make it particularly attractive for tutoring '
    'businesses that need accountability and session archives. The UK-centric pricing and limited brand recognition outside '
    'Commonwealth markets are its primary constraints.'
))
story.append(make_table(
    ['Attribute', 'Detail'],
    [
        ['Status', 'Active; strong UK presence'],
        ['Pricing', 'Free (unlimited lessons + recording); Pro GBP 10/mo'],
        ['Target', 'UK tutors, tutoring agencies'],
        ['Unique Feature', 'Session recording/playback; export; reporting'],
        ['Limitations', 'UK-centric pricing; limited brand outside UK/Commonwealth'],
        ['Relevance to Superboard', 'High - recording/playback is a must-have feature'],
    ],
    [CONTENT_W*0.25, CONTENT_W*0.75]
))

story.append(spacer(2))

# Lessonspace
story.append(heading2('4.4 LessonSpace'))
story.append(body(
    'LessonSpace is a comprehensive virtual classroom that combines an infinite whiteboard with subject-specific tools, video '
    'calls, screen sharing, chat, shared documents, co-browsing, and presentation streaming. It supports teaching up to 10 '
    'students simultaneously, making it suitable for small group instruction. The $29/month starting price positions it in the '
    'premium segment, and subject-specific tools give it depth that general-purpose whiteboards cannot match. However, this '
    'comprehensiveness comes at a cost that may be prohibitive for solo 1-on-1 tutors who only need a basic whiteboard.'
))
story.append(make_table(
    ['Attribute', 'Detail'],
    [
        ['Status', 'Active; featured on Capterra, EdTech Impact'],
        ['Pricing', 'From $29/month; usage-based from $9/month'],
        ['Target', 'Tutoring businesses, small group instructors'],
        ['Unique Feature', 'Subject-specific tools; multi-student (up to 10); co-browsing'],
        ['Limitations', 'Higher price point; overkill for solo tutors'],
        ['Relevance to Superboard', 'Medium - subject-specific tools could inspire features'],
    ],
    [CONTENT_W*0.25, CONTENT_W*0.75]
))

story.append(spacer(2))

# Explain Everything
story.append(heading2('4.5 Explain Everything'))
story.append(body(
    'Explain Everything is a content-creation powerhouse with 24+ million users. It combines an interactive whiteboard with '
    'video tutorial recording (screencast-style), interactive presentations, and collaboration. The Advanced plan at $69/year '
    'offers unlimited projects and slides, unrestricted video recording, and 20GB cloud storage. Its massive user base and '
    'app-store distribution (iOS, iPad, web) give it unparalleled reach. However, collaboration is limited to 30 minutes on '
    'the Advanced plan, and the tool is fundamentally a content-creation platform rather than a live tutoring environment, making '
    'it more suitable for creating educational content than delivering real-time lessons.'
))
story.append(make_table(
    ['Attribute', 'Detail'],
    [
        ['Status', 'Active; 24M+ users'],
        ['Pricing', 'Free tier; Advanced $69/yr; Team $89.99/yr'],
        ['Target', 'Teachers, content creators, tutors'],
        ['Unique Feature', 'Video recording; massive user base; app distribution'],
        ['Limitations', '30-min collaboration limit; more content-creation than live tutoring'],
        ['Relevance to Superboard', 'Medium - video recording of whiteboard is valuable'],
    ],
    [CONTENT_W*0.25, CONTENT_W*0.75]
))

story.append(spacer(2))

# Limnu
story.append(heading2('4.6 Limnu'))
story.append(body(
    'Limnu is optimized for low resource usage, running well on older machines with limited bandwidth and CPU. This makes it '
    'particularly popular among math tutors who value natural drawing feel. Enterprise plans cater to test-preparation companies '
    'like Blueprints. Limnu focuses on doing one thing well: providing a responsive, natural-feeling whiteboard experience '
    'without demanding powerful hardware. Its smaller feature set compared to full virtual classrooms like LessonSpace means it '
    'is best suited for tutors who prioritize drawing quality over comprehensive features.'
))
story.append(make_table(
    ['Attribute', 'Detail'],
    [
        ['Status', 'Active; positive G2 and Capterra reviews'],
        ['Pricing', 'Individual + Enterprise plans'],
        ['Target', 'Math tutors, tutoring businesses, enterprises'],
        ['Unique Feature', 'Low resource usage; natural drawing feel; enterprise plan'],
        ['Limitations', 'Smaller feature set; limited subject-specific tools'],
        ['Relevance to Superboard', 'High - performance optimization focus aligns well'],
    ],
    [CONTENT_W*0.25, CONTENT_W*0.75]
))

story.append(divider())

# ═══════════════════════════════════════════════════════════════
# PRODUCT ANALYSIS - ULTRAMODERN
# ═══════════════════════════════════════════════════════════════

story.append(heading1('5. Product Analysis: Ultramodern Platforms'))

# Koala Go
story.append(heading2('5.1 Koala Go'))
story.append(body(
    'Koala Go represents the most aggressive modernization of the tutoring whiteboard concept. It positions itself as the '
    'all-in-one replacement for Zoom + whiteboard + scheduling tools, explicitly marketing "Goodbye Zoom Boredom." Features '
    'include an interactive whiteboard, co-browser, 3D playground (a unique differentiator), built-in scheduling, AI-generated '
    'class notes, class recording, and granular student permission controls (drawing, co-browser interaction). Koala Go Pro '
    'at $26/month includes lesson recordings and priority support. The platform aggressively publishes comparison content '
    'positioning itself against BitPaper, Ziteboard, Lessonspace, Miro, and Microsoft Whiteboard. Its Trustpilot reviews '
    'indicate strong user satisfaction. The 3D playground feature is particularly innovative, enabling interactive lessons '
    'that no other platform offers. However, as a newer platform, it has less track record than established competitors.'
))
story.append(make_table(
    ['Attribute', 'Detail'],
    [
        ['Status', 'Active; aggressively growing'],
        ['Pricing', 'Free to start; Pro $26/month'],
        ['Target', 'Professional tutors, tutoring businesses (B2B)'],
        ['Unique Feature', '3D playground; AI class notes; co-browser; student permissions'],
        ['Limitations', 'Newer platform; $26/mo mid-to-high for solo tutors'],
        ['Relevance to Superboard', 'Very High - the benchmark for modern all-in-one'],
    ],
    [CONTENT_W*0.25, CONTENT_W*0.75]
))

story.append(spacer(2))

# TutorRoom
story.append(heading2('5.2 TutorRoom'))
story.append(body(
    'TutorRoom combines HD video conferencing, an interactive whiteboard, screen sharing, recording, Google Calendar sync, '
    'and automated reminders into a single tutoring management platform. It targets tutors who need business management and '
    'whiteboard functionality in one integrated solution, rather than cobbling together multiple tools. While less '
    'well-known than the market leaders, its all-in-one approach mirrors the broader trend toward consolidation. The '
    'whiteboard component is secondary to the management features, making it less relevant as a drawing-focused comparison.'
))

story.append(divider())

# ═══════════════════════════════════════════════════════════════
# PRODUCT ANALYSIS - GENERAL PURPOSE
# ═══════════════════════════════════════════════════════════════

story.append(heading1('6. Product Analysis: General-Purpose Whiteboards'))

story.append(body(
    'While not purpose-built for tutoring, general-purpose whiteboards are widely used in educational contexts. Understanding '
    'their strengths and limitations relative to tutor-specific tools is essential for positioning Superboard.'
))

story.append(heading2('6.1 Miro'))
story.append(body(
    'Miro is the undisputed market leader in enterprise whiteboarding, featuring an infinite canvas, 7,000+ templates, '
    '30+ simultaneous cursors, 1,000+ integrations, and advanced collaboration tools. However, its steep learning curve, '
    'enterprise pricing, and overkill for 1-on-1 tutoring make it a poor fit for most tutors. Its drawing and handwriting '
    'experience is notably inferior to tutor-specific tools like Bitpaper or Limnu. Miro is consistently ranked #1 by Zapier '
    'and other review platforms for enterprise collaboration, but education is not its primary market.'
))

story.append(heading2('6.2 Microsoft Whiteboard'))
story.append(body(
    'Included with Microsoft 365 subscriptions, MS Whiteboard provides basic whiteboard functionality with Teams integration. '
    'It is significantly outperformed by Miro in features, stability, and flexibility, and lacks tutor-specific capabilities. '
    'Its primary advantage is zero additional cost for institutions already invested in the Microsoft ecosystem.'
))

story.append(heading2('6.3 Google Jamboard'))
story.append(Paragraph(
    '<b>Status: SUNSET / DEPRECATED</b> - Google is phasing out Jamboard entirely, replacing it with Google Spaces/Canvas. '
    'This creates a significant migration opportunity for competing platforms.',
    ParagraphStyle('s_sunset', fontName='Inter', fontSize=10, leading=14, textColor=C_ERROR, spaceAfter=3*mm)
))

story.append(heading2('6.4 Zoom Whiteboard'))
story.append(body(
    'Integrated into the Zoom ecosystem, Zoom Whiteboard offers basic drawing and annotation tools. Only licensed Zoom users can '
    'create or host boards, and the free tier is limited to 3 concurrent editable whiteboards. Its drawing tools are basic '
    'and lack the depth that tutor-specific whiteboards provide. The Chalkboard app for Zoom quickly runs out of room. '
    'The primary advantage is convenience for users already in the Zoom ecosystem.'
))

story.append(heading2('6.5 Other Notable Products'))
story.append(body(
    '<b>FigJam</b> (by Figma/Adobe) offers design-quality collaboration but is design-centric rather than education-optimized. '
    '<b>Apple Freeform</b> provides excellent Apple Pencil integration and is free with Apple devices but is Apple-only '
    'with no built-in video conferencing. <b>Canva Whiteboard</b> leverages Canva\'s design ecosystem but is not optimized for '
    'real-time handwriting. <b>Whiteboard.fi</b> is specifically designed for K-12 classroom formative assessment with individual '
    'student boards. <b>Stormboard</b> offers data-first collaboration with unique summary report exports but is enterprise-focused.'
))

story.append(divider())

# ═══════════════════════════════════════════════════════════════
# FEATURE COMPARISON MATRIX
# ═══════════════════════════════════════════════════════════════

story.append(heading1('7. Feature Comparison Matrix'))
story.append(body(
    'The following tables compare Superboard against key competitors across critical feature categories. Ratings indicate '
    'current implementation status: "Yes" (fully implemented), "Partial" (in progress or limited), and "No" (not available).'
))

story.append(heading2('7.1 Drawing and Input Quality'))
story.append(rating_table([
    ['SVG Rendering', 'Yes', 'No (Canvas)', 'No (Canvas)', 'No (Canvas)', 'No (Canvas)'],
    ['Perfect-Freehand Strokes', 'Yes', 'No', 'Partial', 'No', 'No'],
    ['Pen Pressure Sensitivity', 'Partial', 'No', 'No', 'No', 'No'],
    ['Palm Touch Rejection', 'Yes', 'No', 'No', 'No', 'No'],
    ['Pinch-to-Zoom', 'Yes', 'No', 'Yes', 'Yes', 'Partial'],
    ['Stylus Barrel Button', 'Yes', 'No', 'No', 'No', 'No'],
    ['Infinite Canvas', 'Yes', 'No', 'Yes', 'Yes', 'Yes'],
    ['Multi-Page', 'Yes', 'No', 'Yes', 'No', 'No'],
    ['Laser Pointer', 'Yes', 'No', 'No', 'No', 'No'],
    ['Shape Tools', 'Yes (7 shapes)', 'Partial', 'No', 'Partial', 'No'],
    ['Text Tool + Formatting', 'Yes', 'Partial', 'Partial', 'Partial', 'No'],
    ['Sticky Notes', 'Yes', 'Partial', 'No', 'Yes', 'No'],
    ['Image Upload', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes'],
    ['PDF Import', 'No', 'No', 'Yes', 'No', 'No'],
    ['Frame Containers', 'Yes', 'No', 'No', 'No', 'No'],
]))

story.append(spacer(3))
story.append(heading2('7.2 Collaboration and Platform Features'))
story.append(rating_table([
    ['Real-time Multiplayer', 'No', 'Yes', 'Yes', 'Yes', 'Partial'],
    ['Video Conferencing', 'No', 'Yes', 'No', 'No', 'Yes (Zoom)'],
    ['Session Recording', 'No', 'Yes (Pro)', 'No', 'No', 'Yes'],
    ['No-Login Student Access', 'N/A', 'Yes', 'Yes', 'Yes', 'Yes'],
    ['Student Permission Controls', 'No', 'Yes', 'No', 'No', 'No'],
    ['AI Features', 'No', 'AI Notes', 'No', 'No', 'No'],
    ['Scheduling / Calendar', 'No', 'Yes', 'No', 'No', 'No'],
    ['Dark Mode', 'Yes', 'Partial', 'Partial', 'Yes', 'Partial'],
    ['Presentation Mode', 'Yes', 'No', 'No', 'Yes', 'No'],
    ['Export (PNG/JPG/SVG/JSON)', 'Yes (4 formats)', 'Yes', 'Yes (PDF)', 'Yes', 'No'],
    ['Undo / Redo', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes'],
    ['Keyboard Shortcuts', 'Yes (extensive)', 'Partial', 'Partial', 'Yes', 'Partial'],
    ['Cross-Platform (Mobile)', 'No (web only)', 'No', 'iPad + Android', 'No', 'Yes'],
    ['Grid / Snap-to-Grid', 'Yes', 'Partial', 'No', 'Partial', 'No'],
]))

story.append(spacer(3))
story.append(heading2('7.3 UI and Design Quality'))
story.append(rating_table([
    ['Minimalist Pocket UI', 'Yes', 'No', 'No', 'No', 'No'],
    ['Collapsible Tool Pockets', 'Yes', 'No', 'No', 'No', 'No'],
    ['Presentation Mode', 'Yes', 'No', 'No', 'Yes', 'No'],
    ['Custom Color Picker', 'Yes', 'Yes', 'Yes', 'Yes', 'No'],
    ['Opacity Slider', 'Yes', 'Partial', 'Partial', 'Yes', 'No'],
    ['Alignment Guides', 'Yes', 'No', 'No', 'Partial', 'No'],
    ['Frame Containers', 'Yes', 'No', 'No', 'No', 'No'],
    ['Font Family Selection', 'Yes (4 fonts)', 'Partial', 'No', 'Yes', 'No'],
    ['Text Alignment', 'Yes', 'Partial', 'No', 'Yes', 'No'],
    ['Dash Styles', 'Yes (4 types)', 'No', 'No', 'Partial', 'No'],
]))

story.append(divider())

# ═══════════════════════════════════════════════════════════════
# SWOT ANALYSIS
# ═══════════════════════════════════════════════════════════════

story.append(heading1('8. SWOT Analysis: Superboard'))

swot_data = [
    ['STRENGTHS', 'WEAKNESSES'],
    [Paragraph(
        '<bullet>&bull;</bullet> <b>SVG-based rendering</b> - Crisp at any zoom level, '
        'unlike Canvas-based competitors that blur on scale', s_body_sm),
     Paragraph(
        '<bullet>&bull;</bullet> <b>No real-time collaboration</b> - Single-user only; '
        'the biggest gap versus every competitor', s_body_sm)],
    [Paragraph(
        '<bullet>&bull;</bullet> <b>Perfect-freehand interpolation</b> - Best-in-class '
        'stroke quality with constant pressure, thinning, round caps', s_body_sm),
     Paragraph(
        '<bullet>&bull;</bullet> <b>No video conferencing</b> - Tutors must use Zoom/Meet '
        'alongside, adding cost and complexity', s_body_sm)],
    [Paragraph(
        '<bullet>&bull;</bullet> <b>Advanced input handling</b> - Palm rejection, pinch-zoom, '
        'stylus barrel button, multi-touch pointer tracking', s_body_sm),
     Paragraph(
        '<bullet>&bull;</bullet> <b>No session recording/playback</b> - Rapidly becoming '
        'a baseline expectation across the market', s_body_sm)],
    [Paragraph(
        '<bullet>&bull;</bullet> <b>Minimalist pocket UI</b> - Cleanest toolbar design in '
        'the market with collapsible flyout menus', s_body_sm),
     Paragraph(
        '<bullet>&bull;</bullet> <b>No AI features</b> - Missing the fastest-growing '
        'differentiator in 2025-2026 (AI notes, handwriting recognition)', s_body_sm)],
    [Paragraph(
        '<bullet>&bull;</bullet> <b>Presentation mode</b> - Unique among tutor whiteboards; '
        'hides all UI for clean presentation delivery', s_body_sm),
     Paragraph(
        '<bullet>&bull;</bullet> <b>Web only (no mobile apps)</b> - No iPad/Android app '
        'limits accessibility and drawing tablet use cases', s_body_sm)],
    [Paragraph(
        '<bullet>&bull;</bullet> <b>4 export formats</b> - PNG, JPG, SVG, JSON; more '
        'than most competitors', s_body_sm),
     Paragraph(
        '<bullet>&bull;</bullet> <b>No scheduling/business tools</b> - Cannot replace the '
        'management stack that all-in-one platforms offer', s_body_sm)],
    ['OPPORTUNITIES', 'THREATS'],
    [Paragraph(
        '<bullet>&bull;</bullet> <b>AI integration</b> - Handwriting recognition, equation '
        'solving, AI-generated lesson summaries would leapfrog competitors', s_body_sm),
     Paragraph(
        '<bullet>&bull;</bullet> <b>Free tier erosion</b> - Bitpaper and others moving to paid; '
        'a quality free Superboard tier could capture displaced users', s_body_sm)],
    [Paragraph(
        '<bullet>&bull;</bullet> <b>Google Jamboard sunset</b> - Thousands of educators '
        'seeking alternatives; SVG quality could attract them', s_body_sm),
     Paragraph(
        '<bullet>&bull;</bullet> <b>Koala Go\'s momentum</b> - All-in-one platforms with '
        'recording, AI, and co-browsing are setting new expectations', s_body_sm)],
    [Paragraph(
        '<bullet>&bull;</bullet> <b>WebRTC collaboration</b> - Adding real-time multiplayer '
        'would unlock the largest feature gap', s_body_sm),
     Paragraph(
        '<bullet>&bull;</bullet> <b>Market consolidation</b> - Larger platforms may acquire '
        'or crush smaller competitors through ecosystem lock-in', s_body_sm)],
    [Paragraph(
        '<bullet>&bull;</bullet> <b>Mobile apps</b> - iPad + Android apps would expand the '
        'addressable market significantly for stylus users', s_body_sm),
     Paragraph(
        '<bullet>&bull;</bullet> <b>Free model pressure</b> - Sustaining a free product '
        'without monetization while competitors charge $15-29/month is challenging', s_body_sm)],
    [Paragraph(
        '<bullet>&bull;</bullet> <b>Subject-specific tools</b> - Math equation editor, '
        'physics diagrams, chemistry notation would differentiate in education', s_body_sm),
     Paragraph(
        '<bullet>&bull;</bullet> <b>Big Tech entries</b> - Apple Freeform, Canva, and others '
        'could expand education features and squeeze tutoring-specific players', s_body_sm)],
]

swot_table = Table(swot_data, colWidths=[CONTENT_W*0.50, CONTENT_W*0.50])
swot_table.setStyle(TableStyle([
    ('SPAN', (0, 0), (0, 0)),
    ('SPAN', (1, 0), (1, 0)),
    ('SPAN', (0, 5), (0, 5)),
    ('SPAN', (1, 5), (1, 5)),
    ('BACKGROUND', (0, 0), (0, 0), HexColor('#4b9262')),
    ('BACKGROUND', (1, 0), (1, 0), HexColor('#92423a')),
    ('TEXTCOLOR', (0, 0), (-1, 0), C_WHITE),
    ('FONTNAME', (0, 0), (-1, 0), 'InterBold'),
    ('FONTSIZE', (0, 0), (-1, 0), 11),
    ('BACKGROUND', (0, 5), (0, 5), HexColor('#39a1c3')),
    ('BACKGROUND', (1, 5), (1, 5), HexColor('#a7884a')),
    ('TEXTCOLOR', (0, 5), (-1, 5), C_WHITE),
    ('FONTNAME', (0, 5), (-1, 5), 'InterBold'),
    ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
    ('ALIGN', (0, 5), (-1, 5), 'CENTER'),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('ROWBACKGROUNDS', (0, 1), (-1, 4), [C_WHITE, C_CARD]),
    ('ROWBACKGROUNDS', (0, 6), (-1, 9), [C_WHITE, C_CARD]),
]))
story.append(swot_table)

story.append(divider())

# ═══════════════════════════════════════════════════════════════
# POSITIONING MAP
# ═══════════════════════════════════════════════════════════════

story.append(heading1('9. Competitive Positioning Map'))
story.append(body(
    'When plotted across two axes - Feature Richness (x-axis, from basic drawing tools to full virtual classroom) '
    'and Drawing Quality (y-axis, from basic Canvas rendering to SVG + pressure-sensitive perfection) - Superboard '
    'occupies a unique quadrant. It has the highest drawing quality in the market due to its SVG rendering + perfect-freehand '
    'combination, but among the lowest feature richness because it lacks collaboration, video, recording, and AI. Koala Go '
    'and LessonSpace dominate the high-feature quadrant but use Canvas-based rendering that cannot match Superboard\'s '
    'stroke quality. Bitpaper and Limnu sit in the drawing-quality segment but lack Superboard\'s advanced input handling '
    '(palm rejection, pinch-zoom, stylus barrel button). This positioning suggests a clear strategic path: add collaboration '
    'and AI features while maintaining the drawing quality advantage.'
))

story.append(spacer(3))
story.append(make_table(
    ['Quadrant', 'Products', 'Characteristics'],
    [
        ['High Quality + Low Features', 'Superboard, Bitpaper', 'Excellent drawing, limited platform features'],
        ['High Quality + High Features', 'Koala Go, LessonSpace', 'Full virtual classroom, good but not SVG-quality drawing'],
        ['Low Quality + Low Features', 'Twiddla, Whiteboard Fox', 'Basic tools, dated technology'],
        ['Low Quality + High Features', 'Miro, Microsoft Whiteboard', 'Many features, poor handwriting/drawing feel'],
    ],
    [CONTENT_W*0.25, CONTENT_W*0.30, CONTENT_W*0.45]
))

story.append(divider())

# ═══════════════════════════════════════════════════════════════
# STRATEGIC RECOMMENDATIONS
# ═══════════════════════════════════════════════════════════════

story.append(heading1('10. Strategic Recommendations'))

story.append(heading2('10.1 Critical Priorities (Must-Have for Market Competitiveness)'))

story.append(heading3('Priority 1: Real-Time Collaboration via WebSockets'))
story.append(body(
    'This is the single most important feature gap. Every competitor in the tutoring whiteboard space offers real-time '
    'collaboration, and tutors fundamentally require it to deliver lessons. Superboard\'s architecture should integrate '
    'WebSockets (via HocusPocus server, which is already in the codebase) to enable multiple users to draw simultaneously. '
    'Implementation should include cursor presence indicators, conflict resolution for overlapping edits, and a simple '
    'share-via-link mechanism that does not require student account creation. This alone would move Superboard from a '
    'personal drawing tool to a viable tutoring platform.'
))

story.append(heading3('Priority 2: Session Recording and Playback'))
story.append(body(
    'Bramble, Koala Go, and TutorRoom all offer session recording, and it is rapidly becoming a baseline expectation rather '
    'than a premium feature. Recording should capture the entire canvas state over time (element operations, camera movements) '
    'rather than a simple video screen capture, enabling efficient playback and scrubbing. A lightweight approach using '
    'operation logging (similar to the existing JSON export format) could provide efficient recording without massive '
    'storage requirements. Playback could reconstruct the session from the operation log.'
))

story.append(heading3('Priority 3: AI Features'))
story.append(body(
    'AI integration is the fastest-growing differentiator in the tutoring whiteboard market. Superboard should pursue '
    'at least two AI capabilities: (a) AI-generated lesson summaries from whiteboard content, using the JSON export format '
    'to capture all elements and send them to an LLM for summarization; and (b) handwriting recognition and equation solving, '
    'particularly for math tutoring where recognizing handwritten equations and providing step-by-step solutions would be '
    'transformative. iDroo\'s AI Tutor and Koala Go\'s AI-generated class notes demonstrate the direction.'
))

story.append(heading2('10.2 High-Impact Enhancements'))

story.append(heading3('PDF Import and Export'))
story.append(body(
    'Bitpaper, LessonSpace, and Explain Everything all support PDF imports, allowing tutors to load worksheets, textbooks, '
    'and practice problems directly onto the whiteboard. Superboard currently lacks this capability. Given the SVG-based '
    'architecture, PDF import could be implemented by converting PDF pages to SVG backgrounds using pdf2svg or pdf.js, '
    'allowing tutors to annotate over imported content. This is particularly important for math and science tutoring.'
))

story.append(heading3('No-Login Student Access'))
story.append(body(
    'Bitpaper, Ziteboard, and Zoom Whiteboard all allow students to join boards without creating accounts. This is '
    'critical for tutoring, where students (especially younger ones) should not face friction joining a lesson. Superboard '
    'should generate unique shareable links that grant view or edit access without requiring authentication, similar to how '
    'Google Docs link-sharing works.'
))

story.append(heading3('Mobile Applications (iPad + Android)'))
story.append(body(
    'Ziteboard\'s cross-platform strategy (browser + iPad + Android) gives it a significant advantage. For a drawing-focused '
    'whiteboard, iPad support with Apple Pencil integration is particularly valuable, as the iPad is the dominant tablet '
    'in education. A Progressive Web App (PWA) approach could provide mobile accessibility without requiring separate '
    'native app development, while maintaining the web-first architecture.'
))

story.append(heading2('10.3 Medium-Term Opportunities'))

story.append(heading3('Subject-Specific Tools'))
story.append(body(
    'LessonSpace differentiates itself with subject-specific whiteboard tools. Superboard could add a math equation editor '
    'with LaTeX rendering, physics diagram tools (force vectors, circuits, optics), and chemistry notation (molecular '
    'structures, reaction arrows). These would differentiate Superboard in education and justify a premium pricing tier. '
    'The existing SVG rendering architecture is well-suited for rendering mathematical and scientific notation.'
))

story.append(heading3('Video Conferencing Integration'))
story.append(body(
    'While building a full video conferencing system is a major undertaking, Superboard could start with integrations '
    'into existing platforms: a Zoom/Meet picture-in-picture mode, an OBS virtual camera plugin for streaming the '
    'whiteboard as a video source, or a WebRTC-based video overlay. This would allow tutors to use Superboard within '
    'their existing video workflow without requiring a complete video stack.'
))

story.append(heading3('Scheduling and Business Tools'))
story.append(body(
    'Koala Go, Bramble, and TutorRoom demonstrate that tutors value having scheduling, student management, and payment '
    'tools integrated with their whiteboard. Superboard could partner with existing tutoring management platforms '
    '(like Calendly, TutorBird, or TutorCruncher) rather than building these features from scratch, providing a '
    'seamless whiteboard experience within existing tutor workflows.'
))

story.append(divider())

# ═══════════════════════════════════════════════════════════════
# CONCLUSION
# ═══════════════════════════════════════════════════════════════

story.append(heading1('11. Conclusion'))
story.append(body(
    'Superboard possesses genuine technical advantages in drawing quality, input handling, and UI design that no current '
    'competitor fully replicates. Its SVG rendering engine, perfect-freehand stroke interpolation, palm rejection, '
    'pinch-to-zoom, and minimalist pocket UI represent the best drawing experience available in a browser-based whiteboard. '
    'However, it currently functions as a sophisticated personal drawing tool rather than a tutoring platform. The gap '
    'between Superboard and the market is not in drawing quality but in platform completeness: real-time collaboration, '
    'video, recording, AI, scheduling, and mobile apps.'
))
story.append(body(
    'The competitive landscape is moving rapidly toward all-in-one solutions that consolidate whiteboard, video, and '
    'business management. Koala Go\'s "Goodbye Zoom" positioning and Bitpaper\'s shift to mandatory paid subscriptions '
    'signal a market that is maturing and consolidating. Superboard has a narrow window to establish itself before the '
    'market settles around a few dominant players. The recommended strategic path is to maintain the drawing quality '
    'advantage while adding the platform features that tutors require, starting with real-time collaboration, session '
    'recording, and AI-assisted features. If Superboard can deliver its superior drawing experience within a complete '
    'tutoring platform, it would occupy a unique and defensible position in the market that no competitor currently fills.'
))

# ── Build PDF ──
doc.build(story)
print(f'PDF generated: {output_path}')
