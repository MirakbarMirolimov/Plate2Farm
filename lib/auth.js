import { supabase } from './supabase';

export const checkDatabaseSetup = async () => {
  try {
    console.log('🔍 Checking database setup...');
    
    // Check if profiles table exists
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Database check failed:', error);
      if (error.code === '42P01') {
        return { 
          isSetup: false, 
          error: 'Database tables not found. Please run the SQL schema in your Supabase dashboard.' 
        };
      }
      return { isSetup: false, error: error.message };
    }
    
    console.log('✅ Database tables exist');
    return { isSetup: true, error: null };
  } catch (error) {
    console.error('❌ Database setup check failed:', error);
    return { isSetup: false, error: error.message };
  }
};

export const signUp = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // Don't create profile here - will be created during onboarding
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const signIn = async (email, password) => {
  try {
    console.log('🔐 Attempting sign in for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Sign in error:', error);
      throw error;
    }
    
    console.log('✅ Sign in successful:', data.user?.email);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Sign in failed:', error.message);
    return { data: null, error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

export const getCurrentUser = async () => {
  try {
    // First try to get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      throw sessionError;
    }
    
    if (!session) {
      console.log('❌ No active session');
      return { user: null, error: new Error('No active session') };
    }
    
    // If session exists, get user
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    
    return { user, error: null };
  } catch (error) {
    console.error('❌ getCurrentUser error:', error);
    return { user: null, error };
  }
};

export const getUserProfile = async (userId) => {
  try {
    console.log('👤 Fetching profile for user:', userId);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Profile fetch error:', error);
      
      // If profile doesn't exist (0 rows), return null instead of throwing error
      if (error.code === 'PGRST116') {
        console.warn('⚠️ Profile not found for user:', userId);
        return { profile: null, error: null };
      }
      
      throw error;
    }
    
    console.log('✅ Profile fetched:', data);
    return { profile: data, error: null };
  } catch (error) {
    console.error('❌ Profile fetch failed:', error.message);
    return { profile: null, error };
  }
};

export const createMissingProfile = async (user, name, role) => {
  try {
    console.log('🔧 Creating missing profile for user:', user.email);
    console.log('🔧 User ID:', user.id);
    console.log('🔧 Profile data:', { id: user.id, email: user.email, name, role });
    
    // First, let's check if the profiles table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    if (tableError) {
      console.error('❌ Profiles table check failed:', tableError);
      if (tableError.code === '42P01') {
        throw new Error('The profiles table does not exist. Please run the database schema first.');
      }
      throw tableError;
    }
    
    console.log('✅ Profiles table exists');
    
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        name: name || user.email.split('@')[0], // Use email prefix as default name
        role: role || 'restaurant', // Default to restaurant if not specified
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating profile:', error);
      throw error;
    }

    console.log('✅ Profile created:', data);
    return { profile: data, error: null };
  } catch (error) {
    console.error('❌ Profile creation failed:', error.message);
    return { profile: null, error };
  }
};
