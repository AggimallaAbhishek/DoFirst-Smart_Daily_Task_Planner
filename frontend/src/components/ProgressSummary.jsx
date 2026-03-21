import { formatEstimatedMinutes } from '../lib/formatters';

export default function ProgressSummary({ tasks, productivityScore, streakCount, focusMode }) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.isCompleted).length;
  const remainingMinutes = tasks
    .filter((task) => !task.isCompleted)
    .reduce((total, task) => total + task.estimatedMinutes, 0);
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const stats = [
    {
      label: 'Completed',
      value: `${completedTasks}/${totalTasks || 0}`
    },
    {
      label: 'Remaining',
      value: formatEstimatedMinutes(remainingMinutes || 0)
    },
    {
      label: 'Progress',
      value: `${completionRate}%`
    },
    {
      label: 'Score',
      value: `${productivityScore}%`
    },
    {
      label: 'Streak',
      value: `${streakCount} day${streakCount === 1 ? '' : 's'}`
    }
  ];

  return (
    <section className="progress-grid">
      {stats.map((stat) => (
        <div key={stat.label} className="panel stat-card">
          <p className="muted-kicker">{stat.label}</p>
          <p className="stat-value">{stat.value}</p>
        </div>
      ))}

      {focusMode ? (
        <div className="panel stat-card stat-focus">
          <p className="muted-kicker">Focus Mode</p>
          <p className="stat-value">On</p>
        </div>
      ) : null}
    </section>
  );
}
