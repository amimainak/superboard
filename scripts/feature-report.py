#!/usr/bin/env python3
"""
Superboard Feature Gap Analysis Report
Expert Tutor Role-Play Across 8 K-12 Subject Areas
"""

import os, sys, hashlib
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm, inch
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
from reportlab.graphics.shapes import Drawing, Line, Rect, String
from reportlab.graphics import renderPDF

# ━━ Font Registration ━━
FONT_DIR = '/usr/share/fonts'
pdfmetrics.registerFont(TTFont('NotoSerifSC', f'{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSC-Bold', f'{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
# Use static weight fonts (ReportLab doesn't support variable fonts)
pdfmetrics.registerFont(TTFont('NotoSansSC', f'{FONT_DIR}/truetype/chinese/SarasaMonoSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSansSC-Bold', f'{FONT_DIR}/truetype/chinese/SarasaMonoSC-Bold.ttf'))
registerFontFamily('NotoSerifSC', normal='NotoSerifSC', bold='NotoSerifSC-Bold')
registerFontFamily('NotoSansSC', normal='NotoSansSC', bold='NotoSansSC-Bold')

# ━━ Cascade Palette ━━
PAGE_BG       = colors.HexColor('#f5f5f4')
SECTION_BG    = colors.HexColor('#eae9e8')
CARD_BG       = colors.HexColor('#efeeec')
TABLE_STRIPE  = colors.HexColor('#f2f2f0')
HEADER_FILL   = colors.HexColor('#716749')
COVER_BLOCK   = colors.HexColor('#7f775e')
BORDER        = colors.HexColor('#d5d1c4')
ICON          = colors.HexColor('#b3994a')
ACCENT        = colors.HexColor('#93761e')
ACCENT_2      = colors.HexColor('#593ea9')
TEXT_PRIMARY   = colors.HexColor('#21201e')
TEXT_MUTED     = colors.HexColor('#8d8b84')
SEM_SUCCESS   = colors.HexColor('#3c8253')
SEM_WARNING   = colors.HexColor('#a88a4e')
SEM_ERROR     = colors.HexColor('#8b4a44')
SEM_INFO      = colors.HexColor('#487199')

# Category colors from the existing codebase
CAT_ENGLISH    = colors.HexColor('#6366f1')
CAT_FL         = colors.HexColor('#10b981')
CAT_MATH       = colors.HexColor('#3b82f6')
CAT_SCIENCE    = colors.HexColor('#8b5cf6')
CAT_HISTORY    = colors.HexColor('#f97316')
CAT_GENERAL    = colors.HexColor('#f59e0b')
CAT_PE         = colors.HexColor('#ef4444')
CAT_HEALTH     = colors.HexColor('#ec4899')
CAT_ARTS       = colors.HexColor('#a855f7')

# ━━ Styles ━━
styles = getSampleStyleSheet()

styles.add(ParagraphStyle(
    'ReportTitle',
    parent=styles['Title'],
    fontName='NotoSansSC-Bold',
    fontSize=28,
    leading=34,
    textColor=TEXT_PRIMARY,
    alignment=TA_CENTER,
    spaceAfter=6*mm,
))

styles.add(ParagraphStyle(
    'ReportSubtitle',
    parent=styles['Normal'],
    fontName='NotoSansSC',
    fontSize=14,
    leading=20,
    textColor=TEXT_MUTED,
    alignment=TA_CENTER,
    spaceAfter=20*mm,
))

styles.add(ParagraphStyle(
    'SectionHeading',
    parent=styles['Heading1'],
    fontName='NotoSansSC-Bold',
    fontSize=18,
    leading=24,
    textColor=HEADER_FILL,
    spaceBefore=12*mm,
    spaceAfter=4*mm,
    borderWidth=0,
    borderPadding=0,
))

styles.add(ParagraphStyle(
    'SubHeading',
    parent=styles['Heading2'],
    fontName='NotoSansSC-Bold',
    fontSize=14,
    leading=19,
    textColor=ACCENT,
    spaceBefore=6*mm,
    spaceAfter=3*mm,
))

styles.add(ParagraphStyle(
    'SubSubHeading',
    parent=styles['Heading3'],
    fontName='NotoSansSC-Bold',
    fontSize=12,
    leading=16,
    textColor=ACCENT_2,
    spaceBefore=4*mm,
    spaceAfter=2*mm,
))

styles.add(ParagraphStyle(
    'BodyText2',
    parent=styles['Normal'],
    fontName='NotoSerifSC',
    fontSize=10.5,
    leading=17,
    textColor=TEXT_PRIMARY,
    alignment=TA_JUSTIFY,
    spaceAfter=3*mm,
    firstLineIndent=0,
))

styles.add(ParagraphStyle(
    'BulletItem',
    parent=styles['Normal'],
    fontName='NotoSerifSC',
    fontSize=10.5,
    leading=16,
    textColor=TEXT_PRIMARY,
    leftIndent=12*mm,
    bulletIndent=6*mm,
    spaceAfter=2*mm,
))

styles.add(ParagraphStyle(
    'TableHeader',
    parent=styles['Normal'],
    fontName='NotoSansSC-Bold',
    fontSize=9.5,
    leading=13,
    textColor=colors.white,
    alignment=TA_CENTER,
))

styles.add(ParagraphStyle(
    'TableCell',
    parent=styles['Normal'],
    fontName='NotoSerifSC',
    fontSize=9,
    leading=13,
    textColor=TEXT_PRIMARY,
))

styles.add(ParagraphStyle(
    'TableCellCenter',
    parent=styles['Normal'],
    fontName='NotoSerifSC',
    fontSize=9,
    leading=13,
    textColor=TEXT_PRIMARY,
    alignment=TA_CENTER,
))

styles.add(ParagraphStyle(
    'FooterStyle',
    parent=styles['Normal'],
    fontName='NotoSansSC',
    fontSize=8,
    leading=10,
    textColor=TEXT_MUTED,
    alignment=TA_CENTER,
))

styles.add(ParagraphStyle(
    'RolePlayLabel',
    parent=styles['Normal'],
    fontName='NotoSansSC-Bold',
    fontSize=10,
    leading=14,
    textColor=SEM_INFO,
    spaceBefore=2*mm,
    spaceAfter=1*mm,
))

# ━━ TOC Support ━━
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

def add_heading(text, style, level=0):
    key = f'h_{hashlib.md5(text.encode()).hexdigest()[:8]}'
    p = Paragraph(f'<a name="{key}"/>{text}', style)
    p.bookmark_name = key
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

# ━━ Helper functions ━━
def priority_badge(p):
    color_map = {'P0': SEM_ERROR, 'P1': SEM_WARNING, 'P2': SEM_SUCCESS, 'P3': TEXT_MUTED}
    return f'<font color="{color_map.get(p, TEXT_MUTED).hexval()}"><b>{p}</b></font>'

def status_badge(s):
    if s == 'EXISTS':
        return f'<font color="{SEM_SUCCESS.hexval()}"><b>EXISTS</b></font>'
    elif s == 'MISSING':
        return f'<font color="{SEM_ERROR.hexval()}"><b>MISSING</b></font>'
    elif s == 'PARTIAL':
        return f'<font color="{SEM_WARNING.hexval()}"><b>PARTIAL</b></font>'
    return s

def feature_table(features, col_widths=None):
    """Build a feature table with columns: Feature, Status, Priority, Description"""
    if col_widths is None:
        available = A4[0] - 40*mm
        col_widths = [available*0.22, available*0.12, available*0.10, available*0.56]

    header = [
        Paragraph('<b>Feature</b>', styles['TableHeader']),
        Paragraph('<b>Status</b>', styles['TableHeader']),
        Paragraph('<b>Priority</b>', styles['TableHeader']),
        Paragraph('<b>Description</b>', styles['TableHeader']),
    ]
    data = [header]
    for feat in features:
        row = [
            Paragraph(feat['name'], styles['TableCell']),
            Paragraph(status_badge(feat['status']), styles['TableCellCenter']),
            Paragraph(priority_badge(feat['priority']), styles['TableCellCenter']),
            Paragraph(feat['desc'], styles['TableCell']),
        ]
        data.append(row)

    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'NotoSansSC-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9.5),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]
    for i in range(1, len(data)):
        bg = colors.white if i % 2 == 1 else TABLE_STRIPE
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t

def section_divider():
    return HRFlowable(width='100%', thickness=1, color=BORDER, spaceAfter=4*mm, spaceBefore=4*mm)

def quote_block(text, author=""):
    """Create a role-play quote block"""
    author_html = ''
    if author:
        author_html = f'<br/><font size="8" color="{TEXT_MUTED.hexval()}">-- {author}</font>'
    q_data = [[
        Paragraph(
            f'<i>"{text}"</i>{author_html}',
            ParagraphStyle('Quote', parent=styles['BodyText2'], fontSize=10, leading=15, textColor=ACCENT_2, leftIndent=8*mm, rightIndent=8*mm)
        )
    ]]
    q_table = Table(q_data, colWidths=[A4[0] - 56*mm])
    q_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f3f0fa')),
        ('BOX', (0, 0), (-1, -1), 1.5, ACCENT_2),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return q_table


# ━━ BUILD DOCUMENT ━━
output_path = '/home/z/my-project/download/Superboard_Feature_Gap_Analysis.pdf'

from reportlab.platypus import PageTemplate, Frame

def add_page_number(canvas, doc):
    """Footer with page number on all pages except cover (page 1)."""
    canvas.saveState()
    if doc.page > 1:
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(TEXT_MUTED)
        page_num = canvas.getPageNumber()
        text = f"Superboard Feature Gap Analysis  |  Page {page_num - 1}"
        canvas.drawCentredString(A4[0] / 2, 12*mm, text)
    canvas.restoreState()

doc = TocDocTemplate(
    output_path,
    pagesize=A4,
    leftMargin=20*mm,
    rightMargin=20*mm,
    topMargin=20*mm,
    bottomMargin=20*mm,
    title='Superboard Feature Gap Analysis',
    author='Superboard',
    subject='Expert Tutor Role-Play Feature Recommendations',
)

# Override build to add page numbers via onPage
original_handle_pageBegin = doc.handle_pageBegin
def handle_page_begin_with_footer(canvas, doc):
    original_handle_pageBegin()
    add_page_number(canvas, doc)
# Use the simpler onFirstPage/onLaterPages approach

story = []

# ━━ COVER PAGE ━━
story.append(Spacer(1, 60*mm))
story.append(Paragraph('Superboard', ParagraphStyle('CoverBrand', parent=styles['ReportTitle'], fontSize=36, leading=42, textColor=ACCENT)))
story.append(Spacer(1, 4*mm))
story.append(Paragraph('Feature Gap Analysis Report', styles['ReportTitle']))
story.append(Spacer(1, 2*mm))
story.append(Paragraph('Expert Tutor Role-Play Across 8 K-12 Subject Areas', styles['ReportSubtitle']))
story.append(Spacer(1, 20*mm))

cover_data = [
    [Paragraph('<b>Audit Date</b>', ParagraphStyle('cl', parent=styles['TableCell'], textColor=TEXT_MUTED, alignment=TA_RIGHT)),
     Paragraph('August 6, 2026', styles['TableCell'])],
    [Paragraph('<b>Existing Features</b>', ParagraphStyle('cl', parent=styles['TableCell'], textColor=TEXT_MUTED, alignment=TA_RIGHT)),
     Paragraph('27 tools across 6 categories', styles['TableCell'])],
    [Paragraph('<b>Proposed New Features</b>', ParagraphStyle('cl', parent=styles['TableCell'], textColor=TEXT_MUTED, alignment=TA_RIGHT)),
     Paragraph('28 additional features across 3 new categories', styles['TableCell'])],
    [Paragraph('<b>Subject Areas Covered</b>', ParagraphStyle('cl', parent=styles['TableCell'], textColor=TEXT_MUTED, alignment=TA_RIGHT)),
     Paragraph('8 K-12 standard subjects', styles['TableCell'])],
    [Paragraph('<b>Tech Stack</b>', ParagraphStyle('cl', parent=styles['TableCell'], textColor=TEXT_MUTED, alignment=TA_RIGHT)),
     Paragraph('Next.js 16 / Tldraw v5 / Zustand / Claude AI', styles['TableCell'])],
]
cover_table = Table(cover_data, colWidths=[50*mm, 80*mm])
cover_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
    ('BOX', (0, 0), (-1, -1), 0.5, BORDER),
    ('INNERGRID', (0, 0), (-1, -1), 0.25, BORDER),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
]))
story.append(cover_table)

story.append(PageBreak())

# ━━ TABLE OF CONTENTS ━━
toc = TableOfContents()
toc_h0 = ParagraphStyle('toc_h0', fontName='NotoSansSC-Bold', fontSize=12, leading=20, textColor=TEXT_PRIMARY, leftIndent=0)
toc_h1 = ParagraphStyle('toc_h1', fontName='NotoSerifSC', fontSize=10.5, leading=18, textColor=TEXT_MUTED, leftIndent=12)
toc.levelStyles = [toc_h0, toc_h1]
story.append(Paragraph('Table of Contents', ParagraphStyle('TOCTitle', parent=styles['SectionHeading'], spaceBefore=0)))
story.append(toc)
story.append(PageBreak())

# ═══════════════════════════════════════════════════════════════
# SECTION 1: EXECUTIVE SUMMARY
# ═══════════════════════════════════════════════════════════════
story.append(add_heading('1. Executive Summary', styles['SectionHeading'], level=0))
story.append(Paragraph(
    'This report presents a comprehensive feature gap analysis for the Superboard K-12 AI tutoring whiteboard platform. '
    'The analysis was conducted by role-playing as an experienced online tutor across all eight standard K-12 subject areas: '
    'English/Language Arts, Mathematics, Science, Social Studies, Foreign Languages, Physical Education, Health Education, and Arts. '
    'For each subject, the tutor perspective was used to identify features that would meaningfully improve teaching effectiveness, '
    'student engagement, and instructional outcomes in a real-time collaborative whiteboard environment.',
    styles['BodyText2']
))
story.append(Paragraph(
    'The audit began with a thorough examination of the existing codebase, which revealed 27 fully-implemented tool panel components '
    'organized across six tool categories in the central tool registry. The existing features cover the original four core subjects well, '
    'with particularly strong implementations in mathematics (LaTeX rendering, fraction manipulatives, unit converter, statistics charts, step-by-step reveal), '
    'science (periodic table, Punnett square, lab report templates), and English/language arts (annotation layers, graphic organizers, fluency timer, '
    'rubric overlay, essay builder, parts of speech highlighting). Foreign language support includes diacritical character toolbars, conjugation tables, '
    'cloze exercises, flashcards, audio recording, and translation toggles.',
    styles['BodyText2']
))
story.append(Paragraph(
    'However, three entire subject categories are completely absent from the current platform: Physical Education, Health Education, and Arts (Visual Arts and Music). '
    'These subjects represent standard K-12 requirements in most U.S. states and are increasingly delivered through online and hybrid learning models. '
    'Additionally, even within the existing categories, the role-play analysis identified several high-value features that are missing and would significantly '
    'enhance the platform for paid tutors. These include 28 new features across all eight categories, bringing the total recommended feature set to 55 tools.',
    styles['BodyText2']
))

# Summary stats table
summary_data = [
    [Paragraph('<b>Category</b>', styles['TableHeader']),
     Paragraph('<b>Existing</b>', styles['TableHeader']),
     Paragraph('<b>New Features</b>', styles['TableHeader']),
     Paragraph('<b>Total</b>', styles['TableHeader']),
     Paragraph('<b>New Category?</b>', styles['TableHeader'])],
    [Paragraph('English / Reading', styles['TableCell']),
     Paragraph('6', styles['TableCellCenter']),
     Paragraph('4', styles['TableCellCenter']),
     Paragraph('10', styles['TableCellCenter']),
     Paragraph('No', styles['TableCellCenter'])],
    [Paragraph('Foreign Languages', styles['TableCell']),
     Paragraph('6', styles['TableCellCenter']),
     Paragraph('3', styles['TableCellCenter']),
     Paragraph('9', styles['TableCellCenter']),
     Paragraph('No', styles['TableCellCenter'])],
    [Paragraph('Mathematics', styles['TableCell']),
     Paragraph('4', styles['TableCellCenter']),
     Paragraph('5', styles['TableCellCenter']),
     Paragraph('9', styles['TableCellCenter']),
     Paragraph('No', styles['TableCellCenter'])],
    [Paragraph('Science', styles['TableCell']),
     Paragraph('3', styles['TableCellCenter']),
     Paragraph('3', styles['TableCellCenter']),
     Paragraph('6', styles['TableCellCenter']),
     Paragraph('No', styles['TableCellCenter'])],
    [Paragraph('History / Social Studies', styles['TableCell']),
     Paragraph('4', styles['TableCellCenter']),
     Paragraph('3', styles['TableCellCenter']),
     Paragraph('7', styles['TableCellCenter']),
     Paragraph('No', styles['TableCellCenter'])],
    [Paragraph('General / Cross-Subject', styles['TableCell']),
     Paragraph('4', styles['TableCellCenter']),
     Paragraph('4', styles['TableCellCenter']),
     Paragraph('8', styles['TableCellCenter']),
     Paragraph('No', styles['TableCellCenter'])],
    [Paragraph('<b>Physical Education</b>', ParagraphStyle('tb', parent=styles['TableCell'], textColor=SEM_ERROR)),
     Paragraph('0', styles['TableCellCenter']),
     Paragraph('3', styles['TableCellCenter']),
     Paragraph('3', styles['TableCellCenter']),
     Paragraph('<b>YES</b>', ParagraphStyle('tc', parent=styles['TableCellCenter'], textColor=SEM_ERROR))],
    [Paragraph('<b>Health Education</b>', ParagraphStyle('tb', parent=styles['TableCell'], textColor=SEM_ERROR)),
     Paragraph('0', styles['TableCellCenter']),
     Paragraph('3', styles['TableCellCenter']),
     Paragraph('3', styles['TableCellCenter']),
     Paragraph('<b>YES</b>', ParagraphStyle('tc', parent=styles['TableCellCenter'], textColor=SEM_ERROR))],
    [Paragraph('<b>Arts (Visual + Music)</b>', ParagraphStyle('tb', parent=styles['TableCell'], textColor=SEM_ERROR)),
     Paragraph('0', styles['TableCellCenter']),
     Paragraph('4', styles['TableCellCenter']),
     Paragraph('4', styles['TableCellCenter']),
     Paragraph('<b>YES</b>', ParagraphStyle('tc', parent=styles['TableCellCenter'], textColor=SEM_ERROR))],
]
avail_w = A4[0] - 40*mm
sum_table = Table(summary_data, colWidths=[avail_w*0.30, avail_w*0.15, avail_w*0.18, avail_w*0.15, avail_w*0.22], repeatRows=1)
sum_style = [
    ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('BACKGROUND', (0, 7), (-1, 9), colors.HexColor('#fef2f2')),
]
for i in range(1, len(summary_data)):
    bg = colors.white if i % 2 == 1 else TABLE_STRIPE
    if i >= 7:
        bg = colors.HexColor('#fef2f2')
    sum_style.append(('BACKGROUND', (0, i), (-1, i), bg))
sum_table.setStyle(TableStyle(sum_style))
story.append(Spacer(1, 3*mm))
story.append(sum_table)
story.append(Spacer(1, 3*mm))
story.append(Paragraph(
    '<b>Table 1:</b> Feature inventory summary. Red-highlighted rows indicate entirely new subject categories that must be created from scratch. '
    'The "New Category?" column identifies which subject areas require new toolkit files, store state, and toolbar entries.',
    ParagraphStyle('Caption', parent=styles['BodyText2'], fontSize=9, leading=13, textColor=TEXT_MUTED, alignment=TA_CENTER)
))

# ═══════════════════════════════════════════════════════════════
# SECTION 2: EXISTING FEATURE AUDIT
# ═══════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(add_heading('2. Existing Feature Audit', styles['SectionHeading'], level=0))
story.append(Paragraph(
    'The existing Superboard codebase implements a comprehensive tutoring toolkit built on a modern web stack. The platform uses Next.js 16 with React 19, '
    'Tldraw v5 as the canvas engine, Zustand for global state management, Tailwind CSS 4 for styling, shadcn/ui for component primitives, and Claude AI (Anthropic) '
    'for intelligent features. Real-time collaboration is powered by Yjs and Hocuspocus, with LiveKit for video conferencing and Stripe for payment processing. '
    'The following audit summarizes the 27 existing features organized by the six current tool categories.',
    styles['BodyText2']
))

# 2.1 English
story.append(add_heading('2.1 English & Reading (6 features)', styles['SubHeading'], level=1))
story.append(feature_table([
    {'name': 'Annotation Layers', 'status': 'EXISTS', 'priority': 'P0', 'desc': 'Separate tutor and student annotation layers with visibility toggles, color coding, and per-layer shape management.'},
    {'name': 'Graphic Organizers', 'status': 'EXISTS', 'priority': 'P0', 'desc': 'Story map, KWL chart, Venn diagram, Frayer model and other pre-formatted graphic organizer templates.'},
    {'name': 'Fluency Timer', 'status': 'EXISTS', 'priority': 'P0', 'desc': 'Timed reading exercises with automatic WPM calculation, countdown/count-up modes, and per-student tracking.'},
    {'name': 'Rubric Overlay', 'status': 'EXISTS', 'priority': 'P1', 'desc': 'Grading rubric with real-time scoring, multiple criteria, custom point scales, and persistent overlay on canvas.'},
    {'name': 'Essay Builder', 'status': 'EXISTS', 'priority': 'P0', 'desc': 'Drag-and-drop essay structure outline builder with intro/body/conclusion framework and paragraph organization.'},
    {'name': 'Parts of Speech', 'status': 'EXISTS', 'priority': 'P1', 'desc': 'Color-coded parts of speech highlighting for any sentence, with automatic POS detection and visual labeling.'},
]))

# 2.2 Foreign Language
story.append(add_heading('2.2 Foreign Languages (6 features)', styles['SubHeading'], level=1))
story.append(feature_table([
    {'name': 'Special Characters', 'status': 'EXISTS', 'priority': 'P0', 'desc': 'Diacritical character toolbar supporting Spanish, French, German, and Portuguese accented characters.'},
    {'name': 'Conjugation Tables', 'status': 'EXISTS', 'priority': 'P0', 'desc': 'Verb conjugation table templates for Spanish, French, and German with tense and person grids.'},
    {'name': 'Cloze Builder', 'status': 'EXISTS', 'priority': 'P1', 'desc': 'Fill-in-the-blank exercise generator that converts any text passage into interactive cloze activities.'},
    {'name': 'Audio Recorder', 'status': 'EXISTS', 'priority': 'P1', 'desc': 'Browser-based audio recording and playback for pronunciation practice and listening exercises.'},
    {'name': 'Flashcards', 'status': 'EXISTS', 'priority': 'P1', 'desc': 'Vocabulary flashcard mode with flip animation, card navigation, and deck management.'},
    {'name': 'Translation Toggle', 'status': 'EXISTS', 'priority': 'P1', 'desc': 'Show/hide English translations beneath foreign language text for reading comprehension support.'},
]))

# 2.3 Math
story.append(add_heading('2.3 Mathematics (4 features)', styles['SubHeading'], level=1))
story.append(feature_table([
    {'name': 'Fraction Manipulatives', 'status': 'EXISTS', 'priority': 'P0', 'desc': 'Visual fraction bars, fraction circles, mixed numbers, and equivalent fraction comparison tools.'},
    {'name': 'Unit Converter', 'status': 'EXISTS', 'priority': 'P1', 'desc': 'Convert length, weight, volume, and temperature with visual representation of conversion relationships.'},
    {'name': 'Statistics Charts', 'status': 'EXISTS', 'priority': 'P1', 'desc': 'Data table with auto-calculated mean, median, mode, and live-updating bar/line/pie charts.'},
    {'name': 'Step Reveal', 'status': 'EXISTS', 'priority': 'P0', 'desc': 'Step-by-step solver with progressive reveal for guided discovery and scaffolded problem solving.'},
]))

# 2.4 Science
story.append(add_heading('2.4 Science (3 features)', styles['SubHeading'], level=1))
story.append(feature_table([
    {'name': 'Periodic Table', 'status': 'EXISTS', 'priority': 'P0', 'desc': 'Full interactive periodic table with 118 elements, symbol/atomic number/mass display, and quick-insert to canvas.'},
    {'name': 'Punnett Square', 'status': 'EXISTS', 'priority': 'P1', 'desc': 'Genetics Punnett square builder with auto-calculated genotype and phenotype ratios.'},
    {'name': 'Lab Report', 'status': 'EXISTS', 'priority': 'P1', 'desc': 'Pre-formatted lab report template builder with hypothesis, materials, procedure, data, and conclusion sections.'},
]))

# 2.5 History
story.append(add_heading('2.5 History & Social Studies (4 features)', styles['SubHeading'], level=1))
story.append(feature_table([
    {'name': 'Map Overlays', 'status': 'EXISTS', 'priority': 'P0', 'desc': 'World, US, and Europe map annotation layers for geography and historical map analysis.'},
    {'name': 'Timeline Builder', 'status': 'EXISTS', 'priority': 'P0', 'desc': 'Zoomable timeline with color-coded era events, date ranges, and event description popups.'},
    {'name': 'Cause & Effect', 'status': 'EXISTS', 'priority': 'P1', 'desc': 'Visual cause-effect chain builder with flowchart arrows and multi-level causal relationships.'},
    {'name': 'DBQ Workspace', 'status': 'EXISTS', 'priority': 'P1', 'desc': 'Multi-document workspace for Document-Based Questions with thesis builder and evidence organizer.'},
]))

# 2.6 General
story.append(add_heading('2.6 General / Cross-Subject (4 features)', styles['SubHeading'], level=1))
story.append(feature_table([
    {'name': 'Sentence Rearrange', 'status': 'EXISTS', 'priority': 'P1', 'desc': 'Drag-and-drop word tiles for word order exercises and sentence construction practice.'},
    {'name': 'Lesson Templates', 'status': 'EXISTS', 'priority': 'P0', 'desc': 'Save and load complete lesson layouts in one click, with template naming and organization.'},
    {'name': 'Parent Summary', 'status': 'EXISTS', 'priority': 'P1', 'desc': 'Generate and export session summary reports for parents, covering topics covered and student progress.'},
    {'name': 'Quick Poll', 'status': 'EXISTS', 'priority': 'P1', 'desc': 'Multiple-choice instant poll with real-time results bar chart and per-student response tracking.'},
]))

# ═══════════════════════════════════════════════════════════════
# SECTION 3: EXPERT TUTOR ROLE-PLAY — NEW FEATURE RECOMMENDATIONS
# ═══════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(add_heading('3. Expert Tutor Role-Play: New Feature Recommendations', styles['SectionHeading'], level=0))
story.append(Paragraph(
    'The following sections present the results of an intensive role-play exercise in which I adopted the perspective of a highly experienced '
    'online tutor for each of the eight K-12 subject areas. For each subject, I considered the daily teaching workflow, common pain points '
    'with existing online tools, and the specific features that would make a subscription tutoring platform indispensable. Each feature is '
    'rated by priority (P0 = essential for launch, P1 = important competitive advantage, P2 = nice-to-have differentiation, P3 = future roadmap).',
    styles['BodyText2']
))

# ━━ 3.1 ENGLISH / LANGUAGE ARTS ━━
story.append(add_heading('3.1 English / Language Arts', styles['SubHeading'], level=1))
story.append(Paragraph('[Role Play: Mrs. Patterson, 15-year ELA veteran, grades 6-12, specializing in AP English and reading intervention]', styles['RolePlayLabel']))
story.append(quote_block(
    'I have tried every whiteboard tool out there, and they all miss the same things. I need to be able to take a passage from Shakespeare '
    'and annotate it with my students in real-time, but I also need them to practice close reading on their own without seeing my notes first. '
    'The annotation layers are great, but I am missing a way to do structured text markup for rhetorical analysis, track which standards '
    'each activity covers, and help students with phonics decoding at the word level. My reading intervention students need explicit phoneme '
    'grapheme mapping that no current tool provides.',
    'Mrs. Patterson, ELA Tutor'
))
story.append(Spacer(1, 2*mm))
story.append(feature_table([
    {'name': 'Text Markup / Highlighter Set', 'status': 'MISSING', 'priority': 'P0', 'desc': 'Structured text annotation tools: underline (key details), highlight (main idea), circle (unknown vocab), bracket (text evidence). Pre-defined color-coded markup legend for close reading and rhetorical analysis.'},
    {'name': 'Standards Tracker Widget', 'status': 'MISSING', 'priority': 'P1', 'desc': 'Floating widget showing CCSS/TEKS standards addressed in the current lesson. Tutor can tag activities with standard codes. Auto-generates standards coverage report.'},
    {'name': 'Phoneme-Grapheme Map', 'status': 'MISSING', 'priority': 'P1', 'desc': 'Word-level phonics decoding tool that breaks words into phonemes with color-coded grapheme mapping. Essential for K-3 reading intervention and phonics instruction.'},
    {'name': 'Peer Review Mode', 'status': 'MISSING', 'priority': 'P2', 'desc': 'Toggle that creates a structured peer review workflow: students see each other\'s writing with guided rubric prompts, can leave anchored comments, and submit revision notes.'},
]))

# ━━ 3.2 MATHEMATICS ━━
story.append(add_heading('3.2 Mathematics', styles['SubHeading'], level=1))
story.append(Paragraph('[Role Play: Dr. Kevin Okonkwo, 12-year math tutor, grades 3-12, specializes in Algebra I and Calculus AB]', styles['RolePlayLabel']))
story.append(quote_block(
    'Math tutoring online is all about visualizing abstract concepts. The fraction manipulatives and LaTeX rendering are fantastic, '
    'but I need more. When I teach functions, I want to show a dynamically graphed function where students can see how changing the '
    'coefficient affects the shape in real time. For geometry proofs, I need a structured two-column proof builder where each step '
    'links to its justification. And for word problems, I need a visual bar modeling tool that helps students translate text into '
    'mathematical relationships before they write any equations.',
    'Dr. Okonkwo, Math Tutor'
))
story.append(Spacer(1, 2*mm))
story.append(feature_table([
    {'name': 'Interactive Function Plotter', 'status': 'PARTIAL', 'priority': 'P0', 'desc': 'Dynamic function grapher where students adjust parameters (slope, y-intercept, amplitude) and see the graph update in real-time. Supports linear, quadratic, trigonometric, and exponential functions.'},
    {'name': 'Coordinate Plane Grid', 'status': 'PARTIAL', 'priority': 'P0', 'desc': 'Pre-built coordinate plane with labeled axes, grid lines, and quadrant markers. Includes snap-to-grid drawing for precise point placement.'},
    {'name': 'Two-Column Proof Builder', 'status': 'MISSING', 'priority': 'P1', 'desc': 'Structured geometry proof workspace with "Statements" and "Reasons" columns. Pre-loaded with common postulates, theorems, and properties as selectable justifications.'},
    {'name': 'Bar Model / Tape Diagram', 'status': 'MISSING', 'priority': 'P1', 'desc': 'Visual bar modeling tool for translating word problems into mathematical relationships. Supports part-part-whole, comparison, and multi-step models.'},
    {'name': 'Number Line Generator', 'status': 'MISSING', 'priority': 'P2', 'desc': 'Customizable number line with zoom, negative numbers, decimals, fractions, and jump annotations for demonstrating operations and number sense.'},
]))

# ━━ 3.3 SCIENCE ━━
story.append(add_heading('3.3 Science', styles['SubHeading'], level=1))
story.append(Paragraph('[Role Play: Dr. Maya Chen, 10-year science tutor, grades 6-12, Biology and Chemistry specialist]', styles['RolePlayLabel']))
story.append(quote_block(
    'Science tutoring requires visualizing processes that students cannot see with the naked eye. The periodic table is essential, '
    'but I spend so much time drawing the same diagrams over and over: cell structures, energy pyramids, electrical circuits, chemical '
    'bonding diagrams. I need a template library for common science diagrams that I can customize on the fly. For chemistry, an '
    'interactive Lewis dot structure builder would save me 20 minutes per session. And for physics, I need vector addition diagrams '
    'with proper arrow notation and angle measurements.',
    'Dr. Chen, Science Tutor'
))
story.append(Spacer(1, 2*mm))
story.append(feature_table([
    {'name': 'Diagram Template Library', 'status': 'MISSING', 'priority': 'P0', 'desc': 'Pre-built science diagram templates: cell structure, energy pyramid, water cycle, solar system, electrical circuits, layers of the earth, human body systems. Insert and customize on canvas.'},
    {'name': 'Lewis Dot Builder', 'status': 'MISSING', 'priority': 'P1', 'desc': 'Interactive Lewis dot structure tool with element selection, electron shell visualization, and bond drawing. Auto-checks octet rules and formal charges.'},
    {'name': 'Vector / Force Diagram', 'status': 'PARTIAL', 'priority': 'P1', 'desc': 'Physics vector diagram tool with proper arrow notation, magnitude labels, angle measurement, and vector addition (tip-to-tail method). Free-body diagram templates.'},
]))

# ━━ 3.4 SOCIAL STUDIES ━━
story.append(add_heading('3.4 Social Studies', styles['SubHeading'], level=1))
story.append(Paragraph('[Role Play: Mr. James Rivera, 18-year social studies tutor, AP US History, AP World History, and Government]', styles['RolePlayLabel']))
story.append(quote_block(
    'History tutoring is about making connections across time and space. The timeline builder and map overlays are a great start, '
    'but I need more. When I teach the American Revolution, I want to annotate a map of colonial America with troop movements and '
    'battle outcomes. When I teach government, I need a flowchart of how a bill becomes a law that students can interact with. '
    'And for economics, supply and demand curve shifting exercises where students can drag the curves and see equilibrium change '
    'would be transformative for my AP Macro students.',
    'Mr. Rivera, Social Studies Tutor'
))
story.append(Spacer(1, 2*mm))
story.append(feature_table([
    {'name': 'Annotated Map Maker', 'status': 'PARTIAL', 'priority': 'P0', 'desc': 'Enhanced map annotation with drawing tools directly on map layers: troop movements with animated arrows, battle markers, territory shading, trade route paths, and custom legend generation.'},
    {'name': 'Government Process Flowchart', 'status': 'MISSING', 'priority': 'P1', 'desc': 'Interactive flowchart templates for civic processes: how a bill becomes law, the electoral process, the judicial branch hierarchy, amendment process, and federalism power division.'},
    {'name': 'Supply & Demand Curve Tool', 'status': 'MISSING', 'priority': 'P1', 'desc': 'Interactive economics graph with draggable supply and demand curves. Shows equilibrium point, surplus/shortage zones, and elasticity visualization. Essential for AP Economics.'},
]))

# ━━ 3.5 FOREIGN LANGUAGES ━━
story.append(add_heading('3.5 Foreign Languages', styles['SubHeading'], level=1))
story.append(Paragraph('[Role Play: Senora Maria Gutierrez, 14-year Spanish tutor, also tutors French and beginner Mandarin]', styles['RolePlayLabel']))
story.append(quote_block(
    'Language tutoring has unique demands that most whiteboards ignore. The diacritical toolbar and conjugation tables are wonderful, '
    'but pronunciation is everything. I need a way to record my pronunciation of a word, have the student record theirs, and play '
    'them side by side for comparison. For teaching grammar, color-coded sentence parsing where each word is tagged with its grammatical '
    'function (subject, verb, object, adjective) would be incredible. And for vocabulary, an image-based flashcard system where I can '
    'quickly search and insert pictures to create visual associations would beat any flashcard app.',
    'Senora Gutierrez, Foreign Language Tutor'
))
story.append(Spacer(1, 2*mm))
story.append(feature_table([
    {'name': 'Pronunciation Comparison', 'status': 'MISSING', 'priority': 'P1', 'desc': 'Side-by-side audio recording comparison: tutor records a word/phrase, student records their attempt, both play back for comparison. Waveform visualization optional.'},
    {'name': 'Color-Coded Sentence Parse', 'status': 'PARTIAL', 'priority': 'P1', 'desc': 'Enhanced sentence parsing for foreign language text: tag each word with grammatical function (subject, verb, direct object, preposition, adjective) using language-specific color coding.'},
    {'name': 'Image Vocabulary Builder', 'status': 'MISSING', 'priority': 'P2', 'desc': 'Quick image search and insert tool paired with vocabulary words to create visual flashcards. Supports bulk image import for vocabulary list generation.'},
]))

# ━━ 3.6 PHYSICAL EDUCATION (NEW CATEGORY) ━━
story.append(add_heading('3.6 Physical Education (NEW CATEGORY)', styles['SubHeading'], level=1))
story.append(Paragraph('[Role Play: Coach David Thompson, 20-year PE teacher and coach, now doing online fitness tutoring and PE instruction]', styles['RolePlayLabel']))
story.append(quote_block(
    'People think PE cannot be taught online, but they are wrong. I have been doing virtual PE sessions for three years now. '
    'What I need is a way to diagram sports plays and formations that students can actually understand. For fitness, I need to '
    'build custom workout plans with exercise demonstrations, track student progress over time, and show proper form through '
    'annotated images. A fitness tracker widget showing heart rate zones, exercise logs, and goal progress would make my online '
    'PE classes feel just as structured as in-person sessions.',
    'Coach Thompson, PE Tutor'
))
story.append(Spacer(1, 2*mm))
story.append(feature_table([
    {'name': 'Sports Play Diagrammer', 'status': 'MISSING', 'priority': 'P0', 'desc': 'Field/court templates (basketball, soccer, football, volleyball, tennis) with player position markers, movement arrows, and play animation. Drag-and-drop formation builder.'},
    {'name': 'Workout Plan Builder', 'status': 'MISSING', 'priority': 'P0', 'desc': 'Structured exercise plan builder with sets, reps, duration, rest periods, and muscle group targeting. Includes common exercise library with descriptions and form cues.'},
    {'name': 'Fitness Tracking Dashboard', 'status': 'MISSING', 'priority': 'P1', 'desc': 'Student fitness data tracker: log exercises, track progress charts (push-up counts, mile times, flexibility scores), set goals, and visualize improvement over time with trend lines.'},
]))

# ━━ 3.7 HEALTH EDUCATION (NEW CATEGORY) ━━
story.append(add_heading('3.7 Health Education (NEW CATEGORY)', styles['SubHeading'], level=1))
story.append(Paragraph('[Role Play: Nurse Practitioner Lisa Kim, 8-year health education instructor for grades 7-12]', styles['RolePlayLabel']))
story.append(quote_block(
    'Health education requires sensitive, structured content delivery. I need to teach nutrition with actual food label reading exercises, '
    'mental health with structured journaling frameworks, and body systems with labeled diagrams students can annotate. For nutrition, '
    'a calorie and macronutrient calculator where students build a meal and see the nutritional breakdown would be incredibly engaging. '
    'For mental health, having a private student journal space within the whiteboard, with mood tracking and guided reflection prompts, '
    'would give me a way to support student wellness that goes beyond just teaching content.',
    'Nurse Kim, Health Education Instructor'
))
story.append(Spacer(1, 2*mm))
story.append(feature_table([
    {'name': 'Food Label Reader', 'status': 'MISSING', 'priority': 'P0', 'desc': 'Interactive nutrition label reading tool: upload or draw a food label, highlight serving size, calories, macronutrients, percent daily values. Quiz mode for label comprehension.'},
    {'name': 'Mood & Wellness Journal', 'status': 'MISSING', 'priority': 'P1', 'desc': 'Private student wellness journal within the whiteboard: daily mood tracking, gratitude entries, guided reflection prompts, and trend visualization over time. Tutor can see aggregate data only.'},
    {'name': 'Body System Diagrams', 'status': 'MISSING', 'priority': 'P1', 'desc': 'Labeled anatomical diagrams for major body systems (skeletal, muscular, digestive, respiratory, circulatory, nervous). Students can annotate, label, and quiz themselves.'},
]))

# ━━ 3.8 ARTS (NEW CATEGORY) ━━
story.append(add_heading('3.8 Arts: Visual Arts and Music (NEW CATEGORY)', styles['SubHeading'], level=1))
story.append(Paragraph('[Role Play: Ms. Olivia Park, 12-year arts educator, teaches studio art, art history, and beginner music theory online]', styles['RolePlayLabel']))
story.append(quote_block(
    'Teaching art online is actually easier than people think, but the tools need to support it. For studio art, I need a color wheel '
    'tool, a value scale generator, and a perspective grid overlay. For art history, I need a side-by-side image comparison tool where '
    'we can place two artworks next to each other and annotate the similarities and differences. For music theory, a staff notation builder '
    'where I can place notes on a treble and bass clef, demonstrate intervals, and build scales would save me hours per week compared to '
    'drawing staff lines by hand.',
    'Ms. Park, Arts Educator'
))
story.append(Spacer(1, 2*mm))
story.append(feature_table([
    {'name': 'Color Theory Toolkit', 'status': 'MISSING', 'priority': 'P0', 'desc': 'Interactive color wheel, value scale generator, complementary/harmonious color selector, warm/cool temperature tool. Essential for painting and design instruction.'},
    {'name': 'Art Comparison View', 'status': 'MISSING', 'priority': 'P0', 'desc': 'Side-by-side image comparison panel for art history analysis. Supports Venn diagram overlay, annotation on both images simultaneously, and structured critique prompts.'},
    {'name': 'Staff Notation Builder', 'status': 'MISSING', 'priority': 'P1', 'desc': 'Interactive music staff with treble and bass clef. Place notes, rests, sharps, flats. Demonstrate intervals, build scales and chords. Playback via Web Audio API.'},
    {'name': 'Perspective Grid Overlay', 'status': 'MISSING', 'priority': 'P2', 'desc': 'One-point and two-point perspective grid overlays with vanishing points and horizon line. Adjustable grid spacing for drawing exercises.'},
]))

# ═══════════════════════════════════════════════════════════════
# SECTION 4: CROSS-SUBJECT GAP FEATURES
# ═══════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(add_heading('4. Cross-Subject Gap Features', styles['SectionHeading'], level=0))
story.append(Paragraph(
    'Beyond subject-specific tools, the expert tutor role-play revealed several cross-subject features that are either partially implemented '
    'or entirely missing from the current platform. These features address universal tutoring needs that span all subject areas and would '
    'significantly improve the overall value proposition for paid tutors considering the platform.',
    styles['BodyText2']
))

story.append(add_heading('4.1 Partially Implemented Features Requiring Enhancement', styles['SubHeading'], level=1))
story.append(feature_table([
    {'name': 'LaTeX Rendering', 'status': 'PARTIAL', 'priority': 'P0', 'desc': 'Currently inserts text placeholder with LaTeX notation. Needs true rendered output on canvas using SVG embedding or MathML, not plain text. Critical for math and science tutoring quality perception.'},
    {'name': 'Graph Paper / Grid Backgrounds', 'status': 'PARTIAL', 'priority': 'P0', 'desc': 'MathToolkit includes 5 background types (blank, dot-grid, isometric, graph paper, elementary lined). Enhancement needed: adjustable grid spacing, axis labels, and seamless switching without page reload.'},
    {'name': 'PDF / Image Import', 'status': 'EXISTS', 'priority': 'P0', 'desc': 'FileImport component exists with image compression. Works for basic use but needs: multi-page PDF rendering as canvas background, OCR text extraction from imported images, and annotation layering on imported documents.'},
    {'name': 'Session Recording', 'status': 'PARTIAL', 'priority': 'P0', 'desc': 'UI toggle exists in TutorFeatureBar but backend wiring is incomplete. Needs: canvas state recording via MediaRecorder API, synced audio/video, playback controls, and shareable recording links.'},
]))

story.append(add_heading('4.2 Missing Cross-Subject Features', styles['SubHeading'], level=1))
story.append(feature_table([
    {'name': 'Student Portfolio Gallery', 'status': 'MISSING', 'priority': 'P1', 'desc': 'Persistent student work portfolio across sessions. Tutor can tag exemplary work, students can review past sessions, and parents can browse progress. Requires database schema extension.'},
    {'name': 'Multi-Student Mode', 'status': 'MISSING', 'priority': 'P1', 'desc': 'Support for tutoring 2-5 students simultaneously with individual attention panels, breakout rooms, and per-student progress tracking. Current architecture is single-tutor-to-single-student.'},
    {'name': 'Sticker / Reward System', 'status': 'MISSING', 'priority': 'P2', 'desc': 'Fun reward system: digital stickers, stars, and badges tutors can award students. Students collect rewards in a persistent gallery. Increases engagement for K-8 students.'},
    {'name': 'AI Misconception Detection', 'status': 'MISSING', 'priority': 'P1', 'desc': 'Claude-powered real-time analysis of student work on canvas. Detects common misconceptions (e.g., sign errors in algebra, misconceptions about fractions) and alerts tutor with suggested interventions.'},
]))

# ═══════════════════════════════════════════════════════════════
# SECTION 5: IMPLEMENTATION PRIORITY MATRIX
# ═══════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(add_heading('5. Implementation Priority Matrix', styles['SectionHeading'], level=0))
story.append(Paragraph(
    'The following matrix organizes all 28 new features by implementation priority, considering both the value to paid tutors and '
    'the technical complexity of implementation. P0 features are considered essential for competitive positioning and should be '
    'implemented first. P1 features provide significant differentiation and should follow. P2 features are nice-to-haves for the '
    'roadmap. Each feature is tagged with its implementation complexity: Low (single component, no backend), Medium (multi-component or '
    'light backend), High (architecture changes, new backend endpoints, or significant UI work).',
    styles['BodyText2']
))

story.append(add_heading('5.1 P0 Features (Essential - Implement First)', styles['SubHeading'], level=1))

p0_data = [
    [Paragraph('<b>Feature</b>', styles['TableHeader']),
     Paragraph('<b>Category</b>', styles['TableHeader']),
     Paragraph('<b>Complexity</b>', styles['TableHeader']),
     Paragraph('<b>Deliverable</b>', styles['TableHeader'])],
    [Paragraph('Text Markup / Highlighter Set', styles['TableCell']),
     Paragraph('ELA', styles['TableCellCenter']),
     Paragraph('Medium', styles['TableCellCenter']),
     Paragraph('CanvasOverlays extension + store state', styles['TableCell'])],
    [Paragraph('Interactive Function Plotter', styles['TableCell']),
     Paragraph('Math', styles['TableCellCenter']),
     Paragraph('High', styles['TableCellCenter']),
     Paragraph('New panel + Canvas API integration', styles['TableCell'])],
    [Paragraph('Coordinate Plane Grid', styles['TableCell']),
     Paragraph('Math', styles['TableCellCenter']),
     Paragraph('Low', styles['TableCellCenter']),
     Paragraph('Background asset + toolbar button', styles['TableCell'])],
    [Paragraph('Science Diagram Templates', styles['TableCell']),
     Paragraph('Science', styles['TableCellCenter']),
     Paragraph('Medium', styles['TableCellCenter']),
     Paragraph('SVG template library + panel', styles['TableCell'])],
    [Paragraph('Enhanced Map Annotation', styles['TableCell']),
     Paragraph('History', styles['TableCellCenter']),
     Paragraph('Medium', styles['TableCellCenter']),
     Paragraph('Extend existing MapPanel', styles['TableCell'])],
    [Paragraph('Sports Play Diagrammer', styles['TableCell']),
     Paragraph('PE', styles['TableCellCenter']),
     Paragraph('High', styles['TableCellCenter']),
     Paragraph('New toolkit + SVG field templates', styles['TableCell'])],
    [Paragraph('Workout Plan Builder', styles['TableCell']),
     Paragraph('PE', styles['TableCellCenter']),
     Paragraph('Medium', styles['TableCellCenter']),
     Paragraph('New panel component', styles['TableCell'])],
    [Paragraph('Food Label Reader', styles['TableCell']),
     Paragraph('Health', styles['TableCellCenter']),
     Paragraph('Medium', styles['TableCellCenter']),
     Paragraph('New panel + image annotation', styles['TableCell'])],
    [Paragraph('Color Theory Toolkit', styles['TableCell']),
     Paragraph('Arts', styles['TableCellCenter']),
     Paragraph('Medium', styles['TableCellCenter']),
     Paragraph('New panel with interactive canvas', styles['TableCell'])],
    [Paragraph('Art Comparison View', styles['TableCell']),
     Paragraph('Arts', styles['TableCellCenter']),
     Paragraph('Medium', styles['TableCellCenter']),
     Paragraph('Split-screen panel extension', styles['TableCell'])],
]
avail_w = A4[0] - 40*mm
p0_table = Table(p0_data, colWidths=[avail_w*0.30, avail_w*0.15, avail_w*0.15, avail_w*0.40], repeatRows=1)
p0_style = [
    ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ('LEFTPADDING', (0, 0), (-1, -1), 5),
    ('RIGHTPADDING', (0, 0), (-1, -1), 5),
]
for i in range(1, len(p0_data)):
    p0_style.append(('BACKGROUND', (0, i), (-1, i), colors.white if i % 2 == 1 else TABLE_STRIPE))
p0_table.setStyle(TableStyle(p0_style))
story.append(p0_table)

story.append(add_heading('5.2 P1 Features (Important Competitive Advantage)', styles['SubHeading'], level=1))

p1_data = [
    [Paragraph('<b>Feature</b>', styles['TableHeader']),
     Paragraph('<b>Category</b>', styles['TableHeader']),
     Paragraph('<b>Complexity</b>', styles['TableHeader']),
     Paragraph('<b>Deliverable</b>', styles['TableHeader'])],
    [Paragraph('Standards Tracker', styles['TableCell']),
     Paragraph('ELA', styles['TableCellCenter']),
     Paragraph('Medium', styles['TableCellCenter']),
     Paragraph('Widget + DB extension', styles['TableCell'])],
    [Paragraph('Phoneme-Grapheme Map', styles['TableCell']),
     Paragraph('ELA', styles['TableCellCenter']),
     Paragraph('Medium', styles['TableCellCenter']),
     Paragraph('New panel component', styles['TableCell'])],
    [Paragraph('Two-Column Proof Builder', styles['TableCell']),
     Paragraph('Math', styles['TableCellCenter']),
     Paragraph('Medium', styles['TableCellCenter']),
     Paragraph('New panel + store', styles['TableCell'])],
    [Paragraph('Bar Model / Tape Diagram', styles['TableCell']),
     Paragraph('Math', styles['TableCellCenter']),
     Paragraph('Medium', styles['TableCellCenter']),
     Paragraph('Canvas drawing extension', styles['TableCell'])],
    [Paragraph('Lewis Dot Builder', styles['TableCell']),
     Paragraph('Science', styles['TableCellCenter']),
     Paragraph('High', styles['TableCellCenter']),
     Paragraph('Interactive chemistry panel', styles['TableCell'])],
    [Paragraph('Vector / Force Diagram', styles['TableCell']),
     Paragraph('Science', styles['TableCellCenter']),
     Paragraph('Medium', styles['TableCellCenter']),
     Paragraph('Extend existing arrows + panel', styles['TableCell'])],
    [Paragraph('Government Flowcharts', styles['TableCell']),
     Paragraph('History', styles['TableCellCenter']),
     Paragraph('Medium', styles['TableCellCenter']),
     Paragraph('Template panel', styles['TableCell'])],
    [Paragraph('Supply & Demand Curves', styles['TableCell']),
     Paragraph('History', styles['TableCellCenter']),
     Paragraph('High', styles['TableCellCenter']),
     Paragraph('Interactive econ graph panel', styles['TableCell'])],
    [Paragraph('Pronunciation Comparison', styles['TableCell']),
     Paragraph('FL', styles['TableCellCenter']),
     Paragraph('Medium', styles['TableCellCenter']),
     Paragraph('Extend audio recorder', styles['TableCell'])],
    [Paragraph('Fitness Tracking Dashboard', styles['TableCell']),
     Paragraph('PE', styles['TableCellCenter']),
     Paragraph('High', styles['TableCellCenter']),
     Paragraph('New panel + DB schema', styles['TableCell'])],
    [Paragraph('Mood & Wellness Journal', styles['TableCell']),
     Paragraph('Health', styles['TableCellCenter']),
     Paragraph('Medium', styles['TableCellCenter']),
     Paragraph('New panel + privacy controls', styles['TableCell'])],
    [Paragraph('Body System Diagrams', styles['TableCell']),
     Paragraph('Health', styles['TableCellCenter']),
     Paragraph('Medium', styles['TableCellCenter']),
     Paragraph('SVG anatomy library', styles['TableCell'])],
    [Paragraph('Staff Notation Builder', styles['TableCell']),
     Paragraph('Arts', styles['TableCellCenter']),
     Paragraph('High', styles['TableCellCenter']),
     Paragraph('Music theory panel + Web Audio', styles['TableCell'])],
    [Paragraph('Student Portfolio Gallery', styles['TableCell']),
     Paragraph('General', styles['TableCellCenter']),
     Paragraph('High', styles['TableCellCenter']),
     Paragraph('New DB model + gallery UI', styles['TableCell'])],
    [Paragraph('Multi-Student Mode', styles['TableCell']),
     Paragraph('General', styles['TableCellCenter']),
     Paragraph('High', styles['TableCellCenter']),
     Paragraph('Architecture change', styles['TableCell'])],
    [Paragraph('AI Misconception Detection', styles['TableCell']),
     Paragraph('General', styles['TableCellCenter']),
     Paragraph('High', styles['TableCellCenter']),
     Paragraph('Claude API + canvas analysis', styles['TableCell'])],
]
p1_table = Table(p1_data, colWidths=[avail_w*0.30, avail_w*0.15, avail_w*0.15, avail_w*0.40], repeatRows=1)
p1_style_cmds = list(p0_style)  # copy base style
for i in range(1, len(p1_data)):
    p1_style_cmds.append(('BACKGROUND', (0, i), (-1, i), colors.white if i % 2 == 1 else TABLE_STRIPE))
p1_table.setStyle(TableStyle(p1_style_cmds))
story.append(p1_table)

story.append(add_heading('5.3 P2 Features (Roadmap Differentiation)', styles['SubHeading'], level=1))
story.append(feature_table([
    {'name': 'Peer Review Mode', 'status': 'MISSING', 'priority': 'P2', 'desc': 'Structured peer review workflow with anchored comments and revision tracking. Requires multi-student architecture.'},
    {'name': 'Number Line Generator', 'status': 'MISSING', 'priority': 'P2', 'desc': 'Customizable number line with zoom, decimals, fractions, and jump annotations for operations demonstration.'},
    {'name': 'Image Vocabulary Builder', 'status': 'MISSING', 'priority': 'P2', 'desc': 'Quick image search paired with vocabulary words to create visual flashcard decks.'},
    {'name': 'Sticker / Reward System', 'status': 'MISSING', 'priority': 'P2', 'desc': 'Digital stickers and badges for student motivation. Persistent collection across sessions.'},
    {'name': 'Perspective Grid Overlay', 'status': 'MISSING', 'priority': 'P2', 'desc': 'One-point and two-point perspective grids for drawing instruction.'},
], col_widths=[avail_w*0.25, avail_w*0.12, avail_w*0.10, avail_w*0.53]))

# ═══════════════════════════════════════════════════════════════
# SECTION 6: ARCHITECTURE REQUIREMENTS FOR NEW CATEGORIES
# ═══════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(add_heading('6. Architecture Requirements for New Categories', styles['SectionHeading'], level=0))
story.append(Paragraph(
    'Adding three entirely new subject categories (PE, Health, Arts) requires coordinated changes across multiple layers of the Superboard '
    'architecture. This section outlines the specific files that need to be created or modified, the store state additions, and the new '
    'toolkit components required. All changes must maintain backward compatibility with existing features.',
    styles['BodyText2']
))

story.append(add_heading('6.1 Type System Extensions', styles['SubHeading'], level=1))
story.append(Paragraph(
    'The Subject type in src/types/index.ts currently supports only four values: MATH, SCIENCE, LANGUAGE, and GENERAL. '
    'Adding PE, HEALTH, and ARTS requires extending this union type. Additionally, the ToolCategory type must be extended '
    'with three new categories: pe-tools, health-tools, and arts-tools. The CATEGORY_LABELS and CATEGORY_COLORS constants '
    'in tool-registry.ts must be updated accordingly. These changes propagate to the Toolbar component, TutorFeatureBar, '
    'and the SUBJECT_AI_TOOLS mapping.',
    styles['BodyText2']
))

story.append(add_heading('6.2 Store State Additions', styles['SubHeading'], level=1))
story.append(Paragraph(
    'The Zustand store in src/store/app-store.ts needs new boolean flags for each new tool panel, following the existing pattern. '
    'For PE: sportsPlayOpen, workoutPlanOpen, fitnessTrackerOpen. For Health: foodLabelOpen, moodJournalOpen, bodySystemsOpen. '
    'For Arts: colorTheoryOpen, artCompareOpen, staffNotationOpen, perspectiveGridOpen. Each flag requires a corresponding toggle '
    'action following the exact same pattern as existing toggles (e.g., togglePeriodicTable, toggleMapPanel). The initialRoomState '
    'object must include all new flags defaulting to false.',
    styles['BodyText2']
))

story.append(add_heading('6.3 New Toolkit Components', styles['SubHeading'], level=1))
story.append(Paragraph(
    'Three new toolkit files must be created following the existing pattern established by MathToolkit, ScienceToolkit, and others. '
    'Each toolkit renders subject-specific canvas shapes, asset buttons, and panel launchers in the toolbar. The recommended structure '
    'is: src/components/toolkits/PEToolkit.tsx (sports field templates, exercise markers, fitness tracking button), '
    'src/components/toolkits/HealthToolkit.tsx (nutrition labels, body diagrams, wellness journal button), and '
    'src/components/toolkits/ArtsToolkit.tsx (color wheel, perspective grid, staff notation, art comparison buttons). '
    'The Toolbar.tsx SubjectToolkitLoader switch statement must be extended to route PE, HEALTH, and ARTS subjects to their '
    'respective toolkits.',
    styles['BodyText2']
))

story.append(add_heading('6.4 Tool Panel Components', styles['SubHeading'], level=1))
story.append(Paragraph(
    'Each new feature requires a corresponding panel component following the existing directory structure pattern. New directories needed: '
    'src/components/tools/pe/ (SportsPlayPanel.tsx, WorkoutPlanPanel.tsx, FitnessTrackerPanel.tsx), '
    'src/components/tools/health/ (FoodLabelPanel.tsx, MoodJournalPanel.tsx, BodySystemsPanel.tsx), and '
    'src/components/tools/arts/ (ColorTheoryPanel.tsx, ArtComparePanel.tsx, StaffNotationPanel.tsx, PerspectiveGridPanel.tsx). '
    'Each panel must be lazily loaded in CanvasOverlays.tsx using the same dynamic import pattern. '
    'The tool-registry.ts must be extended with new ToolRegistration entries for each panel.',
    styles['BodyText2']
))

story.append(add_heading('6.5 TutorFeatureBar Extensions', styles['SubHeading'], level=1))
story.append(Paragraph(
    'The TutorFeatureBar quick panel launcher section must add new SectionDot groups for PE (Sports, Workout), Health (Nutrition, Wellness, Anatomy), '
    'and Arts (Color, Compare, Music, Grid). Each launcher button calls the corresponding store toggle. The SUBJECT_AI_TOOLS mapping '
    'in Toolbar.tsx must include PE, HEALTH, and ARTS subject entries with relevant AI feature dispatches (e.g., workout generation for PE, '
    'nutrition analysis for Health, color palette suggestions for Arts).',
    styles['BodyText2']
))

# ═══════════════════════════════════════════════════════════════
# SECTION 7: COMPLETE FEATURE INVENTORY
# ═══════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(add_heading('7. Complete Feature Inventory: 55 Features', styles['SectionHeading'], level=0))
story.append(Paragraph(
    'This section presents the complete recommended feature set of 55 tools organized by category. The 27 existing features are marked with '
    'their current status, and the 28 new features are marked as MISSING. This inventory serves as the master reference for implementation '
    'planning and progress tracking.',
    styles['BodyText2']
))

# Summary count
story.append(Paragraph(
    '<b>Total: 55 features across 9 categories</b> (27 existing + 28 new). '
    'P0 features: 14 (implementation priority). '
    'P1 features: 17 (competitive advantage). '
    'P2 features: 7 (roadmap). '
    'Existing partial features needing enhancement: 4.',
    ParagraphStyle('SummaryNote', parent=styles['BodyText2'], textColor=ACCENT, fontSize=10.5, backColor=colors.HexColor('#fffbf0'), borderWidth=1, borderColor=ACCENT, borderPadding=8)
))

story.append(Spacer(1, 4*mm))

# Full inventory table
inv_header = [
    Paragraph('<b>#</b>', styles['TableHeader']),
    Paragraph('<b>Feature</b>', styles['TableHeader']),
    Paragraph('<b>Category</b>', styles['TableHeader']),
    Paragraph('<b>Status</b>', styles['TableHeader']),
    Paragraph('<b>Priority</b>', styles['TableHeader']),
]

all_features = [
    # English (10)
    ('1', 'Annotation Layers', 'ELA', 'EXISTS', 'P0'),
    ('2', 'Graphic Organizers', 'ELA', 'EXISTS', 'P0'),
    ('3', 'Fluency Timer', 'ELA', 'EXISTS', 'P0'),
    ('4', 'Rubric Overlay', 'ELA', 'EXISTS', 'P1'),
    ('5', 'Essay Builder', 'ELA', 'EXISTS', 'P0'),
    ('6', 'Parts of Speech', 'ELA', 'EXISTS', 'P1'),
    ('7', 'Text Markup / Highlighter Set', 'ELA', 'MISSING', 'P0'),
    ('8', 'Standards Tracker Widget', 'ELA', 'MISSING', 'P1'),
    ('9', 'Phoneme-Grapheme Map', 'ELA', 'MISSING', 'P1'),
    ('10', 'Peer Review Mode', 'ELA', 'MISSING', 'P2'),
    # Foreign Languages (9)
    ('11', 'Special Characters (Diacritical)', 'FL', 'EXISTS', 'P0'),
    ('12', 'Conjugation Tables', 'FL', 'EXISTS', 'P0'),
    ('13', 'Cloze Builder', 'FL', 'EXISTS', 'P1'),
    ('14', 'Audio Recorder', 'FL', 'EXISTS', 'P1'),
    ('15', 'Flashcards', 'FL', 'EXISTS', 'P1'),
    ('16', 'Translation Toggle', 'FL', 'EXISTS', 'P1'),
    ('17', 'Pronunciation Comparison', 'FL', 'MISSING', 'P1'),
    ('18', 'Sentence Parse (Enhanced)', 'FL', 'PARTIAL', 'P1'),
    ('19', 'Image Vocabulary Builder', 'FL', 'MISSING', 'P2'),
    # Math (9)
    ('20', 'Fraction Manipulatives', 'Math', 'EXISTS', 'P0'),
    ('21', 'Unit Converter', 'Math', 'EXISTS', 'P1'),
    ('22', 'Statistics Charts', 'Math', 'EXISTS', 'P1'),
    ('23', 'Step Reveal', 'Math', 'EXISTS', 'P0'),
    ('24', 'Interactive Function Plotter', 'Math', 'PARTIAL', 'P0'),
    ('25', 'Coordinate Plane Grid', 'Math', 'PARTIAL', 'P0'),
    ('26', 'Two-Column Proof Builder', 'Math', 'MISSING', 'P1'),
    ('27', 'Bar Model / Tape Diagram', 'Math', 'MISSING', 'P1'),
    ('28', 'Number Line Generator', 'Math', 'MISSING', 'P2'),
    # Science (6)
    ('29', 'Periodic Table', 'Science', 'EXISTS', 'P0'),
    ('30', 'Punnett Square', 'Science', 'EXISTS', 'P1'),
    ('31', 'Lab Report', 'Science', 'EXISTS', 'P1'),
    ('32', 'Diagram Template Library', 'Science', 'MISSING', 'P0'),
    ('33', 'Lewis Dot Builder', 'Science', 'MISSING', 'P1'),
    ('34', 'Vector / Force Diagram', 'Science', 'PARTIAL', 'P1'),
    # History (7)
    ('35', 'Map Overlays', 'History', 'EXISTS', 'P0'),
    ('36', 'Timeline Builder', 'History', 'EXISTS', 'P0'),
    ('37', 'Cause & Effect', 'History', 'EXISTS', 'P1'),
    ('38', 'DBQ Workspace', 'History', 'EXISTS', 'P1'),
    ('39', 'Annotated Map Maker', 'History', 'PARTIAL', 'P0'),
    ('40', 'Government Flowcharts', 'History', 'MISSING', 'P1'),
    ('41', 'Supply & Demand Curves', 'History', 'MISSING', 'P1'),
    # General (8)
    ('42', 'Sentence Rearrange', 'General', 'EXISTS', 'P1'),
    ('43', 'Lesson Templates', 'General', 'EXISTS', 'P0'),
    ('44', 'Parent Summary', 'General', 'EXISTS', 'P1'),
    ('45', 'Quick Poll', 'General', 'EXISTS', 'P1'),
    ('46', 'Student Portfolio Gallery', 'General', 'MISSING', 'P1'),
    ('47', 'Multi-Student Mode', 'General', 'MISSING', 'P1'),
    ('48', 'Sticker / Reward System', 'General', 'MISSING', 'P2'),
    ('49', 'AI Misconception Detection', 'General', 'MISSING', 'P1'),
    # PE (3)
    ('50', 'Sports Play Diagrammer', 'PE', 'MISSING', 'P0'),
    ('51', 'Workout Plan Builder', 'PE', 'MISSING', 'P0'),
    ('52', 'Fitness Tracking Dashboard', 'PE', 'MISSING', 'P1'),
    # Health (3)
    ('53', 'Food Label Reader', 'Health', 'MISSING', 'P0'),
    ('54', 'Mood & Wellness Journal', 'Health', 'MISSING', 'P1'),
    ('55', 'Body System Diagrams', 'Health', 'MISSING', 'P1'),
    # Arts (4)
    ('56', 'Color Theory Toolkit', 'Arts', 'MISSING', 'P0'),
    ('57', 'Art Comparison View', 'Arts', 'MISSING', 'P0'),
    ('58', 'Staff Notation Builder', 'Arts', 'MISSING', 'P1'),
    ('59', 'Perspective Grid Overlay', 'Arts', 'MISSING', 'P2'),
]

inv_data = [inv_header]
for feat in all_features:
    inv_data.append([
        Paragraph(feat[0], ParagraphStyle('tc2', parent=styles['TableCell'], alignment=TA_CENTER)),
        Paragraph(feat[1], styles['TableCell']),
        Paragraph(feat[2], ParagraphStyle('tc2', parent=styles['TableCell'], alignment=TA_CENTER)),
        Paragraph(status_badge(feat[3]), ParagraphStyle('tc2', parent=styles['TableCellCenter'])),
        Paragraph(priority_badge(feat[4]), ParagraphStyle('tc2', parent=styles['TableCellCenter'])),
    ])

inv_col_widths = [avail_w*0.06, avail_w*0.32, avail_w*0.14, avail_w*0.13, avail_w*0.13]
inv_table = Table(inv_data, colWidths=inv_col_widths, repeatRows=1)
inv_style = [
    ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.4, BORDER),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('LEFTPADDING', (0, 0), (-1, -1), 4),
    ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ('FONTSIZE', (0, 0), (-1, -1), 8),
]
# Highlight MISSING rows in light red
for i in range(1, len(inv_data)):
    feat_status = all_features[i-1][3]
    if feat_status == 'MISSING':
        inv_style.append(('BACKGROUND', (0, i), (-1, i), colors.HexColor('#fef2f2')))
    elif i % 2 == 0:
        inv_style.append(('BACKGROUND', (0, i), (-1, i), TABLE_STRIPE))
    else:
        inv_style.append(('BACKGROUND', (0, i), (-1, i), colors.white))
inv_table.setStyle(TableStyle(inv_style))
story.append(inv_table)

# ═══════════════════════════════════════════════════════════════
# BUILD
# ═══════════════════════════════════════════════════════════════
doc.multiBuild(story, onLaterPages=add_page_number, onFirstPage=lambda c, d: None)
print(f"Report generated: {output_path}")
print(f"Total features in inventory: {len(all_features)}")
