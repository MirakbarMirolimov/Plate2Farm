import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Debug environment variables
console.log('🔍 Environment check:');
console.log('EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

// Temporary fix: Use your actual credentials directly
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://uzhrtsrhedmzaptqzfna.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aHJ0c3JoZWRtemFwdHF6Zm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTQyMzEsImV4cCI6MjA3ODc5MDIzMX0.Fh1FUkMzokBTcSeOokVIWka3EmJa_Wf69HQNTFL-u7U';

console.log('🔧 Using Supabase URL:', supabaseUrl);

// Check if we're using placeholder values
const isUsingPlaceholders = supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder');

if (isUsingPlaceholders) {
  console.warn('⚠️  Using placeholder Supabase credentials. Please update your .env file with real values.');
} else {
  console.log('✅ Using real Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
