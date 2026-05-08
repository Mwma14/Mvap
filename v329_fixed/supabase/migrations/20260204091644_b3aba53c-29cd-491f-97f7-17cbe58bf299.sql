-- Create storage bucket for movie posters
INSERT INTO storage.buckets (id, name, public)
VALUES ('movie-posters', 'movie-posters', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view movie posters (public bucket)
CREATE POLICY "Anyone can view movie posters"
ON storage.objects FOR SELECT
USING (bucket_id = 'movie-posters');

-- Allow authenticated users to upload movie posters
CREATE POLICY "Authenticated users can upload movie posters"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'movie-posters' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update movie posters"
ON storage.objects FOR UPDATE
USING (bucket_id = 'movie-posters' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete movie posters
CREATE POLICY "Authenticated users can delete movie posters"
ON storage.objects FOR DELETE
USING (bucket_id = 'movie-posters' AND auth.role() = 'authenticated');