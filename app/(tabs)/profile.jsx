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
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { getUserProfile, signOut } from '../../lib/auth';
import Logo from '../../components/Logo';

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
      Alert.alert('Error', 'Business name is required');
      return;
    }

    setSaving(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          name: businessName.trim(),
          role: role,
        })
        .eq('id', session.user.id);

      if (error) {
        console.error('❌ Error updating profile:', error);
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      } else {
        Alert.alert('Success', 'Profile updated successfully!');
        // Reload profile to get updated data
        await loadUserProfile();
      }
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } else {
              router.replace('/(auth)/login');
            }
          }
        }
      ]
    );
  };

  const getRoleDisplayName = (roleValue) => {
    return roleValue === 'farm' ? 'Farm' : 'Restaurant/Market';
  };

  const getRoleIcon = (roleValue) => {
    return roleValue === 'farm' ? '🚜' : '🍽️';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
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
            <Text style={styles.title}>Your Profile</Text>
          </View>
          <Text style={styles.subtitle}>Manage your business information & settings</Text>
        </View>
        <View style={styles.headerDecoration} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileBadge}>
            <Text style={styles.profileBadgeText}>✨ VERIFIED</Text>
          </View>
          <View style={styles.profileHeader}>
            <View style={styles.profileIconContainer}>
              <Text style={styles.profileIcon}>{getRoleIcon(role)}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{businessName || 'Business Name'}</Text>
              <Text style={styles.profileRole}>{getRoleDisplayName(role)}</Text>
              <Text style={styles.profileEmail}>{email}</Text>
            </View>
          </View>
          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>🎯</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>⭐</Text>
              <Text style={styles.statLabel}>Verified</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>🌱</Text>
              <Text style={styles.statLabel}>Sustainable</Text>
            </View>
          </View>
        </View>

        {/* Edit Form */}
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>✏️ Edit Information</Text>
            <Text style={styles.formSubtitle}>Update your business details</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your business name"
              value={businessName}
              onChangeText={setBusinessName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={email}
              editable={false}
            />
            <Text style={styles.helpText}>
              Email cannot be changed. Contact support if you need to update it.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Type *</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'restaurant' && styles.roleButtonSelected,
                ]}
                onPress={() => setRole('restaurant')}
              >
                <Text style={styles.roleIcon}>🍽️</Text>
                <Text
                  style={[
                    styles.roleButtonText,
                    role === 'restaurant' && styles.roleButtonTextSelected,
                  ]}
                >
                  Restaurant/Market
                </Text>
                <Text style={styles.roleDescription}>
                  Find surplus food from farms
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'farm' && styles.roleButtonSelected,
                ]}
                onPress={() => setRole('farm')}
              >
                <Text style={styles.roleIcon}>🚜</Text>
                <Text
                  style={[
                    styles.roleButtonText,
                    role === 'farm' && styles.roleButtonTextSelected,
                  ]}
                >
                  Farm
                </Text>
                <Text style={styles.roleDescription}>
                  List surplus food for restaurants
                </Text>
              </TouchableOpacity>
            </View>
          </View>


          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : '💾 Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Account Actions</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => {
            Alert.alert(
              'App Info',
              'Plate2Farm v1.0\n\nConnecting farms and restaurants to reduce food waste.',
              [{ text: 'OK' }]
            );
          }}>
            <Text style={styles.actionButtonText}>ℹ️ About App</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => {
            Alert.alert(
              'Help & Support',
              'For support, please email: support@plate2farm.com\n\nWe typically respond within 24 hours.',
              [{ text: 'OK' }]
            );
          }}>
            <Text style={styles.actionButtonText}>❓ Help & Support</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.signOutButton]}
            onPress={handleSignOut}
          >
            <Text style={[styles.actionButtonText, styles.signOutButtonText]}>
              🚪 Sign Out
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
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundColor: '#f0f4ff', // Beautiful gradient background
    paddingBottom: 140, // Extra margin to prevent tab bar from blocking content
  },
  header: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundColor: '#6366f1', // Vibrant indigo (consistent with other screens)
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    alignItems: 'center',
    zIndex: 2,
  },
  headerDecoration: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#718096',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 25,
    padding: 25,
    marginBottom: 20,
    marginTop: 10,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
    position: 'relative',
    overflow: 'hidden',
  },
  profileBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  profileBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  profileIconContainer: {
    backgroundColor: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    backgroundColor: '#f59e0b',
    borderRadius: 30,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 40,
    color: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  profileRole: {
    fontSize: 16,
    color: '#8b5cf6',
    fontWeight: '700',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 25,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 25,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.1)',
  },
  formHeader: {
    marginBottom: 25,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  formSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8faff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    fontSize: 16,
    fontWeight: '500',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputDisabled: {
    backgroundColor: '#edf2f7',
    color: '#a0aec0',
  },
  helpText: {
    fontSize: 12,
    color: '#a0aec0',
    marginTop: 4,
  },
  roleContainer: {
    gap: 12,
  },
  roleButton: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f7fafc',
    alignItems: 'center',
  },
  roleButtonSelected: {
    borderColor: '#48bb78',
    backgroundColor: '#f0fff4',
  },
  roleIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#718096',
    marginBottom: 4,
  },
  roleButtonTextSelected: {
    color: '#48bb78',
  },
  roleDescription: {
    fontSize: 12,
    color: '#a0aec0',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    backgroundColor: '#10b981',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 15,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0.1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 25,
    padding: 25,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.1)',
  },
  actionsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  actionButton: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 15,
    backgroundColor: '#f8faff',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.1)',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#4b5563',
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    backgroundColor: '#ef4444',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    shadowColor: '#ef4444',
    shadowOpacity: 0.3,
    marginBottom: 100,
  },
  signOutButtonText: {
    color: 'white',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
