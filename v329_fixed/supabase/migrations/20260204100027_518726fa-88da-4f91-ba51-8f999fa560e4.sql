-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Anyone can view categories
CREATE POLICY "Anyone can view categories"
ON public.categories
FOR SELECT
USING (true);

-- Only admins can manage categories
CREATE POLICY "Admins can insert categories"
ON public.categories
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update categories"
ON public.categories
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete categories"
ON public.categories
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default categories
INSERT INTO public.categories (name, display_order) VALUES
  ('Latest', 1),
  ('Action', 2),
  ('K-Drama', 3),
  ('Hollywood', 4),
  ('Thriller', 5),
  ('Comedy', 6),
  ('Romance', 7),
  ('Horror', 8),
  ('Sci-Fi', 9),
  ('Documentary', 10),
  ('Animation', 11),
  ('Drama', 12);