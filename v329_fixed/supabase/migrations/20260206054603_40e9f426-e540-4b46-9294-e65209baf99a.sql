
-- Create cast_members table
CREATE TABLE public.cast_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cast_members ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can view, admins can manage
CREATE POLICY "Anyone can view cast members"
  ON public.cast_members FOR SELECT USING (true);
CREATE POLICY "Admins can insert cast members"
  ON public.cast_members FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update cast members"
  ON public.cast_members FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete cast members"
  ON public.cast_members FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Create movie_cast junction table
CREATE TABLE public.movie_cast (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id uuid NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  cast_member_id uuid NOT NULL REFERENCES public.cast_members(id) ON DELETE CASCADE,
  character_name text,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(movie_id, cast_member_id)
);

ALTER TABLE public.movie_cast ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view movie cast"
  ON public.movie_cast FOR SELECT USING (true);
CREATE POLICY "Admins can insert movie cast"
  ON public.movie_cast FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update movie cast"
  ON public.movie_cast FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete movie cast"
  ON public.movie_cast FOR DELETE
  USING (has_role(auth.uid(), 'admin'));
