import { useEffect, useState } from 'react';

function buildInitialForm(taskDate) {
  return {
    title: '',
    priority: 'high',
    estimatedMinutes: 30,
    taskDate
  };
}

export default function TaskForm({ onSubmit, taskCount, isSubmitting, selectedDate }) {
  const [form, setForm] = useState(() => buildInitialForm(selectedDate));
  const [error, setError] = useState('');
  const limitReached = taskCount >= 5;

  useEffect(() => {
    setForm((current) => ({
      ...current,
      taskDate: selectedDate
    }));
  }, [selectedDate]);

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

    if (!form.taskDate) {
      setError('Please choose a due date for this task.');
      return;
    }

    setError('');

    await onSubmit({
      title: form.title.trim(),
      priority: form.priority,
      estimatedMinutes: Number(form.estimatedMinutes),
      taskDate: form.taskDate
    });

    setForm(buildInitialForm(form.taskDate));
  }

  return (
    <section className="panel task-form-panel reveal">
      <div>
        <p className="section-label">Plan Tasks</p>
        <h2 className="panel-title">Add the next task to the board.</h2>
      </div>

      <form className="task-form" onSubmit={handleSubmit} data-testid="task-form">
        <div className="form-group">
          <label className="form-label" htmlFor="task-title">
            Task title
          </label>
          <input
            id="task-title"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            maxLength={255}
            required
            className="form-input"
            placeholder="Write proposal, revise slides, call teammate..."
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="task-priority">
              Priority
            </label>
            <select
              id="task-priority"
              value={form.priority}
              onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
              className="form-select form-input"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task-estimate">
              Estimated time
            </label>
            <select
              id="task-estimate"
              value={form.estimatedMinutes}
              onChange={(event) =>
                setForm((current) => ({ ...current, estimatedMinutes: Number(event.target.value) }))
              }
              className="form-select form-input"
            >
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={60}>1 hr</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task-date">
              Due date
            </label>
            <input
              className="form-input"
              id="task-date"
              onChange={(event) => setForm((current) => ({ ...current, taskDate: event.target.value }))}
              type="date"
              value={form.taskDate}
            />
          </div>
        </div>

        <div className="task-form-footer">
          <p className="panel-copy">
            {limitReached
              ? 'Daily limit reached. Complete or remove a task before adding another.'
              : `${5 - taskCount} slots left for the selected day.`}
          </p>
          <button
            type="submit"
            disabled={isSubmitting || limitReached}
            className="form-submit interactive"
          >
            {isSubmitting ? 'Adding...' : 'Add task'}
            <span aria-hidden="true" className="form-submit-arrow">→</span>
          </button>
        </div>

        {error ? (
          <div className="status-banner status-error">{error}</div>
        ) : null}
      </form>
    </section>
  );
}
