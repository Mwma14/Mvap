-- First drop the existing default
ALTER TABLE public.movies ALTER COLUMN category DROP DEFAULT;

-- Change category from single text to array for multiple genres
ALTER TABLE public.movies 
ALTER COLUMN category TYPE text[] USING ARRAY[category];

-- Set new default value as empty array
ALTER TABLE public.movies 
ALTER COLUMN category SET DEFAULT ARRAY['Action']::text[];

-- Make column NOT NULL with a default
ALTER TABLE public.movies 
ALTER COLUMN category SET NOT NULL;