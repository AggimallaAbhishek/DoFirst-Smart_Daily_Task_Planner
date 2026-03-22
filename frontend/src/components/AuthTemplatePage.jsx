import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GOOGLE_ICON = (
  <svg className="authx-google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

function defaultTheme() {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function AuthTemplatePage({
  mode,
  error,
  successMessage,
  isSubmitting,
  onSubmitCredentials,
  onClearError,
  onGoogleSignIn
}) {
  const isSignup = mode === 'signup';
  const visualPanelRef = useRef(null);
  const [theme, setTheme] = useState(defaultTheme);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [localError, setLocalError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    remember: false
  });

  useEffect(() => {
    setLocalError('');
    setFieldErrors({});
    setPasswordVisible(false);
  }, [mode]);

  const resolvedError = localError || error;

  const copy = useMemo(() => {
    if (isSignup) {
      return {
        title: 'Create an account',
        subtitle: 'Start your free journey and plan your days with intention.',
        submitLabel: 'Create account'
      };
    }

    return {
      title: 'Welcome back',
      subtitle: 'Sign in to continue to your workspace',
      submitLabel: 'Sign in'
    };
  }, [isSignup]);

  useEffect(() => {
    const panel = visualPanelRef.current;
    if (!panel) {
      return undefined;
    }

    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      return undefined;
    }

    const orbs = panel.querySelectorAll('.authx-geo-orb');
    let frameId = null;
    let pointerX = 0.5;
    let pointerY = 0.5;

    const render = () => {
      frameId = null;

      orbs.forEach((orb, index) => {
        const factor = (index + 1) * 18;
        const dx = (pointerX - 0.5) * factor;
        const dy = (pointerY - 0.5) * factor;
        orb.style.transform = `translate(${dx}px, ${dy}px)`;
      });
    };

    const requestRender = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(render);
    };

    const handleMouseMove = (event) => {
      const bounds = panel.getBoundingClientRect();
      pointerX = (event.clientX - bounds.left) / bounds.width;
      pointerY = (event.clientY - bounds.top) / bounds.height;
      requestRender();
    };

    const handleMouseLeave = () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
        frameId = null;
      }

      orbs.forEach((orb) => {
        orb.style.transform = '';
      });
    };

    panel.addEventListener('mousemove', handleMouseMove, { passive: true });
    panel.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      panel.removeEventListener('mousemove', handleMouseMove);
      panel.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value
    }));

    if (fieldErrors[name]) {
      setFieldErrors((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    }

    if (localError) {
      setLocalError('');
    }

    if (error && onClearError) {
      onClearError();
    }
  }

  async function handleGoogleSignIn() {
    if (googleLoading || isSubmitting) {
      return;
    }

    setLocalError('');
    if (onClearError) {
      onClearError();
    }

    if (!onGoogleSignIn) {
      setLocalError('Google sign-in is not configured yet. Please use email and password.');
      return;
    }

    setGoogleLoading(true);

    try {
      await onGoogleSignIn();
    } catch (googleError) {
      setLocalError(googleError?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {};
    const normalizedEmail = form.email.trim();

    if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
      nextErrors.email = true;
    }

    if (!form.password || form.password.length < 8) {
      nextErrors.password = true;
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setLocalError('Please check your form and try again.');
      return;
    }

    setLocalError('');
    if (onClearError) {
      onClearError();
    }

    if (import.meta.env.DEV) {
      // Debug-only auth event to trace mode-specific submissions during development.
      // eslint-disable-next-line no-console
      console.debug('[AuthTemplatePage] submit', {
        mode,
        email: normalizedEmail
      });
    }

    await onSubmitCredentials({
      fullName: form.fullName.trim(),
      email: normalizedEmail,
      password: form.password,
      remember: form.remember
    });
  }

  return (
    <div className="authx-page" data-theme={theme}>
      <div className="authx-layout">
        <aside className="authx-visual-panel" id="authx-visual-panel" ref={visualPanelRef}>
          <div className="authx-geo-canvas">
            <div className="authx-geo-grid" />
            <div className="authx-geo-orb authx-geo-orb-1" />
            <div className="authx-geo-orb authx-geo-orb-2" />
            <div className="authx-geo-orb authx-geo-orb-3" />
          </div>

          <Link className="authx-brand" to="/">
            <div className="authx-brand-mark">
              <img
                className="authx-brand-logo"
                src="/DoFirst.png"
                alt="DoFirst logo"
                width="352"
                height="192"
                decoding="async"
                loading="eager"
              />
            </div>
            <span className="authx-brand-name">DoFirst</span>
          </Link>

          <div className="authx-visual-content">
            <h2 className="authx-visual-headline">
              Plan <em>faster</em> than you thought possible.
            </h2>
            <p className="authx-visual-sub">
              Join people who build their day with clarity. Priority-first planning turns overwhelm into execution.
            </p>

            <div className="authx-feature-cards">
              <div className="authx-feature-card">
                <div className="authx-feature-icon authx-icon-indigo">⚡</div>
                <div>
                  <div className="authx-feature-title">Instant prioritization</div>
                  <div className="authx-feature-desc">Top task always visible</div>
                </div>
              </div>
              <div className="authx-feature-card">
                <div className="authx-feature-icon authx-icon-rose">✓</div>
                <div>
                  <div className="authx-feature-title">Daily completion tracking</div>
                  <div className="authx-feature-desc">Progress updates in real time</div>
                </div>
              </div>
              <div className="authx-feature-card">
                <div className="authx-feature-icon authx-icon-amber">🔒</div>
                <div>
                  <div className="authx-feature-title">Secure by default</div>
                  <div className="authx-feature-desc">JWT auth with rate-limited APIs</div>
                </div>
              </div>
            </div>

            <div className="authx-social-proof">
              <div className="authx-avatars">
                <div className="authx-avatar authx-avatar-1">AB</div>
                <div className="authx-avatar authx-avatar-2">SK</div>
                <div className="authx-avatar authx-avatar-3">RP</div>
                <div className="authx-avatar authx-avatar-4">NJ</div>
                <div className="authx-avatar authx-avatar-5">+</div>
              </div>
              <p className="authx-proof-text">
                <strong>Thousands of focused users</strong> build better days with DoFirst
              </p>
            </div>
          </div>
        </aside>

        <main className="authx-auth-panel">
          <button
            aria-label="Toggle light or dark theme"
            className="authx-theme-toggle"
            onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            type="button"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <Link className="authx-mobile-brand" to="/">
            <div className="authx-mobile-brand-mark">
              <img
                className="authx-mobile-brand-logo"
                src="/DoFirst.png"
                alt="DoFirst logo"
                width="352"
                height="192"
                decoding="async"
                loading="eager"
              />
            </div>
            <span className="authx-mobile-brand-name">DoFirst</span>
          </Link>

          <div className="authx-card">
            <div className="authx-header">
              <h1 className="authx-title">{copy.title}</h1>
              <p className="authx-sub">{copy.subtitle}</p>
            </div>

            <div className={`authx-toast authx-toast-success ${successMessage ? 'visible' : ''}`} role="status">
              <span className="authx-toast-icon">✓</span>
              <span>{successMessage || 'Success'}</span>
            </div>

            <div className={`authx-toast authx-toast-error ${resolvedError ? 'visible' : ''}`} role="alert">
              <span className="authx-toast-icon">⚠</span>
              <span>{resolvedError || 'Error'}</span>
            </div>

            <div aria-label="Authentication mode" className="authx-tabs" role="tablist">
              <Link
                aria-selected={!isSignup}
                className={`authx-tab ${!isSignup ? 'active' : ''}`}
                role="tab"
                to="/login"
              >
                Sign in
              </Link>
              <Link
                aria-selected={isSignup}
                className={`authx-tab ${isSignup ? 'active' : ''}`}
                role="tab"
                to="/register"
              >
                Create account
              </Link>
            </div>

            <button
              aria-label="Continue with Google"
              className="authx-btn-google"
              disabled={googleLoading || isSubmitting}
              onClick={handleGoogleSignIn}
              type="button"
            >
              {GOOGLE_ICON}
              <span className={`authx-google-text ${googleLoading ? 'hidden' : ''}`}>Continue with Google</span>
              <div className={`authx-btn-spinner ${googleLoading ? 'visible' : ''}`} />
            </button>

            <div className="authx-divider">
              <div className="authx-divider-line" />
              <span className="authx-divider-text">or with email</span>
              <div className="authx-divider-line" />
            </div>

            <form className={resolvedError ? 'authx-form authx-shake' : 'authx-form'} onSubmit={handleSubmit} noValidate>
              <div className={`authx-signup-fields ${isSignup ? 'open' : ''}`}>
                <div className="authx-form-group">
                  <label className="authx-form-label" htmlFor="authx-fullname">
                    Full name
                  </label>
                  <input
                    autoComplete="name"
                    className={`authx-form-input ${fieldErrors.fullName ? 'error' : ''}`}
                    id="authx-fullname"
                    onChange={(event) => updateField('fullName', event.target.value)}
                    placeholder="Jane Doe"
                    type="text"
                    value={form.fullName}
                  />
                </div>
              </div>

              <div className="authx-form-group">
                <label className="authx-form-label" htmlFor="authx-email">
                  Email
                </label>
                <input
                  autoComplete="email"
                  className={`authx-form-input ${fieldErrors.email ? 'error' : ''}`}
                  id="authx-email"
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="you@company.com"
                  required
                  type="email"
                  value={form.email}
                />
              </div>

              <div className="authx-form-group">
                <label className="authx-form-label" htmlFor="authx-password">
                  Password
                </label>
                <div className="authx-input-wrap">
                  <input
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    className={`authx-form-input ${fieldErrors.password ? 'error' : ''}`}
                    id="authx-password"
                    minLength={8}
                    onChange={(event) => updateField('password', event.target.value)}
                    placeholder="••••••••"
                    required
                    type={passwordVisible ? 'text' : 'password'}
                    value={form.password}
                  />
                  <button
                    aria-label={passwordVisible ? 'Hide characters' : 'Show characters'}
                    className="authx-pw-toggle"
                    onClick={() => setPasswordVisible((current) => !current)}
                    type="button"
                  >
                    {passwordVisible ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              {!isSignup ? (
                <div className="authx-form-meta">
                  <label className="authx-remember">
                    <input
                      checked={form.remember}
                      onChange={(event) => updateField('remember', event.target.checked)}
                      type="checkbox"
                    />
                    <span className="authx-remember-box" />
                    <span className="authx-remember-label">Remember me</span>
                  </label>
                  <a className="authx-forgot-link" href="#">
                    Forgot password?
                  </a>
                </div>
              ) : null}

              <button className="authx-btn-submit" disabled={isSubmitting} type="submit">
                <span>{isSubmitting ? 'Please wait…' : copy.submitLabel}</span>
                <span className="authx-btn-arrow">→</span>
              </button>
            </form>

            <p className="authx-terms">
              By continuing, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
            </p>

            <div className="authx-security">
              <div className="authx-security-dot" />
              <span>256-bit SSL encrypted · SOC 2 aligned controls</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
