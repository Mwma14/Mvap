
-- Create storage bucket for slide images
INSERT INTO storage.buckets (id, name, public)
VALUES ('slide-images', 'slide-images', true);

-- Allow anyone to view slide images
CREATE POLICY "Slide images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'slide-images');

-- Allow admins to upload slide images
CREATE POLICY "Admins can upload slide images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'slide-images'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
);

-- Allow admins to update slide images
CREATE POLICY "Admins can update slide images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'slide-images'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
);

-- Allow admins to delete slide images
CREATE POLICY "Admins can delete slide images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'slide-images'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
);
