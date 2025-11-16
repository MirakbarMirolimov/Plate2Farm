-- =====================================================
-- SIMPLIFIED Supabase Storage RLS Policies for Plate2Farm
-- Bucket: listings_images
-- =====================================================

-- First, drop any existing policies to start fresh
DROP POLICY IF EXISTS "Allow authenticated users to view all images" ON storage.objects;
DROP POLICY IF EXISTS "Allow farms to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow farms to update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow farms to delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to images" ON storage.objects;
DROP POLICY IF EXISTS "Limit file size to 10MB" ON storage.objects;
DROP POLICY IF EXISTS "Only allow image files" ON storage.objects;

-- =====================================================
-- POLICY 1: Allow EVERYONE to view images (public access)
-- =====================================================
CREATE POLICY "Public read access for listings images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'listings_images');

-- =====================================================
-- POLICY 2: Allow authenticated users to upload images
-- =====================================================
CREATE POLICY "Authenticated users can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listings_images');

-- =====================================================
-- POLICY 3: Allow users to update their own images
-- =====================================================
CREATE POLICY "Users can update own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'listings_images'
  AND owner = auth.uid()
);

-- =====================================================
-- POLICY 4: Allow users to delete their own images
-- =====================================================
CREATE POLICY "Users can delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'listings_images'
  AND owner = auth.uid()
);

-- =====================================================
-- BUCKET CONFIGURATION
-- =====================================================

-- Ensure bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('listings_images', 'listings_images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check policies
SELECT policyname, cmd, roles, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%listings%';

-- Check bucket
SELECT id, name, public FROM storage.buckets WHERE id = 'listings_images';
