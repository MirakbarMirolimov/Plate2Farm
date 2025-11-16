# 🪣 Fresh Bucket Setup Guide

Let's create a new storage bucket from scratch to fix the MIME type issues!

## Step 1: Delete Existing Bucket

1. **Go to Supabase Dashboard**
   - Open: https://supabase.com/dashboard
   - Sign in to your account
   - Select your project: `uzhrtsrhedmzaptqzfna`

2. **Navigate to Storage**
   - Click **Storage** in the left sidebar
   - You should see your current `listings_images` bucket

3. **Delete the Old Bucket**
   - Click on the `listings_images` bucket
   - Click the **Settings** tab (gear icon)
   - Scroll down and click **"Delete bucket"**
   - Type the bucket name to confirm: `listings_images`
   - Click **"Delete bucket"** to confirm
   - ✅ Old bucket is now deleted

## Step 2: Create New Bucket

1. **Create New Bucket**
   - Click **"New bucket"** button
   - Enter bucket name: `plate2farm_images`
   - ✅ **Set Public to: ON** (This is crucial!)
   - Leave other settings as default
   - Click **"Create bucket"**

2. **Verify Bucket Settings**
   - Click on your new `plate2farm_images` bucket
   - Go to **Settings** tab
   - Confirm these settings:
     - ✅ **Public**: ON
     - ✅ **File size limit**: 50 MB (default)
     - ✅ **Allowed MIME types**: Leave empty (allows all)

3. **Set Bucket Policies (Complete End-to-End Setup!)**
   
   Go to your Supabase dashboard → Storage → `plate2farm_images` bucket → **Policies** tab
   
   **Policy 1: Allow Authenticated Users to Upload Images**
   - Click **"New policy"** → **"For full customization"**
   - Policy name: `Allow authenticated uploads`
   - Operation: **INSERT**
   ```sql
   CREATE POLICY "Allow authenticated uploads" ON storage.objects
   FOR INSERT 
   TO authenticated
   WITH CHECK (
     bucket_id = 'plate2farm_images' AND 
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```
   
   **Policy 2: Allow Public Downloads (Image Display)**
   - Click **"New policy"** → **"For full customization"**
   - Policy name: `Allow public downloads`
   - Operation: **SELECT**
   ```sql
   CREATE POLICY "Allow public downloads" ON storage.objects
   FOR SELECT 
   TO public
   USING (bucket_id = 'plate2farm_images');
   ```
   
   **Policy 3: Allow Users to Update Their Own Images**
   - Click **"New policy"** → **"For full customization"**
   - Policy name: `Allow users to update own images`
   - Operation: **UPDATE**
   ```sql
   CREATE POLICY "Allow users to update own images" ON storage.objects
   FOR UPDATE 
   TO authenticated
   USING (
     bucket_id = 'plate2farm_images' AND 
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```
   
   **Policy 4: Allow Users to Delete Their Own Images**
   - Click **"New policy"** → **"For full customization"**
   - Policy name: `Allow users to delete own images`
   - Operation: **DELETE**
   ```sql
   CREATE POLICY "Allow users to delete own images" ON storage.objects
   FOR DELETE 
   TO authenticated
   USING (
     bucket_id = 'plate2farm_images' AND 
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```
   
   **Policy 5: Allow Service Role Full Access (For Admin Operations)**
   - Click **"New policy"** → **"For full customization"**
   - Policy name: `Allow service role full access`
   - Operation: **ALL**
   ```sql
   CREATE POLICY "Allow service role full access" ON storage.objects
   FOR ALL 
   TO service_role
   USING (bucket_id = 'plate2farm_images');
   ```

**Policy Summary - You Should Have 5 Policies:**
- ✅ `Allow authenticated uploads` (INSERT)
- ✅ `Allow public downloads` (SELECT) 
- ✅ `Allow users to update own images` (UPDATE)
- ✅ `Allow users to delete own images` (DELETE)
- ✅ `Allow service role full access` (ALL)

**What These Policies Do:**
- **Policy 1**: Lets logged-in users upload images to their own folder
- **Policy 2**: Allows anyone to view/download images (for app display)
- **Policy 3**: Users can update their own images
- **Policy 4**: Users can delete their own images  
- **Policy 5**: Admin/service operations work properly

## Step 3: Test Bucket Access

1. **Upload Test File**
   - In your bucket, click **"Upload file"**
   - Upload any small image file
   - Verify it appears in the bucket

2. **Test Public Access**
   - Click on the uploaded file
   - Copy the public URL
   - Open the URL in a new browser tab
   - ✅ You should see the image

## Step 4: Update App Configuration

Once you've completed the above steps, I'll update the code to use the new bucket name `plate2farm_images`.

## Expected Results

After completing these steps:
- ✅ Clean bucket with proper permissions
- ✅ No MIME type conflicts
- ✅ Public access enabled
- ✅ Proper policies set

## Troubleshooting

If you encounter issues:
1. **Bucket creation fails**: Check if you have admin permissions
2. **Public access not working**: Verify the bucket is set to Public
3. **Upload fails**: Check the policies are correctly applied

## Next Steps

1. Complete the bucket setup above
2. Let me know when it's done
3. I'll update the code to use `plate2farm_images`
4. Test image uploads in the app

---

**Need Help?** Let me know which step you're on and I'll provide more detailed guidance!
