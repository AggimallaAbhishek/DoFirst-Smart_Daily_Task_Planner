import { useEffect, useState } from 'react';

const INSTALL_STATE_KEY = 'dofirst-pwa-installed';

function isStandaloneMode() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isIosDevice() {
  if (typeof window === 'undefined') {
    return false;
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  return (
    /iphone|ipad|ipod/.test(userAgent) ||
    (userAgent.includes('macintosh') && 'ontouchend' in document)
  );
}

function isSafariBrowser() {
  if (typeof window === 'undefined') {
    return false;
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  return userAgent.includes('safari') && !/crios|fxios|edgios|opr|chrome|android/.test(userAgent);
}

function readInstallState() {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(INSTALL_STATE_KEY) === '1';
  } catch {
    return false;
  }
}

function persistInstallState() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(INSTALL_STATE_KEY, '1');
  } catch {
    // Ignore storage failures; install detection still works via display mode.
  }
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => isStandaloneMode() || readInstallState());
  const [showSuccess, setShowSuccess] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    setIsIos(isIosDevice());
    setIsSafari(isSafariBrowser());

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      if (import.meta.env.DEV) {
        // Debug aid for local install-flow validation.
        // eslint-disable-next-line no-console
        console.debug('[PWA] Captured beforeinstallprompt event.');
      }
    };

    const handleInstalled = () => {
      persistInstallState();
      setIsInstalled(true);
      setShowSuccess(true);
      setShowIosHint(false);
      setDeferredPrompt(null);
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.debug('[PWA] App installation completed.');
      }
    };

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (event) => {
      if (event.matches) {
        persistInstallState();
        setIsInstalled(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  useEffect(() => {
    if (!showSuccess) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setShowSuccess(false);
    }, 4200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [showSuccess]);

  async function installApp() {
    if (isInstalled) {
      return {
        status: 'installed'
      };
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      setDeferredPrompt(null);

      return {
        status: result.outcome === 'accepted' ? 'accepted' : 'dismissed'
      };
    }

    if (isIos) {
      setShowIosHint(true);
      return {
        status: 'ios'
      };
    }

    return {
      status: 'unsupported'
    };
  }

  function dismissIosHint() {
    setShowIosHint(false);
  }

  return {
    canInstall: Boolean(deferredPrompt) && !isInstalled,
    dismissIosHint,
    installApp,
    isInstalled,
    isIos,
    isSafari,
    showIosHint,
    showSuccess
  };
}
