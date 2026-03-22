import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthTemplatePage from '../components/AuthTemplatePage';
import { requestGoogleAuthCode } from '../features/auth/googleOAuth';
import { useAuth } from '../features/auth/useAuth';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loginWithGoogle, getApiErrorMessage } = useAuth();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const googleRedirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;

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
      const code = await requestGoogleAuthCode({
        clientId: googleClientId,
        redirectUri: googleRedirectUri
      });
      await loginWithGoogle(code);
      navigate('/', { replace: true });
    } catch (googleError) {
      throw new Error(getApiErrorMessage(googleError, 'Unable to sign in with Google.'));
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
