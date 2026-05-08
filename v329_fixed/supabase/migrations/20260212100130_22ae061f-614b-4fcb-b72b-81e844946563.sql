
-- Table to store globally broken channel URLs
CREATE TABLE public.broken_channels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_url text NOT NULL UNIQUE,
  channel_name text,
  reported_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.broken_channels ENABLE ROW LEVEL SECURITY;

-- Anyone can read (to filter out broken channels)
CREATE POLICY "Anyone can view broken channels"
ON public.broken_channels FOR SELECT
USING (true);

-- Authenticated users can report broken channels
CREATE POLICY "Authenticated can report broken channels"
ON public.broken_channels FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Admins can delete (to unblock channels)
CREATE POLICY "Admins can delete broken channels"
ON public.broken_channels FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
