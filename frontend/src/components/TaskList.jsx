import { formatEstimatedMinutes } from '../lib/formatters';

const priorityAccent = {
  high: 'bg-ember',
  medium: 'bg-gold',
  low: 'bg-slate'
};

export default function TaskList({ tasks, onToggleComplete, onDelete, isWorking }) {
  if (tasks.length === 0) {
    return (
      <section className="rounded-[2rem] border border-dashed border-ink/20 bg-white/60 p-8 text-center shadow-card">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-ink/55">No tasks yet</p>
        <h2 className="mt-3 font-display text-3xl font-semibold">Start the plan with one clear task.</h2>
        <p className="mt-2 font-body text-base text-ink/70">
          Keep it lean. The product is intentionally limited to five tasks per day.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-white/60 bg-white/75 p-6 shadow-card backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.35em] text-slate">Today&apos;s board</p>
          <h2 className="mt-2 font-display text-3xl font-semibold">Prioritized checklist</h2>
        </div>
        <p className="font-body text-sm text-ink/65">Incomplete tasks always stay above completed ones.</p>
      </div>

      <div className="mt-6 space-y-4">
        {tasks.map((task) => (
          <article
            key={task.id}
            className={`grid gap-4 rounded-[1.75rem] border border-ink/10 p-5 transition sm:grid-cols-[auto_1fr_auto] sm:items-center ${
              task.isCompleted ? 'bg-ink/5' : 'bg-white'
            }`}
            data-testid="task-item"
          >
            <div className={`h-12 w-3 rounded-full ${priorityAccent[task.priority]}`} aria-hidden="true" />

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h3
                  className={`font-display text-2xl font-semibold ${
                    task.isCompleted ? 'text-ink/45 line-through' : 'text-ink'
                  }`}
                >
                  {task.title}
                </h3>
                <span className="rounded-full bg-parchment px-3 py-1 font-display text-[11px] uppercase tracking-[0.3em] text-ink/70">
                  {task.priority}
                </span>
              </div>
              <p className="font-body text-base text-ink/65">
                {formatEstimatedMinutes(task.estimatedMinutes)} · {task.isCompleted ? 'Completed' : 'Pending'}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => onToggleComplete(task)}
                disabled={isWorking}
                className="rounded-full border border-moss/30 px-4 py-2 font-display text-xs uppercase tracking-[0.3em] text-moss transition hover:bg-moss hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {task.isCompleted ? 'Undo' : 'Complete'}
              </button>
              <button
                type="button"
                onClick={() => onDelete(task)}
                disabled={isWorking}
                className="rounded-full border border-ember/30 px-4 py-2 font-display text-xs uppercase tracking-[0.3em] text-ember transition hover:bg-ember hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
