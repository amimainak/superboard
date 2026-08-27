// ============================================================
// Service Worker — Caching Strategy (v2)
// ============================================================
// SECURITY FIX (FE-M04): Skip caching for all authenticated
// routes and API endpoints. Only cache static assets.
// Clears all cached content on logout message from client.
//
// FIX: Bumped cache version (v1 → v2) to force old broken SWs
// to be replaced. Made install resilient to individual asset
// failures (e.g. offline.html returning 404 on first deploy).
// Uses stale-while-revalidate for navigation requests so the
// page always loads from network, falling back to cache offline.
// ============================================================

const CACHE_NAME = 'superboard-v2';

// Core app shell assets to pre-cache on install (best-effort)
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
function isAuthRoute(url) {
  return AUTH_ROUTE_PATTERNS.some(function(pattern) { return url.includes(pattern); });
}

// Check if a request URL points to a cacheable static asset
function isCacheableAsset(url) {
  try {
    var pathname = new URL(url).pathname;
    return CACHEABLE_EXTENSIONS.some(function(ext) { return pathname.endsWith(ext); });
  } catch (e) {
    return false;
  }
}

// Check if a request is a navigation request (HTML page)
function isNavigationRequest(request) {
  return request.mode === 'navigate' ||
    (request.method === 'GET' &&
     (request.headers.get('accept') || '').includes('text/html'));
}

// ---- Install: best-effort pre-cache (don't fail if one asset 404s) ----
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      // Cache each asset individually — one failure won't block the rest
      return Promise.allSettled(
        STATIC_ASSETS.map(function(url) {
          return cache.add(url).catch(function(err) {
            console.warn('[SW] Failed to pre-cache:', url, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

// ---- Activate: clean old caches ----
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) {
          return caches.delete(k);
        })
      );
    })
  );
  self.clients.claim();
});

// ---- Logout message: clear all caches ----
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'LOGOUT') {
    caches.keys().then(function(keys) {
      keys.forEach(function(key) { caches.delete(key); });
    });
  }
});

// ---- Fetch handler ----
self.addEventListener('fetch', function(event) {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  var url = event.request.url;

  // SECURITY FIX (FE-M04): Never cache authenticated routes
  if (isAuthRoute(url)) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Never cache API routes
  if (url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Navigation requests: network-first (always get fresh HTML)
  if (isNavigationRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          // Cache the fresh response for offline fallback
          if (response && response.status === 200) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(function() {
          // Offline: serve from cache, or offline.html as last resort
          return caches.match(event.request).then(function(cached) {
            return cached || caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // Static assets: cache-first with network fallback
  if (isCacheableAsset(url)) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        var fetchPromise = fetch(event.request)
          .then(function(response) {
            if (response && response.status === 200) {
              var clone = response.clone();
              caches.open(CACHE_NAME).then(function(cache) {
                cache.put(event.request, clone);
              });
            }
            return response;
          })
          .catch(function() {
            return cached;
          });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // All other requests: network-only (no caching)
  event.respondWith(fetch(event.request).catch(function() {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }));
});
