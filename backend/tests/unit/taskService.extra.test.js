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
        createTaskIfUnderDailyLimit: jest.fn().mockResolvedValue({
          taskCountBeforeInsert: 2,
          task: {
            id: 'task-1',
            user_id: 'user-1',
            title: 'Write proposal',
            priority: 'high',
            estimated_minutes: 30,
            is_completed: false,
            task_date: '2026-03-21',
            created_at: '2026-03-21T10:00:00.000Z'
          }
        }),
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

  test('rejects create when atomic insert reports daily limit reached', async () => {
    const repository = {
      createTaskIfUnderDailyLimit: jest.fn().mockResolvedValue({
        taskCountBeforeInsert: 5,
        task: null
      }),
      createTask: jest.fn()
    };
    const taskService = createTaskService({
      taskRepository: repository,
      logger
    });

    await expect(
      taskService.createTaskForToday('user-1', {
        title: 'Limit reached task',
        priority: 'high',
        estimatedMinutes: 30,
        taskDate: '2026-03-21'
      })
    ).rejects.toMatchObject({
      statusCode: 400
    });
    expect(repository.createTask).not.toHaveBeenCalled();
  });

  test('deletes a task for its owner', async () => {
    const repository = {
      deleteTaskForUser: jest.fn().mockResolvedValue({
        id: 'task-1',
        task_date: '2026-03-21'
      }),
      findTaskById: jest.fn()
    };
    const taskService = createTaskService({
      taskRepository: repository,
      logger
    });

    await taskService.deleteTaskForUser('user-1', 'task-1');

    expect(repository.deleteTaskForUser).toHaveBeenCalledWith({
      userId: 'user-1',
      taskId: 'task-1'
    });
    expect(repository.findTaskById).not.toHaveBeenCalled();
  });

  test('throws not found when deleting a missing task', async () => {
    const taskService = createTaskService({
      taskRepository: {
        deleteTaskForUser: jest.fn().mockResolvedValue(0),
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

  test('uses cache for repeated task list reads on the same date', async () => {
    const repository = {
      listTasksForDate: jest.fn().mockResolvedValue([
        {
          id: 'task-1',
          user_id: 'user-1',
          title: 'Cached task',
          priority: 'high',
          estimated_minutes: 30,
          is_completed: false,
          task_date: '2026-03-21',
          created_at: '2026-03-21T10:00:00.000Z'
        }
      ])
    };
    const taskService = createTaskService({
      taskRepository: repository,
      logger,
      readCacheTtlMs: 5000
    });

    await taskService.listTodayTasks('user-1', '2026-03-21');
    await taskService.listTodayTasks('user-1', '2026-03-21');

    expect(repository.listTasksForDate).toHaveBeenCalledTimes(1);
  });

  test('invalidates cached task list after task creation', async () => {
    const repository = {
      listTasksForDate: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            id: 'task-2',
            user_id: 'user-1',
            title: 'New task',
            priority: 'high',
            estimated_minutes: 30,
            is_completed: false,
            task_date: '2026-03-21',
            created_at: '2026-03-21T10:01:00.000Z'
          }
        ]),
      countTasksForDate: jest.fn().mockResolvedValue(0),
      createTask: jest.fn().mockResolvedValue({
        id: 'task-2',
        user_id: 'user-1',
        title: 'New task',
        priority: 'high',
        estimated_minutes: 30,
        is_completed: false,
        task_date: '2026-03-21',
        created_at: '2026-03-21T10:01:00.000Z'
      })
    };
    const taskService = createTaskService({
      taskRepository: repository,
      logger,
      readCacheTtlMs: 5000
    });

    await taskService.listTodayTasks('user-1', '2026-03-21');
    await taskService.createTaskForToday('user-1', {
      title: 'New task',
      priority: 'high',
      estimatedMinutes: 30,
      taskDate: '2026-03-21'
    });
    await taskService.listTodayTasks('user-1', '2026-03-21');

    expect(repository.listTasksForDate).toHaveBeenCalledTimes(2);
  });

  test('uses cache for repeated suggestion reads, including null suggestion', async () => {
    const repository = {
      findSuggestion: jest.fn().mockResolvedValue(null)
    };
    const taskService = createTaskService({
      taskRepository: repository,
      logger,
      readCacheTtlMs: 5000
    });

    await expect(taskService.getSuggestionForUser('user-1', '2026-03-21')).resolves.toBeNull();
    await expect(taskService.getSuggestionForUser('user-1', '2026-03-21')).resolves.toBeNull();

    expect(repository.findSuggestion).toHaveBeenCalledTimes(1);
  });
});
