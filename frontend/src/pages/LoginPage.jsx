import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthTemplatePage from '../components/AuthTemplatePage';
import { resolveGoogleAuthConfig } from '../features/auth/googleClientConfig';
import { requestGoogleAuthCode } from '../features/auth/googleOAuth';
import { isNativeRuntime, requestNativeGoogleIdToken } from '../features/auth/nativeGoogleOAuth';
import { useAuth } from '../features/auth/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, getApiErrorMessage } = useAuth();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const googleConfig = resolveGoogleAuthConfig();

  async function handleSubmit(credentials) {
    setError('');
    setIsSubmitting(true);

    try {
      await login({
        email: credentials.email,
        password: credentials.password
      });
      navigate('/', { replace: true });
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, 'Unable to log in.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setError('');
    setIsSubmitting(true);

    try {
      if (isNativeRuntime()) {
        const idToken = await requestNativeGoogleIdToken({
          clientId: googleConfig.nativeClientId
        });
        await loginWithGoogle({ idToken });
      } else {
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
      mode="signin"
      error={error}
      isSubmitting={isSubmitting}
      onSubmitCredentials={handleSubmit}
      onGoogleSignIn={handleGoogleSignIn}
      onClearError={() => setError('')}
    />
  );
}
