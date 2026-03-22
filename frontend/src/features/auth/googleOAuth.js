const GOOGLE_SCRIPT_ID = 'google-identity-services';
const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

let scriptLoadPromise;

function getGoogleAccountsApi() {
  return window.google?.accounts?.oauth2;
}

function loadGoogleScript() {
  if (getGoogleAccountsApi()) {
    return Promise.resolve(window.google);
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Unable to load Google Identity Services.')), {
        once: true
      });
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Unable to load Google Identity Services.'));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

export async function requestGoogleAuthCode({ clientId, redirectUri: requestedRedirectUri }) {
  if (!clientId) {
    throw new Error('Google sign-in is not configured. Add VITE_GOOGLE_CLIENT_ID.');
  }

  const configuredRedirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI?.trim();
  const redirectUri = requestedRedirectUri?.trim() || configuredRedirectUri || 'postmessage';

  await loadGoogleScript();
  const oauthApi = getGoogleAccountsApi();

  if (!oauthApi) {
    throw new Error('Google sign-in is currently unavailable.');
  }

  return new Promise((resolve, reject) => {
    const client = oauthApi.initCodeClient({
      client_id: clientId,
      scope: 'openid email profile',
      ux_mode: 'popup',
      redirect_uri: redirectUri,
      select_account: true,
      callback: (response) => {
        if (!response) {
          reject(new Error('Google sign-in was interrupted. Please try again.'));
          return;
        }

        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }

        if (!response.code) {
          reject(new Error('Google sign-in did not return an authorization code.'));
          return;
        }

        resolve(response.code);
      },
      error_callback: (error) => {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.debug('[Google OAuth] error_callback', error);
        }
        reject(new Error(error?.message || error?.type || 'Google sign-in failed.'));
      }
    });

    client.requestCode();
  });
}
