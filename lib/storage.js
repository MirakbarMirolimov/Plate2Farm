import { supabase } from "./supabase";
import * as FileSystem from "expo-file-system/legacy";

const BUCKET = "plate2farm_images"; // Make this bucket manually in Supabase dashboard

// Convert base64 → Uint8Array
function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ---- UPLOAD IMAGE ----
export async function uploadImage(uri, userId) {
  try {
    if (!uri || !userId) throw new Error("Missing arguments");

    const ext = uri.split(".").pop() || "jpg";
    const fileName = `${userId}-${Date.now()}.${ext}`;

    // Read file
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: "base64",
    });

    const bytes = base64ToBytes(base64);

    // Upload
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, bytes, {
        contentType: `image/${ext}`,
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const { data } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(fileName);

    return { url: data.publicUrl, error: null };
  } catch (err) {
    return { url: null, error: err };
  }
}

// ---- DELETE IMAGE ----
export async function deleteImage(publicUrl) {
  try {
    if (!publicUrl) return { error: null };

    const parts = publicUrl.split("/");
    const bucketIndex = parts.findIndex((p) => p === BUCKET);
    const path = parts.slice(bucketIndex + 1).join("/");

    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([path]);

    return { error };
  } catch (err) {
    return { error: err };
  }
}
