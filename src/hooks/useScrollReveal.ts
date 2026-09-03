import { useEffect, useRef, useCallback } from 'react';

/**
 * useScrollReveal — adds IntersectionObserver-based reveal animation
 * to all descendant elements with .reveal, .reveal-scale, .reveal-left, .reveal-right
 * classes within the ref container.
 *
 * Options:
 *  - threshold: 0-1, how much of the element must be visible (default 0.15)
 *  - rootMargin: CSS margin string for the observer root (default '0px 0px -40px 0px')
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
   options?: { threshold?: number; rootMargin?: string }
) {
   const ref = useRef<T>(null);
  const threshold = options?.threshold ?? 0.15;
  const rootMargin = options?.rootMargin ?? '0px 0px -40px 0px';

  const handleIntersect = useCallback((entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-visible');
        observer.unobserve(entry.target);
      }
    });
  }, []);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const revealSelectors = '.reveal, .reveal-scale, .reveal-left, .reveal-right';
    const elements = container.querySelectorAll(revealSelectors);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(handleIntersect, {
      threshold,
      rootMargin,
    });

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [handleIntersect, threshold, rootMargin]);

  return ref;
}

export default useScrollReveal;
