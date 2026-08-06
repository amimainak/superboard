// ============================================================
// GeoGebra API Client
// ============================================================
// Uses the GeoGebra JavaScript API (NOT iframe) for interactive
// graphing. The component that wraps this is lazy-loaded.
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

/**
 * Build a GeoGebra API command string from a structured command object.
 * This is executed within the GeoGebra applet via eval or the API.
 */
export function buildGeoGebraCommand(command: GeoGebraCommand): string {
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
      return command.expression;
  }
}

/**
 * Execute GeoGebra API command in the GeoGebra applet instance.
 * This requires the GeoGebra applet to be loaded in the DOM.
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
 */
export function parseExpressionToGeoGebra(
  aiOutput: string
): GeoGebraCommand[] {
  const commands: GeoGebraCommand[] = [];

  // Parse lines of output — each line could be a GeoGebra command
  const lines = aiOutput
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    // Simple heuristic: if line contains "=" it's likely a function
    if (line.includes('y =') || line.includes('y=') || line.includes('f(x)')) {
      const expr = line.replace(/y\s*=\s*/i, '').replace(/f\(x\)\s*=\s*/i, '');
      commands.push({
        type: 'plot_function',
        expression: expr,
        label: 'f',
      });
    } else if (line.includes('(') && line.includes(')')) {
      // Could be a point
      commands.push({
        type: 'plot_point',
        expression: line,
      });
    }
  }

  return commands;
}

export { GEOGEBRA_API_URL, GEOGEBRA_APP_KEY };
