-- =============================================================================
-- SUPABASE STORAGE POLICIES FOR plate2farm_images BUCKET
-- =============================================================================
-- 
-- Instructions:
-- 1. Go to Supabase Dashboard → Storage → plate2farm_images bucket → Policies tab
-- 2. For each policy below, click "New policy" → "For full customization"
-- 3. Copy and paste the SQL code for each policy
-- 4. Give each policy the name specified in the comments
-- 
-- =============================================================================

-- POLICY 1: Allow Authenticated Users to Upload Images
-- Policy Name: Allow authenticated uploads
-- Operation: INSERT
-- Description: Lets logged-in users upload images to their own user folder

CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'plate2farm_images' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- =============================================================================

-- POLICY 2: Allow Public Downloads (Image Display)
-- Policy Name: Allow public downloads
-- Operation: SELECT
-- Description: Allows anyone to view/download images (essential for app display)

CREATE POLICY "Allow public downloads" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'plate2farm_images');

-- =============================================================================

-- POLICY 3: Allow Users to Update Their Own Images
-- Policy Name: Allow users to update own images
-- Operation: UPDATE
-- Description: Users can modify their own uploaded images only

CREATE POLICY "Allow users to update own images" ON storage.objects
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'plate2farm_images' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- =============================================================================

-- POLICY 4: Allow Users to Delete Their Own Images
-- Policy Name: Allow users to delete own images
-- Operation: DELETE
-- Description: Users can remove their own images only

CREATE POLICY "Allow users to delete own images" ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'plate2farm_images' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- =============================================================================

-- POLICY 5: Allow Service Role Full Access (Admin Operations)
-- Policy Name: Allow service role full access
-- Operation: ALL
-- Description: Admin/service operations work properly

CREATE POLICY "Allow service role full access" ON storage.objects
FOR ALL 
TO service_role
USING (bucket_id = 'plate2farm_images');

-- =============================================================================
-- VERIFICATION CHECKLIST
-- =============================================================================
-- 
-- After applying all policies, you should have:
-- ✅ Allow authenticated uploads (INSERT)
-- ✅ Allow public downloads (SELECT) 
-- ✅ Allow users to update own images (UPDATE)
-- ✅ Allow users to delete own images (DELETE)
-- ✅ Allow service role full access (ALL)
--
-- Total: 5 policies for complete functionality
-- 
-- =============================================================================
