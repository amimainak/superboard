// ============================================================
// Superboard Plugin System
// ============================================================
// Plugins extend the whiteboard with custom tools, shapes, or behaviors.
// Each plugin registers via registerPlugin() and is loaded dynamically.
//
// Built-in plugins are registered on app init via initBuiltinPlugins().
// Third-party plugins can register via registerPlugin() at module load time.
// ============================================================

export interface PluginDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  icon: string; // lucide icon name
  category: 'tool' | 'shape' | 'behavior' | 'integration';
  /** Feature flags required to use this plugin */
  requiredTier?: string[];
  /** Whether this plugin is enabled by default */
  defaultEnabled?: boolean;
  /** The component to render in the toolbar/sidebar */
  component?: string; // lazy-loaded component path
}

// Registry of available plugins
const pluginRegistry = new Map<string, PluginDefinition>();

/**
 * Register a plugin in the global registry.
 * Silently skips if a plugin with the same ID already exists.
 */
export function registerPlugin(definition: PluginDefinition): void {
  if (pluginRegistry.has(definition.id)) {
    console.warn(
      `[Plugins] Plugin "${definition.id}" is already registered. Skipping.`
    );
    return;
  }
  pluginRegistry.set(definition.id, definition);
}

/**
 * Get a single plugin by ID.
 */
export function getPlugin(id: string): PluginDefinition | undefined {
  return pluginRegistry.get(id);
}

/**
 * Get all registered plugins.
 */
export function getAllPlugins(): PluginDefinition[] {
  return Array.from(pluginRegistry.values());
}

/**
 * Get plugins filtered by category.
 */
export function getPluginsByCategory(
  category: PluginDefinition['category']
): PluginDefinition[] {
  return getAllPlugins().filter((p) => p.category === category);
}

// ---- Built-in plugins ----

export const BUILTIN_PLUGINS: PluginDefinition[] = [
  {
    id: 'math-keypad',
    name: 'Math Keypad',
    description: 'Quick-insert mathematical symbols and equations',
    version: '1.0.0',
    author: 'Superboard',
    icon: 'Calculator',
    category: 'tool',
    defaultEnabled: true,
  },
  {
    id: 'shape-library',
    name: 'Shape Library',
    description: 'Extended shapes: triangles, pentagons, stars, arrows',
    version: '1.0.0',
    author: 'Superboard',
    icon: 'Shapes',
    category: 'shape',
    defaultEnabled: true,
  },
  {
    id: 'grid-overlay',
    name: 'Grid Overlay',
    description: 'Toggle graph paper or dot grid overlay on the canvas',
    version: '1.0.0',
    author: 'Superboard',
    icon: 'Grid3x3',
    category: 'behavior',
    defaultEnabled: false,
  },
  {
    id: 'timer-stopwatch',
    name: 'Timer & Stopwatch',
    description: 'Classroom timer and stopwatch for timed exercises',
    version: '1.0.0',
    author: 'Superboard',
    icon: 'Timer',
    category: 'tool',
    defaultEnabled: true,
  },
  {
    id: 'sticky-notes',
    name: 'Sticky Notes',
    description: 'Add colorful sticky note shapes to the canvas',
    version: '1.0.0',
    author: 'Superboard',
    icon: 'StickyNote',
    category: 'shape',
    defaultEnabled: true,
  },
  {
    id: 'protractor',
    name: 'Protractor',
    description: 'On-screen protractor for angle measurement',
    version: '1.0.0',
    author: 'Superboard',
    icon: 'RotateCw',
    category: 'tool',
    requiredTier: ['PRO', 'AGENCY_STANDARD', 'AGENCY_PREMIUM'],
  },
];

// ---- Initialization ----

/**
 * Register all built-in plugins into the registry.
 * Call this once at app startup (e.g., in a layout or initialization file).
 */
export function initBuiltinPlugins(): void {
  BUILTIN_PLUGINS.forEach(registerPlugin);
}
