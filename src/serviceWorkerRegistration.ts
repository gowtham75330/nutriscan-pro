/**
 * Service Worker Registration Handler for NutriScan
 */

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    const swUrl = '/sw.js';

    // When a new service worker takes control (after skipWaiting + clients.claim),
    // reload the page so the browser loads the latest Vite-hashed JS bundles.
    let reloadPending = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloadPending) return; // prevent double-reload
      reloadPending = true;
      console.info('[NutriScan PWA] New service worker activated — reloading for fresh assets...');
      window.location.reload();
    });

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.info('[NutriScan PWA] New version available — will reload when SW activates.');
              } else {
                console.info('[NutriScan PWA] Content cached for offline use.');
              }
            }
          };
        };
      })
      .catch((error) => {
        console.warn('[NutriScan PWA] Service worker registration failed:', error);
      });
  });
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
}

