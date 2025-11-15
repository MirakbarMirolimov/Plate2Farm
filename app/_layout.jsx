import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';
import { getCurrentUser, getUserProfile, checkDatabaseSetup } from '../lib/auth';
import SetupGuide from '../components/SetupGuide';
import ProfileSetup from '../components/ProfileSetup';
import DatabaseError from '../components/DatabaseError';

export default function RootLayout() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [databaseError, setDatabaseError] = useState(null);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        // First check if database is set up
        console.log('🔍 Checking database setup...');
        const { isSetup, error: dbError } = await checkDatabaseSetup();
        
        if (!isSetup) {
          console.error('❌ Database not set up:', dbError);
          setDatabaseError(dbError);
          setLoading(false);
          return;
        }
        
        console.log('✅ Database is set up');
        setDatabaseError(null);
        
        console.log('🔍 Checking current user...');
        const { user: currentUser, error: userError } = await getCurrentUser();
        
        if (userError) {
          console.error('❌ Error getting current user:', userError);
        }
        
        setUser(currentUser);

        if (currentUser) {
          console.log('👤 User found:', currentUser.email);
          const { profile, error: profileError } = await getUserProfile(currentUser.id);
          
          if (profileError) {
            console.error('❌ Error getting user profile:', profileError);
            // If profile doesn't exist, user might need to complete registration
            console.warn('⚠️ Profile not found - user may need to complete registration');
          }
          
          setUserProfile(profile);
        } else {
          console.log('👤 No user found');
        }
      } catch (error) {
        console.error('❌ Error in checkUser:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          setUser(session.user);
          try {
            const { profile, error } = await getUserProfile(session.user.id);
            if (error) {
              console.error('❌ Error fetching profile in auth change:', error);
            }
            setUserProfile(profile);
          } catch (error) {
            console.error('❌ Unexpected error fetching profile:', error);
            setUserProfile(null);
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inRestaurantGroup = segments[0] === '(restaurant)';
    const inFarmGroup = segments[0] === '(farm)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && userProfile && userProfile.role) {
      if (inAuthGroup) {
        // Redirect based on role
        if (userProfile.role === 'restaurant') {
          router.replace('/(restaurant)/dashboard');
        } else if (userProfile.role === 'farm') {
          router.replace('/(farm)/listings');
        }
      } else if (userProfile.role === 'restaurant' && !inRestaurantGroup) {
        router.replace('/(restaurant)/dashboard');
      } else if (userProfile.role === 'farm' && !inFarmGroup) {
        router.replace('/(farm)/listings');
      }
    } else if (user && !userProfile) {
      // User exists but no profile - this will show ProfileSetup component
      console.log('👤 User exists but no profile found, showing profile setup');
    }
  }, [user, userProfile, segments, loading]);

  if (loading) {
    return null; // You can add a loading screen here
  }

  // If database is not set up, show database error
  if (databaseError) {
    return (
      <DatabaseError 
        error={databaseError} 
        onRetry={() => {
          setLoading(true);
          setDatabaseError(null);
          // Re-run the check
          const checkUser = async () => {
            try {
              const { isSetup, error: dbError } = await checkDatabaseSetup();
              if (!isSetup) {
                setDatabaseError(dbError);
              } else {
                // If database is now set up, reload the app
                window.location.reload();
              }
            } catch (error) {
              setDatabaseError(error.message);
            } finally {
              setLoading(false);
            }
          };
          checkUser();
        }} 
      />
    );
  }

  // If user exists but no profile, show profile setup
  if (user && !userProfile) {
    return (
      <ProfileSetup 
        user={user} 
        onProfileCreated={(profile) => setUserProfile(profile)} 
      />
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(restaurant)" />
      <Stack.Screen name="(farm)" />
    </Stack>
  );
}
