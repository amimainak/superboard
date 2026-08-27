// ============================================================
// useAccessibility Hook
// ============================================================
// Watches accessibilityMode and colorBlindMode from the global
// Zustand store and applies the corresponding data-attributes
// on the <html> element so CSS selectors can activate visual modes.
//
// Sprint 1: Accessibility + color-blind palette support.
// ============================================================

'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/app-store';

export function useAccessibility() {
  const accessibilityMode = useAppStore((s) => s.accessibilityMode);
  const colorBlindMode = useAppStore((s) => s.colorBlindMode);

  useEffect(() => {
    const html = document.documentElement;

    // Apply accessibility mode attribute
    if (accessibilityMode === 'normal') {
      html.removeAttribute('data-accessibility');
    } else {
      html.setAttribute('data-accessibility', accessibilityMode);
    }

    // Apply color-blind mode attribute
    if (colorBlindMode === 'none') {
      html.removeAttribute('data-colorblind');
    } else {
      html.setAttribute('data-colorblind', colorBlindMode);
    }

    // Cleanup: reset on unmount
    return () => {
      html.removeAttribute('data-accessibility');
      html.removeAttribute('data-colorblind');
    };
  }, [accessibilityMode, colorBlindMode]);

  return { accessibilityMode, colorBlindMode };
}
