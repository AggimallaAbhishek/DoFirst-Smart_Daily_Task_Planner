import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import AppShell from '../components/AppShell';
import DashboardToolbar from '../components/DashboardToolbar';
import ProgressSummary from '../components/ProgressSummary';
import SuggestionBanner from '../components/SuggestionBanner';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import { useAuth } from '../features/auth/useAuth';
import {
  createTask,
  deleteTask,
  getTasks,
  updateTask
} from '../features/tasks/taskService';
import { getApiErrorMessage } from '../lib/apiError';
import { getTodayDateKey, shiftDate } from '../lib/datePlanner';
import {
  computeProductivityScore,
  getCurrentStreak,
  persistDailyProductivity
} from '../lib/productivity';

const TASK_ORDER_STORAGE_PREFIX = 'smart-daily-planner-order-';
const TASK_DATE_CACHE_TTL_MS = 30_000;
const MAX_TASK_DATE_CACHE_ENTRIES = 14;
const PRIORITY_RANK = {
  high: 3,
  medium: 2,
  low: 1
};

function getOrderStorageKey(taskDate) {
  return `${TASK_ORDER_STORAGE_PREFIX}${taskDate}`;
}

function readStoredTaskOrder(taskDate) {
  try {
    const raw = window.sessionStorage.getItem(getOrderStorageKey(taskDate));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredTaskOrder(taskDate, order) {
  window.sessionStorage.setItem(getOrderStorageKey(taskDate), JSON.stringify(order));
}

function isHigherSuggestionPriority(candidate, current) {
  if (!current) {
    return true;
  }

  const candidatePriority = PRIORITY_RANK[candidate.priority] || 0;
  const currentPriority = PRIORITY_RANK[current.priority] || 0;

  if (candidatePriority !== currentPriority) {
    return candidatePriority > currentPriority;
  }

  const candidateCreatedAt = Number.isNaN(Date.parse(candidate.createdAt))
    ? Number.MAX_SAFE_INTEGER
    : Date.parse(candidate.createdAt);
  const currentCreatedAt = Number.isNaN(Date.parse(current.createdAt))
    ? Number.MAX_SAFE_INTEGER
    : Date.parse(current.createdAt);

  return candidateCreatedAt < currentCreatedAt;
}

function selectSuggestionTask(tasks) {
  return tasks.reduce((currentSuggestion, task) => {
    if (task.isCompleted) {
      return currentSuggestion;
    }

    return isHigherSuggestionPriority(task, currentSuggestion) ? task : currentSuggestion;
  }, null);
}

function isRequestCanceled(error) {
  return error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError';
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayDateKey);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [manualOrder, setManualOrder] = useState([]);
  const [streakCount, setStreakCount] = useState(0);
  const [error, setError] = useState('');
  const selectedDateRef = useRef(selectedDate);
  const activeLoadAbortRef = useRef(null);
  const taskDateCacheRef = useRef(new Map());
  const deferredSearchValue = useDeferredValue(searchValue);

  const writeTaskDateCache = useCallback((taskDate, nextTasks) => {
    const cache = taskDateCacheRef.current;
    cache.delete(taskDate);
    cache.set(taskDate, {
      tasks: nextTasks,
      cachedAt: Date.now()
    });

    while (cache.size > MAX_TASK_DATE_CACHE_ENTRIES) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }
  }, []);

  const readTaskDateCache = useCallback((taskDate) => {
    const entry = taskDateCacheRef.current.get(taskDate);
    if (!entry) {
      return null;
    }

    if (Date.now() - entry.cachedAt > TASK_DATE_CACHE_TTL_MS) {
      taskDateCacheRef.current.delete(taskDate);
      return null;
    }

    return entry.tasks;
  }, []);

  const loadDashboard = useCallback(async (taskDate, options = {}) => {
    const { forceRefresh = false, ...requestOptions } = options;
    const cachedTasks = forceRefresh ? null : readTaskDateCache(taskDate);

    if (cachedTasks) {
      setTasks(cachedTasks);
      return cachedTasks;
    }

    const loadedTasks = await getTasks(taskDate, requestOptions);
    writeTaskDateCache(taskDate, loadedTasks);
    setTasks(loadedTasks);
    return loadedTasks;
  }, [readTaskDateCache, writeTaskDateCache]);

  useEffect(() => {
    selectedDateRef.current = selectedDate;
    setManualOrder(readStoredTaskOrder(selectedDate));
    setSearchValue('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setFocusMode(false);
  }, [selectedDate]);

  useEffect(() => {
    if (tasks.length === 0) {
      setManualOrder([]);
      saveStoredTaskOrder(selectedDate, []);
      return;
    }

    setManualOrder((current) => {
      const taskIds = tasks.map((task) => task.id);
      const taskIdSet = new Set(taskIds);
      const filteredCurrent = current.filter((taskId) => taskIdSet.has(taskId));
      const filteredCurrentSet = new Set(filteredCurrent);
      const missing = taskIds.filter((taskId) => !filteredCurrentSet.has(taskId));
      const merged = [...filteredCurrent, ...missing];

      if (
        merged.length === current.length &&
        merged.every((taskId, index) => taskId === current[index])
      ) {
        return current;
      }

      saveStoredTaskOrder(selectedDate, merged);
      return merged;
    });
  }, [tasks, selectedDate]);

  const orderedTasks = useMemo(() => {
    if (!tasks.length) {
      return [];
    }

    const byId = new Map(tasks.map((task) => [task.id, task]));
    const ordered = manualOrder.map((taskId) => byId.get(taskId)).filter(Boolean);
    const manualOrderSet = new Set(manualOrder);
    const missing = tasks.filter((task) => !manualOrderSet.has(task.id));
    const merged = [...ordered, ...missing];
    const pending = [];
    const completed = [];

    merged.forEach((task) => {
      if (task.isCompleted) {
        completed.push(task);
        return;
      }

      pending.push(task);
    });

    return [...pending, ...completed];
  }, [tasks, manualOrder]);

  const suggestion = useMemo(() => selectSuggestionTask(tasks), [tasks]);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = deferredSearchValue.trim().toLowerCase();

    return orderedTasks.filter((task) => {
      if (focusMode && (task.isCompleted || task.priority === 'low')) {
        return false;
      }

      if (statusFilter === 'pending' && task.isCompleted) {
        return false;
      }

      if (statusFilter === 'completed' && !task.isCompleted) {
        return false;
      }

      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      if (normalizedSearch && !task.title.toLowerCase().includes(normalizedSearch)) {
        return false;
      }

      return true;
    });
  }, [deferredSearchValue, focusMode, orderedTasks, priorityFilter, statusFilter]);

  const pendingTasksCount = useMemo(
    () => orderedTasks.filter((task) => !task.isCompleted).length,
    [orderedTasks]
  );
  const productivityScore = useMemo(() => computeProductivityScore(orderedTasks), [orderedTasks]);
  const hasActiveFilters = useMemo(
    () => Boolean(focusMode || searchValue.trim() || statusFilter !== 'all' || priorityFilter !== 'all'),
    [focusMode, searchValue, statusFilter, priorityFilter]
  );

  useEffect(() => {
    const history = persistDailyProductivity(selectedDate, orderedTasks);
    setStreakCount(getCurrentStreak(history));
  }, [orderedTasks, selectedDate]);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    if (activeLoadAbortRef.current) {
      activeLoadAbortRef.current.abort();
    }
    activeLoadAbortRef.current = abortController;

    async function bootstrap() {
      try {
        setError('');
        setIsLoading(true);
        await loadDashboard(selectedDate, {
          signal: abortController.signal
        });

        if (!isMounted) {
          return;
        }
      } catch (loadError) {
        if (isRequestCanceled(loadError)) {
          return;
        }

        if (loadError.response?.status === 401) {
          logout();
          return;
        }

        if (isMounted) {
          setError(getApiErrorMessage(loadError, 'Unable to load the dashboard.'));
        }
      } finally {
        if (isMounted && !abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
      abortController.abort();
      if (activeLoadAbortRef.current === abortController) {
        activeLoadAbortRef.current = null;
      }
    };
  }, [loadDashboard, logout, selectedDate]);

  const handleReorder = useCallback((draggedTaskId, targetTaskId) => {
    setManualOrder((current) => {
      const draft = current.length ? [...current] : orderedTasks.map((task) => task.id);
      const sourceIndex = draft.indexOf(draggedTaskId);
      const targetIndex = draft.indexOf(targetTaskId);
      const byId = new Map(orderedTasks.map((task) => [task.id, task]));
      const draggedTask = byId.get(draggedTaskId);
      const targetTask = byId.get(targetTaskId);

      if (
        sourceIndex < 0 ||
        targetIndex < 0 ||
        !draggedTask ||
        !targetTask ||
        draggedTask.isCompleted !== targetTask.isCompleted
      ) {
        return current;
      }

      draft.splice(sourceIndex, 1);
      draft.splice(targetIndex, 0, draggedTaskId);
      saveStoredTaskOrder(selectedDate, draft);
      return draft;
    });
  }, [orderedTasks, selectedDate]);

  const handleReminder = useCallback(async () => {
    if (pendingTasksCount === 0) {
      return;
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
      setError('Browser notifications are unavailable on this device.');
      return;
    }

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      setError('Notification permission denied. Enable browser notifications to get reminders.');
      return;
    }

    const topTask = orderedTasks.find((task) => !task.isCompleted);
    new Notification('DoFirst Reminder', {
      body: topTask
        ? `${pendingTasksCount} task(s) pending. Start with: ${topTask.title}`
        : `You have ${pendingTasksCount} pending task(s).`
    });
  }, [orderedTasks, pendingTasksCount]);

  const handleMutation = useCallback(async (action, fallbackMessage, applyLocalUpdate) => {
    setError('');
    setIsMutating(true);
    const requestDate = selectedDateRef.current;

    try {
      const result = await action();

      if (applyLocalUpdate && selectedDateRef.current === requestDate) {
        setTasks((currentTasks) => {
          const nextTasks = applyLocalUpdate(currentTasks, result);
          writeTaskDateCache(requestDate, nextTasks);
          return nextTasks;
        });
      } else {
        await loadDashboard(selectedDateRef.current, { forceRefresh: true });
      }

      return true;
    } catch (mutationError) {
      if (mutationError.response?.status === 401) {
        logout();
        return false;
      }

      setError(getApiErrorMessage(mutationError, fallbackMessage));
      return false;
    } finally {
      setIsMutating(false);
    }
  }, [loadDashboard, logout, writeTaskDateCache]);

  const handleSelectDate = useCallback((value) => {
    setSelectedDate(value);
  }, []);

  const handleShiftDate = useCallback((offset) => {
    setSelectedDate((current) => shiftDate(current, offset));
  }, []);

  const handleJumpToToday = useCallback(() => {
    setSelectedDate(getTodayDateKey());
  }, []);

  const handleToggleFocusMode = useCallback(() => {
    setFocusMode((current) => !current);
  }, []);

  const handleCreateTask = useCallback(
    (payload) =>
      handleMutation(
        () => createTask(payload),
        'Unable to add the task right now.',
        (currentTasks, createdTask) => [...currentTasks, createdTask]
      ),
    [handleMutation]
  );

  const handleToggleTaskCompletion = useCallback(
    (task) =>
      handleMutation(
        () => updateTask(task.id, { isCompleted: !task.isCompleted }),
        'Unable to update the task.',
        (currentTasks, updatedTask) =>
          currentTasks.map((currentTask) =>
            currentTask.id === updatedTask.id ? updatedTask : currentTask
          )
      ),
    [handleMutation]
  );

  const handleDeleteTask = useCallback(
    (task) =>
      handleMutation(
        () => deleteTask(task.id),
        'Unable to delete the task.',
        (currentTasks) => currentTasks.filter((currentTask) => currentTask.id !== task.id)
      ),
    [handleMutation]
  );

  const handleResetFilters = useCallback(() => {
    setFocusMode(false);
    setSearchValue('');
    setStatusFilter('all');
    setPriorityFilter('all');
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearchValue(value);
  }, []);

  const handleStatusFilterChange = useCallback((value) => {
    setStatusFilter(value);
  }, []);

  const handlePriorityFilterChange = useCallback((value) => {
    setPriorityFilter(value);
  }, []);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-pill">Building today&apos;s board</div>
      </div>
    );
  }

  return (
    <AppShell user={user} onLogout={logout}>
      <section className="planner-section">
        <DashboardToolbar
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          onShiftDate={handleShiftDate}
          onJumpToToday={handleJumpToToday}
          focusMode={focusMode}
          onToggleFocus={handleToggleFocusMode}
          onSendReminder={handleReminder}
          pendingTasksCount={pendingTasksCount}
        />
      </section>

      <section className="planner-section" id="suggestion">
        <SuggestionBanner task={suggestion} selectedDate={selectedDate} />
      </section>

      <section className="planner-section" id="progress">
        <ProgressSummary
          tasks={orderedTasks}
          productivityScore={productivityScore}
          streakCount={streakCount}
          focusMode={focusMode}
        />
      </section>

      {error ? (
        <section className="planner-section">
          <div className="status-banner status-error">{error}</div>
        </section>
      ) : null}

      <section className="planner-section planner-grid">
        <div id="form">
          <TaskForm
            taskCount={orderedTasks.length}
            isSubmitting={isMutating}
            selectedDate={selectedDate}
            onSubmit={handleCreateTask}
          />
        </div>

        <div id="tasks">
          <TaskList
            tasks={filteredTasks}
            isWorking={isMutating}
            onToggleComplete={handleToggleTaskCompletion}
            onDelete={handleDeleteTask}
            searchValue={searchValue}
            onSearchChange={handleSearchChange}
            statusFilter={statusFilter}
            onStatusFilterChange={handleStatusFilterChange}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={handlePriorityFilterChange}
            onReorder={handleReorder}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={handleResetFilters}
          />
        </div>
      </section>
    </AppShell>
  );
}
