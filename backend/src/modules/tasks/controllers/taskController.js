const { asyncHandler } = require('../../../utils/asyncHandler');

function createTaskController({ taskService }) {
  const listTodayTasks = asyncHandler(async (request, response) => {
    const tasks = await taskService.listTodayTasks(request.user.id);

    return response.status(200).json({
      tasks
    });
  });

  const createTask = asyncHandler(async (request, response) => {
    const task = await taskService.createTaskForToday(request.user.id, request.body);

    return response.status(201).json({
      task
    });
  });

  const updateTask = asyncHandler(async (request, response) => {
    const task = await taskService.updateTaskForUser(request.user.id, request.params.id, request.body);

    return response.status(200).json({
      task
    });
  });

  const deleteTask = asyncHandler(async (request, response) => {
    await taskService.deleteTaskForUser(request.user.id, request.params.id);

    return response.status(204).send();
  });

  const getSuggestion = asyncHandler(async (request, response) => {
    const task = await taskService.getSuggestionForUser(request.user.id);

    if (!task) {
      return response.status(204).send();
    }

    return response.status(200).json({
      task
    });
  });

  return {
    createTask,
    deleteTask,
    getSuggestion,
    listTodayTasks,
    updateTask
  };
}

module.exports = {
  createTaskController
};
