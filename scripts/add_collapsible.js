const fs = require('fs');
const re = /(?:(?:const|let|var)\s+sectionTitle\s*=\(text:\s*string,\s*sectionId:\s*string\)\s*=>\s*\(([^)]+)\)\s*=>/;

function updateToolkit(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  const lines = content.split('\n');
  let lastImpLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('import ')) {
      lastImpLine = i;
      break;
    }
  }
  if (lastImpLine === -1) return;
  const insertPos = content.indexOf('\n', lastImpLine) + 1;
  content = content.slice(0, insertPos) + '\nimport { useCollapsibleSections } from "./useCollapsibleSections"' + content.slice(insertPos);
  const tm = content.match(/sectionTitle\s*=\(text:\s*string,\s*sectionId:\s*string\)\s*=>\s*\(([^)]+)\)\s*=>/);
  if (!tm) return;
  const funcLine = tm.end() - 1;
  const oldTitle = content.slice(funcLine);
  const newTitle = '\n      <div className={"toolkit-section-title" + (isDark ? "" : "-light") + (isCollapsed(sectionId) ? " toolkit-section-collapsed" : "")}\n        onClick={() => toggle(sectionId)}\n        style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}\n        >\n          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{text}</span>\n          <span className="section-chevron">{isCollapsed(sectionId) ? "+"\u25BE" : "\u25BC"}</span>\n    </div>\n  )';
  content = content.slice(0, funcLine) + newTitle + content.slice(titleMatch.end());
  fs.writeFileSync(filepath, content, 'utf8');
  console.log('Updated ' + filepath);
}

const files = fs.readdirSync('/home/z/my-project/src/components/room/widgets/').filter(f => f.endsWith('Toolkit.tsx'));
files.forEach(updateToolkit);
