# Supabase Storage Setup Guide

## Issue: Storage Bucket Not Available

If you're seeing the error "Storage bucket not available", you need to manually create the storage bucket in your Supabase dashboard.

## Manual Setup Steps

### 1. Access Supabase Dashboard
- Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Sign in to your account
- Select your project: `uzhrtsrhedmzaptqzfna`

### 2. Navigate to Storage
- In the left sidebar, click on **Storage**
- You'll see the storage buckets page

### 3. Verify the Existing Bucket
Your bucket should already exist with:
- Bucket name: `listings_images` (with 's')
- Set **Public** to: `true` ✅

If the bucket doesn't exist:
- Click the **"Create bucket"** button
- Enter bucket name: `listings_images`
- Set **Public** to: `true` ✅
- Click **"Create bucket"**

### 4. Verify Bucket Settings
Make sure:
- ✅ Bucket name is exactly: `listings_images`
- ✅ Public access is enabled
- ✅ You can see the bucket in the storage list

### 5. Test the App
- Restart your app: `npm start`
- Try creating a listing with an image
- Check console logs for success messages

## Troubleshooting

### Permission Issues
If you see permission errors:
1. Check that your Supabase API key has storage permissions
2. Verify your project URL is correct in `.env` file
3. Make sure the bucket is set to public

### Bucket Already Exists
If you get "bucket already exists" error:
1. Check if the bucket appears in your dashboard
2. Verify the bucket name is exactly `listings_images`
3. Restart the app to clear any cached errors

### Still Having Issues?
1. Check the browser console for detailed error messages
2. Verify your Supabase project is active and not paused
3. Check your Supabase project's storage quota

## Expected Console Output After Setup

When working correctly, you should see:
```
✅ Storage bucket "listings_images" exists and is accessible
📸 ==> Starting image upload process
✅ Upload successful
🔗 Generated public URL: https://[project].supabase.co/storage/v1/object/public/listings_images/...
```

## Need Help?
- Check Supabase documentation: [https://supabase.com/docs/guides/storage](https://supabase.com/docs/guides/storage)
- Verify your project settings in the Supabase dashboard
