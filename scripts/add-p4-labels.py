import re

with open('/home/z/my-project/src/components/whiteboard/CanvasWidgets.tsx','r') as f: c=f.read()
p=c.rfind('PHASE4_LANG_KIND_LABELS'); q=c.rfind('}',np)
patch = '\1  \2  'lang-sight-words': 'Sight Word Bank',\n  'lang-cvc-sort': 'CVC Word Sort',\n  'lang-fluency-timer': 'Fluency Timer',\n  'lang-argument-organizer': 'Argumentative Writing Organizer',\n  'lang-text-evidence': 'Text Evidence Highlighter',\n  'lang-semicolon-punct': 'Semicolon & Advanced Punctuation',\n  'lang-context-clues-exp': 'Context Clues Explorer',\n  'lang-rhetorical-analysis': 'Rhetorical Analysis Framework',\n  'lang-logical-fallacies': 'Logical Fallacies Reference',\n  'lang-citation-gen': 'MLA/APA Citation Generator',\n  'lang-essay-outline': 'Essay Outline Builder',\n  'lang-tts-preview': 'Text-to-Speech Preview',\n'
c=c[:q]+a+c[q:]
with open('/home/z/my-project/src/components/whiteboard/CanvasWidgets.tsx','w') as f: f.write(c)
print('OK')
