import { useEffect, useState } from 'react';
import { usePwaInstall } from '../hooks/usePwaInstall';

function triggerDownloadFromUrl(url) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.rel = 'noopener noreferrer';
  anchor.target = '_blank';

  try {
    const resolved = new URL(url, window.location.href);
    if (resolved.origin === window.location.origin) {
      anchor.download = '';
      anchor.target = '_self';
    }
  } catch {
    // Keep default behavior for malformed external URLs.
  }

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

function downloadWebShortcut() {
  const shortcutBody = `[InternetShortcut]\nURL=${window.location.origin}/\n`;
  const blob = new Blob([shortcutBody], { type: 'text/plain;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = 'DoFirst.url';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(blobUrl);
}

export default function InstallAppButton() {
  const downloadUrl = import.meta.env.VITE_APP_DOWNLOAD_URL?.trim();
  const {
    canInstall,
    dismissIosHint,
    installApp,
    isInstalled,
    isIos,
    isSafari,
    showIosHint,
    showSuccess
  } = usePwaInstall();
  const [isOpeningPrompt, setIsOpeningPrompt] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!feedback) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setFeedback('');
    }, 4800);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [feedback]);

  async function handleInstall() {
    setFeedback('');
    setIsOpeningPrompt(true);

    try {
      const result = await installApp();

      if (result.status === 'accepted') {
        setFeedback('Install started. Finish in your browser prompt.');
        return;
      }

      if (result.status === 'dismissed') {
        setFeedback('Install was dismissed. You can try again anytime.');
        return;
      }

      if (result.status === 'unsupported') {
        if (downloadUrl) {
          triggerDownloadFromUrl(downloadUrl);
          setFeedback('Download started. Complete installation from the downloaded file.');
          return;
        }

        downloadWebShortcut();

        if (isSafari) {
          setFeedback('Shortcut downloaded. On Safari use Share -> Add to Home Screen for app install.');
          return;
        }

        setFeedback('Shortcut downloaded. For native install, use Chrome/Edge menu -> Install app.');
      }
    } finally {
      setIsOpeningPrompt(false);
    }
  }

  if (isInstalled && !showSuccess) {
    return null;
  }

  const shouldShowButton = !isInstalled;
  const buttonLabel = canInstall || isIos ? 'Install App' : downloadUrl ? 'Download App' : 'Install';

  return (
    <div className="install-app-wrapper">
      {shouldShowButton ? (
        <button
          type="button"
          className="install-app-button interactive"
          disabled={isOpeningPrompt}
          onClick={handleInstall}
        >
          {isOpeningPrompt ? 'Opening...' : buttonLabel}
        </button>
      ) : null}

      {showSuccess ? (
        <p className="install-app-feedback success" role="status">
          App installed. Launch it from your home screen or app launcher.
        </p>
      ) : null}

      {feedback ? (
        <p className="install-app-feedback">{feedback}</p>
      ) : null}

      {showIosHint ? (
        <p className="install-app-feedback ios" role="status">
          {isSafari
            ? 'On iPhone/iPad Safari: tap Share, then Add to Home Screen.'
            : 'On iPhone/iPad: open this page in Safari, then use Share > Add to Home Screen.'}
          <button type="button" className="install-app-dismiss" onClick={dismissIosHint}>
            Close
          </button>
        </p>
      ) : null}
    </div>
  );
}
