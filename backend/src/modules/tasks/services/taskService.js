const { createHttpError } = require('../../../utils/httpError');
const { mapTask } = require('../../../utils/mappers');

const DEFAULT_TASK_READ_CACHE_TTL_MS = 1500;

function currentTaskDate() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeTaskDate(taskDate) {
  if (!taskDate) {
    return currentTaskDate();
  }

  if (taskDate instanceof Date) {
    return taskDate.toISOString().slice(0, 10);
  }

  return String(taskDate).slice(0, 10);
}

function createTaskCacheKey(userId, taskDate, key) {
  return `${userId}:${taskDate}:${key}`;
}

function createTaskService({ taskRepository, logger, readCacheTtlMs = DEFAULT_TASK_READ_CACHE_TTL_MS }) {
  const effectiveCacheTtlMs =
    Number.isFinite(readCacheTtlMs) && readCacheTtlMs > 0
      ? readCacheTtlMs
      : DEFAULT_TASK_READ_CACHE_TTL_MS;
  const readCache = new Map();

  function getCachedValue(cacheKey) {
    const cachedEntry = readCache.get(cacheKey);

    if (!cachedEntry) {
      return {
        hit: false,
        value: null
      };
    }

    if (cachedEntry.expiresAt <= Date.now()) {
      readCache.delete(cacheKey);
      return {
        hit: false,
        value: null
      };
    }

    return {
      hit: true,
      value: cachedEntry.value
    };
  }

  function setCachedValue(cacheKey, value) {
    readCache.set(cacheKey, {
      value,
      expiresAt: Date.now() + effectiveCacheTtlMs
    });
  }

  function invalidateTaskDateCache(userId, taskDate) {
    const normalizedDate = normalizeTaskDate(taskDate);
    readCache.delete(createTaskCacheKey(userId, normalizedDate, 'tasks'));
    readCache.delete(createTaskCacheKey(userId, normalizedDate, 'suggestion'));
  }

  async function listTodayTasks(userId, taskDateInput) {
    const taskDate = normalizeTaskDate(taskDateInput);
    const cacheKey = createTaskCacheKey(userId, taskDate, 'tasks');
    const cachedResult = getCachedValue(cacheKey);

    if (cachedResult.hit) {
      logger.debug('Serving task list from cache.', {
        userId,
        taskDate,
        cacheTtlMs: effectiveCacheTtlMs
      });
      return cachedResult.value;
    }

    logger.debug('Listing tasks for dashboard.', {
      userId,
      taskDate
    });

    const rows = await taskRepository.listTasksForDate({
      userId,
      taskDate
    });

    const mappedTasks = rows.map(mapTask);
    setCachedValue(cacheKey, mappedTasks);

    return mappedTasks;
  }

  async function createTaskForToday(userId, payload) {
    const taskDate = normalizeTaskDate(payload.taskDate);
    const supportsAtomicCreate = typeof taskRepository.createTaskIfUnderDailyLimit === 'function';
    let existingCount = 0;
    let row = null;

    if (supportsAtomicCreate) {
      const atomicResult = await taskRepository.createTaskIfUnderDailyLimit({
        userId,
        title: payload.title,
        priority: payload.priority,
        estimatedMinutes: payload.estimatedMinutes,
        taskDate
      });
      existingCount = atomicResult.taskCountBeforeInsert;
      row = atomicResult.task;
    } else {
      existingCount = await taskRepository.countTasksForDate({
        userId,
        taskDate
      });
    }

    logger.debug('Creating task.', {
      userId,
      taskDate,
      existingCount,
      usingAtomicCreate: supportsAtomicCreate,
      priority: payload.priority
    });

    if (existingCount >= 5) {
      throw createHttpError(400, 'You can only add up to 5 tasks per day.');
    }

    if (!row) {
      row = await taskRepository.createTask({
        userId,
        title: payload.title,
        priority: payload.priority,
        estimatedMinutes: payload.estimatedMinutes,
        taskDate
      });
    }

    invalidateTaskDateCache(userId, taskDate);
    return mapTask(row);
  }

  async function updateTaskForUser(userId, taskId, updates) {
    logger.debug('Updating task.', {
      userId,
      taskId,
      updateKeys: Object.keys(updates)
    });

    const updatedTask = await taskRepository.updateTaskForUser({
      userId,
      taskId,
      updates
    });

    if (updatedTask) {
      const mappedTask = mapTask(updatedTask);
      invalidateTaskDateCache(userId, mappedTask.taskDate);
      return mappedTask;
    }

    const task = await taskRepository.findTaskById(taskId);

    if (!task) {
      throw createHttpError(404, 'Task not found.');
    }

    throw createHttpError(403, 'You are not allowed to modify this task.');
  }

  async function deleteTaskForUser(userId, taskId) {
    logger.debug('Deleting task.', {
      userId,
      taskId
    });

    const deletedTask = await taskRepository.deleteTaskForUser({
      userId,
      taskId
    });

    if (deletedTask && typeof deletedTask === 'object') {
      invalidateTaskDateCache(userId, deletedTask.task_date);
      return;
    }

    if (typeof deletedTask === 'number' && deletedTask > 0) {
      return;
    }

    const task = await taskRepository.findTaskById(taskId);

    if (!task) {
      throw createHttpError(404, 'Task not found.');
    }

    throw createHttpError(403, 'You are not allowed to delete this task.');
  }

  async function getSuggestionForUser(userId, taskDateInput) {
    const taskDate = normalizeTaskDate(taskDateInput);
    const cacheKey = createTaskCacheKey(userId, taskDate, 'suggestion');
    const cachedSuggestion = getCachedValue(cacheKey);

    if (cachedSuggestion.hit) {
      logger.debug('Serving task suggestion from cache.', {
        userId,
        taskDate,
        cacheTtlMs: effectiveCacheTtlMs
      });
      return cachedSuggestion.value;
    }

    logger.debug('Fetching task suggestion.', {
      userId,
      taskDate
    });

    const task = await taskRepository.findSuggestion({
      userId,
      taskDate
    });

    const mappedSuggestion = task ? mapTask(task) : null;
    setCachedValue(cacheKey, mappedSuggestion);
    return mappedSuggestion;
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
  currentTaskDate,
  normalizeTaskDate
};
