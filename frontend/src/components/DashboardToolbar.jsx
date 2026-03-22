import { memo } from 'react';
import { buildDateWindow, formatBoardDate } from '../lib/datePlanner';

const DashboardToolbar = memo(function DashboardToolbar({
  selectedDate,
  onSelectDate,
  onShiftDate,
  onJumpToToday,
  focusMode,
  onToggleFocus,
  onSendReminder,
  pendingTasksCount
}) {
  const dateWindow = buildDateWindow(selectedDate);

  return (
    <section className="panel planner-toolbar reveal">
      <div className="toolbar-header">
        <div>
          <p className="section-label">Planning Controls</p>
          <h2 className="panel-title">Board for {formatBoardDate(selectedDate)}</h2>
          <p className="panel-copy">
            Choose a day, focus on top priorities, and trigger reminders for pending work.
          </p>
        </div>

        <div className="toolbar-actions">
          <button className={`toolbar-toggle ${focusMode ? 'active' : ''}`} onClick={onToggleFocus} type="button">
            {focusMode ? 'Focus Mode On' : 'Focus Mode Off'}
          </button>
          <button
            className="toolbar-button"
            disabled={pendingTasksCount === 0}
            onClick={onSendReminder}
            type="button"
          >
            Remind Me
          </button>
        </div>
      </div>

      <div className="toolbar-date-controls">
        <button className="toolbar-icon-button" onClick={() => onShiftDate(-1)} type="button">
          ←
        </button>
        <input
          aria-label="Planning date"
          className="toolbar-date-input"
          onChange={(event) => onSelectDate(event.target.value)}
          type="date"
          value={selectedDate}
        />
        <button className="toolbar-icon-button" onClick={() => onShiftDate(1)} type="button">
          →
        </button>
        <button className="toolbar-button subtle" onClick={onJumpToToday} type="button">
          Today
        </button>
      </div>

      <div className="toolbar-date-window">
        {dateWindow.map((day) => (
          <button
            className={`toolbar-day-pill ${day.key === selectedDate ? 'selected' : ''} ${day.isToday ? 'today' : ''}`}
            key={day.key}
            onClick={() => onSelectDate(day.key)}
            type="button"
          >
            {day.label}
          </button>
        ))}
      </div>
    </section>
  );
});

export default DashboardToolbar;
