import { useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import AuthTemplatePage from '../components/AuthTemplatePage';
import { resolveGoogleAuthConfig } from '../features/auth/googleClientConfig';
import { useAuth } from '../features/auth/useAuth';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loginWithGoogle, getApiErrorMessage } = useAuth();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const googleConfig = useMemo(() => resolveGoogleAuthConfig(), []);

  async function handleSubmit(credentials) {
    setError('');
    setIsSubmitting(true);

    try {
      await register({
        email: credentials.email,
        password: credentials.password
      });
      navigate('/', { replace: true });
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, 'Unable to create your account.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setError('');
    setIsSubmitting(true);

    try {
      if (Capacitor.isNativePlatform()) {
        const { requestNativeGoogleIdToken } = await import('../features/auth/nativeGoogleOAuth');
        const idToken = await requestNativeGoogleIdToken({
          clientId: googleConfig.nativeClientId
        });
        await loginWithGoogle({ idToken });
      } else {
        const { requestGoogleAuthCode } = await import('../features/auth/googleOAuth');
        const code = await requestGoogleAuthCode({
          clientId: googleConfig.webClientId,
          redirectUri: googleConfig.redirectUri
        });
        await loginWithGoogle({ code });
      }
      navigate('/', { replace: true });
    } catch (googleError) {
      setError(getApiErrorMessage(googleError, 'Unable to sign in with Google.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthTemplatePage
      mode="signup"
      error={error}
      isSubmitting={isSubmitting}
      onSubmitCredentials={handleSubmit}
      onGoogleSignIn={handleGoogleSignIn}
      onClearError={() => setError('')}
    />
  );
}
