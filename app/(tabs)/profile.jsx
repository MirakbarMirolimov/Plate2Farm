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
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Manage your business information</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Text style={styles.profileIcon}>{getRoleIcon(role)}</Text>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{businessName || 'Business Name'}</Text>
              <Text style={styles.profileRole}>{getRoleDisplayName(role)}</Text>
              <Text style={styles.profileEmail}>{email}</Text>
            </View>
          </View>
        </View>

        {/* Edit Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Edit Business Information</Text>
          
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
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
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 16,
    color: '#48bb78',
    fontWeight: '600',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: '#718096',
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 20,
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
    backgroundColor: '#f7fafc',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 16,
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
    backgroundColor: '#48bb78',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#a0aec0',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 16,
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f7fafc',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#4a5568',
    fontWeight: '500',
  },
  signOutButton: {
    backgroundColor: '#fed7d7',
    borderColor: '#feb2b2',
  },
  signOutButtonText: {
    color: '#e53e3e',
    fontWeight: '600',
  },
});
