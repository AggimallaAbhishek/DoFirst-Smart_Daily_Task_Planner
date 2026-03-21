import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import ProgressSummary from '../components/ProgressSummary';
import SuggestionBanner from '../components/SuggestionBanner';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import { useAuth } from '../features/auth/useAuth';
import {
  createTask,
  deleteTask,
  getSuggestion,
  getTasks,
  updateTask
} from '../features/tasks/taskService';
import { getApiErrorMessage } from '../lib/apiError';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [suggestion, setSuggestion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState('');

  async function loadDashboard() {
    const [loadedTasks, loadedSuggestion] = await Promise.all([getTasks(), getSuggestion()]);
    setTasks(loadedTasks);
    setSuggestion(loadedSuggestion);
  }

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        setError('');
        const [loadedTasks, loadedSuggestion] = await Promise.all([getTasks(), getSuggestion()]);

        if (!isMounted) {
          return;
        }

        setTasks(loadedTasks);
        setSuggestion(loadedSuggestion);
      } catch (loadError) {
        if (loadError.response?.status === 401) {
          logout();
          return;
        }

        if (isMounted) {
          setError(getApiErrorMessage(loadError, 'Unable to load the dashboard.'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [logout]);

  async function handleMutation(action, fallbackMessage) {
    setError('');
    setIsMutating(true);

    try {
      await action();
      await loadDashboard();
    } catch (mutationError) {
      if (mutationError.response?.status === 401) {
        logout();
        return;
      }

      setError(getApiErrorMessage(mutationError, fallbackMessage));
    } finally {
      setIsMutating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-planner-texture px-6 text-ink">
        <div className="rounded-full border border-white/60 bg-white/80 px-5 py-3 font-display text-xs uppercase tracking-[0.35em] shadow-card">
          Building today&apos;s board
        </div>
      </div>
    );
  }

  return (
    <AppShell user={user} onLogout={logout}>
      <div className="grid gap-6">
        <SuggestionBanner task={suggestion} />
        <ProgressSummary tasks={tasks} />

        {error ? (
          <div className="rounded-[1.75rem] border border-ember/20 bg-ember/10 px-5 py-4 font-body text-sm text-ember">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <TaskForm
            taskCount={tasks.length}
            isSubmitting={isMutating}
            onSubmit={(payload) =>
              handleMutation(() => createTask(payload), 'Unable to add the task right now.')
            }
          />

          <TaskList
            tasks={tasks}
            isWorking={isMutating}
            onToggleComplete={(task) =>
              handleMutation(
                () => updateTask(task.id, { isCompleted: !task.isCompleted }),
                'Unable to update the task.'
              )
            }
            onDelete={(task) =>
              handleMutation(() => deleteTask(task.id), 'Unable to delete the task.')
            }
          />
        </div>
      </div>
    </AppShell>
  );
}
