const PRIORITY_SQL = `
  CASE priority
    WHEN 'high' THEN 3
    WHEN 'medium' THEN 2
    ELSE 1
  END
`;
const TASK_COLUMNS = 'id, user_id, title, priority, estimated_minutes, is_completed, task_date, created_at';

async function countTasksForDate(pool, { userId, taskDate }) {
  const result = await pool.query(
    'SELECT COUNT(*)::INTEGER AS task_count FROM tasks WHERE user_id = $1 AND task_date = $2',
    [userId, taskDate]
  );

  return result.rows[0]?.task_count || 0;
}

async function createTask(pool, { userId, title, priority, estimatedMinutes, taskDate }) {
  const result = await pool.query(
    `
      INSERT INTO tasks (user_id, title, priority, estimated_minutes, task_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING ${TASK_COLUMNS}
    `,
    [userId, title.trim(), priority, estimatedMinutes, taskDate]
  );

  return result.rows[0];
}

async function createTaskIfUnderDailyLimit(pool, { userId, title, priority, estimatedMinutes, taskDate }) {
  const result = await pool.query(
    `
      WITH daily_count AS (
        SELECT COUNT(*)::INTEGER AS task_count
        FROM tasks
        WHERE user_id = $1
          AND task_date = $5
      ),
      inserted AS (
        INSERT INTO tasks (user_id, title, priority, estimated_minutes, task_date)
        SELECT $1, $2, $3, $4, $5
        FROM daily_count
        WHERE task_count < 5
        RETURNING ${TASK_COLUMNS}
      )
      SELECT
        daily_count.task_count,
        inserted.${TASK_COLUMNS.replaceAll(', ', ', inserted.')}
      FROM daily_count
      LEFT JOIN inserted ON TRUE
    `,
    [userId, title.trim(), priority, estimatedMinutes, taskDate]
  );

  const row = result.rows[0] || null;
  const taskCountBeforeInsert = row?.task_count || 0;
  const insertedTask = row?.id
    ? {
        id: row.id,
        user_id: row.user_id,
        title: row.title,
        priority: row.priority,
        estimated_minutes: row.estimated_minutes,
        is_completed: row.is_completed,
        task_date: row.task_date,
        created_at: row.created_at
      }
    : null;

  return {
    taskCountBeforeInsert,
    task: insertedTask
  };
}

async function listTasksForDate(pool, { userId, taskDate }) {
  const result = await pool.query(
    `
      SELECT ${TASK_COLUMNS}
      FROM tasks
      WHERE user_id = $1 AND task_date = $2
      ORDER BY is_completed ASC, ${PRIORITY_SQL} DESC, created_at ASC
    `,
    [userId, taskDate]
  );

  return result.rows;
}

async function findTaskById(pool, taskId) {
  const result = await pool.query(`SELECT ${TASK_COLUMNS} FROM tasks WHERE id = $1 LIMIT 1`, [taskId]);
  return result.rows[0] || null;
}

async function updateTask(pool, { taskId, updates }) {
  const allowedFields = {
    title: 'title',
    priority: 'priority',
    estimatedMinutes: 'estimated_minutes',
    isCompleted: 'is_completed'
  };

  const entries = Object.entries(updates).filter(([key, value]) => allowedFields[key] && value !== undefined);
  const values = [];
  const assignments = entries.map(([key, value], index) => {
    values.push(key === 'title' ? value.trim() : value);
    return `${allowedFields[key]} = $${index + 1}`;
  });

  values.push(taskId);

  const result = await pool.query(
    `
      UPDATE tasks
      SET ${assignments.join(', ')}
      WHERE id = $${values.length}
      RETURNING ${TASK_COLUMNS}
    `,
    values
  );

  return result.rows[0];
}

async function updateTaskForUser(pool, { userId, taskId, updates }) {
  const allowedFields = {
    title: 'title',
    priority: 'priority',
    estimatedMinutes: 'estimated_minutes',
    isCompleted: 'is_completed'
  };

  const entries = Object.entries(updates).filter(([key, value]) => allowedFields[key] && value !== undefined);
  const values = [];
  const assignments = entries.map(([key, value], index) => {
    values.push(key === 'title' ? value.trim() : value);
    return `${allowedFields[key]} = $${index + 1}`;
  });

  values.push(taskId);
  values.push(userId);

  const result = await pool.query(
    `
      UPDATE tasks
      SET ${assignments.join(', ')}
      WHERE id = $${values.length - 1}
        AND user_id = $${values.length}
      RETURNING ${TASK_COLUMNS}
    `,
    values
  );

  return result.rows[0] || null;
}

async function deleteTask(pool, taskId) {
  const result = await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
  return result.rowCount;
}

async function deleteTaskForUser(pool, { userId, taskId }) {
  const result = await pool.query(
    'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id, task_date',
    [taskId, userId]
  );
  return result.rows[0] || null;
}

async function findSuggestion(pool, { userId, taskDate }) {
  const result = await pool.query(
    `
      SELECT ${TASK_COLUMNS}
      FROM tasks
      WHERE user_id = $1
        AND task_date = $2
        AND is_completed = FALSE
      ORDER BY ${PRIORITY_SQL} DESC, created_at ASC
      LIMIT 1
    `,
    [userId, taskDate]
  );

  return result.rows[0] || null;
}

module.exports = {
  countTasksForDate,
  createTask,
  createTaskIfUnderDailyLimit,
  deleteTask,
  deleteTaskForUser,
  findSuggestion,
  findTaskById,
  listTasksForDate,
  updateTask,
  updateTaskForUser
};
