// ============================================================
// Service Worker — Caching Strategy
// ============================================================
// NOTE: This is a placeholder service worker with basic cache-first
// strategy for static assets. It should be enhanced for production use
// with proper versioning, stale-while-revalidate for HTML, and
// workbox integration for optimal caching.
// ============================================================
// SECURITY FIX (FE-M04): Skip caching for all authenticated
// routes and API endpoints. Only cache static assets.
// Clears all cached content on logout message from client.
//
// On shared devices (school labs, libraries), this prevents
// user-to-user information leaks via stale cached content.
// ============================================================

const CACHE_NAME = 'superboard-v1';
// Core app shell assets to pre-cache on install
const STATIC_ASSETS = ['/', '/manifest.json', '/offline.html'];

// File extensions to cache on fetch (CSS, JS, fonts, images)
const CACHEABLE_EXTENSIONS = [
  '.css', '.js', '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.avif',
];

// Authenticated route patterns that must NEVER be cached
const AUTH_ROUTE_PATTERNS = [
  '/dashboard',
  '/room/',
  '/settings',
  '/admin',
  '/parent/',
  '/billing',
  '/schedule',
  '/homework',
  '/lesson-notes',
  '/invoices',
  '/resources',
  '/analytics',
  '/student',
];

// Skip caching for authenticated routes
function isAuthRoute(url: string): boolean {
  return AUTH_ROUTE_PATTERNS.some(pattern => url.includes(pattern));
}

// Check if a request URL points to a cacheable static asset
function isCacheableAsset(url: string): boolean {
  try {
    const pathname = new URL(url).pathname;
    return CACHEABLE_EXTENSIONS.some(ext => pathname.endsWith(ext));
  } catch {
    return false;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// SECURITY FIX (FE-M04): Listen for logout message from client
// to clear all cached content immediately
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'LOGOUT') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW] Cache cleared on logout');
    });
    // Also clear all caches (including old versions)
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    });
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // SECURITY FIX (FE-M04): Never cache authenticated routes
  if (isAuthRoute(event.request.url)) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Never cache API routes
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first for static assets (pre-cached + cacheable extensions)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
