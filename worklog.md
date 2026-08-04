---
Task ID: 1
Agent: main
Task: Fix "foggy" frontend — make surfaces sharp, crisp, and inviting

Work Log:
- Diagnosed root causes of "foggy/water vapour on glass" look:
  1. oklch-tinted CSS tokens (chroma > 0 on background/border/muted) creating subtle green wash
  2. Glass-morphism: backdrop-blur-xl on navbars + bg-white/70 transparency
  3. Massive blurred blobs (blur-[120px], blur-[100px]) diffusing across hero
  4. Semi-transparent card backgrounds (bg-white/80)
  5. Low-contrast muted-foreground text (oklch 0.50)
  6. Glass-card CSS class with backdrop-filter: blur(20px)
  7. gradient-hero using washed-out oklch light tones
- Fixed globals.css:
  - Replaced ALL oklch tokens with pure hex values
  - background: #ffffff, foreground: #111827, border: #e5e7eb
  - Converted all gradients to sharp hex colors
  - Removed backdrop-filter from .glass-card, .pip-panel
  - Made stat gradients more vivid (darker endpoints)
  - Scrollbar: pure gray hex values
- Fixed page.tsx:
  - Landing navbar: bg-white/70 backdrop-blur-xl → bg-white border-gray-200
  - Dashboard header: bg-white/70 backdrop-blur-xl → bg-white border-gray-200 shadow-sm
  - Hero section: removed 3 massive blur blobs, replaced with subtle dot grid
  - Welcome banner: removed blur overlay divs, direct gradient
  - Stat cards: removed blur overlay divs from all 3 cards
  - Quick Start card: bg-white/80 → bg-white, border-emerald-100/60 → border-gray-200
  - Tabs: bg-emerald-50/60 → bg-gray-100
  - Hover states: emerald-50/60 → emerald-50 (no transparency)
  - Billing card: bg-white/80 → bg-white
  - Admin card: bg-white/80 → bg-white
  - Loading screen: gradient-auth → bg-white
  - Body text: text-gray-500 → text-gray-600 for better contrast
- Fixed supporting components:
  - BrandedHeader.tsx: bg-background/95 backdrop-blur-sm → bg-white
  - UsageBar.tsx: bg-background/80 backdrop-blur-md → bg-white
- VLM verification: confirmed "Crisp and sharp"

Stage Summary:
- All glass-morphism/blur effects removed from main surfaces
- All oklch tinted tokens replaced with pure hex (no chroma on neutrals)
- Green accents preserved at component level (buttons, icons, active states)
- Screenshots saved: landing-sharp.png, landing-middle.png, landing-features.png
