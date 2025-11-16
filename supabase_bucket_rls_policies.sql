-- =====================================================
-- Supabase Storage RLS Policies for Plate2Farm
-- Bucket: listings_images
-- =====================================================

-- Note: RLS is already enabled on storage.objects by default in Supabase
-- No need to manually enable it

-- =====================================================
-- POLICY 1: Allow authenticated users to view all images
-- =====================================================
CREATE POLICY "Allow authenticated users to view all images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'listings_images');

-- =====================================================
-- POLICY 2: Allow farms to upload images
-- =====================================================
CREATE POLICY "Allow farms to upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'listings_images' 
  AND auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE role = 'farm'
  )
);

-- =====================================================
-- POLICY 3: Allow farms to update their own images
-- =====================================================
CREATE POLICY "Allow farms to update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'listings_images'
  AND auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE role = 'farm'
  )
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'listings_images'
  AND auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE role = 'farm'
  )
);

-- =====================================================
-- POLICY 4: Allow farms to delete their own images
-- =====================================================
CREATE POLICY "Allow farms to delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'listings_images'
  AND auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE role = 'farm'
  )
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- POLICY 5: Allow public access to view images (for restaurants)
-- =====================================================
CREATE POLICY "Allow public read access to images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'listings_images');

-- =====================================================
-- ALTERNATIVE POLICIES (Choose one set based on your needs)
-- =====================================================

-- OPTION A: If you want to organize images by user folders
-- Update your upload function to use: `${userId}/${filename}`
-- Then use these policies instead:

/*
-- Allow farms to upload to their own folder
CREATE POLICY "Allow farms to upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'listings_images' 
  AND auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE role = 'farm'
  )
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow farms to manage only their own folder
CREATE POLICY "Allow farms to manage own folder"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'listings_images'
  AND auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE role = 'farm'
  )
  AND (storage.foldername(name))[1] = auth.uid()::text
);
*/

-- =====================================================
-- BUCKET CONFIGURATION
-- =====================================================

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('listings_images', 'listings_images', true)
ON CONFLICT (id) DO NOTHING;

-- Set bucket to be publicly accessible
UPDATE storage.buckets 
SET public = true 
WHERE id = 'listings_images';

-- =====================================================
-- ADDITIONAL SECURITY POLICIES (Optional)
-- =====================================================

-- Limit file size to 10MB
CREATE POLICY "Limit file size to 10MB"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'listings_images'
  AND COALESCE((metadata->>'size')::bigint, 0) < 10485760
);

-- Only allow image file types
CREATE POLICY "Only allow image files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'listings_images'
  AND (
    lower((metadata->>'mimetype')::text) = 'image/jpeg' OR
    lower((metadata->>'mimetype')::text) = 'image/jpg' OR
    lower((metadata->>'mimetype')::text) = 'image/png' OR
    lower((metadata->>'mimetype')::text) = 'image/webp' OR
    lower((metadata->>'mimetype')::text) = 'image/gif'
  )
);

-- =====================================================
-- CLEANUP (Run if you need to remove existing policies)
-- =====================================================

/*
-- Drop existing policies if you need to recreate them
DROP POLICY IF EXISTS "Allow authenticated users to view all images" ON storage.objects;
DROP POLICY IF EXISTS "Allow farms to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow farms to update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow farms to delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to images" ON storage.objects;
DROP POLICY IF EXISTS "Limit file size to 10MB" ON storage.objects;
DROP POLICY IF EXISTS "Only allow image files" ON storage.objects;
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Check bucket configuration
SELECT * FROM storage.buckets WHERE id = 'listings_images';
