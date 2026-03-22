import { SocialLogin } from '@capgo/capacitor-social-login';
import { Capacitor } from '@capacitor/core';

let initializePromise;

function normalizeErrorMessage(error) {
  const message = error?.message || 'Google sign-in failed.';
  const normalized = message.toLowerCase();

  if (normalized.includes('cancel')) {
    return 'Google sign-in was cancelled.';
  }

  if (normalized.includes('network')) {
    return 'Google sign-in failed due to network issues. Please try again.';
  }

  return message;
}

export function isNativeRuntime() {
  return Capacitor.isNativePlatform();
}

async function initializeNativeGoogle(clientId) {
  if (initializePromise) {
    return initializePromise;
  }

  initializePromise = SocialLogin.initialize({
    google: {
      webClientId: clientId,
      mode: 'online'
    }
  }).catch((error) => {
    initializePromise = null;
    throw error;
  });

  return initializePromise;
}

export async function requestNativeGoogleIdToken({ clientId }) {
  if (!isNativeRuntime()) {
    throw new Error('Native Google sign-in is only available in mobile app builds.');
  }

  if (!clientId) {
    throw new Error('Google sign-in is not configured. Add VITE_GOOGLE_CLIENT_ID.');
  }

  try {
    await initializeNativeGoogle(clientId);
    const result = await SocialLogin.login({
      provider: 'google',
      options: {
        scopes: ['email', 'profile']
      }
    });

    const idToken = result?.result?.responseType === 'online' ? result.result.idToken : null;

    if (!idToken) {
      throw new Error('Google sign-in did not return an ID token.');
    }

    return idToken;
  } catch (error) {
    throw new Error(normalizeErrorMessage(error));
  }
}
