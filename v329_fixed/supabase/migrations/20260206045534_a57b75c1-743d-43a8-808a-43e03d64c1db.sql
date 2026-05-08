
-- Add redirect_link column
ALTER TABLE public.info_slides
ADD COLUMN redirect_link text NOT NULL DEFAULT '';

-- Make title nullable
ALTER TABLE public.info_slides
ALTER COLUMN title DROP NOT NULL;
