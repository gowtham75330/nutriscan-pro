/**
 * NutriScan Progressive Web App - Service Worker
 * ─────────────────────────────────────────────────────────────────────────────
 * Safe caching for app shell and static assets.
 * Passthrough for AI models (TensorFlow/MobileNet) and API requests.
 */

const CACHE_VERSION = 'nutriscan-v1';
const STATIC_CACHE = `nutriscan-static-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon.svg',
  '/icons/icon-maskable.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png'
];

const BYPASS_URL_PATTERNS = [
  'storage.googleapis.com',
  'tfhub.dev',
  'cdn.jsdelivr.net',
  '/api/'
];

// Install: precache shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          fetch(url, { cache: 'no-cache' })
            .then((res) => {
              if (res.ok) return cache.put(url, res);
            })
            .catch(() => {})
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: smart routing strategy
self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (!url.protocol.startsWith('http')) return;

  const shouldBypass = BYPASS_URL_PATTERNS.some((pattern) =>
    url.hostname.includes(pattern) || url.pathname.includes(pattern)
  );

  if (shouldBypass) {
    return;
  }

  // Navigation requests: Network-First with Cache Fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes.ok) {
            const clone = networkRes.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
          return caches.match('/');
        })
    );
    return;
  }

  // Static assets: Stale-While-Revalidate
  const isStaticAsset =
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') ||
     url.pathname.startsWith('/icons/') ||
     url.pathname.endsWith('.js') ||
     url.pathname.endsWith('.css') ||
     url.pathname.endsWith('.svg') ||
     url.pathname.endsWith('.png') ||
     url.pathname.endsWith('.ico') ||
     url.pathname.endsWith('.woff2') ||
     url.pathname.endsWith('.woff') ||
     url.pathname.endsWith('.ttf'));

  if (isStaticAsset) {
    event.respondWith(
      caches.match(req).then((cachedRes) => {
        const fetchPromise = fetch(req)
          .then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              const clone = networkRes.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(req, clone));
            }
            return networkRes;
          })
          .catch(() => cachedRes);

        return cachedRes || fetchPromise;
      })
    );
    return;
  }

  event.respondWith(
    fetch(req)
      .then((networkRes) => networkRes)
      .catch(() => caches.match(req))
  );
});

