import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { getUserProfile, signOut } from '../../lib/auth';
import Logo from '../../components/Logo';
import { colors, radii, shadows, spacing, typography } from '../../constants/theme';

export default function ProfileTab() {
  const [userProfile, setUserProfile] = useState(null);
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setEmail(session.user.email);
        
        const { profile, error } = await getUserProfile(session.user.id);
        if (error) {
          console.error('❌ Error loading profile:', error);
        } else if (profile) {
          setUserProfile(profile);
          setBusinessName(profile.name || '');
          setRole(profile.role || '');
        }
      }
    } catch (error) {
      console.error('❌ Error in loadUserProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!businessName.trim()) {
      Alert.alert('Missing name', 'Please add your business name to continue.');
      return;
    }

    setSaving(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        Alert.alert('Signed out', 'Please sign in again to update your profile.');
        return;
      }

      // Role is set once during onboarding and cannot be changed here.
      const { error } = await supabase
        .from('profiles')
        .update({
          name: businessName.trim(),
        })
        .eq('id', session.user.id);

      if (error) {
        console.error('❌ Error updating profile:', error);
        Alert.alert('Could not save', 'We could not update your profile. Please try again.');
      } else {
        Alert.alert('Profile saved', 'Your business details are up to date.');
        // Reload profile to get updated data
        await loadUserProfile();
      }
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      Alert.alert('Something went wrong', 'Please try saving again in a moment.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign out',
      'You will need to sign in again to manage listings.',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('Could not sign out', 'Please try again.');
            } else {
              router.replace('/(auth)/login');
            }
          }
        }
      ]
    );
  };

  const getRoleDisplayName = (roleValue) => {
    return roleValue === 'farm' ? 'Farm partner' : 'Restaurant / market';
  };

  const getRoleMark = (roleValue) => {
    return roleValue === 'farm' ? 'F' : 'R';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Account</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your profile…</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Logo size="small" />
            <Text style={styles.title}>Account</Text>
          </View>
          <Text style={styles.subtitle}>Business details for your Plate2Farm harvest loop</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          <View style={styles.profileBadge}>
            <Text style={styles.profileBadgeText}>Verified partner</Text>
          </View>
          <View style={styles.profileHeader}>
            <View style={styles.profileIconContainer}>
              <Text style={styles.profileIcon}>{getRoleMark(role)}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{businessName || 'Your business'}</Text>
              <Text style={styles.profileRole}>{getRoleDisplayName(role)}</Text>
              <Text style={styles.profileEmail}>{email}</Text>
            </View>
          </View>
          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>Active</Text>
              <Text style={styles.statLabel}>Status</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>Partner</Text>
              <Text style={styles.statLabel}>Trust</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>Rescue</Text>
              <Text style={styles.statLabel}>Mission</Text>
            </View>
          </View>
        </View>

        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Business information</Text>
            <Text style={styles.formSubtitle}>Keep your details clear for pickup partners</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your business name"
              placeholderTextColor={colors.muted}
              value={businessName}
              onChangeText={setBusinessName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={email}
              editable={false}
            />
            <Text style={styles.helpText}>
              Email is fixed to your login. Contact support if you need it changed.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account role</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={getRoleDisplayName(role)}
              editable={false}
            />
            <Text style={styles.helpText}>
              Your role is set when you join and cannot be changed. Create a new account if you need a different role.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving…' : 'Save changes'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Account</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => {
            Alert.alert(
              'About Plate2Farm',
              'Plate2Farm connects kitchens and farms so good food is rescued instead of wasted.',
              [{ text: 'OK' }]
            );
          }}>
            <Text style={styles.actionButtonText}>About the app</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => {
            Alert.alert(
              'Help & support',
              'Email support@plate2farm.com — we typically reply within one business day.',
              [{ text: 'OK' }]
            );
          }}>
            <Text style={styles.actionButtonText}>Help & support</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.signOutButton]}
            onPress={handleSignOut}
          >
            <Text style={[styles.actionButtonText, styles.signOutButtonText]}>
              Sign out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingBottom: 140,
  },
  header: {
    backgroundColor: colors.header,
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    ...shadows.soft,
  },
  headerContent: {
    alignItems: 'flex-start',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.white,
    marginLeft: spacing.sm,
  },
  subtitle: {
    ...typography.caption,
    color: colors.headerMuted,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.muted,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.card,
  },
  profileBadge: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    marginBottom: spacing.sm,
  },
  profileBadgeText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  profileIconContainer: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.h2,
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileEmail: {
    ...typography.caption,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.card,
  },
  formHeader: {
    marginBottom: spacing.lg,
  },
  formTitle: {
    ...typography.h2,
    marginBottom: 6,
  },
  formSubtitle: {
    ...typography.caption,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    fontSize: 16,
    fontWeight: '500',
    color: colors.ink,
  },
  inputDisabled: {
    backgroundColor: colors.bg,
    color: colors.muted,
  },
  helpText: {
    ...typography.caption,
    marginTop: 6,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadows.soft,
  },
  saveButtonDisabled: {
    backgroundColor: colors.muted,
  },
  saveButtonText: {
    ...typography.button,
    color: colors.white,
  },
  actionsCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.card,
  },
  actionsTitle: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSoft,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
  },
  actionButtonText: {
    fontSize: 16,
    color: colors.inkSoft,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#E8B4B4',
    marginBottom: 100,
  },
  signOutButtonText: {
    color: colors.danger,
    fontWeight: '800',
  },
});
