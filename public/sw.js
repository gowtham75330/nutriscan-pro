/**
 * NutriScan Progressive Web App - Service Worker v3
 * ─────────────────────────────────────────────────────────────────────────────
 * Version: nutriscan-v3
 * Strategy:
 *   - Navigation (HTML): Network-First, cache fallback only when offline.
 *   - Hashed static assets (/assets/): Cache-First (safe — Vite content-hashes filenames).
 *   - Icons / manifest: Network-First, cache fallback.
 *   - AI models, API, external CDNs: Passthrough (never cached).
 *
 * On install : self.skipWaiting() called immediately (unconditional).
 * On activate: Delete ALL previous nutriscan-* caches, then clients.claim().
 */

const SW_VERSION = 'nutriscan-v3';
const CACHE_NAME = `nutriscan-cache-${SW_VERSION}`;

/** URLs to precache on install (app shell only). */
const PRECACHE_ASSETS = [
  '/',
  '/?source=pwa',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png'
];

/**
 * URL patterns that must ALWAYS bypass the service worker.
 * Covers: AI model files, external CDNs, and all API requests.
 */
const BYPASS_PATTERNS = [
  'storage.googleapis.com',
  'tfhub.dev',
  'cdn.jsdelivr.net',
  'generativelanguage.googleapis.com',
  '/api/'
];

// ─── INSTALL ─────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  console.info(`[NutriScan SW] Installing version ${SW_VERSION}`);

  // skipWaiting unconditionally — do NOT chain inside cache.put() Promise.
  // This guarantees the new SW takes over even if precaching partially fails.
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          fetch(url, { cache: 'no-cache' })
            .then((res) => {
              if (res && res.ok) return cache.put(url, res);
            })
            .catch(() => {
              // Silently skip assets that fail to precache (e.g. /manifest.json 404)
            })
        )
      );
    })
  );
});

// ─── ACTIVATE ────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  console.info(`[NutriScan SW] Activating version ${SW_VERSION}`);

  event.waitUntil(
    caches.keys().then((keys) => {
      const deletions = keys
        .filter((key) => key.startsWith('nutriscan-') && key !== CACHE_NAME)
        .map((key) => {
          console.info(`[NutriScan SW] Deleting old cache: ${key}`);
          return caches.delete(key);
        });
      return Promise.all(deletions);
    }).then(() => {
      console.info('[NutriScan SW] Old caches removed.');
      console.info('[NutriScan SW] Claiming clients...');
      return self.clients.claim();
    }).then(() => {
      console.info('[NutriScan SW] Clients claimed.');
    })
  );
});

// ─── FETCH ───────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET requests over http(s)
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (!url.protocol.startsWith('http')) return;

  // Bypass: AI models, external CDNs, API calls
  const shouldBypass = BYPASS_PATTERNS.some(
    (pattern) => url.hostname.includes(pattern) || url.pathname.includes(pattern)
  );
  if (shouldBypass) return;

  // ── 1. Navigation requests (HTML pages): Network-First ──────────────────
  // Always try network first. Only fall back to cached index.html if offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.ok) {
            // Update the cache with the freshly fetched HTML
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(async () => {
          // Offline fallback only
          const cached = await caches.match('/index.html');
          if (cached) return cached;
          return caches.match('/');
        })
    );
    return;
  }

  // ── 2. Hashed Vite assets (/assets/): Cache-First ───────────────────────
  // Vite appends a content hash to every JS/CSS filename.
  // A cached /assets/index-XYZ.js is permanently valid for that hash.
  // New deployments produce new hashes → new network requests → new cache entries.
  if (
    url.origin === self.location.origin &&
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(
      caches.match(req).then((cachedRes) => {
        if (cachedRes) return cachedRes; // Cache hit — safe because hash is immutable
        // Cache miss — fetch from network and cache for future loads
        return fetch(req).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        });
      })
    );
    return;
  }

  // ── 3. Icons, manifest, other same-origin resources: Network-First ───────
  const isSameOriginAsset =
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/icons/') ||
     url.pathname.endsWith('.webmanifest') ||
     url.pathname.endsWith('.json') ||
     url.pathname.endsWith('.ico') ||
     url.pathname.endsWith('.svg') ||
     url.pathname.endsWith('.png') ||
     url.pathname.endsWith('.woff2') ||
     url.pathname.endsWith('.woff') ||
     url.pathname.endsWith('.ttf'));

  if (isSameOriginAsset) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.ok) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // ── 4. Everything else: Network-First, no caching ────────────────────────
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});
