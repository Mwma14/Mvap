-- Add download_url column to movies table
ALTER TABLE public.movies ADD COLUMN download_url TEXT DEFAULT NULL;