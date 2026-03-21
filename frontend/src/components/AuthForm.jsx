export default function AuthForm({
  email,
  password,
  error,
  isSubmitting,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  submitLabel,
  dataTestId
}) {
  return (
    <form className="task-form auth-form" onSubmit={onSubmit} data-testid={dataTestId}>
      <div className="form-group">
        <label className="form-label" htmlFor={`${dataTestId}-email`}>
          Email
        </label>
        <input
          id={`${dataTestId}-email`}
          type="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          autoComplete="email"
          required
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor={`${dataTestId}-password`}>
          Password
        </label>
        <input
          id={`${dataTestId}-password`}
          type="password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          autoComplete="current-password"
          required
          minLength={8}
          className="form-input"
        />
      </div>

      {error ? (
        <div className="status-banner status-error">{error}</div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="form-submit interactive auth-submit"
      >
        {isSubmitting ? 'Working...' : submitLabel}
        <span className="form-submit-arrow">→</span>
      </button>
    </form>
  );
}
