function mapUser(row) {
  return {
    id: row.id,
    email: row.email,
    createdAt: row.created_at
  };
}

function mapTask(row) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    priority: row.priority,
    estimatedMinutes: row.estimated_minutes,
    isCompleted: row.is_completed,
    taskDate: row.task_date,
    createdAt: row.created_at
  };
}

module.exports = {
  mapUser,
  mapTask
};
