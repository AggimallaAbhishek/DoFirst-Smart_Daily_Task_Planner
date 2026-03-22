const CACHE_VERSION = 'dofirst-v2';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const MAX_RUNTIME_ENTRIES = 80;
const NAVIGATION_NETWORK_TIMEOUT_MS = 2500;

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png'
];

function isCacheableStaticAsset(request, url) {
  if (request.method !== 'GET') {
    return false;
  }

  if (url.origin !== self.location.origin) {
    return false;
  }

  if (url.pathname.startsWith('/api/')) {
    return false;
  }

  if (url.pathname.endsWith('.apk')) {
    return false;
  }

  return ['style', 'script', 'image', 'font', 'manifest'].includes(request.destination);
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length <= maxEntries) {
    return;
  }

  const deletions = keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key));
  await Promise.all(deletions);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      );

      if ('navigationPreload' in self.registration) {
        await self.registration.navigationPreload.enable();
      }

      await self.clients.claim();
    })()
  );
});

async function handleNavigation(event) {
  const { request } = event;
  const shellCache = await caches.open(SHELL_CACHE);
  let timeoutId;

  try {
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((resolve, reject) => {
        timeoutId = self.setTimeout(() => {
          reject(new Error('Navigation network timeout'));
        }, NAVIGATION_NETWORK_TIMEOUT_MS);
      })
    ]);

    if (networkResponse && networkResponse.ok) {
      return networkResponse;
    }
  } catch {
    // Ignore and fall back to cache below.
  } finally {
    if (timeoutId) {
      self.clearTimeout(timeoutId);
    }
  }

  if ('navigationPreload' in self.registration) {
    try {
      const preloadResponse = await self.registration.navigationPreload.getState();
      if (preloadResponse?.enabled) {
        const response = await event.preloadResponse;
        if (response) {
          return response;
        }
      }
    } catch {
      // Continue to shell cache fallback.
    }
  }

  return (await shellCache.match('/index.html')) || shellCache.match('/offline.html');
}

async function handleStaticAsset(request) {
  const runtimeCache = await caches.open(RUNTIME_CACHE);
  const cached = await runtimeCache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        runtimeCache.put(request, response.clone());
        trimCache(RUNTIME_CACHE, MAX_RUNTIME_ENTRIES);
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    networkPromise.catch(() => null);
    return cached;
  }

  const networkResponse = await networkPromise;
  if (networkResponse) {
    return networkResponse;
  }

  return runtimeCache.match(request);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(event));
    return;
  }

  if (isCacheableStaticAsset(request, url)) {
    event.respondWith(handleStaticAsset(request));
  }
});
