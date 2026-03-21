import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthTemplatePage from '../components/AuthTemplatePage';
import { useAuth } from '../features/auth/useAuth';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, getApiErrorMessage } = useAuth();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <AuthTemplatePage
      mode="signup"
      error={error}
      isSubmitting={isSubmitting}
      onSubmitCredentials={handleSubmit}
      onClearError={() => setError('')}
    />
  );
}
