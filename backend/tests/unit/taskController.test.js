const { createTaskController } = require('../../src/modules/tasks/controllers/taskController');

function createResponse() {
  return {
    statusCode: 200,
    payload: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
    send(payload) {
      this.payload = payload;
      return this;
    }
  };
}

describe('taskController', () => {
  test('returns 204 when there is no suggestion', async () => {
    const taskController = createTaskController({
      taskService: {
        getSuggestionForUser: jest.fn().mockResolvedValue(null)
      }
    });
    const request = {
      user: {
        id: 'user-1'
      }
    };
    const response = createResponse();

    await taskController.getSuggestion(request, response, jest.fn());

    expect(response.statusCode).toBe(204);
  });

  test('returns 204 after deleting a task', async () => {
    const taskController = createTaskController({
      taskService: {
        deleteTaskForUser: jest.fn().mockResolvedValue(undefined)
      }
    });
    const request = {
      user: {
        id: 'user-1'
      },
      params: {
        id: 'task-1'
      }
    };
    const response = createResponse();

    await taskController.deleteTask(request, response, jest.fn());

    expect(response.statusCode).toBe(204);
  });
});
