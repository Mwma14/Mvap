
-- Remove ALL duplicates keeping only the row with highest progress (or latest last_watched_at as tiebreaker)
DELETE FROM watch_history
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, movie_id, COALESCE(episode_id, '00000000-0000-0000-0000-000000000000'))
    id
  FROM watch_history
  ORDER BY user_id, movie_id, COALESCE(episode_id, '00000000-0000-0000-0000-000000000000'), progress DESC NULLS LAST, last_watched_at DESC
);

-- Add unique constraint so upsert works correctly
CREATE UNIQUE INDEX watch_history_user_movie_episode_unique
ON watch_history (user_id, movie_id, COALESCE(episode_id, '00000000-0000-0000-0000-000000000000'));
