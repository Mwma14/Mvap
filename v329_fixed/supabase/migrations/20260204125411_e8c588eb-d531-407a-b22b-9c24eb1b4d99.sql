-- Watch History - Tracks viewing progress and history
CREATE TABLE public.watch_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  movie_id uuid REFERENCES public.movies(id) ON DELETE CASCADE NOT NULL,
  episode_id uuid REFERENCES public.episodes(id) ON DELETE CASCADE,
  progress_seconds integer DEFAULT 0,
  duration_seconds integer,
  completed boolean DEFAULT false,
  watched_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, movie_id, episode_id)
);

-- Movie Views for Trending
CREATE TABLE public.movie_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id uuid REFERENCES public.movies(id) ON DELETE CASCADE UNIQUE NOT NULL,
  view_count integer DEFAULT 0,
  week_views integer DEFAULT 0,
  last_updated timestamp with time zone DEFAULT now()
);

-- Ratings
CREATE TABLE public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  movie_id uuid REFERENCES public.movies(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

-- Add rating columns to movies
ALTER TABLE public.movies ADD COLUMN average_rating decimal(3,2) DEFAULT 0;
ALTER TABLE public.movies ADD COLUMN rating_count integer DEFAULT 0;

-- Create validation trigger for ratings (1-5 range) instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_rating_trigger
BEFORE INSERT OR UPDATE ON public.ratings
FOR EACH ROW
EXECUTE FUNCTION public.validate_rating();

-- Function to update movie average rating
CREATE OR REPLACE FUNCTION public.update_movie_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.movies
    SET average_rating = COALESCE((
      SELECT AVG(rating)::decimal(3,2) FROM public.ratings WHERE movie_id = OLD.movie_id
    ), 0),
    rating_count = (SELECT COUNT(*) FROM public.ratings WHERE movie_id = OLD.movie_id)
    WHERE id = OLD.movie_id;
    RETURN OLD;
  ELSE
    UPDATE public.movies
    SET average_rating = COALESCE((
      SELECT AVG(rating)::decimal(3,2) FROM public.ratings WHERE movie_id = NEW.movie_id
    ), 0),
    rating_count = (SELECT COUNT(*) FROM public.ratings WHERE movie_id = NEW.movie_id)
    WHERE id = NEW.movie_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_movie_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_movie_rating();

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_view_count(p_movie_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO public.movie_views (movie_id, view_count, week_views, last_updated)
  VALUES (p_movie_id, 1, 1, now())
  ON CONFLICT (movie_id) DO UPDATE
  SET view_count = movie_views.view_count + 1,
      week_views = movie_views.week_views + 1,
      last_updated = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to reset weekly views (to be called by a cron job)
CREATE OR REPLACE FUNCTION public.reset_weekly_views()
RETURNS void AS $$
BEGIN
  UPDATE public.movie_views SET week_views = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RLS Policies
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Watch history: users can manage their own
CREATE POLICY "Users can view own history" ON public.watch_history 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON public.watch_history 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own history" ON public.watch_history 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own history" ON public.watch_history 
  FOR DELETE USING (auth.uid() = user_id);

-- Movie views: anyone can read, authenticated users can increment via function
CREATE POLICY "Anyone can view counts" ON public.movie_views 
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert views" ON public.movie_views 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update views" ON public.movie_views 
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Ratings: users manage own, anyone can read
CREATE POLICY "Anyone can view ratings" ON public.ratings 
  FOR SELECT USING (true);
CREATE POLICY "Users can rate" ON public.ratings 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rating" ON public.ratings 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rating" ON public.ratings 
  FOR DELETE USING (auth.uid() = user_id);