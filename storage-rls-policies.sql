-- IMPORTANT: You cannot run storage policies via SQL Editor
-- Storage policies must be configured through the Supabase Dashboard UI

-- Instead, follow these steps in the Supabase Dashboard:

-- STEP 1: Make the bucket public (EASIEST SOLUTION)
-- 1. Go to Storage in your Supabase dashboard
-- 2. Click on your "listings_images" bucket
-- 3. Click the Settings (gear) icon
-- 4. Toggle "Public bucket" to ON
-- 5. Click Save

-- STEP 2: If you want custom policies instead of public bucket:
-- 1. Go to Storage → listings_images bucket
-- 2. Click "Policies" tab
-- 3. Click "New Policy"
-- 4. Create these policies:

-- Policy 1: Allow uploads for authenticated users
-- Name: "Allow authenticated uploads"
-- Operation: INSERT
-- Target roles: authenticated
-- Policy definition: true

-- Policy 2: Allow public read access
-- Name: "Allow public read"
-- Operation: SELECT  
-- Target roles: public
-- Policy definition: true

-- Policy 3: Allow users to delete their own images
-- Name: "Allow delete own images"
-- Operation: DELETE
-- Target roles: authenticated
-- Policy definition: auth.uid()::text = (storage.foldername(name))[1]

-- Also make sure the bucket is public for read access
-- You can also do this in the Supabase dashboard: Storage > listings_images > Settings > Make bucket public

-- Alternative: If you want to make the bucket completely public (easier approach)
-- You can run this instead of the policies above:

-- UPDATE storage.buckets 
-- SET public = true 
-- WHERE id = 'listings_images';

-- And then create a simple policy:
-- CREATE POLICY "Public read access for listing images" ON storage.objects
--   FOR SELECT USING (bucket_id = 'listings_images');

-- CREATE POLICY "Authenticated users can upload listing images" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'listings_images' 
--     AND auth.role() = 'authenticated'
--   );
