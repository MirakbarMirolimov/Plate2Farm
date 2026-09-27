import React, { useState } from 'react';
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
} from 'react-native';
import { createMissingProfile } from '../lib/auth';
import { colors, spacing, radii, shadows, typography } from '../constants/theme';

export default function ProfileSetup({ user, onProfileCreated }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateProfile = async () => {
    if (!name || !role) {
      Alert.alert('Almost there', 'Please add a business name and choose your role.');
      return;
    }

    setLoading(true);

    try {
      console.log('🔧 Creating profile for user:', user.email, 'with role:', role);
      const { profile, error } = await createMissingProfile(user, name, role);

      if (error) {
        console.error('❌ Profile creation error:', error);
        Alert.alert('Could not create profile', error.message || String(error));
      } else if (profile) {
        console.log('✅ Profile created successfully:', profile);
        Alert.alert('Profile saved', 'You’re set to start rescuing surplus food.');
        onProfileCreated(profile);
      } else {
        console.error('❌ No profile returned and no error');
        Alert.alert('Could not create profile', 'No profile was returned. Please try again.');
      }
    } catch (error) {
      console.error('❌ Unexpected error in profile creation:', error);
      Alert.alert('Unexpected error', error.message);
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.kicker}>Almost ready</Text>
          <Text style={styles.title}>Complete your profile</Text>
          <Text style={styles.subtitle}>
            Welcome, {user.email}. Add your business details to join the rescue network.
          </Text>

          <View style={styles.formCard}>
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Business name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Hillside Farm Co-op"
                  placeholderTextColor={colors.muted}
                  value={name}
                  onChangeText={setName}
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
                      Offer surplus from service or shelves.
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
                      Receive surplus for farm use.
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.createButton, loading && styles.createButtonDisabled]}
                onPress={handleCreateProfile}
                disabled={loading}
              >
                <Text style={styles.createButtonText}>
                  {loading ? 'Saving…' : 'Finish setup'}
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
    fontSize: 15,
    fontWeight: '700',
    color: colors.inkSoft,
    marginBottom: 4,
  },
  roleButtonTextSelected: {
    color: colors.primaryDark,
  },
  roleDescription: {
    ...typography.caption,
  },
  roleDescriptionSelected: {
    color: colors.inkSoft,
  },
  createButton: {
    backgroundColor: colors.primaryDark,
    paddingVertical: 16,
    borderRadius: radii.md,
    alignItems: 'center',
    ...shadows.soft,
  },
  createButtonDisabled: {
    backgroundColor: colors.muted,
    shadowOpacity: 0,
  },
  createButtonText: {
    ...typography.button,
    color: colors.white,
  },
});
