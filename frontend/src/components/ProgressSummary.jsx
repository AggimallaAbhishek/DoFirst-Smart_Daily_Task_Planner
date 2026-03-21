import { formatEstimatedMinutes } from '../lib/formatters';

export default function ProgressSummary({ tasks }) {
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
    }
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-[1.75rem] border border-white/60 bg-white/70 p-5 shadow-card backdrop-blur"
        >
          <p className="font-display text-xs uppercase tracking-[0.3em] text-ink/55">{stat.label}</p>
          <p className="mt-3 font-display text-3xl font-semibold text-ink">{stat.value}</p>
        </div>
      ))}
    </section>
  );
}
