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
    <form className="space-y-5" onSubmit={onSubmit} data-testid={dataTestId}>
      <div className="space-y-2">
        <label className="font-display text-xs uppercase tracking-[0.3em] text-ink/60" htmlFor={`${dataTestId}-email`}>
          Email
        </label>
        <input
          id={`${dataTestId}-email`}
          type="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          autoComplete="email"
          required
          className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 font-body text-base outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
        />
      </div>

      <div className="space-y-2">
        <label className="font-display text-xs uppercase tracking-[0.3em] text-ink/60" htmlFor={`${dataTestId}-password`}>
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
          className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 font-body text-base outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-ember/20 bg-ember/10 px-4 py-3 font-body text-sm text-ember">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-ember px-5 py-3 font-display text-xs uppercase tracking-[0.35em] text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Working...' : submitLabel}
      </button>
    </form>
  );
}
