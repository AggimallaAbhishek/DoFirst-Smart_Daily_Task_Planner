const request = require('supertest');
const { createTestApp } = require('./helpers/testApp');
const {
  closeTestDatabase,
  resetTestDatabase,
  setupTestDatabase
} = require('./helpers/testDatabase');

async function registerAndLogin(app, email) {
  await request(app).post('/api/auth/register').send({
    email,
    password: 'Password123'
  });

  const loginResponse = await request(app).post('/api/auth/login').send({
    email,
    password: 'Password123'
  });

  return loginResponse.body.token;
}

describe('task routes', () => {
  let app;
  let pool;

  beforeAll(async () => {
    pool = await setupTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
    app = createTestApp(pool);
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  test('creates a task and returns the correct shape', async () => {
    const token = await registerAndLogin(app, 'owner@example.com');

    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Prepare project breakdown',
        priority: 'high',
        estimatedMinutes: 30
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.task).toMatchObject({
      title: 'Prepare project breakdown',
      priority: 'high',
      estimatedMinutes: 30,
      isCompleted: false
    });
  });

  test('returns only the authenticated user tasks and sorts incomplete tasks by priority', async () => {
    const ownerToken = await registerAndLogin(app, 'owner@example.com');
    const otherToken = await registerAndLogin(app, 'other@example.com');

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Medium task',
        priority: 'medium',
        estimatedMinutes: 30
      });

    const highTaskResponse = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'High task',
        priority: 'high',
        estimatedMinutes: 15
      });

    await request(app)
      .patch(`/api/tasks/${highTaskResponse.body.task.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        isCompleted: true
      });

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        title: 'Other user task',
        priority: 'high',
        estimatedMinutes: 60
      });

    const response = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.tasks).toHaveLength(2);
    expect(response.body.tasks[0].title).toBe('Medium task');
    expect(response.body.tasks[1].title).toBe('High task');
  });

  test('filters tasks by taskDate query parameter', async () => {
    const token = await registerAndLogin(app, 'owner@example.com');
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const tomorrowDate = new Date(now);
    tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
    const tomorrow = tomorrowDate.toISOString().slice(0, 10);

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Today task',
        priority: 'medium',
        estimatedMinutes: 30,
        taskDate: today
      });

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Tomorrow task',
        priority: 'high',
        estimatedMinutes: 15,
        taskDate: tomorrow
      });

    const response = await request(app)
      .get('/api/tasks')
      .query({
        taskDate: tomorrow
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.tasks).toHaveLength(1);
    expect(response.body.tasks[0].title).toBe('Tomorrow task');
  });

  test('rejects a sixth task for the day', async () => {
    const token = await registerAndLogin(app, 'owner@example.com');

    for (let index = 0; index < 5; index += 1) {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: `Task ${index + 1}`,
          priority: 'medium',
          estimatedMinutes: 30
        });

      expect(response.statusCode).toBe(201);
    }

    const blockedResponse = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Task 6',
        priority: 'low',
        estimatedMinutes: 15
      });

    expect(blockedResponse.statusCode).toBe(400);
  });

  test('blocks cross-user updates with 403', async () => {
    const ownerToken = await registerAndLogin(app, 'owner@example.com');
    const otherToken = await registerAndLogin(app, 'other@example.com');

    const taskResponse = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Protected task',
        priority: 'high',
        estimatedMinutes: 30
      });

    const response = await request(app)
      .patch(`/api/tasks/${taskResponse.body.task.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        isCompleted: true
      });

    expect(response.statusCode).toBe(403);
  });

  test('returns 204 when no suggested task is available', async () => {
    const token = await registerAndLogin(app, 'owner@example.com');

    const response = await request(app)
      .get('/api/tasks/suggestion')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(204);
  });

  test('deletes a task owned by the authenticated user', async () => {
    const token = await registerAndLogin(app, 'owner@example.com');

    const taskResponse = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Delete me',
        priority: 'low',
        estimatedMinutes: 15
      });

    const deleteResponse = await request(app)
      .delete(`/api/tasks/${taskResponse.body.task.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.statusCode).toBe(204);

    const listResponse = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);

    expect(listResponse.body.tasks).toHaveLength(0);
  });

  test('rejects invalid task payloads', async () => {
    const token = await registerAndLogin(app, 'owner@example.com');

    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '',
        priority: 'urgent',
        estimatedMinutes: 99
      });

    expect(response.statusCode).toBe(400);
  });

  test('rejects unauthenticated task requests', async () => {
    const response = await request(app).get('/api/tasks');

    expect(response.statusCode).toBe(401);
  });

  test('rejects invalid bearer tokens', async () => {
    const response = await request(app)
      .get('/api/tasks')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.statusCode).toBe(401);
  });
});
