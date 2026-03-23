const taskRepository = require('../../src/modules/tasks/repositories/taskRepository');

describe('taskRepository', () => {
  let pool;

  beforeEach(() => {
    pool = {
      query: jest.fn()
    };
  });

  test('countTasksForDate returns count when present', async () => {
    pool.query.mockResolvedValue({
      rows: [{ task_count: 3 }]
    });

    const result = await taskRepository.countTasksForDate(pool, {
      userId: 'user-1',
      taskDate: '2026-03-23'
    });

    expect(result).toBe(3);
  });

  test('countTasksForDate returns zero when rows are empty', async () => {
    pool.query.mockResolvedValue({
      rows: []
    });

    const result = await taskRepository.countTasksForDate(pool, {
      userId: 'user-1',
      taskDate: '2026-03-23'
    });

    expect(result).toBe(0);
  });

  test('createTask trims title before insert', async () => {
    pool.query.mockResolvedValue({
      rows: [{ id: 'task-1', title: 'Trim me' }]
    });

    const result = await taskRepository.createTask(pool, {
      userId: 'user-1',
      title: '  Trim me  ',
      priority: 'high',
      estimatedMinutes: 30,
      taskDate: '2026-03-23'
    });

    expect(result.id).toBe('task-1');
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [
      'user-1',
      'Trim me',
      'high',
      30,
      '2026-03-23'
    ]);
  });

  test('createTaskIfUnderDailyLimit returns inserted task when insert succeeds', async () => {
    pool.query.mockResolvedValue({
      rows: [
        {
          task_count: 2,
          id: 'task-1',
          user_id: 'user-1',
          title: 'Do it',
          priority: 'high',
          estimated_minutes: 15,
          is_completed: false,
          task_date: '2026-03-23',
          created_at: '2026-03-23T10:00:00.000Z'
        }
      ]
    });

    const result = await taskRepository.createTaskIfUnderDailyLimit(pool, {
      userId: 'user-1',
      title: '  Do it  ',
      priority: 'high',
      estimatedMinutes: 15,
      taskDate: '2026-03-23'
    });

    expect(result.taskCountBeforeInsert).toBe(2);
    expect(result.task).toEqual(
      expect.objectContaining({
        id: 'task-1',
        user_id: 'user-1',
        title: 'Do it'
      })
    );
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [
      'user-1',
      'Do it',
      'high',
      15,
      '2026-03-23'
    ]);
  });

  test('createTaskIfUnderDailyLimit returns null task when daily limit blocks insert', async () => {
    pool.query.mockResolvedValue({
      rows: [{ task_count: 5 }]
    });

    const result = await taskRepository.createTaskIfUnderDailyLimit(pool, {
      userId: 'user-1',
      title: 'Blocked',
      priority: 'low',
      estimatedMinutes: 60,
      taskDate: '2026-03-23'
    });

    expect(result).toEqual({
      taskCountBeforeInsert: 5,
      task: null
    });
  });

  test('createTaskIfUnderDailyLimit falls back to defaults when no row is returned', async () => {
    pool.query.mockResolvedValue({
      rows: []
    });

    const result = await taskRepository.createTaskIfUnderDailyLimit(pool, {
      userId: 'user-1',
      title: 'Task',
      priority: 'medium',
      estimatedMinutes: 30,
      taskDate: '2026-03-23'
    });

    expect(result).toEqual({
      taskCountBeforeInsert: 0,
      task: null
    });
  });

  test('findTaskById returns null when no task exists', async () => {
    pool.query.mockResolvedValue({
      rows: []
    });

    const result = await taskRepository.findTaskById(pool, 'missing-id');

    expect(result).toBeNull();
  });

  test('updateTask trims title and returns first row', async () => {
    pool.query.mockResolvedValue({
      rows: [{ id: 'task-1', title: 'Updated' }]
    });

    const result = await taskRepository.updateTask(pool, {
      taskId: 'task-1',
      updates: {
        title: '  Updated  ',
        isCompleted: true,
        ignored: 'value'
      }
    });

    expect(result).toEqual({
      id: 'task-1',
      title: 'Updated'
    });
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['Updated', true, 'task-1']);
  });

  test('updateTaskForUser returns null when no owned row is updated', async () => {
    pool.query.mockResolvedValue({
      rows: []
    });

    const result = await taskRepository.updateTaskForUser(pool, {
      userId: 'user-1',
      taskId: 'task-1',
      updates: {
        isCompleted: true
      }
    });

    expect(result).toBeNull();
  });

  test('deleteTask returns affected row count', async () => {
    pool.query.mockResolvedValue({
      rowCount: 1
    });

    const result = await taskRepository.deleteTask(pool, 'task-1');

    expect(result).toBe(1);
  });

  test('deleteTaskForUser returns null when task does not belong to user', async () => {
    pool.query.mockResolvedValue({
      rows: []
    });

    const result = await taskRepository.deleteTaskForUser(pool, {
      userId: 'user-1',
      taskId: 'task-1'
    });

    expect(result).toBeNull();
  });

  test('findSuggestion returns null when no incomplete task exists', async () => {
    pool.query.mockResolvedValue({
      rows: []
    });

    const result = await taskRepository.findSuggestion(pool, {
      userId: 'user-1',
      taskDate: '2026-03-23'
    });

    expect(result).toBeNull();
  });
});
