import { useState } from 'react';

const initialForm = {
  title: '',
  priority: 'high',
  estimatedMinutes: 30
};

export default function TaskForm({ onSubmit, taskCount, isSubmitting }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const limitReached = taskCount >= 5;

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim()) {
      setError('Task title is required.');
      return;
    }

    if (limitReached) {
      setError('You can only plan up to 5 tasks for today.');
      return;
    }

    setError('');

    await onSubmit({
      title: form.title.trim(),
      priority: form.priority,
      estimatedMinutes: Number(form.estimatedMinutes)
    });

    setForm(initialForm);
  }

  return (
    <section className="rounded-[2rem] border border-white/60 bg-white/75 p-6 shadow-card backdrop-blur">
      <div className="space-y-2">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-slate">Plan Today</p>
        <h2 className="font-display text-3xl font-semibold">Add the next task to the board.</h2>
      </div>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit} data-testid="task-form">
        <div className="space-y-2">
          <label className="font-display text-xs uppercase tracking-[0.3em] text-ink/60" htmlFor="task-title">
            Task title
          </label>
          <input
            id="task-title"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            maxLength={255}
            required
            className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 font-body text-base outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
            placeholder="Write proposal, revise slides, call teammate..."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="font-display text-xs uppercase tracking-[0.3em] text-ink/60" htmlFor="task-priority">
              Priority
            </label>
            <select
              id="task-priority"
              value={form.priority}
              onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
              className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 font-body text-base outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="font-display text-xs uppercase tracking-[0.3em] text-ink/60" htmlFor="task-estimate">
              Estimated time
            </label>
            <select
              id="task-estimate"
              value={form.estimatedMinutes}
              onChange={(event) =>
                setForm((current) => ({ ...current, estimatedMinutes: Number(event.target.value) }))
              }
              className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 font-body text-base outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/20"
            >
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={60}>1 hr</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body text-sm text-ink/65">
            {limitReached
              ? 'Daily limit reached. Complete or remove a task before adding another.'
              : `${5 - taskCount} slots left for today.`}
          </p>
          <button
            type="submit"
            disabled={isSubmitting || limitReached}
            className="rounded-full bg-moss px-6 py-3 font-display text-xs uppercase tracking-[0.35em] text-white transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Adding...' : 'Add task'}
          </button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-ember/20 bg-ember/10 px-4 py-3 font-body text-sm text-ember">
            {error}
          </div>
        ) : null}
      </form>
    </section>
  );
}
