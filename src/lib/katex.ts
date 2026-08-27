// ============================================================
// KaTeX Rendering Utility
// ============================================================
// Renders LaTeX strings into HTML using KaTeX.
// SECURITY: trust is set to FALSE to prevent HTML injection
// via LaTeX commands like \html{...}
// ============================================================

import katex from 'katex';

/**
 * Render LaTeX to HTML string using KaTeX.
 *
 * @param latex - LaTeX string to render
 * @param displayMode - Whether to render in display mode (block) or inline
 * @returns HTML string
 */
export function renderLatex(latex: string, displayMode: boolean = false): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: true,
      strict: true,
      // SECURITY: trust must be false to prevent HTML injection via \html{...}
      trust: false,
      output: 'html',
    });
  } catch (error) {
    console.error('[KaTeX] Render error:', error);
    // Return the raw LaTeX escaped if KaTeX fails
    return `<span class="katex-error" style="color:red">${escapeHtml(latex)}</span>`;
  }
}

/**
 * Render LaTeX to an HTML element.
 *
 * @param element - Target DOM element
 * @param latex - LaTeX string
 * @param displayMode - Display mode (block) or inline
 */
export function renderLatexToElement(
  element: HTMLElement,
  latex: string,
  displayMode: boolean = false
): void {
  try {
    katex.render(latex, element, {
      displayMode,
      throwOnError: true,
      strict: true,
      // SECURITY: trust must be false
      trust: false,
    });
  } catch (error) {
    console.error('[KaTeX] Render to element error:', error);
    element.textContent = latex;
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export default katex;
