const { createTaskService } = require('../../src/modules/tasks/services/taskService');

describe('taskService extra branches', () => {
  const logger = {
    debug: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates a task when the daily limit has not been reached', async () => {
    const taskService = createTaskService({
      taskRepository: {
        countTasksForDate: jest.fn().mockResolvedValue(2),
        createTask: jest.fn().mockResolvedValue({
          id: 'task-1',
          user_id: 'user-1',
          title: 'Write proposal',
          priority: 'high',
          estimated_minutes: 30,
          is_completed: false,
          task_date: '2026-03-21',
          created_at: '2026-03-21T10:00:00.000Z'
        })
      },
      logger
    });

    const result = await taskService.createTaskForToday('user-1', {
      title: 'Write proposal',
      priority: 'high',
      estimatedMinutes: 30,
      taskDate: '2026-03-21'
    });

    expect(result.title).toBe('Write proposal');
    expect(result.estimatedMinutes).toBe(30);
  });

  test('deletes a task for its owner', async () => {
    const repository = {
      findTaskById: jest.fn().mockResolvedValue({
        id: 'task-1',
        user_id: 'user-1'
      }),
      deleteTask: jest.fn().mockResolvedValue(1)
    };
    const taskService = createTaskService({
      taskRepository: repository,
      logger
    });

    await taskService.deleteTaskForUser('user-1', 'task-1');

    expect(repository.deleteTask).toHaveBeenCalledWith('task-1');
  });

  test('throws not found when deleting a missing task', async () => {
    const taskService = createTaskService({
      taskRepository: {
        findTaskById: jest.fn().mockResolvedValue(null)
      },
      logger
    });

    await expect(taskService.deleteTaskForUser('user-1', 'task-404')).rejects.toMatchObject({
      statusCode: 404
    });
  });

  test('maps the suggested task when one exists', async () => {
    const taskService = createTaskService({
      taskRepository: {
        findSuggestion: jest.fn().mockResolvedValue({
          id: 'task-1',
          user_id: 'user-1',
          title: 'Most important task',
          priority: 'high',
          estimated_minutes: 60,
          is_completed: false,
          task_date: '2026-03-21',
          created_at: '2026-03-21T10:00:00.000Z'
        })
      },
      logger
    });

    const suggestion = await taskService.getSuggestionForUser('user-1');

    expect(suggestion.title).toBe('Most important task');
  });
});
