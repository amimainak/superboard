# MASTER TECHNICAL BLUEPRINT: K-12 AI SUPERBOARD
**Document Version:** 4.0 FINAL (Enterprise-Ready Lock)
**Target Audience:** Lead Development Team / CTO
**Core Directive:** AI ASSISTS THE TEACHER, NOT THE STUDENT. The AI never gives the student the final answer. Students never create accounts (Zero-Friction). The UI must feel like a native, premium B2B product, not a clunky educational tool.

---

## 1. SYSTEM ARCHITECTURE & STRICT TECH STACK
Do not substitute these technologies. They are chosen to avoid rebuilding complex subsystems and to guarantee high margins.

*   **Frontend:** Next.js (App Router) + React + TypeScript
*   **UI/Styling:** Tailwind CSS + Shadcn UI (utilizing CSS variables for dynamic theming).
*   **Whiteboard Engine:** `@tldraw/tldraw` (CRITICAL: Do not build custom HTML5 canvas. Use Tldraw for vector math, infinite zoom, multi-page, and laser pointer).
*   **Real-Time Sync (Drawing/Cursors):** Yjs + Hocuspocus Server (Deployed via Serverless functions to scale to zero when not in use).
*   **Audio/Video & Recordings:** LiveKit (CRITICAL: Must be **Self-Hosted** on a dedicated VPS like Hetzner/DigitalOcean. Do NOT use LiveKit Cloud).
*   **Backend/Database/Auth:** Supabase (PostgreSQL, Row Level Security, Storage).
*   **Payments:** Stripe (Checkout + Webhooks).
*   **AI Brain (Split Tier):** 
    *   *Text Tasks (Quizzes, Worksheets, Summaries):* **Claude 3 Haiku** (`claude-3-haiku-20240307`) for 10x cost savings.
    *   *Vision Tasks (Graphing, Shape Perfection):* **Claude 3.5 Sonnet** (`claude-3-5-sonnet-20241022`) for high accuracy.
*   **Math OCR (Premium):** Mathpix API.
*   **Math Rendering:** KaTeX.
*   **Graphing Engine (Premium):** GeoGebra API (JavaScript API, not iframe).
*   **Anti-Fraud:** FingerprintJS (Open Source).

---

## 2. USER FLOWS & STATE MACHINES

### 2.1. The Tutor Flow (Authenticated via Supabase)
1. Logs in to Dashboard (views Templates, Saved Boards, Billing, Agency Admin).
2. Clicks **"New Lesson"** -> Selects **Subject** (Math, Science, Language, General) -> Selects **Branding** (Agency tier only).
3. System generates Room ID. Tutor is taken to Whiteboard. The Toolbar loads the specific Subject Toolkit based on the selection.

### 2.2. The Student Flow (UNAUTHENTICATED / ZERO-FRICTION)
1. Clicks link -> **Branded Waiting Room** (Features Agency logo, brand colors, and a mini scratch-pad).
2. Once tutor's Yjs presence is detected, student transitions to Main Board.
3. **Name Entry Modal:** Must type name and pick cursor color.
4. **Permissions:** Can draw/interact with Subject Tools. **CANNOT:** Change pages, clear board, upload files, access AI panel, or see Quiz Answer Keys.

### 2.3. Session Termination
1. Tutor clicks "End Lesson". 
2. WebSockets severed. Room `is_active = false`. Link dies forever.

---

## 3. THE OPTIMIZED 3-TIER MONETIZATION MODEL
All gating logic MUST be executed server-side (Next.js API routes).

### TIER 1: FREE (The Hook)
*   **Video/Audio:** 120 minutes per week (Resets Monday 00:00 UTC. Never cuts active calls, blocks next initiation).
*   **AI Actions:** 10 Credits per week (Resets Monday).
*   **Unlocked:** Basic Subject Toolkit shapes/backgrounds.
*   **Locked:** Save/Load, Downloads, Uploads, GeoGebra, Mathpix, Recordings, All AI features.

### TIER 2: PRO TUTOR - $15/month (or $120/year)
*   **Video/Audio:** Unlimited.
*   **AI Actions:** 100 Credits per month (Resets on billing cycle. Text AI uses Haiku, Vision AI uses Sonnet).
*   **Unlocked:** PDF/JPEG Uploads, Save/Load, Templates, Download PDF, GeoGebra, Shape Perfect, Handwriting-to-Math, All AI Subject Tools.
*   **Recordings:** 2 Free Session Recordings per month.

### TIER 3: AGENCY / CENTER - $39/month
*   **Everything in Pro.**
*   **Unlimited Session Recordings.**
*   **Deep White-Labeling:** Custom URL routing, Dynamic CSS theming, Branded Headers, Branded Waiting Rooms, Branded PDF exports.
*   **Admin Dashboard:** Center owner can view aggregate usage/students of sub-tutors.

**UI Rule - The Progress Bar:** Free/Pro users see a sleek bar at the bottom: `AI Credits: 8/10 used`. Turns into an "Upgrade" button at limit.

---

## 4. DETAILED FEATURE SPECIFICATIONS

### 4.1. Performance Mandates (Mandatory)
*   **Lazy Loading:** GeoGebra, KaTeX, and AI components MUST use `next/dynamic` with `ssr: false`. Initial whiteboard load must be < 1.5 seconds.
*   **Vision Payload Compression (CRITICAL):** Before sending a canvas snapshot to Claude for Graphing/Shape Perfection, the frontend MUST use the browser's native Canvas API to crop *only* the bounding box of the selected area, compress to 800px width, 50% JPEG quality. (Reduces API latency from 4s to <1s).
*   **Optimistic UI:** When AI is processing, instantly grey out the target area and show a micro-spinner. Do not freeze the board.

### 4.2. Subject-Specific Toolkits Architecture
The `Toolbar.tsx` component reads the `subject` state from the `rooms` table. It renders three columns: Core Tools (always visible), Subject Shapes/Assets, and Subject AI Tools.

#### TOOLKIT A: MATHEMATICS (`subject === 'MATH'`)
*   **Native Canvas (Free):** Toggle backgrounds (Blank, Dot Grid, Isometric, Standard Graph Paper, Elementary Lined Paper). Basic Geometry Shapes. Ruler/Protractor SVG overlays.
*   **GeoGebra Integration (Premium):** Slides out from the right. Plot points, lines, parabolas, trig functions. Interactive parameter sliders (e.g., `y = ax^2 + bx + c`).
*   **AI Math Tools (Premium):** Handwriting-to-LaTeX (Mathpix + KaTeX). AI Shape Perfection. AI Graph Plotter (Handwriting -> GeoGebra). AI Worksheet Generator (e.g., "3rd-grade fractions coloring worksheet").

#### TOOLKIT B: SCIENCE (`subject === 'SCIENCE'`)
*   **Native Canvas (Free):** Pre-colored vector arrows (Red=velocity, Blue=force). Drag-and-drop Lab Diagram SVGs (Beakers, Circuits). Graph Paper background.
*   **GeoGebra Integration (Premium):** Used for Physics: plotting distance-time/velocity-time graphs.
*   **AI Science Tools (Premium):** AI Diagram Generator ("Draw a plant cell"). AI Chemical Equation Balancer. AI Lab Summary (Hypothesis/Method/Data/Conclusion notes).

#### TOOLKIT C: ENGLISH & LANGUAGE (`subject === 'LANGUAGE'`)
*   **Native Canvas (Free):** 4 distinct translucent highlighters. Annotation tools (brackets, underlines). Mind Map connected nodes. Backgrounds (Wide/College ruled, Elementary dashed-handwriting lines).
*   **AI Language Tools (Premium):** AI Grammar Highlighter (highlights errors, doesn't fix). AI Vocab Quiz. AI Essay Outliner. AI Phonics Helper (breaks words into syllables).

#### TOOLKIT D: GENERAL / OTHER (`subject === 'GENERAL'`)
*   **Native Canvas (Free):** Standard tools. Map overlays. Timeline Builder axis tool.
*   **AI General Tools (Premium):** AI Timeline Generator. Concept Summarizer.

### 4.3. AI Control Panel (Premium)
Sidebar modal with toggle switches for all AI features. If a feature is toggled OFF by the tutor, it is completely hidden from the main toolbar.

### 4.4. AI Worksheets vs. Interactive Quizzes (Premium)
*   **Worksheets:** AI generates grid -> Places on *new blank page*. Printable via "Download PDF".
*   **Interactive Quizzes:** AI generates questions -> Places as interactive sticky notes on *current page*. 
*   **CRITICAL QUIZ RULE:** AI returns `public_questions` (canvas) and `private_answer_key` (tutor-only modal).

### 4.5. Classroom Management
*   **Focus Mode:** Tutor clicks "Focus". Broadcasts command locking student's viewport/pan/zoom to match tutor.
*   **Laser Pointer:** Expose Tldraw's built-in laser tool prominently. 

### 4.6. Native Picture-in-Picture (PiP) Audio/Video
*   **CRITICAL UI LAYOUT:** The audio/video MUST be a native, floating, resizable panel *inside* the whiteboard UI (built using `@livekit/components-react`). It must NOT open a new browser tab, and it must NOT be a static, locked sidebar.
*   **Behavior:** It should behave like a Picture-in-Picture window. The tutor must be able to drag it to any corner of the screen (default: bottom-right) so it never obstructs the canvas drawing area.
*   **Always Visible:** The video grid (tutor + student webcams) and a mute/deafen controls bar must remain visible at all times while drawing, ensuring the tutor never leaves the whiteboard context to look at the student.
*   **Recordings:** A "Record" button inside the video control bar triggers LiveKit E2EE, saves MP4 to Supabase Storage.

### 4.7. Deep White-Labeling (Agency Tier)
To justify the B2B price point, the app must feel like the agency built it themselves. 
*   **Dynamic CSS Theming:** The Agency tutor selects a "Brand Color" in their dashboard. This hex code is saved to the DB. When the room loads, the frontend injects this hex code into Tailwind/CSS variables. This dynamically changes the color of the toolbar, buttons, active states, and AI panels to match the agency.
*   **Branded Header Bar:** The default app logo/text in the top left corner must be completely replaced by the Agency's uploaded Logo and custom text (e.g., "Smith Tutoring Center").
*   **Branded Waiting Room:** The student waiting room must feature the Agency's logo front-and-center, their brand colors as the background, and customized text.
*   **Branded PDF Exports:** When downloading the board as a PDF, the file must have a header/footer featuring the Agency's logo, student name, and date.
*   **Custom Domain Routing:** If the agency uses `classroom.smithtutoring.com`, the Next.js backend must sniff the host header, lookup the agency in the DB, and apply their branding dynamically without the user ever seeing the main app URL.

---

## 5. DATABASE SCHEMA (Supabase PostgreSQL)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id                String    @id @default(uuid())
  email             String    @unique
  stripeCustomerId  String?   @unique
  tier              String    @default("FREE") // "FREE", "PRO", "AGENCY"
  fingerprintHash   String?   
  // Agency Features
  customDomain      String?   @unique 
  brandingLogoUrl   String?   
  brandingColor     String?   // Hex code e.g., #FF5733
  parentAgencyId    String?   // If this user is a sub-tutor
  createdAt         DateTime  @default(now())
  rooms             Room[]
  usageLogs         UsageLog[]
}

model UsageLog {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  periodStartDate DateTime // Monday for Free, Billing Day for Pro
  videoMinutesUsed Int     @default(0)
  aiCreditsUsed   Int      @default(0)
  recordingsUsed  Int      @default(0)

  @@unique([userId, periodStartDate]) 
}

model Room {
  id            String   @id @default(uuid())
  tutorId       String
  tutor         User     @relation(fields: [tutorId], references: [id], onDelete: Cascade)
  subject       String   @default("GENERAL") // MATH, SCIENCE, LANGUAGE, GENERAL
  isActive      Boolean  @default(true) 
  // Branding snapshot taken at room creation so it persists even if agency changes logo later
  brandingLogo  String?  
  brandingColor String?  
  pages         BoardPage[]
  recordings    Recording[]
  createdAt     DateTime @default(now())
}

model BoardPage {
  id         String  @id @default(uuid())
  roomId     String
  room       Room    @relation(fields: [roomId], references: [id], onDelete: Cascade)
  pageIndex  Int     
  snapshot   Json    // Yjs document state
}

model Template {
  id         String  @id @default(uuid())
  tutorId    String
  tutor      User     @relation(fields: [tutorId], references: [id], onDelete: Cascade)
  name       String  
  subject    String
  snapshot   Json    
  createdAt  DateTime @default(now())
}

model Recording {
  id        String   @id @default(uuid())
  roomId    String
  room      Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  tutorId   String
  url       String   // Storage URL for the video file
  createdAt DateTime @default(now())
}
```

---

## 6. PROJECT DIRECTORY STRUCTURE

```text
k12-superboard/
├── src/
│   ├── app/                              
│   │   ├── layout.tsx                    # Global wrapper, injects CSS variables for theming
│   │   ├── page.tsx                      # Tutor Dashboard
│   │   ├── room/
│   │   │   └── [roomId]/
│   │   │       └── page.tsx              # Main Whiteboard / Waiting Room
│   │   └── api/                          
│   │       ├── stripe/
│   │       │   └── webhook/route.ts      # Handle Pro/Agency upgrades
│   │       ├── livekit/
│   │       │   └── token/route.ts        # Gen token + CHECK limits
│   │       └── ai/
│   │           └── action/route.ts       # Route to Haiku/Sonnet + DEDUCT credit
│   ├── components/
│   │   ├── ui/                           # Shadcn UI
│   │   ├── canvas/
│   │   │   ├── Whiteboard.tsx            # Tldraw + Yjs
│   │   │   ├── Toolbar.tsx               # Dynamic toolbar switcher
│   │   │   ├── PageSidebar.tsx           # Multi-page nav (Tutor only)
│   │   │   └── ImageCompressor.ts        # Bounding box crop + JPEG compression
│   │   ├── toolkits/                     # SUBJECT SPECIFIC TOOLS
│   │   │   ├── MathToolkit.tsx           
│   │   │   ├── ScienceToolkit.tsx        
│   │   │   ├── LanguageToolkit.tsx       
│   │   │   └── GeneralToolkit.tsx        
│   │   ├── video/
│   │   │   ├── PipVideoPanel.tsx         # FLOATING, DRAGGABLE LiveKit video UI
│   │   │   └── RecordButton.tsx          # Triggers LiveKit E2EE recording
│   │   ├── ai/
│   │   │   ├── AIControlPanel.tsx        # Tutor toggles
│   │   │   ├── QuizGenerator.tsx         # Interactive sticky notes
│   │   │   ├── WorksheetGenerator.tsx    # Grid layout
│   │   │   ├── GeoGebraPanel.tsx         # Lazy loaded GeoGebra API
│   │   │   └── AnswerKeyModal.tsx        # Private popup
│   │   ├── student/
│   │   │   ├── WaitingRoom.tsx           # DYNAMICALLY BRANDED waiting screen
│   │   │   └── NameEntryModal.tsx        # Guest name entry
│   │   ├── premium/
│   │   │   ├── PaywallModal.tsx          
│   │   │   └── UsageBar.tsx              # "8/10 Credits" bottom bar
│   │   └── branding/
│   │       ├── BrandedHeader.tsx         # Swaps logo/text based on room data
│   │       └── BrandedPdfExport.tsx      # Adds agency header/footer to downloads
│   ├── lib/
│   │   ├── supabase.ts                  
│   │   ├── livekit.ts                   # Self-hosted Livekit client
│   │   ├── ai.ts                        # Anthropic client (Haiku & Sonnet)
│   │   ├── mathpix.ts                   
│   │   └── geogebra.ts                  
│   └── hooks/
│       ├── useCredits.ts                 # Fetch current period usage
│       ├── useFocusMode.ts              # Sync viewport
│       └── useTheme.ts                  # Applies agency hex codes to CSS vars
├── server/                               # Hocuspocus Yjs Server (Deploy Serverless)
│   └── index.ts                          
├── package.json
└── tailwind.config.ts
```

---

## 7. CRITICAL API LOGIC, ROUTING & ANTI-FRAUD

### 7.1. Custom Domain Routing (Middleware)
In `middleware.ts` (Next.js), intercept incoming requests. If the hostname is NOT the main app domain (e.g., is `classroom.smith.com`), query the `User` table for `customDomain`. If found, fetch their branding colors/logo and pass them down so the frontend renders their theme.

### 7.2. The AI Action Endpoint (`/api/ai/action`)
1. Verify auth & tier.
2. Check `aiCreditsUsed` in `UsageLog`.
3. If limit reached -> throw `{ error: 'LIMIT_REACHED' }`.
4. **ROUTING LOGIC (MANDATORY FOR COST):**
   * If `action === 'QUIZ' || 'WORKSHEET' || 'SUMMARY' || 'GRAMMAR' || 'OUTLINE'` -> Call Claude 3 Haiku.
   * If `action === 'PLOT_GRAPH' || 'PERFECT_SHAPE' || 'HANDWRITING_TO_MATH'` -> Call Claude 3.5 Sonnet (Vision).
5. Upon success, increment `aiCreditsUsed` by 1.

### 7.3. Anti-Fraud Device Fingerprinting
On Dashboard load, run FingerprintJS. Send hash to backend. If hash exists on a *different* user ID, instantly downgrade to restricted tier.

---

## 8. MILESTONES & ACCEPTANCE CRITERIA

**Milestone 1: Foundation, Zero-Friction Onboarding & Domain Routing (20%)**
*   Next.js/Supabase setup. Tutor Auth. 3-Tier Stripe integration.
*   Middleware for Custom Domain Routing.
*   Student Branded Waiting Room & Name Entry flow.
*   *Test:* Agency tutor sets custom domain. Student opens custom domain link, sees waiting room with Agency Logo and Colors, enters name, joins board.

**Milestone 2: The Canvas, Sync, Theming & Subject Toolkits (25%)**
*   Tldraw integrated. Serverless Hocuspocus running.
*   **Dynamic CSS Theming:** Toolbar and UI elements change color based on `room.brandingColor`. Branded Header swaps logo/text.
*   Multi-page, Dynamic Subject Toolkits (Math/Science/Language/General), Cursor presence, Focus Mode, Laser Pointer.
*   *Test:* Tutor selects "Math", sees graph paper. Selects "English", sees highlighters. Agency room UI perfectly matches agency hex code. Two users draw with zero lag.

**Milestone 3: Native Floating PiP Audio/Video & Recordings (15%)**
*   **CRITICAL UI:** LiveKit video implemented as a draggable, floating panel overlaying the canvas (not a sidebar, not a new tab).
*   Self-Hosted LiveKit integrated via Docker on a VPS. 
*   120-minute weekly limit enforced server-side.
*   Recording button in PiP panel triggers LiveKit E2EE, saves URL to DB.
*   *Test:* Tutor drags video window to bottom right. Student's video remains visible while they draw. Free tutor is blocked from starting an 11th call. Pro tutor records session.

**Milestone 4: Premium Features & Branded Exports (20%)**
*   Upload Files. Save/Load. Templates. 
*   **Branded PDF Export:** Downloading a board generates a PDF with the Agency Logo and Student Name in the header.
*   Agency Admin dashboard showing sub-tutor usage.
*   *Test:* Agency tutor downloads board. Opened PDF features agency logo. Agency owner logs in and sees stats for their sub-tutors.

**Milestone 5: Optimized AI Engine & GeoGebra (20%)**
*   AI Control Panel. 
*   Text AI (Haiku) generates Subject-Specific Quizzes/Worksheets (with separate Answer key modal).
*   Vision AI (Sonnet) reads *compressed* handwriting -> plots on GeoGebra. Shape Perfecting. Mathpix + KaTeX.
*   Credit limits enforced.
*   *Test:* Free user uses 10 credits, blocked on 11th. Tutor handwrites messy equation, app compresses image, plots perfect line on GeoGebra in < 2 seconds. Student drags line. Answer key is hidden from student.
