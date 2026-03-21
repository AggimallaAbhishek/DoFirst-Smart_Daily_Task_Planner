const { createTaskService } = require('../../src/modules/tasks/services/taskService');

describe('taskService', () => {
  const logger = {
    debug: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rejects a sixth task for the day', async () => {
    const taskService = createTaskService({
      taskRepository: {
        countTasksForDate: jest.fn().mockResolvedValue(5)
      },
      logger
    });

    await expect(
      taskService.createTaskForToday('user-1', {
        title: 'Plan focus block',
        priority: 'high',
        estimatedMinutes: 30
      })
    ).rejects.toMatchObject({
      statusCode: 400
    });
  });

  test('returns null suggestion when no tasks exist', async () => {
    const taskService = createTaskService({
      taskRepository: {
        findSuggestion: jest.fn().mockResolvedValue(null)
      },
      logger
    });

    await expect(taskService.getSuggestionForUser('user-1')).resolves.toBeNull();
  });

  test('rejects updates for tasks owned by another user', async () => {
    const taskService = createTaskService({
      taskRepository: {
        findTaskById: jest.fn().mockResolvedValue({
          id: '9d9e5fd6-e786-4c66-bea8-38101f640621',
          user_id: 'other-user'
        })
      },
      logger
    });

    await expect(
      taskService.updateTaskForUser('current-user', 'task-1', {
        isCompleted: true
      })
    ).rejects.toMatchObject({
      statusCode: 403
    });
  });
});
