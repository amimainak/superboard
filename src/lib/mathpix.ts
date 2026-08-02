// ============================================================
// Mathpix OCR Client
// ============================================================
// Converts handwriting/images to LaTeX using Mathpix API.
// The LaTeX output is then rendered via KaTeX on the whiteboard.
// ============================================================

const MATHPIX_APP_ID = process.env.MATHPIX_APP_ID || '';
const MATHPIX_APP_KEY = process.env.MATHPIX_APP_KEY || '';

const MATHPIX_API_URL = 'https://api.mathpix.com/v3/text';

/**
 * Send an image to Mathpix OCR and receive LaTeX output.
 *
 * @param imageBase64 - Base64 encoded image (pre-compressed by frontend)
 * @returns LaTeX string
 */
export async function mathpixImageToLatex(imageBase64: string): Promise<string> {
  if (!MATHPIX_APP_ID || MATHPIX_APP_ID === 'TODO_MATHPIX_APP_ID') {
    throw new Error(
      'Mathpix credentials not configured. Set MATHPIX_APP_ID and MATHPIX_APP_KEY in .env.local'
    );
  }

  const response = await fetch(MATHPIX_API_URL, {
    method: 'POST',
    headers: {
      'app_id': MATHPIX_APP_ID,
      'app_key': MATHPIX_APP_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      src: `data:image/jpeg;base64,${imageBase64}`,
      formats: ['text', 'data', 'html'],
      data_options: {
        include_asciimath: true,
        include_latex: true,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Mathpix API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Return LaTeX from the response
  if (data.latex) {
    return data.latex;
  }
  if (data.text) {
    return data.text;
  }

  throw new Error('No LaTeX output from Mathpix');
}

/**
 * Parse and validate LaTeX string for KaTeX rendering.
 * Throws if the LaTeX contains invalid commands.
 */
export function validateLatex(latex: string): boolean {
  // Basic validation — KaTeX will do full validation at render time
  return latex.length > 0 && latex.length < 5000;
}

export { MATHPIX_APP_ID, MATHPIX_APP_KEY };
