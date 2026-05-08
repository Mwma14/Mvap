
-- Movie Requests table
CREATE TABLE public.movie_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'movie',
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.movie_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests" ON public.movie_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own requests" ON public.movie_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests" ON public.movie_requests
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update requests" ON public.movie_requests
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete requests" ON public.movie_requests
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_movie_requests_updated_at
  BEFORE UPDATE ON public.movie_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- TV Channels table
CREATE TABLE public.tv_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Entertainment',
  stream_url TEXT,
  thumbnail_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tv_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active channels" ON public.tv_channels
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert channels" ON public.tv_channels
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update channels" ON public.tv_channels
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete channels" ON public.tv_channels
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_tv_channels_updated_at
  BEFORE UPDATE ON public.tv_channels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
