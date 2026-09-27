import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Check if user has seen onboarding
        const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
        setHasSeenOnboarding(onboardingCompleted === 'true');
        
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
        
        console.log('🔍 Checking current session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }
        
        if (!session?.user) {
          console.log('❌ No active session');
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }
        
        const currentUser = session.user;
        console.log('👤 User found:', currentUser.email);
        const { profile, error: profileError } = await getUserProfile(currentUser.id);

        // Missing profile is expected until the user finishes setup — not an app error
        if (profileError) {
          console.error('❌ Error getting user profile:', profileError);
        }

        setUser(currentUser);
        setUserProfile(profile);
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
            // null profile = needs onboarding; only log real failures
            if (error) {
              console.error('❌ Error fetching profile in auth change:', error);
            }
            setUserProfile(profile ?? null);
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
    const inTabsGroup = segments[0] === '(tabs)';
    const inOnboarding = segments[0] === 'onboarding';

    // Always start with onboarding screen if not already there and not in auth group
    if (!inOnboarding && !inAuthGroup && !user) {
      console.log('🎯 Always redirecting to onboarding first');
      router.replace('/onboarding');
      return;
    }

    // If user is authenticated with profile, redirect to main app
    if (user && userProfile && userProfile.role) {
      if (inAuthGroup || inOnboarding) {
        // Redirect to tabs after successful auth
        router.replace('/(tabs)/listings');
      } else if (!inTabsGroup) {
        // Always redirect to tabs for authenticated users with profiles
        router.replace('/(tabs)/listings');
      }
    } else if (user && !userProfile && !inAuthGroup) {
      // User exists but no profile - redirect to profile onboarding
      console.log('👤 User exists but no profile found, redirecting to profile onboarding');
      router.replace('/(auth)/onboarding');
    }
  }, [user, userProfile, segments, loading, hasSeenOnboarding]);

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
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(restaurant)" />
      <Stack.Screen name="(farm)" />
    </Stack>
  );
}
