import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';
import { getCurrentUser, getUserProfile } from '../lib/auth';

export default function RootLayout() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { user: currentUser } = await getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        const { profile } = await getUserProfile(currentUser.id);
        setUserProfile(profile);
      }

      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          const { profile } = await getUserProfile(session.user.id);
          setUserProfile(profile);
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
    } else if (user && userProfile) {
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
    }
  }, [user, userProfile, segments, loading]);

  if (loading) {
    return null; // You can add a loading screen here
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(restaurant)" />
      <Stack.Screen name="(farm)" />
    </Stack>
  );
}
