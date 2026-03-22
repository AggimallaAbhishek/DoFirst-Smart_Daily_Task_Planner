import { useRef } from 'react';
import { formatEstimatedMinutes } from '../lib/formatters';

const priorityAccent = {
  high: 'task-priority-high',
  medium: 'task-priority-medium',
  low: 'task-priority-low'
};

export default function TaskList({
  tasks,
  onToggleComplete,
  onDelete,
  isWorking,
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  onReorder,
  hasActiveFilters,
  onResetFilters
}) {
  const draggingTaskIdRef = useRef(null);

  function handleDragStart(event, taskId) {
    draggingTaskIdRef.current = taskId;
    event.currentTarget.classList.add('dragging');

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', taskId);
    }
  }

  function handleDragEnd(event) {
    event.currentTarget.classList.remove('dragging');
    draggingTaskIdRef.current = null;
  }

  function handleDrop(event, targetTaskId) {
    event.preventDefault();
    const draggedTaskId =
      draggingTaskIdRef.current ||
      event.dataTransfer?.getData('text/plain') ||
      null;

    if (!draggedTaskId || draggedTaskId === targetTaskId) {
      return;
    }

    onReorder(draggedTaskId, targetTaskId);
    draggingTaskIdRef.current = null;
  }

  if (tasks.length === 0) {
    return (
      <section className="panel task-list-panel task-list-empty reveal">
        <p className="section-label">{hasActiveFilters ? 'No matches' : 'No tasks yet'}</p>
        <h2 className="panel-title">
          {hasActiveFilters ? 'No task matches the current filters.' : 'Start the plan with one clear task.'}
        </h2>
        <p className="panel-copy">
          {hasActiveFilters
            ? 'Try adjusting search, priority, status, or focus mode to see tasks again.'
            : 'Keep it lean. The product is intentionally limited to five tasks per day.'}
        </p>
        {hasActiveFilters ? (
          <button className="task-filter-reset" onClick={onResetFilters} type="button">
            Clear filters
          </button>
        ) : null}
      </section>
    );
  }

  return (
    <section className="panel task-list-panel reveal">
      <div className="task-list-header">
        <div>
          <p className="section-label">Planned board</p>
          <h2 className="panel-title">Prioritized checklist</h2>
        </div>
        <p className="panel-copy">Incomplete tasks always stay above completed ones.</p>
      </div>

      <div className="task-filter-grid">
        <label className="task-filter-field">
          <span className="form-label">Search</span>
          <input
            className="form-input"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by title..."
            type="search"
            value={searchValue}
          />
        </label>

        <label className="task-filter-field">
          <span className="form-label">Status</span>
          <select
            className="form-select form-input"
            onChange={(event) => onStatusFilterChange(event.target.value)}
            value={statusFilter}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </label>

        <label className="task-filter-field">
          <span className="form-label">Level filter</span>
          <select
            className="form-select form-input"
            aria-label="Level filter"
            onChange={(event) => onPriorityFilterChange(event.target.value)}
            value={priorityFilter}
          >
            <option value="all">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
      </div>

      <div className="task-list">
        {tasks.map((task) => (
          <article
            key={task.id}
            className={`task-item ${task.isCompleted ? 'completed' : ''}`}
            data-testid="task-item"
            draggable={!isWorking}
            onDragEnd={handleDragEnd}
            onDragOver={(event) => event.preventDefault()}
            onDragStart={(event) => handleDragStart(event, task.id)}
            onDrop={(event) => handleDrop(event, task.id)}
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
                {formatEstimatedMinutes(task.estimatedMinutes)} · Due {task.taskDate} ·{' '}
                {task.isCompleted ? 'Completed' : 'Pending'}
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
