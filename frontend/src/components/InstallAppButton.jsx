import { useEffect, useState } from 'react';
import { usePwaInstall } from '../hooks/usePwaInstall';

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
        if (isSafari) {
          setFeedback('Use Safari menu to install: Share -> Add to Home Screen.');
        } else {
          setFeedback('Use Chrome or Edge menu: open settings and choose "Install app".');
        }
      }
    } finally {
      setIsOpeningPrompt(false);
    }
  }

  if (isInstalled && !showSuccess) {
    return null;
  }

  const shouldShowButton = !isInstalled;
  const buttonLabel = canInstall || isIos ? 'Install App' : 'How to Install';

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
