import httpClient from '../../api/httpClient';

const pendingTaskRequests = new Map();

function buildTasksRequestKey(taskDate) {
  return taskDate || 'today';
}

export async function getTasks(taskDate, options = {}) {
  const requestKey = buildTasksRequestKey(taskDate);
  const hasAbortSignal = Boolean(options.signal);

  if (!hasAbortSignal) {
    const existingRequest = pendingTaskRequests.get(requestKey);
    if (existingRequest) {
      return existingRequest;
    }
  }

  const requestPromise = httpClient
    .get('/api/tasks', {
      params: taskDate ? { taskDate } : undefined,
      signal: options.signal
    })
    .then((response) => response.data.tasks);

  if (!hasAbortSignal) {
    pendingTaskRequests.set(requestKey, requestPromise);
    requestPromise.finally(() => {
      pendingTaskRequests.delete(requestKey);
    });
  }

  return requestPromise;
}

export async function createTask(payload) {
  const response = await httpClient.post('/api/tasks', payload);
  return response.data.task;
}

export async function updateTask(taskId, payload) {
  const response = await httpClient.patch(`/api/tasks/${taskId}`, payload);
  return response.data.task;
}

export async function deleteTask(taskId) {
  await httpClient.delete(`/api/tasks/${taskId}`);
}

export async function getSuggestion(taskDate) {
  const response = await httpClient.get('/api/tasks/suggestion', {
    params: taskDate ? { taskDate } : undefined,
    validateStatus: (status) => (status >= 200 && status < 300) || status === 204
  });

  return response.status === 204 ? null : response.data.task;
}
