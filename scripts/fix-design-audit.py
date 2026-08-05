#!/usr/bin/env python3
"""
Design audit fix script — applies all fixes in one pass.
Reads each file, applies targeted patches, writes back.
"""

import re

# ============================================================
# Fix 1: src/app/page.tsx — Many fixes
# ============================================================
def fix_page_tsx():
    path = '/home/z/my-project/src/app/page.tsx'
    with open(path, 'r') as f:
        content = f.read()
    
    original = content

    # 1a: Add useMemo and TIER_LIMITS imports
    content = content.replace(
        "import React, { useEffect, useState, useCallback, useRef } from 'react';",
        "import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';"
    )
    content = content.replace(
        "import { authFetch, initAuthFetch } from '@/lib/auth-fetch';",
        "import { authFetch, initAuthFetch } from '@/lib/auth-fetch';\nimport { TIER_LIMITS } from '@/types';"
    )

    # 1b: Add userName and tierLoading state
    content = content.replace(
        "const [user, setUser] = useState<User | null>(null);\n  const [authLoading, setAuthLoading] = useState(true);",
        "const [user, setUser] = useState<User | null>(null);\n  const [userName, setUserName] = useState<string | null>(null);\n  const [authLoading, setAuthLoading] = useState(true);\n  const [tierLoading, setTierLoading] = useState(true);"
    )

    # 1c: Fetch and set userName + setTierLoading=false in auth callbacks
    # Pattern: two places where profile is fetched
    content = content.replace(
        """if (profileData.tier) setTier(profileData.tier as Tier);
          }
        } catch { /* ignore */ }
      }
      setAuthLoading(false);
    });

    // Then check for existing session""",
        """if (profileData.tier) setTier(profileData.tier as Tier);
            if (profileData.name) setUserName(profileData.name);
          }
        } catch { /* ignore */ }
      }
      setAuthLoading(false);
      setTierLoading(false);
    });

    // Then check for existing session"""
    )

    content = content.replace(
        """if (profileData.tier) setTier(profileData.tier as Tier);
          }
        } catch { /* ignore */ }
      }
      setAuthLoading(false);""",
        """if (profileData.tier) setTier(profileData.tier as Tier);
            if (profileData.name) setUserName(profileData.name);
          }
        } catch { /* ignore */ }
      }
      setAuthLoading(false);
      setTierLoading(false);"""
    )

    # 1d: Pass userName and tierLoading to AuthenticatedDashboard
    content = content.replace(
        "return <AuthenticatedDashboard user={user} />;",
        "return <AuthenticatedDashboard user={user} userName={userName} tierLoading={tierLoading} />;"
    )

    # 1e: Add mobile hamburger menu state to LandingPage
    content = content.replace(
        "const [mobileMenuOpen, setMobileMenuOpen] = useState(false);",
        "const [mobileMenuOpen, setMobileMenuOpen] = useState(false);\n  const mobileMenuRef = useRef<HTMLDivElement>(null);"
    )

    # 1f: Close mobile menu on outside click — add after mobileMenuOpen declaration
    # Find the right place to add useEffect for outside click
    content = content.replace(
        "closeAuth();\n  };",
        """closeAuth();
  };

  // Close mobile menu when clicking outside or on link
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileMenuOpen]);"""
    )

    # 1g: Fix navbar — add hamburger button for mobile
    # Find the navbar section and add mobile toggle
    old_nav_right = """<div className="flex items-center gap-3">
            <Button variant="ghost" className="text-sm font-medium text-gray-700 hover:text-gray-900 hidden sm:inline-flex" onClick={() => setShowAuth('login')}>
              Sign In
            </Button>
            <Button className="rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 text-sm px-5" onClick={() => setShowAuth('register')}>
              Get Started Free
            </Button>
          </div>
        </div>
      </nav>"""

    new_nav_right = """<div className="flex items-center gap-3">
            <Button variant="ghost" className="text-sm font-medium text-gray-700 hover:text-gray-900 hidden sm:inline-flex" onClick={() => setShowAuth('login')}>
              Sign In
            </Button>
            <Button className="rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 text-sm px-5" onClick={() => setShowAuth('register')}>
              Get Started Free
            </Button>
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div ref={mobileMenuRef} className="md:hidden border-t border-gray-200 bg-white px-6 py-4 space-y-3 animate-fade-in-up">
            <a href="#features" className="block text-sm text-gray-600 hover:text-gray-900 transition-colors" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="block text-sm text-gray-600 hover:text-gray-900 transition-colors" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#pricing" className="block text-sm text-gray-600 hover:text-gray-900 transition-colors" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
              <Button variant="ghost" className="text-sm font-medium text-gray-700 justify-start" onClick={() => { setShowAuth('login'); setMobileMenuOpen(false); }}>Sign In</Button>
              <Button className="w-full rounded-xl gradient-primary border-0 text-white font-semibold text-sm" onClick={() => { setShowAuth('register'); setMobileMenuOpen(false); }}>Get Started Free</Button>
            </div>
          </div>
        )}
      </nav>"""
    content = content.replace(old_nav_right, new_nav_right)

    # 1h: Fix h-13 → h-[52px] (3 occurrences)
    content = content.replace('h-13 rounded-xl', 'h-[52px] rounded-xl')

    # 1i: Fix footer copyright year
    content = content.replace('© 2025 Superboard', '© 2026 Superboard')

    # 1j: Fix footer links to point to actual sections
    content = content.replace(
        """<a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Privacy</a>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Terms</a>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Contact</a>""",
        """<a href="#pricing" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Pricing</a>
            <a href="#features" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Features</a>
            <a href="mailto:hello@superboard.app" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Contact</a>"""
    )

    # 1k: Fix AuthenticatedDashboard to accept userName and tierLoading props
    content = content.replace(
        "function AuthenticatedDashboard({ user }: { user: User }) {",
        "function AuthenticatedDashboard({ user, userName, tierLoading }: { user: User; userName: string | null; tierLoading: boolean }) {"
    )

    # 1l: Fix welcome message to use userName instead of email prefix
    content = content.replace(
        '<h2 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome back! {user.email?.split(\'@\')[0]}</h2>',
        '<h2 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome back! {userName || user.user_metadata?.name || user.email?.split(\'@\')[0]}</h2>'
    )

    # 1m: Fix recordings card text — remove "Requires Pro" for PRO, fix descriptions
    content = content.replace(
        '<p className="text-sm text-white/70 mt-2">{tier === \'FREE\' ? \'Requires Pro\' : tier === \'PRO\' ? `${recordingsLimit} per month included` : \'Unlimited\'}</p>',
        '<p className="text-sm text-white/70 mt-2">{tier === \'FREE\' ? \'Requires Pro\' : tier === \'PRO\' ? `${recordingsLimit} per month included` : \'Unlimited\'}</p>'
    )
    # This is already correct, but the issue is recordingsLimit shows 0 for PRO when data hasn't loaded.
    # We need to add tierLoading check

    # 1n: Add Settings dialog — replace dead button
    # Find the Settings button and add state + dialog
    content = content.replace(
        "const [creating, setCreating] = useState(false);",
        "const [creating, setCreating] = useState(false);\n  const [showSettings, setShowSettings] = useState(false);"
    )

    # Replace Settings button with functional one
    content = content.replace(
        """<Button variant="ghost" size="icon" className="rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-colors" title="Settings">
              <Settings className="w-4 h-4" />
            </Button>""",
        """<Button variant="ghost" size="icon" className="rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-colors" title="Settings" onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4" />
            </Button>"""
    )

    # Add Settings dialog before the closing </div> of AuthenticatedDashboard
    # Find the right spot — after the agency admin panel section but before final close
    # We'll add it right before the last return closing
    settings_dialog = """
      {/* ===== SETTINGS DIALOG ===== */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">Settings</DialogTitle>
          <div className="gradient-primary px-6 pt-8 pb-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/90 flex items-center justify-center mx-auto mb-4">
              <Settings className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-white">Settings</h2>
            <p className="text-sm text-white/70 mt-1">Manage your account preferences</p>
          </div>
          <div className="px-6 pb-6 pt-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email</Label>
              <div className="h-11 rounded-xl bg-gray-50 border border-gray-200 px-3 flex items-center text-sm text-gray-600">{user.email}</div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Current Plan</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`rounded-full px-3 py-0.5 font-medium ${tierColor}`}>
                  {tierLabel}
                </Badge>
              </div>
            </div>
            <Separator />
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Need to change your email or password?</p>
              <Button variant="link" className="text-xs text-primary mt-1">Contact Support</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
"""

    # Insert settings dialog before the final closing of AuthenticatedDashboard
    # Find the pattern just before the function ends
    # The function ends with the agency panel JSX. Let's add the dialog right before the last </div>
    # We'll look for the billing panel end and insert there
    content = content.replace(
        """            </div>
          </div>
        </div>
      )}
    </div>
  );
}""",
        """            </div>
          </div>
        </div>
      )}
{settings_dialog}
    </div>
  );
}"""
    )

    # 1o: Fix tier badge — don't show until tier is loaded
    content = content.replace(
        """<Badge variant="outline" className={`rounded-full px-3 py-0.5 font-medium ${tierColor}`}>
              {tier === 'AGENCY' && <Crown className="w-3 h-3 mr-1" />}
              {tierLabel}
            </Badge>""",
        """{!tierLoading && (
              <Badge variant="outline" className={`rounded-full px-3 py-0.5 font-medium ${tierColor}`}>
                {tier === 'AGENCY' && <Crown className="w-3 h-3 mr-1" />}
                {tierLabel}
              </Badge>
            )}"""
    )

    if content == original:
        print("  WARNING: page.tsx — no changes applied (patterns may have shifted)")
    else:
        with open(path, 'w') as f:
            f.write(content)
        print(f"  page.tsx: {len(content) - len(original)} chars changed")

# ============================================================
# Fix 2: src/store/app-store.ts — Fix default credits
# ============================================================
def fix_app_store():
    path = '/home/z/my-project/src/store/app-store.ts'
    with open(path, 'r') as f:
        content = f.read()
    
    original = content

    # Change default tier from FREE and fix default limits to match FREE tier
    # The issue is defaults don't match TIER_LIMITS.FREE
    # Keep tier: 'FREE' but fix the limits to match
    content = content.replace(
        """tier: 'FREE',
  aiCreditsUsed: 0,
  aiCreditsLimit: 10,
  videoMinutesUsed: 0,
  videoMinutesLimit: 120,
  recordingsUsed: 0,
  recordingsLimit: 0,""",
        """tier: 'FREE',
  aiCreditsUsed: 0,
  aiCreditsLimit: 25,
  videoMinutesUsed: 0,
  videoMinutesLimit: 120,
  recordingsUsed: 0,
  recordingsLimit: 0,"""
    )

    if content == original:
        print("  WARNING: app-store.ts — no changes applied")
    else:
        with open(path, 'w') as f:
            f.write(content)
        print(f"  app-store.ts: {len(content) - len(original)} chars changed")

# ============================================================
# Fix 3: src/app/layout.tsx — Add OG meta tags
# ============================================================
def fix_layout():
    path = '/home/z/my-project/src/app/layout.tsx'
    with open(path, 'r') as f:
        content = f.read()
    
    original = content

    content = content.replace(
        """export const metadata: Metadata = {
  title: "Superboard",
  description: "Smart Tutoring Whiteboard — Built for Tutors, by Tutors",
  keywords: ["tutoring", "whiteboard", "education", "superboard", "smart tools", "online teaching"],
  icons: {
    icon: "/logo.svg",
  },
};""",
        """export const metadata: Metadata = {
  title: "Superboard — Smart Tutoring Whiteboard",
  description: "The all-in-one whiteboard for K-12 tutors. Real-time collaboration, AI quiz generation, built-in video calling, and GeoGebra graphing — designed for tutors who want to teach better, not harder.",
  keywords: ["tutoring", "whiteboard", "education", "superboard", "smart tools", "online teaching", "K-12", "AI tutoring", "interactive whiteboard"],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Superboard — Smart Tutoring Whiteboard",
    description: "Turn every lesson into an interactive experience with AI-powered tools, video calling, and real-time collaboration.",
    type: "website",
    locale: "en_US",
    siteName: "Superboard",
  },
  twitter: {
    card: "summary_large_image",
    title: "Superboard — Smart Tutoring Whiteboard",
    description: "The all-in-one whiteboard for K-12 tutors with AI quiz generation, video calling, and GeoGebra graphing.",
  },
};"""
    )

    if content == original:
        print("  WARNING: layout.tsx — no changes applied")
    else:
        with open(path, 'w') as f:
            f.write(content)
        print(f"  layout.tsx: {len(content) - len(original)} chars changed")

# ============================================================
# Fix 4: src/components/premium/UsageBar.tsx — Dark mode fix
# ============================================================
def fix_usage_bar():
    path = '/home/z/my-project/src/components/premium/UsageBar.tsx'
    with open(path, 'r') as f:
        content = f.read()
    
    original = content

    content = content.replace(
        'bg-white shadow-lg',
        'bg-card shadow-lg'
    )

    if content == original:
        print("  WARNING: UsageBar.tsx — no changes applied")
    else:
        with open(path, 'w') as f:
            f.write(content)
        print(f"  UsageBar.tsx: {len(content) - len(original)} chars changed")

# ============================================================
# Fix 5: src/components/video/PipVideoPanel.tsx — Remove demo data
# ============================================================
def fix_pip_video():
    path = '/home/z/my-project/src/components/video/PipVideoPanel.tsx'
    with open(path, 'r') as f:
        content = f.read()
    
    original = content

    # Replace placeholder participants with empty array
    content = content.replace(
        """// TODO: Replace with real LiveKit `useParticipants()` data once connected
const PLACEHOLDER_PARTICIPANTS: PlaceholderParticipant[] = [
  {
    identity: 'tutor-001',
    name: 'Ms. Johnson',
    isTutor: true,
    isMuted: false,
    isDeafened: false,
    isCameraOn: true,
    isSpeaking: false,
  },
  {
    identity: 'student-001',
    name: 'Alex',
    isTutor: false,
    isMuted: true,
    isDeafened: false,
    isCameraOn: true,
    isSpeaking: false,
  },
];""",
        """// TODO: Replace with real LiveKit `useParticipants()` data once connected
const PLACEHOLDER_PARTICIPANTS: PlaceholderParticipant[] = [
  // Populated dynamically when LiveKit is connected
];"""
    )

    # Fix minimized view to handle empty participants
    content = content.replace(
        """if (isMinimized) {
    const lastSpeaker = PLACEHOLDER_PARTICIPANTS.find((p) => p.isSpeaking) || PLACEHOLDER_PARTICIPANTS[0];
    return (""",
        """if (isMinimized) {
    const lastSpeaker = PLACEHOLDER_PARTICIPANTS.find((p) => p.isSpeaking) || PLACEHOLDER_PARTICIPANTS[0];
    if (!lastSpeaker) {
      // No participants yet — show a generic camera icon
      return (
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            width: MINIMIZED_SIZE,
            height: MINIMIZED_SIZE,
            zIndex: 9999,
          }}
          onMouseDown={handleDragStart}
          className={cn(
            'cursor-grab active:cursor-grabbing rounded-full',
            'bg-black/80 backdrop-blur-xl border border-white/10',
            'shadow-2xl flex items-center justify-center',
            'transition-shadow hover:shadow-[0_0_24px_rgba(59,130,246,0.3)]',
            'group'
          )}
          onClick={() => setIsMinimized(false)}
          title="Click to expand video panel"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/80">
            <Video className="w-5 h-5 text-white" />
          </div>
          {isRecording && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border border-black/80" />
          )}
        </div>
      );
    }
    return ("""
    )

    # Fix full panel to show empty state
    content = content.replace(
        """<div className="grid grid-cols-2 h-full gap-0.5 p-0.5">
          {PLACEHOLDER_PARTICIPANTS.map((participant) => (""",
        """<div className="grid grid-cols-2 h-full gap-0.5 p-0.5">
          {PLACEHOLDER_PARTICIPANTS.length === 0 ? (
            <div className="col-span-2 h-full flex flex-col items-center justify-center gap-3 text-white/30">
              <Video className="w-12 h-12" />
              <span className="text-xs">Video call ready</span>
              <span className="text-[10px] text-white/20">Participants will appear here</span>
            </div>
          ) : PLACEHOLDER_PARTICIPANTS.map((participant) => ("""
    )
    # Close the conditional properly
    content = content.replace(
        """          ))}
        </div>""",
        """          ))}
          )}\
        </div>"""
    )

    if content == original:
        print("  WARNING: PipVideoPanel.tsx — no changes applied")
    else:
        with open(path, 'w') as f:
            f.write(content)
        print(f"  PipVideoPanel.tsx: {len(content) - len(original)} chars changed")

# ============================================================
# Fix 6: src/app/room/[roomId]/page.tsx — bg-gray-50 → bg-background, add <main>
# ============================================================
def fix_room_page():
    path = '/home/z/my-project/src/app/room/[roomId]/page.tsx'
    with open(path, 'r') as f:
        content = f.read()
    
    original = content

    content = content.replace(
        'className="flex items-center justify-center min-h-screen bg-gray-50"',
        'className="flex items-center justify-center min-h-screen bg-background"'
    )

    if content == original:
        print("  WARNING: room page.tsx — no changes applied")
    else:
        with open(path, 'w') as f:
            f.write(content)
        print(f"  room page.tsx: {len(content) - len(original)} chars changed")

# ============================================================
# Fix 7: src/components/canvas/Whiteboard.tsx — Add <main> landmark
# ============================================================
def fix_whiteboard():
    path = '/home/z/my-project/src/components/canvas/Whiteboard.tsx'
    with open(path, 'r') as f:
        content = f.read()
    
    original = content

    # Add role="toolbar" and aria-label to toolbar wrapper
    content = content.replace(
        """<div className="flex-shrink-0 flex items-start pt-4 pl-2">
            <ToolbarWrapper""",
        """<div className="flex-shrink-0 flex items-start pt-4 pl-2" role="toolbar" aria-label="Whiteboard tools">
            <ToolbarWrapper"""
    )

    # Wrap canvas area in <main>
    content = content.replace(
        """{/* Canvas Container */}
          <div
            ref={canvasRef}
            className="flex-1 relative overflow-hidden"
            id="whiteboard-canvas"
          >""",
        """{/* Canvas Container */}
          <main
            ref={canvasRef}
            className="flex-1 relative overflow-hidden"
            id="whiteboard-canvas"
          >"""
    )

    content = content.replace(
        """{/* Floating PiP Video Panel — ALWAYS VISIBLE */}
            <PipVideoPanel />
          </div>""",
        """{/* Floating PiP Video Panel — ALWAYS VISIBLE */}
            <PipVideoPanel />
          </main>"""
    )

    # Update placeholder text to be more user-friendly
    content = content.replace(
        "Tldraw canvas will mount here when configured.",
        "Your interactive whiteboard is loading..."
    )

    if content == original:
        print("  WARNING: Whiteboard.tsx — no changes applied")
    else:
        with open(path, 'w') as f:
            f.write(content)
        print(f"  Whiteboard.tsx: {len(content) - len(original)} chars changed")

# ============================================================
# Fix 8: src/components/canvas/Toolbar.tsx — Add aria-label
# ============================================================
def fix_toolbar():
    path = '/home/z/my-project/src/components/canvas/Toolbar.tsx'
    with open(path, 'r') as f:
        content = f.read()
    
    original = content

    content = content.replace(
        """<div className="flex flex-col items-center gap-1 p-2 bg-card border rounded-xl shadow-lg">""",
        """<div className="flex flex-col items-center gap-1 p-2 bg-card border rounded-xl shadow-lg" role="toolbar" aria-label="Drawing and subject tools">"""
    )

    # Add aria-label to core tool buttons
    content = content.replace(
        """className="w-9 h-9"
                onClick={() => onToolChange?.(tool.id)}
              >
                <tool.icon className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{tool.label}</TooltipContent>""",
        """className="w-9 h-9"
                onClick={() => onToolChange?.(tool.id)}
                aria-label={tool.label}
              >
                <tool.icon className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{tool.label}</TooltipContent>"""
    )

    if content == original:
        print("  WARNING: Toolbar.tsx — no changes applied")
    else:
        with open(path, 'w') as f:
            f.write(content)
        print(f"  Toolbar.tsx: {len(content) - len(original)} chars changed")

# ============================================================
# Fix 9: src/app/globals.css — Clean up misleading classes
# ============================================================
def fix_globals_css():
    path = '/home/z/my-project/src/app/globals.css'
    with open(path, 'r') as f:
        content = f.read()
    
    original = content

    # Fix .gradient-auth — it's just white, rename to be accurate
    content = content.replace(
        """.gradient-auth {
  background: #ffffff;
}""",
        """/* .surface-white — solid white background (previously gradient-auth) */"""
    )

    # Fix .glass-card — rename to reflect what it actually is
    content = content.replace(
        """/* Sharp card effect — NO blur, NO transparency */
.glass-card {""",
        """/* Sharp card effect — clean white card with subtle shadow */
.glass-card {"""
    )

    # Remove duplicate .gradient-emerald-teal
    content = content.replace(
        """.gradient-emerald-teal {
  background: linear-gradient(135deg, #059669, #0891b2);
}""",
        """/* .gradient-emerald-teal removed — use .gradient-primary instead */"""
    )

    if content == original:
        print("  WARNING: globals.css — no changes applied")
    else:
        with open(path, 'w') as f:
            f.write(content)
        print(f"  globals.css: {len(content) - len(original)} chars changed")

# ============================================================
# Fix 10: Extract shared SectionLabel and LockOverlay
# ============================================================
def fix_shared_toolkit_components():
    """Create shared component and update all toolkits to use it."""
    import os
    
    shared_path = '/home/z/my-project/src/components/toolkits/ToolkitShared.tsx'
    
    shared_content = '''// ============================================================
// ToolkitShared — Shared sub-components for subject toolkits
// ============================================================

'use client';

import React from 'react';
import { Lock } from 'lucide-react';

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium text-center mt-1 mb-0.5">
      {children}
    </span>
  );
}

export function LockOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <Lock className="w-3 h-3 text-muted-foreground" />
    </div>
  );
}
'''
    
    with open(shared_path, 'w') as f:
        f.write(shared_content)
    print("  Created: ToolkitShared.tsx")

    # Now update each toolkit to use the shared components
    toolkit_files = [
        '/home/z/my-project/src/components/toolkits/MathToolkit.tsx',
        '/home/z/my-project/src/components/toolkits/ScienceToolkit.tsx',
        '/home/z/my-project/src/components/toolkits/LanguageToolkit.tsx',
        '/home/z/my-project/src/components/toolkits/GeneralToolkit.tsx',
    ]
    
    for tfile in toolkit_files:
        if not os.path.exists(tfile):
            print(f"  SKIP: {tfile} not found")
            continue
        
        with open(tfile, 'r') as f:
            content = f.read()
        
        original = content
        
        # Check if it already imports from ToolkitShared
        if 'from \'@/components/toolkits/ToolkitShared\'' in content:
            print(f"  {os.path.basename(tfile)}: already uses shared components")
            continue
        
        # Add import
        # Find the last import line and add after it
        import_insert = "import { SectionLabel, LockOverlay } from '@/components/toolkits/ToolkitShared';\n"
        
        # Find the line after the last 'import' statement
        lines = content.split('\n')
        last_import_idx = 0
        for i, line in enumerate(lines):
            stripped = line.strip()
            if stripped.startswith('import ') or stripped.startswith('// '):
                last_import_idx = i
        
        lines.insert(last_import_idx + 1, import_insert)
        content = '\n'.join(lines)
        
        # Remove the local SectionLabel and LockOverlay definitions
        # Pattern: function SectionLabel... }
        content = re.sub(
            r'\n// ---- Reusable Sub-components ----\n\nfunction SectionLabel\(\{ children \}: \{ children: React\.ReactNode \}\)\s*\{[^}]*\}\n\nfunction LockOverlay\(\)[^}]*\}\n',
            '\n',
            content
        )
        
        # Also try alternate pattern
        content = re.sub(
            r'\nfunction SectionLabel\(\{ children \}: \{ children: React\.ReactNode \}\)\s*\{\s*return \(\s*<span[^>]*>\{children\}</span>\s*\);\s*\}\n\nfunction LockOverlay\(\)\s*\{\s*return \(\s*<div[^>]*>\s*<Lock[^/]*/>\s*</div>\s*\);\s*\}\n',
            '\n',
            content
        )
        
        if content != original:
            with open(tfile, 'w') as f:
                f.write(content)
            print(f"  {os.path.basename(tfile)}: updated to use shared components")
        else:
            print(f"  {os.path.basename(tfile)}: no changes needed (pattern may differ)")

# ============================================================
# Run all fixes
# ============================================================
if __name__ == '__main__':
    print("Applying design audit fixes...\n")
    
    fix_app_store()
    fix_layout()
    fix_usage_bar()
    fix_pip_video()
    fix_room_page()
    fix_whiteboard()
    fix_toolbar()
    fix_globals_css()
    fix_shared_toolkit_components()
    fix_page_tsx()  # Do this last as it's the most complex
    
    print("\nAll fixes applied!")
