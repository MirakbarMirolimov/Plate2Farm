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
} from 'react-native';
import { useRouter } from 'expo-router';
import { createMissingProfile } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

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
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User session not found. Please sign in again.');
      router.replace('/(auth)/login');
      return;
    }

    setLoading(true);
    
    try {
      const { profile, error } = await createMissingProfile(user, businessName, role);

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert(
          'Welcome!',
          'Your profile has been set up successfully.',
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
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }

    setLoading(false);
  };

  if (sessionLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Loading...</Text>
          <Text style={styles.subtitle}>Checking your session</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Plate2Farm!</Text>
        <Text style={styles.subtitle}>Let's set up your profile</Text>

        <View style={styles.form}>
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
                  🍽️ Restaurant/Market
                </Text>
                <Text style={styles.roleDescription}>
                  I want to find surplus food from farms
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
                  🚜 Farm
                </Text>
                <Text style={styles.roleDescription}>
                  I want to list surplus food for restaurants
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
              {loading ? 'Setting up...' : 'Complete Setup'}
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
    paddingVertical: 32,
  },
  title: {
    fontSize: 32,
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
  },
  form: {
    gap: 24,
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
    gap: 12,
  },
  roleButton: {
    paddingVertical: 16,
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
  button: {
    backgroundColor: '#48bb78',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#a0aec0',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
