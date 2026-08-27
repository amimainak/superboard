// ============================================================
// GeoGebra API Client
// ============================================================
// Uses the GeoGebra JavaScript API (NOT iframe) for interactive
// graphing. The component that wraps this is lazy-loaded.
//
// SECURITY FIX (V-12): Added command whitelisting for evalCommand().
// Only allowed safe mathematical expressions are passed to the API.
// ============================================================

const GEOGEBRA_API_URL =
  process.env.GEOGEBRA_API_URL || 'https://www.geogebra.org/api/v1.0';
const GEOGEBRA_APP_KEY = process.env.GEOGEBRA_API_KEY || '';

export interface GeoGebraCommand {
  type: 'plot_point' | 'plot_function' | 'plot_line' | 'plot_parabola' | 'plot_trig' | 'set_slider';
  expression: string;
  label?: string;
  color?: string;
  params?: Record<string, number>;
}

// SECURITY (V-12): Allowed characters in GeoGebra expressions.
// Only mathematical operators, numbers, variables, parentheses, and common functions.
// This prevents injection of GeoGebra API commands or JavaScript.
const SAFE_EXPRESSION_REGEX = /^[a-zA-Z0-9\s+\-*/^().,=<>!&|?:]+$/

// SECURITY (V-12): GeoGebra command blacklist — these API commands are forbidden
// as they can access system resources or execute arbitrary code.
const GEOGEBRA_FORBIDDEN_COMMANDS = [
  'evalCommand', 'exec', 'eval', 'Function', 'XML',
  'setCaption', 'setText', 'registerClientListener',
  'openFile', 'saveFile', 'getXML', 'setXML',
  'Image', 'Text', 'Button', 'TextInput',
  'JavaScript', 'Execute', 'RunClickScript',
].map(cmd => cmd.toLowerCase());

/**
 * SECURITY (V-12): Validate that an expression is safe for GeoGebra evalCommand.
 * Checks against forbidden commands and unsafe characters.
 */
function isSafeGeoGebraExpression(expression: string): boolean {
  if (!expression || expression.length > 500) return false;

  // Check for forbidden command patterns
  const lowerExpr = expression.toLowerCase();
  for (const forbidden of GEOGEBRA_FORBIDDEN_COMMANDS) {
    if (lowerExpr.includes(forbidden)) {
      return false;
    }
  }

  // Allow only safe characters
  return SAFE_EXPRESSION_REGEX.test(expression);
}

/**
 * Build a GeoGebra API command string from a structured command object.
 * SECURITY (V-12): Validates expression before building command.
 */
export function buildGeoGebraCommand(command: GeoGebraCommand): string {
  // SECURITY: Validate expression before processing
  if (!isSafeGeoGebraExpression(command.expression)) {
    console.warn('[GeoGebra] Blocked potentially unsafe expression:', command.expression.substring(0, 50));
    return ''; // Return empty string — the component will skip this command
  }

  // SECURITY: Validate label is safe (alphanumeric only)
  if (command.label && !/^[a-zA-Z0-9_]{1,20}$/.test(command.label)) {
    console.warn('[GeoGebra] Blocked unsafe label:', command.label);
    return '';
  }

  switch (command.type) {
    case 'plot_point':
      return command.label
        ? `${command.label} = (${command.expression})`
        : `(${command.expression})`;
    case 'plot_function':
      return command.label
        ? `${command.label}: ${command.expression}`
        : `f(x) = ${command.expression}`;
    case 'plot_line':
      return command.label
        ? `${command.label}: ${command.expression}`
        : `g(x) = ${command.expression}`;
    case 'plot_parabola':
      return command.label
        ? `${command.label}: ${command.expression}`
        : `p(x) = ${command.expression}`;
    case 'plot_trig':
      return command.label
        ? `${command.label}: ${command.expression}`
        : `t(x) = ${command.expression}`;
    case 'set_slider': {
      const { params = {} } = command;
      return `Slider(${command.label || 'a'}, ${params.min ?? -10}, ${params.max ?? 10}, ${params.step ?? 0.1})`;
    }
    default:
      return '';
  }
}

/**
 * Execute GeoGebra API commands in the GeoGebra applet instance.
 * SECURITY (V-12): All commands are validated before execution.
 *
 * @param appletId - The ID of the GeoGebra applet element
 * @param commands - Array of GeoGebra commands to execute
 */
export function executeGeoGebraCommands(
  appletId: string,
  commands: GeoGebraCommand[]
): void {
  // The actual execution happens in the GeoGebraPanel component
  // where the GeoGebra API is available as a global `ggbApplet`.
  // This function generates the command strings that the component
  // will pipe to the API.
  commands.forEach((cmd) => {
    const cmdStr = buildGeoGebraCommand(cmd);
    // TODO: When GeoGebra applet is loaded, call:
    // window.ggbApplet[appletId].evalCommand(cmdStr);
  });
}

/**
 * Parse AI-generated math expression into GeoGebra-compatible format.
 * Transforms LaTeX or natural language math into GeoGebra syntax.
 * SECURITY (V-12): All parsed expressions are validated before use.
 */
export function parseExpressionToGeoGebra(
  aiOutput: string
): GeoGebraCommand[] {
  const commands: GeoGebraCommand[] = [];

  // SECURITY: Limit input length to prevent abuse
  const sanitizedInput = aiOutput.substring(0, 10_000);

  // Parse lines of output — each line could be a GeoGebra command
  const lines = sanitizedInput
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    // Simple heuristic: if line contains "=" it's likely a function
    if (line.includes('y =') || line.includes('y=') || line.includes('f(x)')) {
      const expr = line.replace(/y\s*=\s*/i, '').replace(/f\(x\)\s*=\s*/i, '');
      if (isSafeGeoGebraExpression(expr)) {
        commands.push({
          type: 'plot_function',
          expression: expr,
          label: 'f',
        });
      }
    } else if (line.includes('(') && line.includes(')')) {
      // Could be a point — extract just the coordinate part
      const coordMatch = line.match(/\(([^)]+)\)/);
      if (coordMatch && isSafeGeoGebraExpression(coordMatch[1])) {
        commands.push({
          type: 'plot_point',
          expression: coordMatch[1],
        });
      }
    }
  }

  return commands;
}

export { GEOGEBRA_API_URL, GEOGEBRA_APP_KEY };
