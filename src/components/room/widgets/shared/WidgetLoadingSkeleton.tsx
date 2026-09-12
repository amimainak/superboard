'use client'

import React from 'react'

// ============================================================
// WidgetLoadingSkeleton — shared Suspense fallback for all
// lazy-loaded widget toolkits. Renders a small "Loading…"
// pill plus 3 shimmer bars so the tutor sees that the panel
// is hydrating instead of a blank gap.
//
// Usage:
//   <Suspense fallback={<WidgetLoadingSkeleton isDark={isDark} />}>
//     <SomeWidgetLazy isDark={isDark} />
//   </Suspense>
// ============================================================

interface WidgetLoadingSkeletonProps {
  isDark?: boolean
  /** Optional label override (defaults to "Loading…") */
  label?: string
}

export function WidgetLoadingSkeleton({
  isDark = true,
  label = 'Loading…',
}: WidgetLoadingSkeletonProps) {
  const barBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const text = isDark ? '#94a3b8' : '#64748b'
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          textAlign: 'center',
          color: text,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: 24 + (i % 2) * 6,
            borderRadius: 6,
            background: barBg,
            animation: `wb-skeleton-shimmer 1.4s ease-in-out ${i * 0.12}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes wb-skeleton-shimmer {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default WidgetLoadingSkeleton
