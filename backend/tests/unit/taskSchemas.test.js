const {
  createTaskSchema,
  todayTasksSchema,
  updateTaskSchema
} = require('../../src/modules/tasks/validators/taskSchemas');

describe('taskSchemas', () => {
  test('createTaskSchema accepts a valid payload', () => {
    const { error } = createTaskSchema.validate({
      body: {
        title: 'Finish architecture notes',
        priority: 'high',
        estimatedMinutes: 30
      },
      params: {},
      query: {}
    });

    expect(error).toBeUndefined();
  });

  test('updateTaskSchema rejects empty updates', () => {
    const { error } = updateTaskSchema.validate({
      body: {},
      params: {
        id: '9d9e5fd6-e786-4c66-bea8-38101f640621'
      },
      query: {}
    });

    expect(error).toBeDefined();
  });

  test('todayTasksSchema accepts date filters in query', () => {
    const { error } = todayTasksSchema.validate({
      body: {},
      params: {},
      query: {
        taskDate: '2026-03-21'
      }
    });

    expect(error).toBeUndefined();
  });
});
