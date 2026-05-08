
-- Create football_videos table
CREATE TABLE public.football_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  thumbnail_url TEXT,
  stream_url TEXT,
  download_url TEXT,
  category TEXT NOT NULL DEFAULT 'Highlights',
  is_premium BOOLEAN DEFAULT false,
  is_live BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.football_videos ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view football videos"
ON public.football_videos
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert football videos"
ON public.football_videos
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update football videos"
ON public.football_videos
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete football videos"
ON public.football_videos
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Timestamp trigger
CREATE TRIGGER update_football_videos_updated_at
BEFORE UPDATE ON public.football_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
