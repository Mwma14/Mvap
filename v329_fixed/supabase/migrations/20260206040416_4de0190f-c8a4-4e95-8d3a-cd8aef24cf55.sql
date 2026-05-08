
-- Create info_slides table for admin-managed carousel
CREATE TABLE public.info_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  bg_color TEXT NOT NULL DEFAULT 'from-red-600 to-red-800',
  accent_color TEXT NOT NULL DEFAULT 'text-yellow-300',
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.info_slides ENABLE ROW LEVEL SECURITY;

-- Everyone can read active slides
CREATE POLICY "Anyone can view active slides"
  ON public.info_slides FOR SELECT
  USING (is_active = true);

-- Admin policies using user_roles table directly
CREATE POLICY "Admins can insert slides"
  ON public.info_slides FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update slides"
  ON public.info_slides FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete slides"
  ON public.info_slides FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Insert default mock slides
INSERT INTO public.info_slides (title, description, image_url, bg_color, accent_color, display_order) VALUES
  ('Welcome to Cineverse Premium', 'Stream unlimited movies, series & K-Drama with Myanmar subtitles. Enjoy HD quality anytime, anywhere!', NULL, 'from-red-600 to-red-800', 'text-yellow-300', 1),
  ('Download & Watch Offline', 'Save your favorite movies to watch without internet. Available for Premium members!', NULL, 'from-blue-600 to-blue-800', 'text-cyan-300', 2),
  ('Request Any Movie', E'Can''t find your movie? Request it and we''ll add it within 24 hours with Myanmar subtitles!', NULL, 'from-purple-600 to-purple-800', 'text-pink-300', 3),
  ('Live Football Streaming', 'Watch live football matches, replays and highlights. Never miss a game again!', NULL, 'from-emerald-600 to-emerald-800', 'text-lime-300', 4),
  ('New Movies Every Day', 'We add new movies and series daily. Stay tuned for the latest blockbusters and trending content!', NULL, 'from-amber-600 to-amber-800', 'text-yellow-200', 5);
