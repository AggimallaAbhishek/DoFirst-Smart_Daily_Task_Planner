import { getTodayDateKey, shiftDate } from './datePlanner';

const HISTORY_KEY = 'smart-daily-planner-productivity-history';

const priorityWeight = {
  high: 3,
  medium: 2,
  low: 1
};

function safeWindow() {
  return typeof window !== 'undefined' ? window : null;
}

function readHistory() {
  const browserWindow = safeWindow();
  if (!browserWindow) {
    return {};
  }

  try {
    const raw = browserWindow.localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    browserWindow.localStorage.removeItem(HISTORY_KEY);
    return {};
  }
}

function writeHistory(history) {
  const browserWindow = safeWindow();
  if (!browserWindow) {
    return;
  }

  browserWindow.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function computeProductivityScore(tasks) {
  if (!tasks.length) {
    return 0;
  }

  const totalWeight = tasks.reduce((total, task) => total + (priorityWeight[task.priority] || 1), 0);
  const completedWeight = tasks.reduce((total, task) => {
    if (!task.isCompleted) {
      return total;
    }

    return total + (priorityWeight[task.priority] || 1);
  }, 0);
  const estimateTotal = tasks.reduce((total, task) => total + task.estimatedMinutes, 0);
  const estimateCompleted = tasks.reduce((total, task) => {
    if (!task.isCompleted) {
      return total;
    }

    return total + task.estimatedMinutes;
  }, 0);

  const weightedCompletion = totalWeight > 0 ? completedWeight / totalWeight : 0;
  const timeCompletion = estimateTotal > 0 ? estimateCompleted / estimateTotal : 0;
  const score = Math.round((weightedCompletion * 0.7 + timeCompletion * 0.3) * 100);

  return Math.min(100, Math.max(0, score));
}

export function persistDailyProductivity(dateKey, tasks) {
  const history = readHistory();

  if (!tasks.length) {
    if (history[dateKey]) {
      delete history[dateKey];
      writeHistory(history);
    }
    return history;
  }

  const completedCount = tasks.filter((task) => task.isCompleted).length;
  const completionRate = Math.round((completedCount / tasks.length) * 100);

  const nextEntry = {
    completionRate,
    taskCount: tasks.length,
    score: computeProductivityScore(tasks),
    updatedAt: new Date().toISOString()
  };

  const currentEntry = history[dateKey];
  if (
    currentEntry &&
    currentEntry.completionRate === nextEntry.completionRate &&
    currentEntry.taskCount === nextEntry.taskCount &&
    currentEntry.score === nextEntry.score
  ) {
    return history;
  }

  history[dateKey] = nextEntry;
  writeHistory(history);
  return history;
}

export function getCurrentStreak(history = readHistory(), endDateKey = getTodayDateKey()) {
  let streak = 0;
  let cursor = endDateKey;

  for (let iteration = 0; iteration < 400; iteration += 1) {
    const day = history[cursor];
    if (!day || day.taskCount < 1 || day.completionRate < 60) {
      break;
    }

    streak += 1;
    cursor = shiftDate(cursor, -1);
  }

  return streak;
}

export function loadProductivityHistory() {
  return readHistory();
}
