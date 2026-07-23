-- Add parent_notified_at column to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS parent_notified_at TIMESTAMPTZ;

-- Mark historical sessions (completed before today) as already notified
-- Uses exam.completed_at from summary JSON, falls back to started_at
UPDATE sessions
SET parent_notified_at = COALESCE(
  NULLIF(CAST(summary AS jsonb)->'exam'->>'completed_at', '')::timestamptz,
  started_at,
  NOW()
)
WHERE
  CAST(summary AS jsonb)->'exam'->>'completed_at' IS NOT NULL
  AND NULLIF(CAST(summary AS jsonb)->'exam'->>'completed_at', '') IS NOT NULL
  AND NULLIF(CAST(summary AS jsonb)->'exam'->>'completed_at', '')::timestamptz < CURRENT_DATE;
