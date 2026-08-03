// ============================================================
// LazyGeoGebraPanel — Dynamic import wrapper for GeoGebraPanel
// ============================================================
// Must be imported via next/dynamic with ssr: false because
// GeoGebra relies on browser APIs (DOM, window, etc.).
// ============================================================

import dynamic from 'next/dynamic';

const GeoGebraPanel = dynamic(() => import('./GeoGebraPanel'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span className="text-sm">Loading GeoGebra...</span>
      </div>
    </div>
  ),
});

export default GeoGebraPanel;
