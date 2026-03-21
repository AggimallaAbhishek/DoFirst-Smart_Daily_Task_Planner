import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthTemplatePage from '../components/AuthTemplatePage';
import { useAuth } from '../features/auth/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, getApiErrorMessage } = useAuth();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <AuthTemplatePage
      mode="signin"
      error={error}
      isSubmitting={isSubmitting}
      onSubmitCredentials={handleSubmit}
      onClearError={() => setError('')}
    />
  );
}
