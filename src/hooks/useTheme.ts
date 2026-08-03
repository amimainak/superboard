// ============================================================
// useTheme Hook — Dynamic CSS Theming for White-Labeling
// ============================================================
// Applies agency hex codes to CSS/Tailwind variables.
// When a room loads, if the room has brandingColor, inject it
// into CSS custom properties to dynamically theme the UI.
// ============================================================

'use client';

import { useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import type { BrandingConfig } from '@/types';

/**
 * Convert hex color to HSL values for CSS custom properties.
 * Tailwind CSS variables use oklch format, but for brand colors
 * we inject raw hex and derive HSL for utility classes.
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === r
      ? (g - b) / d + (g < b ? 6 : 0)
      : max === g
        ? (b - r) / d + 2
        : (r - g) / d + 4;

  return {
    h: Math.round(h * 60),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Apply brand color to CSS custom properties.
 * This dynamically changes toolbar, buttons, active states, and AI panels.
 */
function applyBrandToCSS(color: string | null) {
  if (!color) {
    // Reset to default theme
    document.documentElement.style.removeProperty('--brand-color');
    document.documentElement.style.removeProperty('--brand-color-h');
    document.documentElement.style.removeProperty('--brand-color-s');
    document.documentElement.style.removeProperty('--brand-color-l');
    document.documentElement.style.removeProperty('--brand-color-light');
    document.documentElement.style.removeProperty('--brand-color-dark');
    return;
  }

  const hsl = hexToHsl(color);
  if (!hsl) return;

  const root = document.documentElement;
  root.style.setProperty('--brand-color', color);
  root.style.setProperty('--brand-color-h', `${hsl.h}`);
  root.style.setProperty('--brand-color-s', `${hsl.s}%`);
  root.style.setProperty('--brand-color-l', `${hsl.l}%`);
  root.style.setProperty(
    '--brand-color-light',
    `hsl(${hsl.h}, ${hsl.s}%, ${Math.min(hsl.l + 20, 95)}%)`
  );
  root.style.setProperty(
    '--brand-color-dark',
    `hsl(${hsl.h}, ${Math.min(hsl.s + 10, 100)}%, ${Math.max(hsl.l - 15, 15)}%)`
  );

  // Also override Tailwind primary for full theme integration
  root.style.setProperty('--primary', `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`);
  root.style.setProperty(
    '--primary-foreground',
    hsl.l > 55 ? `hsl(${hsl.h}, ${hsl.s}%, 10%)` : `hsl(${hsl.h}, ${hsl.s}%, 98%)`
  );
}

export function useTheme() {
  const branding = useAppStore((s) => s.room.branding);

  const applyTheme = useCallback((config: BrandingConfig) => {
    applyBrandToCSS(config.color);
  }, []);

  useEffect(() => {
    applyTheme(branding);
  }, [branding, applyTheme]);

  /**
   * Manually set brand color (used by agency admin settings).
   */
  const setBrandColor = useCallback((color: string | null) => {
    applyBrandToCSS(color);
  }, []);

  return {
    brandColor: branding.color,
    brandLogo: branding.logoUrl,
    agencyName: branding.agencyName,
    setBrandColor,
  };
}
