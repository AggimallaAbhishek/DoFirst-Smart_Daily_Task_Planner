import { formatEstimatedMinutes } from '../lib/formatters';

export default function SuggestionBanner({ task }) {
  if (!task) {
    return (
      <section className="rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-card backdrop-blur">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-moss">Do This First</p>
        <h2 className="mt-3 font-display text-2xl font-semibold">No task is blocking the day right now.</h2>
        <p className="mt-2 max-w-2xl font-body text-base text-ink/70">
          Add a task or finish the remaining checklist. The banner will promote the next priority automatically.
        </p>
      </section>
    );
  }

  return (
    <section
      className="rounded-[2rem] border border-gold/40 bg-gradient-to-br from-gold/90 via-[#f5c45d] to-ember/85 p-6 text-ink shadow-card"
      data-testid="suggestion-banner"
    >
      <p className="font-display text-xs uppercase tracking-[0.35em] text-ink/70">Do This First</p>
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">{task.title}</h2>
          <p className="font-body text-base text-ink/80">
            Priority {task.priority} · {formatEstimatedMinutes(task.estimatedMinutes)}
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-ink/10 bg-white/35 px-5 py-4">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-ink/60">Reason</p>
          <p className="mt-2 max-w-xs font-body text-base text-ink/85">
            Highest priority incomplete task, ordered ahead of everything else on today’s list.
          </p>
        </div>
      </div>
    </section>
  );
}
