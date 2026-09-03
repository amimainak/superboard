// Module declarations for optional peer dependencies that may not be installed
// in this environment. These keep TypeScript happy in files that import them
// (e.g. useYjsCanvasSync.ts, UnitConverter.tsx, useCanvasFeatures.ts) without
// forcing every install to include the underlying packages.

declare module 'fabric' {
  export const Canvas: any;
  export const util: any;
  export const classRegistry: any;
  export type Object = any;
  const _default: any;
  export default _default;
}

declare module '@tldraw/tldraw' {
  export const Editor: any;
  export const TLComponentsProvider: any;
  export const Tldraw: any;
  const _default: any;
  export default _default;
}
