import re
with open('/home/z/my-project/src/components/whiteboard/CanvasWidgets.tsx','r') as f: c=f.read()

# 1. Add to WIDGET_COMPONENTS after classroom-quiz
marker = "'classroom-quiz': CanvasQuiz,"
idx = c.find(marker)
end = c.index('\n', idx)
new_entries = "\n  'lang-sight-words': CanvasSightWordBank,\n  'lang-cvc-sort': CanvasCVCWordSort,\n  'lang-fluency-timer': CanvasFluencyTimer,\n  'lang-argument-organizer': CanvasArgumentOrganizer,\n  'lang-text-evidence': CanvasTextEvidence,\n  'lang-semicolon-punct': CanvasSemicolonPunctuation,\n  'lang-context-clues-exp': CanvasContextCluesExplorer,\n  'lang-rhetorical-analysis': CanvasRhetoricalAnalysis,\n  'lang-logical-fallacies': CanvasLogicalFallacies,\n  'lang-citation-gen': CanvasCitationGenerator,\n  'lang-essay-outline': CanvasEssayOutline,\n  'lang-tts-preview': CanvasTTSPreview,\n  'arts-elements-art': CanvasElementsOfArt,\n  'arts-symmetry-drawing': CanvasSymmetryDrawing,\n  'arts-rhythm-builder': CanvasRhythmBuilder,\n  'arts-artist-spotlight': CanvasArtistSpotlight,\n  'arts-art-timeline': CanvasArtHistoryTimeline,\n  'arts-value-shading': CanvasValueShading,\n  'arts-compositional': CanvasCompositionalAnalysis,\n  'arts-criticism': CanvasArtCriticism,\n  'arts-two-point-persp': CanvasTwoPointPerspective,\n  'arts-chord-progression': CanvasChordProgression,\n"
c = c[:end] + new_entries + c[end:]
with open('/home/z/my-project/src/components/whiteboard/CanvasWidgets.tsx','w') as f: f.write(c)
print('OK components')

# 2. Add default config cases after classroom-quiz config
marker = "    case 'classroom-quiz': return getL3WidgetDefaultConfig('classroom-quiz')"
idx = c.find(marker)
end = c.index('\n', idx)
new_cfg = "\n  // Phase 4 English\n  case 'lang-sight-words': return getLangWidgetDefaultConfig('lang-sight-words')\n  case 'lang-cvc-sort': return getLangWidgetDefaultConfig('lang-cvc-sort')\n  case 'lang-fluency-timer': return getLangWidgetDefaultConfig('lang-fluency-timer')\n  case 'lang-argument-organizer': return getLangWidgetDefaultConfig('lang-argument-organizer')\n  case 'lang-text-evidence': return getLangWidgetDefaultConfig('lang-text-evidence')\n  case 'lang-semicolon-punct': return getLangWidgetDefaultConfig('lang-semicolon-punct')\n  case 'lang-context-clues-exp': return getLangWidgetDefaultConfig('lang-context-clues-exp')\n  case 'lang-rhetorical-analysis': return getLangWidgetDefaultConfig('lang-rhetorical-analysis')\n  case 'lang-logical-fallacies': return getLangWidgetDefaultConfig('lang-logical-fallacies')\n  case 'lang-citation-gen': return getLangWidgetDefaultConfig('lang-citation-gen')\n  case 'lang-essay-outline': return getLangWidgetDefaultConfig('lang-essay-outline')\n  case 'lang-tts-preview': return getLangWidgetDefaultConfig('lang-tts-preview')\n  // Phase 4 Arts\n  case 'arts-elements-art': return getArtsWidgetDefaultConfig('arts-elements-art')\n  case 'arts-symmetry-drawing': return getArtsWidgetDefaultConfig('arts-symmetry-drawing')\n  case 'arts-rhythm-builder': return getArtsWidgetDefaultConfig('arts-rhythm-builder')\n  case 'arts-artist-spotlight': return getArtsWidgetDefaultConfig('arts-artist-spotlight')\n  case 'arts-art-timeline': return getArtsWidgetDefaultConfig('arts-art-timeline')\n  case 'arts-value-shading': return getArtsWidgetDefaultConfig('arts-value-shading')\n  case 'arts-compositional': return getArtsWidgetDefaultConfig('arts-compositional')\n  case 'arts-criticism': return getArtsWidgetDefaultConfig('arts-criticism')\n  case 'arts-two-point-persp': return getArtsWidgetDefaultConfig('arts-two-point-persp')\n  case 'arts-chord-progression': return getArtsWidgetDefaultConfig('arts-chord-progression')\n"
c = c[:end] + new_cfg + c[end:]
with open('/home/z/my-project/src/components/whiteboard/CanvasWidgets.tsx','w') as f: f.write(c)
print('OK config')

# 3. Add default size cases after classroom-quiz size
marker = "    case 'classroom-quiz': return getL3WidgetDefaultSize('classroom-quiz')"
idx = c.find(marker)
end = c.index('\n', idx)
new_sz = "\n  // Phase 4 English\n  case 'lang-sight-words': return getLangWidgetDefaultSize('lang-sight-words')\n  case 'lang-cvc-sort': return getLangWidgetDefaultSize('lang-cvc-sort')\n  case 'lang-fluency-timer': return getLangWidgetDefaultSize('lang-fluency-timer')\n  case 'lang-argument-organizer': return getLangWidgetDefaultSize('lang-argument-organizer')\n  case 'lang-text-evidence': return getLangWidgetDefaultSize('lang-text-evidence')\n  case 'lang-semicolon-punct': return getLangWidgetDefaultSize('lang-semicolon-punct')\n  case 'lang-context-clues-exp': return getLangWidgetDefaultSize('lang-context-clues-exp')\n  case 'lang-rhetorical-analysis': return getLangWidgetDefaultSize('lang-rhetorical-analysis')\n  case 'lang-logical-fallacies': return getWidgetDefaultSize('lang-logical-fallacies')\n  case 'lang-citation-gen': return getWidgetDefaultSize('lang-citation-gen')\n case 'lang-essay-outline': return getWidgetDefaultSize('lang-essay-outline')\n  case 'lang-tts-preview': return getWidgetDefaultSize('lang-tts-preview')\n  // Phase 4 Arts\n  case 'arts-elements-art': return getArtsWidgetDefaultSize('arts-elements-art')\n  case 'arts-symmetry-drawing': return getArtsWidgetDefaultSize('arts-symmetry-drawing')\n  case 'arts-rhythm-builder': return getArtsWidgetDefaultSize('arts-rhythm-builder')\n  case 'arts-artist-spotlight': return getArtsWidgetDefaultSize('arts-artist-spotlight')\n  case 'arts-art-timeline': return getArtsWidgetDefaultSize('arts-art-timeline')\n  case 'arts-value-shading': return getArtsWidgetDefaultSize('arts-value-shading')\n  case 'arts-compositional': return getArtsWidgetDefaultSize('arts-compositional')\n  case 'arts-criticism': return getArtsWidgetDefaultSize('arts-criticism')\n  case 'arts-two-point-persp': return getArtsWidgetDefaultSize('arts-two-point-persp')\n  case 'arts-chord-progression': return getArtsWidgetDefaultSize('arts-chord-progression')\n"
c = c[:end] + new_sz + c[end:]
with open('/home/z/my-project/src/components/whiteboard/CanvasWidgets.tsx','w') as f: f.write(c)
print('OK sizes')

print('All Phase 4 registrations complete')
