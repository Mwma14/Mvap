-- Migration: v3.2.9 — watch_history upsert optimization
--
-- Adds a unique constraint on (user_id, movie_id, episode_id) to the watch_history table.
-- This enables the upsert-based progress saving in useUpdateProgress(),
-- which replaces the old 2-query select+update/insert pattern.
--
-- The constraint uses a partial index to handle NULL episode_id correctly:
--   - For movies: (user_id, movie_id) where episode_id IS NULL
--   - For episodes: (user_id, movie_id, episode_id)

-- Add unique constraint for movie-level watch history (no episode)
CREATE UNIQUE INDEX IF NOT EXISTS watch_history_user_movie_unique
  ON watch_history (user_id, movie_id)
  WHERE episode_id IS NULL;

-- Add unique constraint for episode-level watch history
CREATE UNIQUE INDEX IF NOT EXISTS watch_history_user_movie_episode_unique
  ON watch_history (user_id, movie_id, episode_id)
  WHERE episode_id IS NOT NULL;

-- Note: The upsert in useUpdateProgress uses onConflict: 'user_id,movie_id,episode_id'
-- Supabase/PostgREST resolves this to the appropriate partial index automatically.
