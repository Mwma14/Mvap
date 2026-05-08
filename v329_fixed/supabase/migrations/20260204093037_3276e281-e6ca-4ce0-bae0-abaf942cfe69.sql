-- Add content_type to movies table to distinguish movies from series
ALTER TABLE public.movies 
ADD COLUMN content_type text NOT NULL DEFAULT 'movie' CHECK (content_type IN ('movie', 'series'));

-- Create seasons table
CREATE TABLE public.seasons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
    season_number INTEGER NOT NULL,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(movie_id, season_number)
);

-- Create episodes table with streaming links
CREATE TABLE public.episodes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    duration TEXT,
    air_date DATE,
    thumbnail_url TEXT,
    stream_url TEXT,
    telegram_url TEXT,
    mega_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(season_id, episode_number)
);

-- Enable RLS on seasons
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

-- Seasons policies
CREATE POLICY "Anyone can view seasons" ON public.seasons
FOR SELECT USING (true);

CREATE POLICY "Admins can insert seasons" ON public.seasons
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update seasons" ON public.seasons
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete seasons" ON public.seasons
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable RLS on episodes
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

-- Episodes policies
CREATE POLICY "Anyone can view episodes" ON public.episodes
FOR SELECT USING (true);

CREATE POLICY "Admins can insert episodes" ON public.episodes
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update episodes" ON public.episodes
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete episodes" ON public.episodes
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_seasons_movie_id ON public.seasons(movie_id);
CREATE INDEX idx_episodes_season_id ON public.episodes(season_id);