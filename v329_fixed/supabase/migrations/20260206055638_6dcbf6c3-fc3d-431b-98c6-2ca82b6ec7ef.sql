-- Create the movie-posters storage bucket for poster/backdrop/cast photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('movie-posters', 'movie-posters', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view files in movie-posters bucket
CREATE POLICY "Anyone can view movie posters"
ON storage.objects FOR SELECT
USING (bucket_id = 'movie-posters');

-- Allow admins to upload to movie-posters bucket
CREATE POLICY "Admins can upload movie posters"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'movie-posters' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update files in movie-posters bucket
CREATE POLICY "Admins can update movie posters"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'movie-posters' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete files in movie-posters bucket
CREATE POLICY "Admins can delete movie posters"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'movie-posters' 
  AND has_role(auth.uid(), 'admin'::app_role)
);