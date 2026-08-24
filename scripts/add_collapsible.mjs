const fs = require('fs');
module.exports = {};

function updateToolkit(filepath) {
  let content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.split('\n');
  let titleDefStart = -1, titleDefEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('sectionTitle') && line.includes('(')) {
      titleDefStart = i; break;
    }
  }
  if (titleDefStart === -1) { return; }
  titleDefEnd = titleDefStart + 1;
  for (let i = titleDefStart; i <= titleDefEnd; i++) {
    if (')' === lines[i].trim()) {
      titleDefEnd = i + 1; break;
    }
  }
  const bodyLines = lines.slice(titleDefEnd);
  const chevronHtml = '<span className="section-chevron">&#x2212;</span>';
  const newBody = bodyLines.map(l => l.trim()).join('\n').replace('className={', 'className={').replace('</span>', '</span>'));
  const newFunc = '\n' + lines[titleDefStart] + newBody + '\n';
  fs.writeFileSync(filepath, newFunc, 'utf-8');
  console.log('Updated ' + filepath);
}
module.exports.updateToolkit = updateToolkit;
