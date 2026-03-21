import httpClient from '../../api/httpClient';

export async function getTasks() {
  const response = await httpClient.get('/api/tasks');
  return response.data.tasks;
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

export async function getSuggestion() {
  const response = await httpClient.get('/api/tasks/suggestion', {
    validateStatus: (status) => (status >= 200 && status < 300) || status === 204
  });

  return response.status === 204 ? null : response.data.task;
}
