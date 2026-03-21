CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  priority VARCHAR(10) NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  estimated_minutes INTEGER NOT NULL CHECK (estimated_minutes IN (15, 30, 60)),
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  task_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT tasks_title_not_blank CHECK (char_length(trim(title)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, task_date);
