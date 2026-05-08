-- Add download_url column to episodes table (matching movies table pattern)
ALTER TABLE public.episodes ADD COLUMN IF NOT EXISTS download_url text DEFAULT NULL;