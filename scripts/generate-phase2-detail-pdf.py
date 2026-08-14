#!/usr/bin/env python3
"""Generate Superboard Phase 2 Detailed Plan PDF — Extensive Detail for Every Feature"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'skills', 'pdf', 'scripts'))

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm, mm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, CondPageBreak, HRFlowable, ListFlowable, ListItem,
    PageTemplate, Frame
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
MARGIN = 0.9 * inch
AVAILABLE_W = W - 2 * MARGIN

# ── Styles ──
sH1 = ParagraphStyle('H1', fontName='NotoSansSC-Bold', fontSize=26, leading=32,
    textColor=HEADER_FILL, spaceAfter=8, spaceBefore=4)
sH2 = ParagraphStyle('H2', fontName='NotoSansSC-Bold', fontSize=16, leading=22,
    textColor=ACCENT, spaceAfter=5, spaceBefore=12)
sH3 = ParagraphStyle('H3', fontName='NotoSansSC-Bold', fontSize=12, leading=18,
    textColor=TEXT_PRIMARY, spaceAfter=4, spaceBefore=8)
sBody = ParagraphStyle('Body', fontName='NotoSansSC', fontSize=10, leading=16,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK', spaceAfter=4)
sBullet = ParagraphStyle('Bullet', fontName='NotoSansSC', fontSize=10, leading=15,
    textColor=TEXT_PRIMARY, leftIndent=18, bulletIndent=6, wordWrap='CJK', spaceAfter=2)
sSubBullet = ParagraphStyle('SubBullet', fontName='NotoSansSC', fontSize=9.5, leading=14,
    textColor=TEXT_PRIMARY, leftIndent=36, bulletIndent=22, wordWrap='CJK', spaceAfter=1)
sTableCell = ParagraphStyle('TableCell', fontName='NotoSansSC', fontSize=9, leading=13,
    wordWrap='CJK', textColor=TEXT_PRIMARY)
sTableHeader = ParagraphStyle('TableHeader', fontName='NotoSansSC-Bold', fontSize=9, leading=13,
    textColor=colors.white, wordWrap='CJK')
sCaption = ParagraphStyle('Caption', fontName='NotoSansSC', fontSize=8.5, leading=12,
    textColor=TEXT_MUTED, alignment=TA_CENTER, spaceAfter=6)
sNote = ParagraphStyle('Note', fontName='NotoSansSC', fontSize=9, leading=14,
    textColor=SEM_INFO, leftIndent=12, spaceAfter=6, spaceBefore=4)
sSectionIntro = ParagraphStyle('SectionIntro', fontName='NotoSansSC', fontSize=10.5, leading=17,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK', spaceAfter=8)

def heading1(text): return Paragraph(text, sH1)
def heading2(text): return Paragraph(text, sH2)
def heading3(text): return Paragraph(text, sH3)
def body(text): return Paragraph(text, sBody)
def bullet(text): return Paragraph(f'<bullet>&bull;</bullet> {text}', sBullet)
def sub_bullet(text): return Paragraph(f'<bullet>-</bullet> {text}', sSubBullet)
def note(text): return Paragraph(f'<b>Note:</b> {text}', sNote)

def make_table(headers, rows, col_widths=None):
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
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style_cmds.append(('BACKGROUND', (0, i), (-1, i), TABLE_STRIPE))
    t.setStyle(TableStyle(style_cmds))
    return t

def hr(): return HRFlowable(width='100%', thickness=0.5, color=BORDER, spaceAfter=8, spaceBefore=8)

# ── Build Document ──
output_path = '/home/z/my-project/download/Superboard_Phase2_Detailed_Plan.pdf'
os.makedirs(os.path.dirname(output_path), exist_ok=True)

# Page number footer (skip cover page)
cover_pages = 2  # cover + TOC
body_frame = Frame(MARGIN, 0.75*inch, W - 2*MARGIN, H - MARGIN - 0.75*inch, id='body')

def on_first_page(canvas, doc):
    pass  # no footer on cover

def on_later_pages(canvas, doc):
    page_num = doc.page
    if page_num > cover_pages:
        display_num = page_num - cover_pages
        canvas.saveState()
        canvas.setFont('NotoSansSC', 9)
        canvas.setFillColor(TEXT_MUTED)
        canvas.drawCentredString(W / 2, 0.5 * inch, str(display_num))
        canvas.restoreState()

doc = SimpleDocTemplate(
    output_path,
    pagesize=A4,
    leftMargin=MARGIN, rightMargin=MARGIN,
    topMargin=MARGIN, bottomMargin=0.75*inch,
    title='Superboard Phase 2 - Detailed Implementation Plan',
    author='Superboard',
    subject='Phase 2 Classroom Features - Extensive Technical and Product Plan'
)

story = []

# ──────────────── COVER ────────────────
story.append(Spacer(1, 100))
story.append(Paragraph('Phase 2', ParagraphStyle('CT', fontName='NotoSansSC-Bold', fontSize=52, leading=60, textColor=HEADER_FILL)))
story.append(Spacer(1, 6))
story.append(Paragraph('Classroom Features', ParagraphStyle('CS', fontName='NotoSansSC', fontSize=32, leading=40, textColor=ACCENT)))
story.append(Spacer(1, 20))
story.append(HRFlowable(width='35%', thickness=2, color=ACCENT, spaceAfter=18))
story.append(Paragraph('Detailed Implementation Plan', ParagraphStyle('CD', fontName='NotoSansSC', fontSize=16, leading=22, textColor=TEXT_MUTED)))
story.append(Spacer(1, 8))
story.append(Paragraph('Authentication, Roles, Sessions, Collaboration, Video, Chat, Widgets, Recording, and Persistence', ParagraphStyle('CSub', fontName='NotoSansSC', fontSize=11, leading=17, textColor=TEXT_MUTED)))
story.append(Spacer(1, 60))
story.append(Paragraph('Superboard Virtual Classroom Series', ParagraphStyle('CFooter', fontName='NotoSansSC', fontSize=10, leading=15, textColor=TEXT_MUTED, alignment=TA_CENTER)))
story.append(Paragraph('August 2026', ParagraphStyle('CDate', fontName='NotoSansSC', fontSize=10, leading=15, textColor=TEXT_MUTED, alignment=TA_CENTER)))
story.append(PageBreak())

# ──────────────── TABLE OF CONTENTS ────────────────
story.append(heading1('Table of Contents'))
story.append(Spacer(1, 8))

toc_items = [
    ('1', 'Phase 2 Overview', ''),
    ('2', '2A: User Accounts & Authentication', ''),
    ('3', '2B: Role & Permission System', ''),
    ('4', '2C: Session Management', ''),
    ('5', '2D: Real-Time Collaboration', ''),
    ('6', '2E: Student Management', ''),
    ('7', '2F: Video & Audio (WebRTC)', ''),
    ('8', '2G: Text Chat', ''),
    ('9', '2H: Classroom Widgets', ''),
    ('10', '2I: Session Recording & Playback', ''),
    ('11', '2J: Persistent Boards', ''),
    ('12', 'Build Order & Timeline', ''),
    ('13', 'Technical Architecture', ''),
    ('14', 'Success Criteria & Acceptance Tests', ''),
]
for num, title, _ in toc_items:
    story.append(Paragraph(f'<b>{num}.</b>  {title}', ParagraphStyle('TOCItem', fontName='NotoSansSC', fontSize=11, leading=20, textColor=TEXT_PRIMARY, leftIndent=20)))
story.append(PageBreak())

# ──────────────── 1. PHASE 2 OVERVIEW ────────────────
story.append(heading1('1. Phase 2 Overview'))
story.append(Spacer(1, 4))
story.append(Paragraph('Phase 2 Detailed Plan', sSectionIntro))
story.append(body(
    'Phase 2 is the most feature-dense phase of the Superboard roadmap. It transforms the standalone whiteboard '
    '(delivered in Phase 1) into a fully functional virtual classroom where a tutor can teach a student in real-time. '
    'This phase covers ten major feature areas, each of which is detailed in its own section of this document. '
    'The estimated timeline is 12 weeks, organized into six two-week sprints. Each sprint delivers a functional '
    'increment that can be tested and validated before proceeding.'
))
story.append(body(
    'The guiding principle for Phase 2 is: "The whiteboard is the classroom, and everything else orbits around it." '
    'Every feature must integrate seamlessly with the existing whiteboard engine. Video, chat, widgets, and student '
    'management all exist as panels and overlays around the central canvas, never replacing it. The whiteboard remains '
    'the primary interaction surface at all times.'
))
story.append(body(
    'This document provides extensive technical detail for every feature in Phase 2, including data models, API '
    'contracts, UI specifications, edge cases, and acceptance criteria. It is intended to serve as the single source '
    'of truth for implementation, enabling any developer to pick up a feature and build it without ambiguity.'
))

story.append(Spacer(1, 8))
p2_scope = [
    ['Category', 'Feature Count', 'Priority', 'Sprint'],
    ['2A. Authentication', '9 features', 'Critical', 'Sprint 1-2'],
    ['2B. Roles & Permissions', '8 features', 'Critical', 'Sprint 1-2'],
    ['2C. Session Management', '12 features', 'Critical', 'Sprint 3-4'],
    ['2D. Real-Time Collaboration', '7 features', 'Critical', 'Sprint 3-4'],
    ['2E. Student Management', '8 features', 'High', 'Sprint 5-6'],
    ['2F. Video & Audio', '8 features', 'High', 'Sprint 5-6'],
    ['2G. Text Chat', '7 features', 'High', 'Sprint 5-6'],
    ['2H. Classroom Widgets', '10 widgets', 'Medium', 'Sprint 7-8'],
    ['2I. Session Recording', '9 features', 'Medium', 'Sprint 9-10'],
    ['2J. Persistent Boards', '9 features', 'Medium', 'Sprint 11-12'],
]
cw = [AVAILABLE_W * 0.30, AVAILABLE_W * 0.20, AVAILABLE_W * 0.20, AVAILABLE_W * 0.30]
story.append(make_table(p2_scope[0], p2_scope[1:], cw))
story.append(Spacer(1, 3))
story.append(Paragraph('Table 1: Phase 2 feature areas, counts, priorities, and sprint assignments', sCaption))

story.append(CondPageBreak(100))

# ──────────────── 2A. AUTHENTICATION ────────────────
story.append(heading1('2. 2A: User Accounts & Authentication'))
story.append(Spacer(1, 4))
story.append(Paragraph('Authentication & User Management', sSectionIntro))
story.append(body(
    'Authentication is the foundation of the classroom. Without user accounts, there are no roles, no sessions, no '
    'permissions, and no persistence. This section covers the complete authentication system, including email/password '
    'signup, OAuth providers (Google and Microsoft), profile management, role selection, and session token management. '
    'The authentication system must be secure, fast, and frictionless to minimize drop-off during onboarding.'
))

story.append(heading2('2A.1 Sign Up (Email/Password)'))
story.append(body(
    'New users can create an account with an email address and password. The signup form collects: email, password '
    '(minimum 8 characters, must include uppercase, lowercase, and number), display name (optional, can be set later), '
    'and account type selection (Tutor or Student). After form submission, the system sends a verification email with '
    'a time-limited link (expires in 24 hours). The user must verify before they can create or join sessions.'
))
story.append(body(
    'The backend uses bcrypt password hashing with a work factor of 12. Rate limiting prevents brute force attacks: '
    'maximum 5 signup attempts per email per hour, and maximum 10 login attempts per account per 15 minutes. '
    'The verification email is sent via a transactional email service (SendGrid or Resend) with a branded HTML template.'
))

story.append(heading2('2A.2 Sign Up (Google OAuth)'))
story.append(body(
    'One-click signup via Google OAuth 2.0. The OAuth flow redirects to Google\'s consent screen, returns an authorization '
    'code, which is exchanged server-side for access tokens. The system extracts the user\'s name, email, and profile '
    'picture from the Google ID token. If the email already exists in the database, the Google account is linked to the '
    'existing account. If not, a new account is created with a random secure password (user can set a password later '
    'if they want email/password login as well).'
))
story.append(note('Google OAuth is critical for reducing signup friction. Industry data shows OAuth signup converts '
    '30-50% higher than email/password alone.'))

story.append(heading2('2A.3 Sign Up (Microsoft OAuth)'))
story.append(body(
    'Microsoft OAuth 2.0 for institutional users (teachers and students with school or university Microsoft 365 accounts). '
    'The flow is identical to Google OAuth but uses Microsoft\'s identity provider. This is essential for Phase 5 '
    'enterprise adoption, as many schools and universities use Microsoft 365 exclusively. The implementation uses '
    'Microsoft Azure AD endpoints with OpenID Connect discovery.'
))

story.append(heading2('2A.4 Profile Page'))
story.append(body(
    'Each user has a profile page where they can manage their identity. The profile includes: avatar (uploaded image or '
    'initials-based auto-generated avatar), display name, bio (up to 280 characters), timezone (auto-detected from browser, '
    'manually adjustable), subject expertise (for tutors: selectable tags like Math, Physics, English, Music, etc.), '
    'and notification preferences. The profile page is accessible from the top-right user menu in the whiteboard interface.'
))

story.append(heading2('2A.5 Role Selection'))
story.append(body(
    'During signup, the user selects their primary role: "I am a Tutor" or "I am a Student." This determines the default '
    'experience and available features. Tutors see the session creation dashboard, student management, and analytics. '
    'Students see upcoming classes, session history, and their tutor\'s profile. The role can be changed later in profile '
    'settings. Users can have multiple roles (a tutor who also takes lessons from another tutor), but one is primary.'
))

story.append(heading2('2A.6 Password Reset'))
story.append(body(
    'Standard forgot password flow: user enters email, system sends a time-limited reset link (expires in 1 hour), '
    'user clicks link and sets a new password. The reset token is single-use and invalidated after password change. '
    'The new password must meet the same complexity requirements as signup. A confirmation email is sent after successful '
    'password reset. The old session tokens are invalidated to prevent session hijacking.'
))

story.append(heading2('2A.7 Email Verification'))
story.append(body(
    'Mandatory email verification before a user can create or join sessions. The verification email contains a unique '
    'token (cryptographically signed JWT with 24-hour expiry). Clicking the link marks the email as verified. '
    'Unverified users can access their profile page and settings, but cannot create sessions, join sessions, or access '
    'the whiteboard. A resend verification button is available on the login page and in the user\'s settings.'
))

story.append(heading2('2A.8 Session Tokens (JWT)'))
story.append(body(
    'Authentication uses JSON Web Tokens (JWT) with access/refresh token pair. Access tokens expire after 15 minutes. '
    'Refresh tokens expire after 7 days. The client automatically refreshes the access token when it expires. Refresh '
    'tokens are stored in an HTTP-only cookie to prevent XSS theft. The server maintains a token blacklist for '
    'immediate revocation (e.g., when a user logs out or changes their password). The JWT payload includes: user ID, '
    'role, email verification status, and session scope.'
))

story.append(heading2('2A.9 Account Types'))
story.append(body(
    'Four account types that determine feature access and pricing: Personal Tutor (individual educator, starts on free '
    'tier), Tutoring Agency (organization with multiple tutors, managed seats), School/Institution (educational '
    'institution with admin controls and compliance requirements), and Student (learner who joins sessions created by '
    'tutors). Each account type has different default settings, available features, and billing models. Account type '
    'is set during signup and can be upgraded later in Phase 3 billing flows.'
))

auth_summary = [
    ['Feature', 'Priority', 'Dependencies', 'Estimate'],
    ['Email/Password Signup', 'P0', 'Database schema', '3 days'],
    ['Google OAuth', 'P0', 'OAuth provider setup', '2 days'],
    ['Microsoft OAuth', 'P1', 'OAuth provider setup', '2 days'],
    ['Profile Page', 'P1', 'Auth system', '2 days'],
    ['Role Selection', 'P0', 'Signup flow', '1 day'],
    ['Password Reset', 'P0', 'Email service', '1 day'],
    ['Email Verification', 'P0', 'Email service', '1 day'],
    ['JWT Session Tokens', 'P0', 'Auth system', '2 days'],
    ['Account Types', 'P1', 'Database schema', '1 day'],
]
cw2 = [AVAILABLE_W * 0.30, AVAILABLE_W * 0.15, AVAILABLE_W * 0.30, AVAILABLE_W * 0.25]
story.append(Spacer(1, 8))
story.append(heading3('Authentication Feature Summary'))
story.append(make_table(auth_summary[0], auth_summary[1:], cw2))
story.append(Spacer(1, 3))
story.append(Paragraph('Table 2: Authentication features with priorities and estimates', sCaption))

story.append(CondPageBreak(100))

# ──────────────── 2B. ROLES & PERMISSIONS ────────────────
story.append(heading1('3. 2B: Role & Permission System'))
story.append(Spacer(1, 4))
story.append(Paragraph('Role-Based Access Control', sSectionIntro))
story.append(body(
    'The role and permission system is what differentiates Superboard from a generic collaborative whiteboard. In a '
    'tutoring context, the teacher needs control over what students can see, draw, and interact with. This system '
    'defines four base roles with granular permissions at the tool, zone, and object level. Permissions are enforced '
    'both client-side (for UI feedback) and server-side (for security).'
))

story.append(heading2('2B.1 Four Base Roles'))
story.append(body(
    '<b>Teacher</b>: Full control over the session. Can draw, erase, manage users, invite/remove students, lock the '
    'board, end the session, use all tools, and configure permissions. The teacher is the session owner and has '
    'unrestricted access to all features. Only one teacher per session (or co-teachers, see below).'
))
story.append(body(
    '<b>Student</b>: Can draw in allowed zones using permitted tools. Can raise hand, use chat (if enabled), interact '
    'with widgets (if enabled), and view the board. Cannot manage users, change session settings, or use teacher-only '
    'tools. Students are restricted to the areas and tools the teacher has enabled for them.'
))
story.append(body(
    '<b>Co-Teacher</b>: Has the same drawing and tool access as the teacher, but cannot delete the session or remove '
    'the host teacher. Co-teachers can invite students, manage permissions, use all tools, and control widgets. This '
    'role is designed for team teaching scenarios, teaching assistants, or guest lecturers.'
))
story.append(body(
    '<b>Observer</b>: View-only access. Cannot draw, type, chat, or interact with the board in any way. Designed for '
    'parents watching a tutoring session, administrators monitoring classroom quality, or guest auditors. Observers '
    'see the board, video feeds, and chat history but cannot participate.'
))

story.append(heading2('2B.2 Tool-Level Permissions'))
story.append(body(
    'The teacher can disable specific tools for students on a per-session basis. For example, in a math tutoring session, '
    'the teacher might disable the eraser (so students cannot erase the teacher\'s work), the image tool (to prevent '
    'inappropriate image uploads), and the laser pointer. The permission system checks the active tool against the '
    'user\'s role and the session\'s permission configuration before allowing any drawing action. If a student tries '
    'to use a disabled tool, the cursor shows a "not allowed" indicator and the action is blocked.'
))

story.append(heading2('2B.3 Zone Permissions'))
story.append(body(
    'The teacher can define rectangular zones on the canvas with different permission levels. For example, a "shared zone" '
    'where both teacher and students can draw, a "teacher-only zone" where only the teacher can write (e.g., the answer '
    'area), and a "student sandbox zone" where individual students have their own private drawing area. Zones are defined '
    'by selecting an area of the canvas and assigning a permission level. The permission boundary is visualized as a '
    'subtle dashed border on the canvas.'
))

story.append(heading2('2B.4 Object-Level Locking'))
story.append(body(
    'The teacher can lock individual objects on the canvas. Locked objects cannot be moved, resized, deleted, or modified '
    'by students. They appear with a small lock icon in the selection handles. The teacher can unlock them at any time. '
    'This is useful for protecting template content, reference materials, or completed examples that students should not '
    'alter. Object-level locking is enforced in real-time: if a student tries to select a locked object, the selection is '
    'denied and a brief tooltip explains why.'
))

story.append(heading2('2B.5 Role Switching During Session'))
story.append(body(
    'The teacher can promote or demote users during an active session. For example, calling on a student to demonstrate a '
    'solution: the teacher temporarily promotes the student to co-teacher role, they demonstrate on the board, then the '
    'teacher demotes them back to student. Role changes take effect immediately and are reflected in the UI (the promoted '
    'user\'s cursor changes color/style to indicate their elevated role). All role changes are logged in the session '
    'history for audit purposes.'
))

role_perm = [
    ['Permission', 'Teacher', 'Co-Teacher', 'Student', 'Observer'],
    ['Draw on canvas', 'Full', 'Full', 'Restricted', 'No'],
    ['Erase content', 'Full', 'Full', 'Restricted', 'No'],
    ['Manage users', 'Full', 'Limited', 'No', 'No'],
    ['End session', 'Yes', 'No', 'No', 'No'],
    ['Lock objects', 'Yes', 'Yes', 'No', 'No'],
    ['Use all tools', 'Yes', 'Yes', 'Configurable', 'No'],
    ['View board', 'Yes', 'Yes', 'Yes', 'Yes'],
    ['Chat', 'Yes', 'Yes', 'Configurable', 'No'],
    ['Raise hand', 'N/A', 'N/A', 'Yes', 'No'],
    ['Join via link', 'N/A', 'By invite', 'Yes', 'By invite'],
]
cw3 = [AVAILABLE_W * 0.22, AVAILABLE_W * 0.18, AVAILABLE_W * 0.18, AVAILABLE_W * 0.22, AVAILABLE_W * 0.20]
story.append(Spacer(1, 8))
story.append(heading3('Permission Matrix'))
story.append(make_table(role_perm[0], role_perm[1:], cw3))
story.append(Spacer(1, 3))
story.append(Paragraph('Table 3: Permission matrix by role', sCaption))

story.append(CondPageBreak(100))

# ──────────────── 2C. SESSION MANAGEMENT ────────────────
story.append(heading1('4. 2C: Session Management'))
story.append(Spacer(1, 4))
story.append(Paragraph('Session Lifecycle & Scheduling', sSectionIntro))
story.append(body(
    'Session management covers the complete lifecycle of a teaching session, from creation through scheduling, joining, '
    'active teaching, and archiving. A session is the core organizational unit of Superboard. Every teaching interaction '
    'happens within a session, which contains the whiteboard state, participant list, chat history, recording data, and '
    'all associated metadata. Sessions are created by tutors and joined by students via links or codes.'
))

story.append(heading2('2C.1 Create Session'))
story.append(body(
    'Teachers click "New Session" to create a session. The creation flow collects: session title (required, up to 100 '
    'characters), subject/topic (optional, from predefined list or custom), scheduled date/time (optional, can start '
    'immediately), duration (default 60 minutes, configurable up to 4 hours), maximum participants (default 10, up to '
    '50 on paid plans), and initial board template (blank, graph paper, lined, custom). Upon creation, the system '
    'generates a unique room ID (12-character alphanumeric), a 6-digit join code, and an invite URL. The teacher is '
    'redirected to the session\'s whiteboard immediately.'
))

story.append(heading2('2C.2 Session Dashboard'))
story.append(body(
    'The tutor\'s dashboard shows all their sessions organized into tabs: Upcoming (scheduled, not yet started), '
    'Active (currently running, with live participant count), Past (ended sessions, with links to recordings and board '
    'state), and Templates (saved board templates for reuse). Each session card shows: title, scheduled time, participant '
    'count, status badge (scheduled/active/ended/archived), and quick actions (start, join, copy link, delete). '
    'Filtering and search are available across all tabs.'
))

story.append(heading2('2C.3 Invite Link & Join Code'))
story.append(body(
    'Two methods for students to join a session. The invite link is a shareable URL: "superboard.com/join/abc123". '
    'Clicking it opens the session in the browser. If the student is not logged in, they are prompted to sign up or '
    'log in first. The 6-digit join code is a shorter alternative: the student enters the code on the Superboard homepage '
    'and is taken directly to the session. Both methods require the student to have a verified account. The join code '
    'expires when the session ends or after 24 hours, whichever comes first.'
))

story.append(heading2('2C.4 Waiting Room'))
story.append(body(
    'When a student joins a session before the teacher has started it, they enter a waiting room. The waiting room shows '
    'the session title and subject, a message saying "The teacher has not started yet," the student\'s position in the '
    'queue (if the session has a max participant limit), and a "Leave" button. The teacher sees a notification when '
    'students are waiting and can admit them individually or all at once. This prevents students from accessing the board '
    'before the teacher is ready.'
))

story.append(heading2('2C.5 Session Timer'))
story.append(body(
    'A configurable countdown timer displayed prominently in the session UI. The teacher sets the duration when creating '
    'the session or can start/modify it during the session. The timer shows remaining time in a top-bar widget, changes '
    'color as time runs low (green > yellow > red in the last 5 minutes), and emits an audio chime at 5-minute and '
    '1-minute warnings. When time expires, the session transitions to "time up" state: the board is still accessible '
    'but a prominent banner shows "Time is up!" and the teacher can choose to extend or end.'
))

story.append(heading2('2C.6 Schedule & Recurring Sessions'))
story.append(body(
    'Teachers can schedule sessions for a future date and time, with optional recurring patterns: daily, weekly (with day '
    'of week selection), bi-weekly, or monthly. Recurring sessions auto-create new sessions at the scheduled interval. '
    'Each recurring session gets its own unique room ID and join code, but inherits the template and settings from the '
    'parent session. Participants invited to a recurring session are automatically invited to all future occurrences. '
    'Email reminders are sent 24 hours, 1 hour, and 5 minutes before the scheduled start time.'
))

story.append(heading2('2C.7 Session Templates'))
story.append(body(
    'Teachers can save the current board state (all elements, styles, and layout) as a reusable template. Templates '
    'are accessible from the session creation flow and the templates tab in the dashboard. Built-in templates include: '
    'blank canvas, graph paper (with axis), lined paper, music staff (treble and bass clef), periodic table, fraction '
    'model, number line, coordinate plane, and Venn diagram. Custom templates are stored in the teacher\'s account and '
    'can be shared with other tutors (in Phase 4 marketplace).'
))

story.append(heading2('2C.8 Session Lifecycle States'))
story.append(body(
    'Every session transitions through a defined lifecycle: Draft (created but not yet scheduled or started), Scheduled '
    '(has a future start time, not yet started), Active (teacher has started the session, students can interact), Paused '
    '(teacher temporarily pauses, board is frozen), Time Up (timer expired, awaiting teacher decision), Ended (teacher '
    'explicitly ended the session), and Archived (moved to archive after a configurable retention period, e.g., 30 days). '
    'State transitions are logged with timestamps and actor (who triggered the transition). The session state determines '
    'what actions are available to participants.'
))

session_states = [
    ['State', 'Board Access', 'New Joins', 'Timer', 'Recording'],
    ['Draft', 'Teacher only', 'No', 'Not started', 'No'],
    ['Scheduled', 'Teacher only', 'Waiting room', 'Not started', 'No'],
    ['Active', 'All permitted', 'Yes (if slots)', 'Running', 'Available'],
    ['Paused', 'Frozen', 'No', 'Paused', 'Paused'],
    ['Time Up', 'Read-only', 'No', 'Stopped', 'Auto-stopped'],
    ['Ended', 'Read-only', 'No', 'Stopped', 'Stopped'],
    ['Archived', 'Read-only', 'No', 'N/A', 'Stored'],
]
cw4 = [AVAILABLE_W * 0.14, AVAILABLE_W * 0.20, AVAILABLE_W * 0.18, AVAILABLE_W * 0.20, AVAILABLE_W * 0.28]
story.append(Spacer(1, 8))
story.append(heading3('Session State Matrix'))
story.append(make_table(session_states[0], session_states[1:], cw4))
story.append(Spacer(1, 3))
story.append(Paragraph('Table 4: Behavior per session state', sCaption))

story.append(CondPageBreak(100))

# ──────────────── 2D. REAL-TIME COLLABORATION ────────────────
story.append(heading1('5. 2D: Real-Time Collaboration'))
story.append(Spacer(1, 4))
story.append(Paragraph('Multi-User Real-Time Sync', sSectionIntro))
story.append(body(
    'Real-time collaboration is the technical backbone of the virtual classroom. It enables multiple users to see each '
    'other\'s cursors, watch strokes appear as they are drawn, and interact with the board simultaneously without conflicts. '
    'This section covers the collaboration architecture, including cursor broadcasting, drawing sync, conflict resolution, '
    'user presence, latency compensation, reconnection handling, and state synchronization.'
))

story.append(heading2('2D.1 Multi-User Cursors'))
story.append(body(
    'Each connected user\'s cursor position is broadcast to all other participants in real-time. The cursor is rendered '
    'as a colored dot with a name label (e.g., a small tag showing "John" near the cursor). Cursor colors are assigned '
    'automatically from a predefined palette of high-contrast colors (red, blue, green, orange, purple, teal, pink, etc.) '
    'that are distinct from the background and from each other. The cursor position is throttled to 30 updates per second '
    'to avoid excessive network traffic while maintaining smooth visual movement.'
))

story.append(heading2('2D.2 Live Drawing Sync'))
story.append(body(
    'Every stroke, shape, text input, and element modification is broadcast to all participants in real-time. The '
    'sync architecture uses a server-authoritative model: the client sends drawing commands to the server, which validates '
    'and broadcasts them to all other clients. For freehand drawing, intermediate points are batched and sent at 60fps '
    'during active drawing, then the final element is committed when the pointer is released. For shapes and text, '
    'the intermediate state (during drag or typing) is broadcast as a preview, and the final state is committed on '
    'completion. This ensures all users see the same result at the same time.'
))

story.append(heading2('2D.3 Conflict Resolution'))
story.append(body(
    'When two users modify the same element simultaneously, the system uses a last-write-wins strategy with operation '
    'timestamping. Each modification carries a monotonically increasing Lamport timestamp (logical clock). If two '
    'modifications have the same timestamp, the modification from the user with the lower user ID wins (deterministic '
    'tiebreaker). For Phase 2, this simple strategy is sufficient. Phase 6 introduces CRDTs (Conflict-free Replicated '
    'Data Types) for more sophisticated conflict-free concurrent editing.'
))

story.append(heading2('2D.4 User Presence Indicators'))
story.append(body(
    'The participant list in the session sidebar shows real-time presence information for each user. Indicators include: '
    'online status (green dot for active, yellow for idle for more than 2 minutes, gray for disconnected), typing '
    'indicator ("Sarah is drawing..."), avatar in the participant list, and join/leave notifications ("John joined the '
    'session," "Emily left"). Presence data is maintained via WebSocket heartbeats every 5 seconds. If a heartbeat is '
    'missed for 15 seconds, the user is marked as idle. If missed for 60 seconds, the user is marked as disconnected '
    '(their cursor is removed but their past actions remain on the board).'
))

story.append(heading2('2D.5 Latency Compensation'))
story.append(body(
    'To make drawing feel instant even with network latency, the client uses optimistic updates: when the user draws a '
    'stroke, it appears on their local canvas immediately (without waiting for server confirmation). The stroke is also '
    'sent to the server in the background. If the server rejects the action (e.g., due to permission denial or conflict), '
    'the client rolls back the optimistic update and shows an error. For other users receiving the broadcast, the stroke '
    'appears with a slight delay proportional to their network latency. Target: sub-100ms perceived latency for the '
    'drawing user, sub-200ms for other participants in the same region.'
))

story.append(heading2('2D.6 Reconnection Handling'))
story.append(body(
    'Users who lose connection temporarily (network glitch, tab switch on mobile, brief WiFi dropout) are automatically '
    'reconnected when their connection is restored. During disconnection, the client queues outgoing actions locally and '
    'replays them upon reconnection. The server buffers missed broadcasts for up to 30 seconds. If the user reconnects '
    'within 30 seconds, they receive the buffered updates and their queued actions are sent. If reconnection takes longer '
    'than 30 seconds, the client performs a full state synchronization: it requests the current board state from the '
    'server and renders it, then resumes normal operation. The user sees a "Reconnecting..." overlay during this process.'
))

story.append(heading2('2D.7 Board State Sync'))
story.append(body(
    'When a user joins a session mid-way, they need the complete current board state. The server serializes the current '
    'elements array, camera position, and style state into a compact binary format (MessagePack or Protocol Buffers) '
    'and sends it to the joining client. The client deserializes and renders the full board. For sessions with embedded '
    'images (which can be large), the images are transferred separately via a CDN-backed URL, not embedded in the state '
    'payload. This keeps the initial sync fast even for boards with many images.'
))

story.append(CondPageBreak(100))

# ──────────────── 2E. STUDENT MANAGEMENT ────────────────
story.append(heading1('6. 2E: Student Management'))
story.append(Spacer(1, 4))
story.append(Paragraph('Student Roster & Controls', sSectionIntro))
story.append(body(
    'Student management gives the teacher control over who is in the session and how they can participate. This covers '
    'the student roster, invitation methods, removal and muting controls, spotlighting student work, sandbox areas for '
    'private practice, and group assignments. The student roster panel is visible to the teacher on the right side of the '
    'whiteboard (collapsible) and shows all participants with their status and available controls.'
))

story.append(heading2('2E.1 Student Roster'))
story.append(body(
    'A real-time list of all participants in the session. Each entry shows: avatar, display name, role badge (Teacher, '
    'Co-Teacher, Student, Observer), connection status (online/idle/disconnected), a "raised hand" indicator (hand icon '
    'if the student has raised their hand), and action buttons (for teacher: mute, spotlight, remove). The roster is '
    'sorted by role (teacher first, then co-teachers, then students, then observers) and within each role by join time. '
    'The roster updates in real-time as users join, leave, or change status.'
))

story.append(heading2('2E.2 Invite Methods'))
story.append(body(
    'Teachers can invite students via two methods. Email invite: the teacher enters the student\'s email address, and '
    'Superboard sends an invitation email with a direct join link. The email includes the session title, scheduled time, '
    'and a "Join Session" button. Link invite: the teacher copies the shareable join link or 6-digit code and sends it '
    'via any channel (WhatsApp, Slack, SMS, etc.). Both methods require the student to have a Superboard account. '
    'If they do not, the join link redirects to a signup page with the session auto-joined after registration.'
))

story.append(heading2('2E.3 Remove & Mute Controls'))
story.append(body(
    'The teacher can remove a student from the session at any time. Removal disconnects the student and shows them a '
    'message: "You have been removed from this session by the teacher." The student can rejoin only if the teacher '
    'sends a new invite. The teacher can also mute individual students: muting disables the student\'s ability to draw, '
    'type text, use any tool, or send chat messages. The student sees a "You have been muted by the teacher" banner. '
    'Muting is temporary for the current session and does not persist across sessions.'
))

story.append(heading2('2E.4 Spotlight Student Work'))
story.append(body(
    'The teacher can spotlight a student\'s work to draw attention to it. When spotlighted, the student\'s recent '
    'drawing or a selected element is brought to the center of the board for all participants to see. A subtle '
    'highlight animation indicates the spotlighted area. This is useful for reviewing student work, showing correct '
    'answers, or facilitating peer learning. The teacher can unspotlight at any time.'
))

story.append(heading2('2E.5 Student Sandbox'))
story.append(body(
    'A private drawing area where a student can work without other students seeing. The teacher creates sandbox zones '
    'on the canvas, assigns each student to a sandbox, and can peek into any student\'s sandbox at any time. The '
    'student sees only their own sandbox. When the teacher peeks, the sandbox content is displayed to the teacher in '
    'a floating panel (not broadcast to other students). This is useful for independent practice, assessments, and '
    'checking individual understanding without revealing answers to the class.'
))

story.append(CondPageBreak(100))

# ──────────────── 2F. VIDEO & AUDIO ────────────────
story.append(heading1('7. 2F: Video & Audio (WebRTC)'))
story.append(Spacer(1, 4))
story.append(Paragraph('Real-Time Video Conferencing', sSectionIntro))
story.append(body(
    'Video and audio conferencing transforms the whiteboard from an asynchronous collaboration tool into a live '
    'teaching environment. Superboard uses WebRTC for peer-to-peer video/audio with a selective forwarding unit (SFU) '
    'for sessions with more than 2 participants. The video UI is designed to complement, not compete with, the whiteboard. '
    'Video feeds are compact and positioned around the edges of the screen, with the whiteboard always occupying the '
    'majority of the viewport.'
))

story.append(heading2('2F.1 Teacher Video'))
story.append(body(
    'The teacher\'s webcam feed is displayed as a larger video tile, positioned in the top-right corner of the screen '
    '(or in a collapsible side panel). The video tile is draggable and resizable within the Superboard UI so the teacher '
    'can position it wherever it does not obstruct the board content. The teacher can toggle their camera on/off and '
    'mute/unmute their microphone. Audio from the teacher is always given priority in the audio mixing to ensure clarity.'
))

story.append(heading2('2F.2 Student Video Grid'))
story.append(body(
    'Student webcam feeds are displayed as smaller thumbnail tiles in a horizontal strip at the bottom of the screen '
    '(similar to Zoom\'s gallery layout) or in a collapsible side panel. The strip shows up to 6 student video tiles '
    'at a time; if there are more students, the strip scrolls horizontally. Each tile shows the student\'s avatar when '
    'the camera is off and their video feed when it is on. Clicking a student\'s tile can pin it to a larger view.'
))

story.append(heading2('2F.3 Audio Controls'))
story.append(body(
    'Each participant has independent audio controls: mute/unmute mic toggle, push-to-talk option (audio is only '
    'transmitted while a key is held down), and volume control per participant (teacher can adjust individual student '
    'volume levels). The teacher has a "Mute All" button that mutes all students at once. In teacher-only audio mode, '
    'all students are muted by default and must request permission to speak (via raise hand). Visual indicators show '
    'who is currently speaking (highlighted border, audio level bar).'
))

story.append(heading2('2F.4 Screen Sharing'))
story.append(body(
    'The teacher can share their entire screen, a specific application window, or a browser tab. Screen share is '
    'displayed as a large overlay on the whiteboard (replacing the board view temporarily) or as a picture-in-picture '
    'window that floats above the board. Students can see the screen share and the whiteboard simultaneously. Screen '
    'share is transmitted via WebRTC with adaptive bitrate to maintain quality on varying network conditions. '
    'Only the teacher can share their screen (students cannot, unless the teacher grants permission).'
))

story.append(heading2('2F.5 Low-Bandwidth Mode'))
story.append(body(
    'When network conditions are poor (detected via WebRTC stats API: packet loss > 5%, RTT > 300ms, or available '
    'bandwidth < 500kbps), Superboard automatically enters low-bandwidth mode. In this mode: video feeds are disabled '
    '(avatars shown instead), audio bitrate is reduced to 32kbps (from 128kbps), whiteboard sync frequency is reduced '
    'to 10fps (from 60fps), and non-essential data (cursor position, typing indicators) is throttled. A banner informs '
    'all participants that low-bandwidth mode is active. The system automatically returns to normal mode when conditions '
    'improve.'
))

story.append(CondPageBreak(100))

# ──────────────── 2G. TEXT CHAT ────────────────
story.append(heading1('8. 2G: Text Chat'))
story.append(Spacer(1, 4))
story.append(Paragraph('In-Session Messaging', sSectionIntro))
story.append(body(
    'Text chat provides a parallel communication channel alongside the whiteboard and video. It is essential for '
    'questions that do not require drawing, sharing links and resources, and communication when audio is not available '
    '(e.g., a student in a quiet environment). The chat panel is a collapsible sidebar on the right side of the screen, '
    'visible alongside the whiteboard and video feeds.'
))

story.append(heading2('2G.1 Session Chat'))
story.append(body(
    'Real-time text chat visible to all participants. Messages appear in chronological order with sender name, avatar, '
    'and timestamp. The chat supports plain text, emoji (via native emoji picker), and file attachments (images, '
    'PDFs, documents up to 10MB each). Messages are transmitted via the same WebSocket connection used for whiteboard '
    'sync, ensuring minimal latency. The chat panel shows an unread message count badge when collapsed, and auto-scrolls '
    'to the latest message when open (unless the user has manually scrolled up).'
))

story.append(heading2('2G.2 Private Messages'))
story.append(body(
    'The teacher can send private messages to individual students. Private messages appear only to the sender and '
    'recipient, indicated by a "Private" badge. This is useful for giving individual feedback, answering sensitive '
    'questions, or providing hints without revealing them to the class. Students cannot initiate private messages to '
    'other students (to prevent distraction), but can send private messages to the teacher (e.g., to ask a question '
    'they are embarrassed to ask publicly).'
))

story.append(heading2('2G.3 Chat Permissions'))
story.append(body(
    'The teacher can enable or disable chat for students during the session. When chat is disabled, students see a '
    '"Chat is disabled by the teacher" message in the chat panel. The teacher can also set chat to "raise hand only" '
    'mode, where students can only send messages if they have been called on. This helps maintain focus during '
    'lecture-style teaching segments. Chat permissions can be toggled at any time during the session.'
))

story.append(CondPageBreak(100))

# ──────────────── 2H. CLASSROOM WIDGETS ────────────────
story.append(heading1('9. 2H: Classroom Widgets'))
story.append(Spacer(1, 4))
story.append(Paragraph('Interactive Teaching Widgets', sSectionIntro))
story.append(body(
    'Classroom widgets are small, purpose-built interactive tools that float on top of the whiteboard. They are '
    'designed for specific teaching scenarios and can be opened, closed, moved, and resized by the teacher. Widgets '
    'are the precursor to the Phase 4 plugin system: they demonstrate the concept of extensible tools on the whiteboard '
    'and inform the SDK design. All widgets are teacher-controlled by default; students can only interact with widgets '
    'if the teacher enables student interaction for that specific widget.'
))

widgets = [
    ('Raise Hand', 'Students click a "Raise Hand" button (in their toolbar or via keyboard shortcut). The teacher sees '
     'a queue in a floating panel ordered by time raised. The teacher can acknowledge (removes from queue, shows '
     'acknowledgment animation to student) or dismiss. Multiple students can raise hands simultaneously. The widget '
     'plays a subtle notification sound when a new hand is raised.'),
    ('Countdown Timer', 'Configurable timer with hours, minutes, and seconds input. Start, pause, reset controls. '
     'Large visual display with color transitions (green to yellow to red). Audio chime at configurable warning '
     'thresholds (e.g., 5 minutes, 1 minute, 10 seconds). Full-screen overlay option for timed assessments.'),
    ('Quick Polls', 'Create multiple-choice polls with 2-6 options in real-time. Students vote via clicking an '
     'option. Live results displayed as a bar chart that updates in real-time. Teacher can close the poll and reveal '
     'results. Results are saved with the session for post-class review.'),
    ('Thumbs Up/Down', 'Instant feedback widget. Students click thumbs up or thumbs down. A counter shows the tally. '
     'Used for quick comprehension checks: "Does everyone understand this concept?" The widget resets automatically '
     'after a configurable timeout (default 30 seconds) or manually by the teacher.'),
    ('Attention Check', 'Teacher triggers a prompt: "Are you following?" with Yes/No buttons. Students must '
     'respond within a configurable time limit (default 15 seconds). Non-responders are flagged in the teacher\'s '
     'roster. Response rate is displayed as a percentage. Useful for ensuring engagement in online settings.'),
    ('Noise Meter', 'Uses the student\'s microphone to measure ambient noise level. Displays a visual meter (green/yellow/red) '
     'on the teacher\'s dashboard. Useful for classroom management in group settings or when students are in a noisy '
     'environment. Only the teacher sees the noise meter; students see a "Your microphone is being monitored for '
     'noise level" notification.'),
    ('Stopwatch', 'Simple stopwatch for timing activities, exercises, and tests. Start, stop, lap (record intermediate '
     'times), and reset. Display shows elapsed time in MM:SS.ms format. Can be displayed full-screen for student viewing.'),
    ('Random Student Picker', 'Teacher clicks "Pick" and the widget randomly selects a student from the roster. '
     'Animated selection effect (spinning names) for engagement. Ensures random cold-calling for participation. '
     'Optional: exclude students who have already been picked (turns it into a no-repeat picker).'),
    ('Score/Points', 'Teacher awards points to students for correct answers, good participation, or achievements. '
     'Points are displayed next to each student\'s name in the roster and in a leaderboard widget. Optional '
     'negative points for incorrect answers. Points reset per session or accumulate across sessions (configurable).'),
    ('Progress Bar', 'Visual indicator of lesson progress. Teacher sets total segments (e.g., 5 topics) and advances '
     'the bar as each is completed. Students see how far along the lesson is. Helps set expectations and manage time. '
     'Segments can be labeled (e.g., "Warm-up," "Main Topic," "Practice," "Review," "Homework").'),
]

for title, desc in widgets:
    story.append(heading2(f'Widget: {title}'))
    story.append(body(desc))

story.append(CondPageBreak(100))

# ──────────────── 2I. RECORDING ────────────────
story.append(heading1('10. 2I: Session Recording & Playback'))
story.append(Spacer(1, 4))
story.append(Paragraph('Capture, Store, and Replay', sSectionIntro))
story.append(body(
    'Session recording captures everything that happens during a teaching session: whiteboard drawing actions, audio, '
    'and teacher screen share. Recordings are stored in the cloud and can be played back by the teacher and (if the '
    'teacher allows) by students. Recordings are one of the most valuable features for tutoring, as they allow '
    'students to review material after the session and enable teachers to reflect on their teaching.'
))

story.append(heading2('2I.1 Recording Architecture'))
story.append(body(
    'The recording system captures three streams in parallel: (1) Whiteboard events: every drawing action, element '
    'modification, camera change, and tool switch is logged with a timestamp in an event log. (2) Audio: the teacher\'s '
    'microphone audio is recorded via WebRTC and encoded as Opus in a WebM container. (3) Screen share: if the teacher '
    'is sharing their screen, it is recorded as a separate video stream using MediaRecorder API with H.264 encoding. '
    'The three streams are synchronized by a shared clock (server-provided NTP timestamp). On playback, the three streams '
    'are merged into a single timeline.'
))

story.append(heading2('2I.2 Playback Controls'))
story.append(body(
    'Recordings are played back in a dedicated player UI that reconstructs the session. Controls include: play/pause, '
    'rewind 10 seconds, fast forward 10 seconds, timeline scrubber (drag to jump to any point), speed control (0.5x, '
    '0.75x, 1x, 1.25x, 1.5x, 2x), and fullscreen mode. During playback, the whiteboard reconstructs the drawing '
    'events in real-time, so the viewer sees strokes appearing as they were originally drawn, creating an immersive '
    'replay experience. Audio plays in sync with the drawing events.'
))

story.append(heading2('2I.3 Storage & Sharing'))
story.append(body(
    'Recordings are stored in cloud storage (AWS S3 or equivalent) with server-side encryption. Each recording includes '
    'the event log, audio file, and optional screen share video. Storage quota depends on the subscription plan: Free '
    'tier has no recording, Tutor plan has 5GB storage (~10 hours of recording), Academy plan has 50GB, Enterprise '
    'is unlimited. The teacher can generate a shareable link for each recording, set an expiry date, and optionally '
    'require a password. Students who missed a session can watch the recording to catch up.'
))

story.append(CondPageBreak(100))

# ──────────────── 2J. PERSISTENT BOARDS ────────────────
story.append(heading1('11. 2J: Persistent Boards'))
story.append(Spacer(1, 4))
story.append(Paragraph('Save, Load, Templates, and Export', sSectionIntro))
story.append(body(
    'Persistent boards ensure that the teacher\'s work is never lost. Boards are automatically saved during sessions, '
    'can be manually saved with custom names, loaded for reuse, exported in multiple formats, and organized into '
    'templates. This section covers the auto-save mechanism, the save/load UI, board templates, version history, '
    'and export options.'
))

story.append(heading2('2J.1 Auto-Save'))
story.append(body(
    'The board state is automatically saved every 5 seconds during an active session and on every significant action '
    '(element added, deleted, or modified). Auto-save uses a debounced mechanism: after the user stops drawing for '
    '2 seconds, the current state is serialized and sent to the server. The serialized state includes all elements, '
    'camera position, page list, and style settings. Auto-save is indicated by a small pulsing dot in the top bar '
    '(green = saved, yellow = saving, red = save failed). If auto-save fails (network error), the client queues '
    'the save and retries every 10 seconds until successful.'
))

story.append(heading2('2J.2 Board Templates'))
story.append(body(
    'Built-in templates provide pre-configured board layouts for common teaching scenarios. Templates include: Blank '
    '(empty canvas), Graph Paper (with labeled axes and grid), Lined Paper (horizontal lines for handwriting), Grid '
    '(square grid for geometry and design), Music Staff (treble and bass clef staff lines), Coordinate Plane (four '
     'quadrants with labels), Venn Diagram (two and three circle options), Fraction Models (circle and bar fraction '
    'templates), Number Line (numbered line with tick marks), and Periodic Table (full periodic table layout). Teachers '
    'can save any board state as a custom template for reuse across sessions.'
))

story.append(heading2('2J.3 Export Options'))
story.append(body(
    'Boards can be exported in multiple formats for offline use, sharing, and archival. PNG export at 2x resolution '
    '(for high-quality printing and sharing). PDF export with page-by-page rendering for multi-page boards. SVG export '
    'for vector editing in external tools. JSON export for backup and import (the complete board state as a JSON file '
    'that can be re-imported into Superboard). All exports are generated client-side to minimize server load.'
))

story.append(CondPageBreak(100))

# ──────────────── BUILD ORDER ────────────────
story.append(heading1('12. Build Order & Timeline'))
story.append(Spacer(1, 4))
story.append(body(
    'Phase 2 is organized into six two-week sprints. Each sprint delivers a functional increment that can be tested '
    'and validated independently. The build order is designed to minimize dependencies and maximize early value: '
    'authentication and roles first (foundation), then sessions and collaboration (core classroom), then communication '
    'features (video, chat), then interactive features (widgets), and finally persistence and recording (polish).'
))

sprint_data = [
    ['Sprint', 'Weeks', 'Focus Areas', 'Deliverables'],
    ['Sprint 1', '1-2', '2A Auth + 2B Roles', 'User signup, login, roles, permissions system'],
    ['Sprint 2', '3-4', '2C Sessions + 2D Collab', 'Session CRUD, invite links, real-time sync, cursors'],
    ['Sprint 3', '5-6', '2E Students + 2G Chat', 'Roster, invite, mute, text chat, private messages'],
    ['Sprint 4', '7-8', '2F Video + 2H Widgets', 'WebRTC video/audio, 10 classroom widgets'],
    ['Sprint 5', '9-10', '2I Recording', 'Session recording, playback, sharing, storage'],
    ['Sprint 6', '11-12', '2J Persistence', 'Auto-save, templates, export, version history'],
]
cw5 = [AVAILABLE_W * 0.12, AVAILABLE_W * 0.10, AVAILABLE_W * 0.30, AVAILABLE_W * 0.48]
story.append(Spacer(1, 6))
story.append(make_table(sprint_data[0], sprint_data[1:], cw5))
story.append(Spacer(1, 3))
story.append(Paragraph('Table 5: Sprint plan for Phase 2', sCaption))

story.append(CondPageBreak(100))

# ──────────────── TECH ARCHITECTURE ────────────────
story.append(heading1('13. Technical Architecture'))
story.append(Spacer(1, 4))
story.append(body(
    'Phase 2 requires significant backend infrastructure that does not exist in Phase 1. The architecture must support '
    'real-time collaboration (WebSockets), user authentication (JWT), data persistence (database), file storage '
    '(recordings, images), and video conferencing (WebRTC/SFU). The recommended technology stack leverages the existing '
    'Next.js frontend and adds complementary backend services.'
))

story.append(heading2('Backend Stack'))
story.append(bullet('Next.js API Routes for REST endpoints (auth, session management, CRUD operations)'))
story.append(bullet('Supabase for PostgreSQL database, authentication, and real-time subscriptions'))
story.append(bullet('WebSocket server (Supabase Realtime or custom Socket.io) for collaboration sync'))
story.append(bullet('LiveKit or Jitsi for WebRTC video/audio/SFU (managed service, avoids self-hosting complexity)'))
story.append(bullet('AWS S3 or Supabase Storage for file uploads (images, recordings, exports)'))
story.append(bullet('Redis for rate limiting, session state caching, and presence tracking'))
story.append(bullet('SendGrid or Resend for transactional emails (verification, reminders, notifications)'))

story.append(heading2('Database Schema'))
story.append(body(
    'The database schema extends the existing Phase 1 architecture with user, session, and collaboration tables. Key '
    'tables include: users (id, email, display_name, role, avatar_url, created_at), sessions (id, teacher_id, title, '
    'status, scheduled_at, room_code, settings_json, created_at), session_participants (session_id, user_id, role, '
    'joined_at, permissions_json), elements (id, session_id, page_index, type, props_json, created_at, updated_at), '
    'messages (id, session_id, sender_id, content, type, created_at), recordings (id, session_id, storage_url, duration, '
    'created_at), and templates (id, owner_id, title, elements_json, is_public, created_at).'
))

story.append(heading2('State Management Evolution'))
story.append(body(
    'The Zustand store from Phase 1 must evolve to support real-time collaboration. The key changes include: separating '
    'local UI state (tool selection, dark mode) from shared board state (elements, camera), adding optimistic update '
    'patterns (local changes applied immediately, server confirms or rolls back), implementing a presence system (track '
    'connected users, cursor positions), and adding a sync layer that receives remote changes and merges them into the '
    'local state. The store remains a single source of truth on the client but now has a bi-directional sync with the '
    'server.'
))

story.append(CondPageBreak(100))

# ──────────────── SUCCESS CRITERIA ────────────────
story.append(heading1('14. Success Criteria & Acceptance Tests'))
story.append(Spacer(1, 4))
story.append(body(
    'Phase 2 is complete when the following acceptance criteria are met. Each criterion is testable and represents '
    'a real user scenario that must work reliably before Phase 3 begins.'
))

criteria = [
    ['ID', 'Criterion', 'Priority'],
    ['SC-01', 'A tutor can create an account, log in, and create a session within 2 minutes', 'P0'],
    ['SC-02', 'A student can join a session via invite link and see the whiteboard within 5 seconds', 'P0'],
    ['SC-03', 'Two users can draw on the board simultaneously with sub-200ms latency', 'P0'],
    ['SC-04', 'The teacher can mute a student and verify they cannot draw or send chat', 'P0'],
    ['SC-05', 'Video/audio works with 2 participants with sub-500ms audio latency', 'P1'],
    ['SC-06', 'A student can raise hand and the teacher sees it within 1 second', 'P1'],
    ['SC-07', 'The teacher can create a poll and students can vote in real-time', 'P1'],
    ['SC-08', 'A session can be recorded and played back with synchronized audio and drawing', 'P1'],
    ['SC-09', 'The board auto-saves every 5 seconds and survives page refresh without data loss', 'P0'],
    ['SC-10', 'A disconnected user can reconnect and resume without losing their unsent actions', 'P1'],
    ['SC-11', 'The teacher can export the board as PNG, PDF, and SVG', 'P2'],
    ['SC-12', 'Session templates can be saved and loaded across different sessions', 'P2'],
]
cw6 = [AVAILABLE_W * 0.10, AVAILABLE_W * 0.72, AVAILABLE_W * 0.18]
story.append(Spacer(1, 6))
story.append(make_table(criteria[0], criteria[1:], cw6))
story.append(Spacer(1, 3))
story.append(Paragraph('Table 6: Phase 2 acceptance criteria', sCaption))

story.append(Spacer(1, 12))
story.append(body(
    'Each acceptance criterion must pass manual testing, automated E2E testing (where applicable), and be validated '
    'by at least one real tutor user before Phase 2 is considered complete. Priority P0 criteria are blocking: Phase 2 '
    'cannot be considered complete until all P0 criteria pass. P1 criteria should pass but can be deferred to a Phase 2.1 '
    'patch release if necessary. P2 criteria are nice-to-have and can be moved to Phase 3 if timeline pressure requires.'
))

# ──────────────── BUILD ────────────────
doc.build(story, onFirstPage=on_first_page, onLaterPages=on_later_pages)
print(f'PDF generated: {output_path}')
