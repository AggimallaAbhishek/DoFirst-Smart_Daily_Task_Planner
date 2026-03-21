import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../features/auth/useAuth';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, getApiErrorMessage } = useAuth();
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
      await register(form);
      navigate('/', { replace: true });
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, 'Unable to create your account.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Start clean"
      title="Create account"
      description="Create an account and the planner will take you straight to today’s workspace."
      footerText="Already have an account?"
      footerLinkText="Log in"
      footerLinkTo="/login"
    >
      <AuthForm
        email={form.email}
        password={form.password}
        error={error}
        isSubmitting={isSubmitting}
        onEmailChange={(email) => setForm((current) => ({ ...current, email }))}
        onPasswordChange={(password) => setForm((current) => ({ ...current, password }))}
        onSubmit={handleSubmit}
        submitLabel="Create account"
        dataTestId="register-form"
      />
    </AuthLayout>
  );
}
