CREATE INDEX IF NOT EXISTS idx_tasks_user_date_completed_created
  ON tasks(user_id, task_date, is_completed, created_at);

CREATE INDEX IF NOT EXISTS idx_tasks_suggestion_lookup
  ON tasks(
    user_id,
    task_date,
    is_completed,
    (CASE priority WHEN 'high' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END) DESC,
    created_at
  );
