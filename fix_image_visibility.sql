-- =====================================================
-- COMPLETE FIX for Image Visibility Issues
-- =====================================================

-- Step 1: Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Allow authenticated users to view all images" ON storage.objects;
DROP POLICY IF EXISTS "Allow farms to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow farms to update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow farms to delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for listings images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Limit file size to 10MB" ON storage.objects;
DROP POLICY IF EXISTS "Only allow image files" ON storage.objects;

-- Step 2: Create the bucket (if it doesn't exist) and make it PUBLIC
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listings_images', 
  'listings_images', 
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- Step 3: Create SIMPLE policies that work
-- Policy 1: Allow EVERYONE to SELECT (view) images
CREATE POLICY "allow_all_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'listings_images');

-- Policy 2: Allow authenticated users to INSERT (upload) images  
CREATE POLICY "allow_authenticated_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listings_images');

-- Policy 3: Allow authenticated users to UPDATE their own images
CREATE POLICY "allow_authenticated_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'listings_images' AND owner = auth.uid());

-- Policy 4: Allow authenticated users to DELETE their own images
CREATE POLICY "allow_authenticated_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'listings_images' AND owner = auth.uid());

-- Step 4: Verify the setup
SELECT 
  'Bucket Configuration' as check_type,
  id, 
  name, 
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'listings_images';

SELECT 
  'RLS Policies' as check_type,
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE 'allow_%';

-- Step 5: Test query to see if you can access objects
SELECT 
  'Storage Objects' as check_type,
  name,
  bucket_id,
  owner,
  created_at
FROM storage.objects 
WHERE bucket_id = 'listings_images'
LIMIT 5;
