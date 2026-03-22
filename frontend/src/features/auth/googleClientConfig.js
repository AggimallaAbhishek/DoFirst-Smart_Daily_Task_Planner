function readEnv(key) {
  const value = import.meta.env[key];
  return typeof value === 'string' ? value.trim() : '';
}

export function resolveGoogleAuthConfig() {
  const sharedClientId = readEnv('VITE_GOOGLE_CLIENT_ID');
  const webClientId = readEnv('VITE_GOOGLE_WEB_CLIENT_ID') || sharedClientId;
  const nativeClientId =
    readEnv('VITE_GOOGLE_NATIVE_CLIENT_ID') ||
    readEnv('VITE_GOOGLE_ANDROID_CLIENT_ID') ||
    sharedClientId ||
    webClientId;
  const redirectUri = readEnv('VITE_GOOGLE_REDIRECT_URI') || 'postmessage';

  return {
    webClientId,
    nativeClientId,
    redirectUri
  };
}

