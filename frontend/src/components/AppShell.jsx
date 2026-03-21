import { formatTodayLabel } from '../lib/formatters';

export default function AppShell({ user, onLogout, children }) {
  return (
    <div className="min-h-screen bg-planner-texture text-ink">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-white/50 bg-white/70 p-6 shadow-card backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <span className="inline-flex rounded-full border border-ink/15 bg-parchment px-4 py-1 font-display text-xs uppercase tracking-[0.35em] text-ink/70">
                Smart Daily Planner
              </span>
              <div className="space-y-2">
                <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
                  Focus the day around the task that matters most.
                </h1>
                <p className="max-w-2xl font-body text-lg text-ink/75">
                  Plan up to five tasks, rank them clearly, and let the planner keep
                  your next move obvious.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-[1.5rem] bg-ink px-5 py-4 text-parchment sm:min-w-72">
              <p className="font-display text-xs uppercase tracking-[0.3em] text-parchment/60">
                Today
              </p>
              <p className="font-body text-xl">{formatTodayLabel()}</p>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-display text-xs uppercase tracking-[0.3em] text-parchment/60">
                    Signed in
                  </p>
                  <p className="break-all font-body text-base">{user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-full border border-parchment/30 px-4 py-2 font-display text-xs uppercase tracking-[0.28em] transition hover:bg-parchment hover:text-ink"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="py-8">{children}</main>
      </div>
    </div>
  );
}
