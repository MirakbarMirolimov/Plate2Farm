import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';

export const uploadImage = async (imageUri, userId) => {
  try {
    console.log('📸 Starting image upload:', imageUri);
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `listing_${userId}_${timestamp}.jpg`;
    
    // Read the image file as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Convert base64 to blob
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });
    
    console.log('📤 Uploading to Supabase storage...');
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('listing-images')
      .upload(filename, blob, {
        contentType: 'image/jpeg',
        upsert: false
      });
    
    if (error) {
      console.error('❌ Upload error:', error);
      throw error;
    }
    
    console.log('✅ Upload successful:', data);
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('listing-images')
      .getPublicUrl(filename);
    
    console.log('🔗 Public URL:', publicUrl);
    
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
      .from('listing-images')
      .remove([filename]);
    
    if (error) throw error;
    
    console.log('🗑️ Image deleted:', filename);
    return { error: null };
  } catch (error) {
    console.error('❌ Image deletion failed:', error);
    return { error };
  }
};
