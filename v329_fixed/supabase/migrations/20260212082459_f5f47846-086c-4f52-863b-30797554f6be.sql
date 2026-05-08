
-- Create favorite_channels table for users to bookmark TV channels
CREATE TABLE public.favorite_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel_name TEXT NOT NULL,
  channel_url TEXT NOT NULL,
  channel_logo TEXT,
  channel_group TEXT,
  source_category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, channel_url)
);

-- Enable RLS
ALTER TABLE public.favorite_channels ENABLE ROW LEVEL SECURITY;

-- Users can view their own favorites
CREATE POLICY "Users can view own favorites"
ON public.favorite_channels FOR SELECT
USING (auth.uid() = user_id);

-- Users can add their own favorites
CREATE POLICY "Users can add own favorites"
ON public.favorite_channels FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove their own favorites
CREATE POLICY "Users can remove own favorites"
ON public.favorite_channels FOR DELETE
USING (auth.uid() = user_id);
