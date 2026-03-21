const { createHttpError } = require('../../../utils/httpError');
const { mapTask } = require('../../../utils/mappers');

function currentTaskDate() {
  return new Date().toISOString().slice(0, 10);
}

function createTaskService({ taskRepository, logger }) {
  async function listTodayTasks(userId) {
    const taskDate = currentTaskDate();

    logger.debug('Listing tasks for dashboard.', {
      userId,
      taskDate
    });

    const rows = await taskRepository.listTasksForDate({
      userId,
      taskDate
    });

    return rows.map(mapTask);
  }

  async function createTaskForToday(userId, payload) {
    const taskDate = payload.taskDate || currentTaskDate();
    const existingCount = await taskRepository.countTasksForDate({
      userId,
      taskDate
    });

    logger.debug('Creating task.', {
      userId,
      taskDate,
      existingCount,
      priority: payload.priority
    });

    if (existingCount >= 5) {
      throw createHttpError(400, 'You can only add up to 5 tasks per day.');
    }

    const row = await taskRepository.createTask({
      userId,
      title: payload.title,
      priority: payload.priority,
      estimatedMinutes: payload.estimatedMinutes,
      taskDate
    });

    return mapTask(row);
  }

  async function updateTaskForUser(userId, taskId, updates) {
    const task = await taskRepository.findTaskById(taskId);

    if (!task) {
      throw createHttpError(404, 'Task not found.');
    }

    if (task.user_id !== userId) {
      throw createHttpError(403, 'You are not allowed to modify this task.');
    }

    logger.debug('Updating task.', {
      userId,
      taskId,
      updateKeys: Object.keys(updates)
    });

    const updatedTask = await taskRepository.updateTask({
      taskId,
      updates
    });

    return mapTask(updatedTask);
  }

  async function deleteTaskForUser(userId, taskId) {
    const task = await taskRepository.findTaskById(taskId);

    if (!task) {
      throw createHttpError(404, 'Task not found.');
    }

    if (task.user_id !== userId) {
      throw createHttpError(403, 'You are not allowed to delete this task.');
    }

    logger.debug('Deleting task.', {
      userId,
      taskId
    });

    await taskRepository.deleteTask(taskId);
  }

  async function getSuggestionForUser(userId) {
    const taskDate = currentTaskDate();

    logger.debug('Fetching task suggestion.', {
      userId,
      taskDate
    });

    const task = await taskRepository.findSuggestion({
      userId,
      taskDate
    });

    return task ? mapTask(task) : null;
  }

  return {
    createTaskForToday,
    deleteTaskForUser,
    getSuggestionForUser,
    listTodayTasks,
    updateTaskForUser
  };
}

module.exports = {
  createTaskService,
  currentTaskDate
};
