import { formatEstimatedMinutes } from '../lib/formatters';

const priorityAccent = {
  high: 'task-priority-high',
  medium: 'task-priority-medium',
  low: 'task-priority-low'
};

export default function TaskList({ tasks, onToggleComplete, onDelete, isWorking }) {
  if (tasks.length === 0) {
    return (
      <section className="panel task-list-panel task-list-empty reveal">
        <p className="section-label">No tasks yet</p>
        <h2 className="panel-title">Start the plan with one clear task.</h2>
        <p className="panel-copy">
          Keep it lean. The product is intentionally limited to five tasks per day.
        </p>
      </section>
    );
  }

  return (
    <section className="panel task-list-panel reveal">
      <div className="task-list-header">
        <div>
          <p className="section-label">Today&apos;s board</p>
          <h2 className="panel-title">Prioritized checklist</h2>
        </div>
        <p className="panel-copy">Incomplete tasks always stay above completed ones.</p>
      </div>

      <div className="task-list">
        {tasks.map((task) => (
          <article
            key={task.id}
            className={`task-item ${task.isCompleted ? 'completed' : ''}`}
            data-testid="task-item"
          >
            <div className={`task-priority ${priorityAccent[task.priority]}`} aria-hidden="true" />

            <div className="task-content">
              <div className="task-title-row">
                <h3 className="task-title">
                  {task.title}
                </h3>
                <span className="task-tag">
                  {task.priority}
                </span>
              </div>
              <p className="panel-copy">
                {formatEstimatedMinutes(task.estimatedMinutes)} · {task.isCompleted ? 'Completed' : 'Pending'}
              </p>
            </div>

            <div className="task-actions">
              <button
                type="button"
                onClick={() => onToggleComplete(task)}
                disabled={isWorking}
                className="task-action complete interactive"
              >
                {task.isCompleted ? 'Undo' : 'Complete'}
              </button>
              <button
                type="button"
                onClick={() => onDelete(task)}
                disabled={isWorking}
                className="task-action delete interactive"
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
