
-- Create telegram_files table
CREATE TABLE public.telegram_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id text NOT NULL,
  file_unique_id text NOT NULL UNIQUE,
  file_name text,
  file_size bigint,
  mime_type text,
  message_id integer,
  channel_id text,
  movie_id uuid REFERENCES public.movies(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.telegram_files ENABLE ROW LEVEL SECURITY;

-- Anyone can view telegram files (needed for streaming)
CREATE POLICY "Anyone can view telegram files"
ON public.telegram_files FOR SELECT
USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can insert telegram files"
ON public.telegram_files FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update telegram files"
ON public.telegram_files FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete telegram files"
ON public.telegram_files FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast lookups
CREATE INDEX idx_telegram_files_movie_id ON public.telegram_files(movie_id);
CREATE INDEX idx_telegram_files_file_id ON public.telegram_files(file_id);
