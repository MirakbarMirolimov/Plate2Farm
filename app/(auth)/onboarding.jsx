import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { createMissingProfile } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { colors, spacing, radii, shadows, typography } from '../../constants/theme';

export default function Onboarding() {
  const [businessName, setBusinessName] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Get current session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('❌ Session error:', error);
          router.replace('/(auth)/login');
          return;
        }

        if (session?.user) {
          setUser(session.user);
        } else {
          console.log('❌ No session found, redirecting to login');
          router.replace('/(auth)/login');
        }
      } catch (error) {
        console.error('❌ Error getting session:', error);
        router.replace('/(auth)/login');
      } finally {
        setSessionLoading(false);
      }
    };

    getSession();
  }, []);

  const handleComplete = async () => {
    if (!businessName || !role) {
      Alert.alert('Almost there', 'Please add a business name and choose your role.');
      return;
    }

    if (!user) {
      Alert.alert('Session expired', 'User session not found. Please sign in again.');
      router.replace('/(auth)/login');
      return;
    }

    setLoading(true);

    try {
      const { profile, error } = await createMissingProfile(user, businessName, role);

      if (error) {
        Alert.alert('Could not finish setup', error.message);
      } else {
        Alert.alert(
          'Welcome to Plate2Farm',
          'Your profile is ready. Let’s keep good food in circulation.',
          [
            {
              text: 'Continue',
              onPress: () => {
                // Redirect to tabs for all users
                router.replace('/(tabs)/listings');
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Something went wrong', 'Please try again in a moment.');
    }

    setLoading(false);
  };

  if (sessionLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingTitle}>Preparing your space</Text>
        <Text style={styles.loadingSubtitle}>Checking your session…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.kicker}>Profile</Text>
          <Text style={styles.title}>Set up your place</Text>
          <Text style={styles.subtitle}>
            Tell us who you are so we can match the right surplus and partners.
          </Text>

          <View style={styles.formCard}>
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Business name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Green Table Market"
                  placeholderTextColor={colors.muted}
                  value={businessName}
                  onChangeText={setBusinessName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>I am a</Text>
                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      role === 'restaurant' && styles.roleButtonSelected,
                    ]}
                    onPress={() => setRole('restaurant')}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        role === 'restaurant' && styles.roleButtonTextSelected,
                      ]}
                    >
                      Kitchen / Market
                    </Text>
                    <Text
                      style={[
                        styles.roleDescription,
                        role === 'restaurant' && styles.roleDescriptionSelected,
                      ]}
                    >
                      Share surplus from your kitchen or market floor with nearby farms.
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      role === 'farm' && styles.roleButtonSelected,
                    ]}
                    onPress={() => setRole('farm')}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        role === 'farm' && styles.roleButtonTextSelected,
                      ]}
                    >
                      Farm Partner
                    </Text>
                    <Text
                      style={[
                        styles.roleDescription,
                        role === 'farm' && styles.roleDescriptionSelected,
                      ]}
                    >
                      Claim food for animals, compost, or secondary use on the farm.
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleComplete}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Saving profile…' : 'Finish setup'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  loadingTitle: {
    ...typography.h2,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  loadingSubtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  kicker: {
    ...typography.label,
    color: colors.primary,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.title,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
    color: colors.muted,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.card,
  },
  form: {
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
  },
  input: {
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    fontSize: 16,
    color: colors.ink,
  },
  roleContainer: {
    gap: spacing.sm,
  },
  roleButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surfaceSoft,
  },
  roleButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.inkSoft,
    marginBottom: 6,
  },
  roleButtonTextSelected: {
    color: colors.primaryDark,
  },
  roleDescription: {
    ...typography.caption,
    color: colors.muted,
  },
  roleDescriptionSelected: {
    color: colors.inkSoft,
  },
  button: {
    backgroundColor: colors.primaryDark,
    paddingVertical: 16,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: spacing.xs,
    ...shadows.soft,
  },
  buttonDisabled: {
    backgroundColor: colors.muted,
    shadowOpacity: 0,
  },
  buttonText: {
    ...typography.button,
    color: colors.white,
  },
});
