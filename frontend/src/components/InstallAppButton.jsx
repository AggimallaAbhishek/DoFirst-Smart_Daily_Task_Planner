import { useEffect, useState } from 'react';
import { usePwaInstall } from '../hooks/usePwaInstall';

function downloadWebAppLauncher() {
  const appUrl = `${window.location.origin}/`;
  const launcherHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>DoFirst Web App Launcher</title>
    <meta http-equiv="refresh" content="0;url=${appUrl}" />
  </head>
  <body>
    <p>Opening DoFirst...</p>
    <p>If not redirected, <a href="${appUrl}">click here</a>.</p>
  </body>
</html>`;

  const blob = new Blob([launcherHtml], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = 'DoFirst-WebApp.html';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(blobUrl);
}

export default function InstallAppButton() {
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
        downloadWebAppLauncher();
        setFeedback('Download started. Open DoFirst-WebApp.html from your Downloads folder to launch the web app.');
      }
    } finally {
      setIsOpeningPrompt(false);
    }
  }

  if (isInstalled && !showSuccess) {
    return null;
  }

  const shouldShowButton = !isInstalled;
  const buttonLabel = canInstall || isIos ? 'Install App' : 'Download App';

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
