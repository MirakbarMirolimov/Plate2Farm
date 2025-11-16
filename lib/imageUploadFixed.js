import { supabase } from './supabase';

export const uploadImage = async (imageUri, userId) => {
  try {
    console.log('📸 Starting image upload:', imageUri);
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `listing_${userId}_${timestamp}.jpg`;
    
    console.log('📤 Uploading to Supabase storage...');
    
    // Convert image URI to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    console.log('📄 Blob info:', {
      size: blob.size,
      type: blob.type
    });
    
    // Upload directly as blob without specifying contentType
    const { data, error } = await supabase.storage
      .from('listings_images')
      .upload(filename, blob, {
        upsert: false
      });
    
    if (error) {
      console.error('❌ Upload error:', error);
      throw error;
    }
    
    console.log('✅ Upload successful:', data);
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('listings_images')
      .getPublicUrl(filename);
    
    console.log('🔗 Public URL:', publicUrl);
    
    // Verify the URL is accessible
    if (!publicUrl || publicUrl.includes('undefined')) {
      console.error('❌ Invalid public URL generated:', publicUrl);
      throw new Error('Failed to generate valid image URL');
    }
    
    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('❌ Image upload failed:', error);
    return { url: null, error };
  }
};

export const deleteImage = async (imageUrl) => {
  try {
    // Extract filename from URL
    const filename = imageUrl.split('/').pop();
    
    const { error } = await supabase.storage
      .from('listings_images')
      .remove([filename]);
    
    if (error) throw error;
    
    console.log('🗑️ Image deleted:', filename);
    return { error: null };
  } catch (error) {
    console.error('❌ Image deletion failed:', error);
    return { error };
  }
};
