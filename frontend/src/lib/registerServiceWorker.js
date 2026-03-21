export function registerServiceWorker() {
  if (!import.meta.env.PROD) {
    return;
  }

  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      () => {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.debug('[PWA] Service worker registered.');
        }
      },
      (error) => {
        // eslint-disable-next-line no-console
        console.error('[PWA] Service worker registration failed.', error);
      }
    );
  });
}
