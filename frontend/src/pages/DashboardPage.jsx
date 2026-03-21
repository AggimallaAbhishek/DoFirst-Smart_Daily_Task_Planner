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
      <div className="loading-screen">
        <div className="loading-pill">Building today&apos;s board</div>
      </div>
    );
  }

  return (
    <AppShell user={user} onLogout={logout}>
      <section className="planner-section" id="suggestion">
        <SuggestionBanner task={suggestion} />
      </section>

      <section className="planner-section" id="progress">
        <ProgressSummary tasks={tasks} />
      </section>

      {error ? (
        <section className="planner-section">
          <div className="status-banner status-error">{error}</div>
        </section>
      ) : null}

      <section className="planner-section planner-grid">
        <div id="form">
          <TaskForm
            taskCount={tasks.length}
            isSubmitting={isMutating}
            onSubmit={(payload) =>
              handleMutation(() => createTask(payload), 'Unable to add the task right now.')
            }
          />
        </div>

        <div id="tasks">
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
      </section>
    </AppShell>
  );
}
