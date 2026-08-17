// Efficient script to apply ALL color fixes at once
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..');

function readFile(p) { return fs.readFileSync(p, 'utf8'); }
function writeFile(p, c) { fs.writeFileSync(p, c, 'utf8'); }

function replaceAll(content, search, replace) {
  if (content.includes(search)) {
    return content.replaceAll(search, replace);
  }
  return content;
}

// ============================
// 1. STORE FIX: Adaptive stroke color
// ============================
const storePath = path.join(BASE, 'src/lib/whiteboard/store.ts');
let store = readFile(storePath);

// Add getDefaultStroke function after laser rAF tracking
store = store.replace(
  "// ---- Default Values ----\n\nexport const DEFAULT_STYLE",
  "// ---- Default Values ----\n\n// Adaptive defaults based on theme — prevents invisible strokes\nexport function getDefaultStroke(isDark: boolean) {\n  return isDark ? '#e2e8f0' : '#1e293b'\n}\n\nexport const DEFAULT_STYLE"
);

// Fix initial style to use adaptive stroke
store = store.replace(
  `style: { ...DEFAULT_STYLE },`,
  `style: {\n      ...DEFAULT_STYLE,\n      strokeColor: getDefaultStroke(\n        typeof window !== 'undefined'\n          ? window.matchMedia('(prefers-color-scheme: dark)').matches\n          : false\n      ),\n    },`
);

// Fix setDark to auto-switch stroke
store = store.replace(
  `    setDark: (isDark) => {
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', isDark)
      }
      set({ isDark })
    },`,
  `    setDark: (isDark) => {
      if (typeof document !== 'undefined') {
n        document.documentElement.classList.toggle('dark', isDark)
      }
n      // Auto-switch stroke color so new drawings are always visible
      set((s) => ({\n        isDark,\n        style: { ...s.style, strokeColor: getDefaultStroke(isDark) },\n      }))\n    },`
);

writeFile(storePath, store);
console.log('✓ Store: adaptive stroke color + setDark auto-switch');

// ============================
// 2. WHITEBOARD.CSS: Brighten dark mode, darken light mode
// ============================
const wbCssPath = path.join(BASE, 'src/components/whiteboard/whiteboard.css');
var wbCss = readFile(wbCssPath);

// Dark mode: brighten idle text
wbCss = wbCss.replaceAll('#8892a8', '#b4c0d8');
wbCss = wbCss.replaceAll('#6b7a94', '#8b9ab4');
wbCss = wbCss.replaceAll('#5a6478', '#7b8ca6');
wbCss = wbCss.replaceAll('#5e6b82', '#8090a8');

// Light mode: darken idle text for readability
wbCss = wbCss.replaceAll('#94a3b8', '#64748b');
wbCss = wbCss.replaceAll('#6b7280', '#4b5563');
wbCss = wbCss.replaceAll('#9ca3af', '#6b7280');

writeFile(wbCssPath, wbCss);
console.log('✓ Whiteboard CSS: dark mode brightened, light mode darkened');

// ============================
// 3. STYLE PANEL: Reorder palette
// ============================
const stylePanelPath = path.join(BASE, 'src/components/whiteboard/StylePanel.tsx');
var stylePanel = readFile(stylePanelPath);

stylePanel = stylePanel.replace(
  `const COLORS = [
  '#000000', '#1e293b', '#374151', '#6b7280',
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#059669', '#0ea5e9', '#3b82f6', '#8b5cf6',
  '#ec4899', '#f43f5e', '#78716c', '#ffffff',
]`,
  `// Vibrant palette — ordered for visual appeal, grays at end (not start)
const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#059669', '#0ea5e9', '#3b82f6', '#8b5cf6',
  '#ec4899', '#f43f5e', '#e2e8f0', '#374151',
  '#1e293b', '#000000', '#78716c', '#ffffff',
]`
);

writeFile(stylePanelPath, stylePanel);
console.log('✓ StylePanel: palette reordered, vibrant colors first');

// ============================
// 4. ELEMENT RENDERER: Better placeholder colors
// ============================
const elemRendererPath = path.join(BASE, 'src/components/whiteboard/ElementRenderer.tsx');
var elem = readFile(elemRendererPath);

elem = elem.replace(
  "color: hasText ? element.strokeColor : (isDark ? '#94a3b8' : '#6b7280'),",
  "color: hasText ? element.strokeColor : (isDark ? '#b4c0d4' : '#4b5563'),"
);

writeFile(elemRendererPath, elem);
console.log('✓ ElementRenderer: placeholder colors more visible');

// ============================
// 5. WIDGET JSX: Add isDark to remaining components
// ============================
const widgetFiles = [
  { path: 'AIAssistantWidget.tsx', import: true, existing: false },
  { path: 'MathToolkit.tsx', import: true, existing: false },
  { path: 'ScienceToolkit.tsx', import: true, existing: false },
  { path: 'LanguageToolkit.tsx', import: true, existing: false },
  { path: 'GeoGebraPanel.tsx', import: true, existing: false },
  { path: 'AgencyWidget.tsx', import: true, existing: false },
  { path: 'BreakoutRoomsWidget.tsx', import: true, existing: false },
  { path: 'SchedulingWidget.tsx', import: true, existing: false },
  { path: 'RoomInfoBar.tsx', import: true, existing: false },
  { path: 'ConnectionStatus.tsx', import: true, existing: false },
];

for (const wf of widgetFiles) {
  const fp = path.join(BASE, 'src/components/room/widgets', wf.path);
  let content = readFile(fp);
  
  // Add import if needed
  if (wf.import && !content.includes('useWhiteboardStore')) {
    const importLine = `import { useWhiteboardStore } from '@/lib/whiteboard/store'\n`;
    // Add after last existing import
    content = content.replace(/(import\s+.*?\n)(?!import)/s, `$1${importLine}`);
  }
  
  // Add isDark inside component function if not present
  if (!content.includes('const isDark')) {
    // Find the component function and add isDark after it
    const funcMatch = content.match(/export function \w+[\s\S]*?\{(\n)/);
    if (funcMatch) {
      const insertPoint = funcMatch.index + funcMatch[0].length;
      content = content.slice(0, insertPoint) + '  const isDark = useWhiteboardStore((s) => s.isDark)\n' + content.slice(insertPoint);
    }
  }
  
  writeFile(fp, content);
  console.log(`✓ ${wf.path}: added isDark support`);
}

// ============================
// 6. Fix RoomInfoBar JSX classes
// ============================
const riBarPath = path.join(BASE, 'src/components/room/widgets/RoomInfoBar.tsx');
var riBar = readFile(riBarPath);
riBar = riBar.replace(
  '    <div className="room-info-bar">',
  '    <div className={`room-info-bar ${isDark ? \'\' : \'room-info-bar-light\'}`}>'
);
riBar = riBar.replace(
  '      <span className="room-info-subject">',
  "      <span className={`room-info-subject ${isDark ? '' : 'room-info-subject-light'}`}>"
);
riBar = riBar.replace(
  '      <span className="room-info-status">',
  "      <span className={`room-info-status ${isDark ? '' : 'room-info-status-light'}`}>"
);
writeFile(riBarPath, riBar);
console.log('✓ RoomInfoBar: isDark class switching');

// ============================
// 7. Fix ConnectionStatus inline styles
// ============================
const csPath = path.join(BASE, 'src/components/room/widgets/ConnectionStatus.tsx');
var cs = readFile(csPath);
cs = cs.replace(
  "import { useCollabStore } from '@/lib/collab/store'",
  "import { useCollabStore } from '@/lib/collab/store'\nimport { useWhiteboardStore } from '@/lib/whiteboard/store'"
);
cs = cs.replace(
  '  const remoteCount = useCollabStore((s) => s.remoteUsers.length)',
  '  const remoteCount = useCollabStore((s) => s.remoteUsers.length)\n  const isDark = useWhiteboardStore((s) => s.isDark)'
);
cs = cs.replace(
  "      background: 'rgba(15, 23, 42, 0.7)',",
  "      background: isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.85)',"
);
cs = cs.replace(
  "      color: '#94a3b8',",
  "      color: isDark ? '#94a3b8' : '#475569',"
);
cs = cs.replace(
  "        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`;",
  '' // remove old border
);
cs = cs.replace(
  "      backdropFilter: 'blur(4px)',",
  "      backdropFilter: 'blur(4px)',\n      border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)',"
);
cs = cs.replace(
  "        <span style={{ color: '#64748b' }}>({remoteCount}",
  "        <span style={{ color: isDark ? '#64748b' : '#94a3b8' }}>({remoteCount}"
);
writeFile(csPath, cs);
console.log('✓ ConnectionStatus: isDark adaptive styles');

console.log('\n=== All color fixes applied! ===');
