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
} from 'react-native';
import { createMissingProfile } from '../lib/auth';

export default function ProfileSetup({ user, onProfileCreated }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateProfile = async () => {
    if (!name || !role) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔧 Creating profile for user:', user.email, 'with role:', role);
      const { profile, error } = await createMissingProfile(user, name, role);

      if (error) {
        console.error('❌ Profile creation error:', error);
        Alert.alert('Error', `Failed to create profile: ${error.message || error}`);
      } else if (profile) {
        console.log('✅ Profile created successfully:', profile);
        Alert.alert('Success', 'Profile created successfully!');
        onProfileCreated(profile);
      } else {
        console.error('❌ No profile returned and no error');
        Alert.alert('Error', 'Profile creation failed - no profile returned');
      }
    } catch (error) {
      console.error('❌ Unexpected error in profile creation:', error);
      Alert.alert('Error', `Unexpected error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>
          Welcome {user.email}! Please complete your profile to continue.
        </Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your business name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>I am a: *</Text>
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
                  Restaurant/Market
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
                  Farm
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
              {loading ? 'Creating Profile...' : 'Complete Setup'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#2d3748',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#718096',
    lineHeight: 24,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 16,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  roleButtonSelected: {
    borderColor: '#48bb78',
    backgroundColor: '#f0fff4',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
  },
  roleButtonTextSelected: {
    color: '#48bb78',
  },
  createButton: {
    backgroundColor: '#48bb78',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  createButtonDisabled: {
    backgroundColor: '#a0aec0',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
