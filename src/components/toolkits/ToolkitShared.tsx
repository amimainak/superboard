// ============================================================
// ToolkitShared — Shared sub-components for subject toolkits
// ============================================================

'use client';

import React from 'react';
import { Lock } from 'lucide-react';

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium text-center mt-1 mb-0.5">
      {children}
    </span>
  );
}

export function LockOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <Lock className="w-3 h-3 text-muted-foreground" />
    </div>
  );
}
