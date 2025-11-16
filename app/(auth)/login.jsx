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
  Animated,
  Dimensions,
} from 'react-native';
import { Link } from 'expo-router';
import { signIn } from '../../lib/auth';
import Logo from '../../components/Logo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    console.log('🔐 Login attempt for:', email);
    
    const { data, error } = await signIn(email, password);

    if (error) {
      console.error('❌ Login error:', error);
      
      // Provide more specific error messages
      let errorMessage = error.message;
      if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and confirm your account before signing in.';
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      }
      
      Alert.alert('Login Failed', errorMessage);
    } else {
      console.log('✅ Login successful');
    }

    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Background Decoration */}
      <View style={styles.backgroundDecoration}>
        <View style={styles.decorationCircle1} />
        <View style={styles.decorationCircle2} />
        <View style={styles.decorationCircle3} />
      </View>

      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Logo size="large" />
          </View>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Sign in to your Plate2Farm account</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? '🔄 Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer Links */}
          <View style={styles.footer}>
            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>Don't have an account? </Text>
              <Link href="/(auth)/register" style={styles.link}>
                Create Account
              </Link>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundColor: '#6366f1', // Vibrant indigo background
  },
  backgroundDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  decorationCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorationCircle2: {
    position: 'absolute',
    bottom: -150,
    left: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  decorationCircle3: {
    position: 'absolute',
    top: 200,
    left: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 35,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
    color: '#ffffff',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 25,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#f9fafb',
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
  button: {
    backgroundColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    backgroundColor: '#10b981',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0.1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.1)',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  linkText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  link: {
    color: '#6366f1',
    fontWeight: '700',
    fontSize: 16,
  },
});
