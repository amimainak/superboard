// ============================================================
// KaTeX Rendering Utility
// ============================================================
// Renders LaTeX strings into HTML using KaTeX.
// Used after Mathpix OCR or AI-generated math output.
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
      throwOnError: false,
      strict: false,
      trust: true,
      // Output HTML for insertion into DOM elements
      output: 'html',
    });
  } catch (error) {
    console.error('[KaTeX] Render error:', error);
    // Return the raw LaTeX if KaTeX fails
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
      throwOnError: false,
      strict: false,
      trust: true,
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
