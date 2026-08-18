---
Task ID: 1
Agent: Main
Task: Build Widget Library (v1 marketplace) with Phase 2 language tools

Work Log:
- Created WidgetManifest schema at src/lib/room/widget-registry.ts with full manifest for all 21 core widgets, 5 Phase 2 marketplace widgets, and 5 Phase 3 coming-soon widgets
- Built 5 Phase 2 language tools in src/components/room/widgets/language/LanguagePhase2Utilities.tsx: Root & Morphology Explorer, Active & Passive Voice, Reading Comprehension Strategies, Grammar Error Diagnostic, Spelling Patterns
- Updated LanguageToolkit.tsx to lazy-load and conditionally show Phase 2 tools (only if installed via marketplace)
- Extended widget-store.ts with installedTools Set, install/uninstall actions, browseModalOpen state
- Created WidgetBrowseModal.tsx — in-session modal for browsing/installing marketplace tools with search, subject/grade filters, tabs (Available/Installed/Coming Soon)
- Updated WidgetToggleBar.tsx with purple dashed 'Library' button that opens the browse modal, loads installed tools on mount
- Created API route at src/app/api/user/widgets/route.ts for persisting installed tools to Supabase User table
- Added Widget Library section to dashboard page with install/remove buttons, tier gating (Pro-only badges), and coming-soon cards
- Fixed all lint errors in new files (hooks ordering, unused imports, memoization dependencies, numeric object keys)

Stage Summary:
- Widget Library is a catalog-with-feature-flags system (not dynamic plugin loading)
- Phase 2 tools appear in LanguageToolkit under 'Marketplace Tools' section with purple PRO badge
- In-session: tutors click 'Library' button on toggle bar → modal opens → install/uninstall tools
- Dashboard: full Widget Library section with cards for all 10 Phase 2+3 tools
- Tier gating: Phase 2 tools marked as 'pro' tier, FREE users see 'Pro Only' button
- Persistence: installed tools saved to User.installedWidgets via Supabase
- Files created: widget-registry.ts, LanguagePhase2Utilities.tsx, WidgetBrowseModal.tsx, api/user/widgets/route.ts
- Files modified: widget-store.ts, LanguageToolkit.tsx, WidgetToggleBar.tsx, dashboard/page.tsx, widgets/index.ts
