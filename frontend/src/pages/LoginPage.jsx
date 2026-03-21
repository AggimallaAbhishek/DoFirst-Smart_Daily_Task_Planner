import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../features/auth/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, getApiErrorMessage } = useAuth();
  const [form, setForm] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(form);
      navigate('/', { replace: true });
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, 'Unable to log in.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Log in"
      description="Sign in to reopen today’s board and keep the priority order intact."
      footerText="Need an account?"
      footerLinkText="Create one"
      footerLinkTo="/register"
    >
      <AuthForm
        email={form.email}
        password={form.password}
        error={error}
        isSubmitting={isSubmitting}
        onEmailChange={(email) => setForm((current) => ({ ...current, email }))}
        onPasswordChange={(password) => setForm((current) => ({ ...current, password }))}
        onSubmit={handleSubmit}
        submitLabel="Log in"
        dataTestId="login-form"
      />
    </AuthLayout>
  );
}
