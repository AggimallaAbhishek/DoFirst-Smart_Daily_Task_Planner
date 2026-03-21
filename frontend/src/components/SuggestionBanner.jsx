import { formatEstimatedMinutes } from '../lib/formatters';

export default function SuggestionBanner({ task }) {
  if (!task) {
    return (
      <section className="panel suggestion-panel suggestion-empty">
        <p className="section-label">Do This First</p>
        <h2 className="panel-title">No task is blocking the day right now.</h2>
        <p className="panel-copy">
          Add a task or finish the remaining checklist. The banner will promote the next priority automatically.
        </p>
      </section>
    );
  }

  return (
    <section className="panel suggestion-panel" data-testid="suggestion-banner">
      <p className="section-label">Do This First</p>
      <div className="suggestion-layout">
        <div>
          <h2 className="panel-title suggestion-title">{task.title}</h2>
          <p className="panel-copy">
            Priority {task.priority} · {formatEstimatedMinutes(task.estimatedMinutes)}
          </p>
        </div>
        <div className="suggestion-reason">
          <p className="muted-kicker">Reason</p>
          <p className="panel-copy">
            Highest priority incomplete task, ordered ahead of everything else on today’s list.
          </p>
        </div>
      </div>
    </section>
  );
}
