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
  ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { signIn } from '../../lib/auth';
import Logo from '../../components/Logo';
import { colors, spacing, radii, shadows, typography } from '../../constants/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing details', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    console.log('🔐 Login attempt for:', email);

    const { data, error } = await signIn(email, password);

    if (error) {
      console.error('❌ Login error:', error);

      let errorMessage = error.message || 'Sign-in failed';
      const isRateLimited =
        error.status === 429 ||
        /rate limit|over_email|too many requests/i.test(errorMessage);
      if (isRateLimited) {
        errorMessage =
          'Supabase built-in email allows only 2 messages per hour. Wait, disable Confirm email, or configure custom SMTP to increase the limit.';
      } else if (errorMessage.includes('Email not confirmed')) {
        errorMessage =
          'Please check your email and confirm your account before signing in.';
      } else if (errorMessage.includes('Invalid login credentials')) {
        errorMessage =
          'Invalid email or password. Please check your credentials.';
      }

      Alert.alert(isRateLimited ? 'Email limit reached' : 'Sign-in failed', errorMessage);
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
      <View style={styles.backgroundDecoration}>
        <View style={styles.decorationCircle1} />
        <View style={styles.decorationCircle2} />
        <View style={styles.decorationCircle3} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Logo size="large" />
            </View>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to keep surplus food moving</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@kitchen.local"
                  placeholderTextColor={colors.muted}
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
                  placeholder="Your password"
                  placeholderTextColor={colors.muted}
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
                  {loading ? 'Signing in…' : 'Sign in'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <View style={styles.linkContainer}>
                <Text style={styles.linkText}>New to the network? </Text>
                <Link href="/(auth)/register" style={styles.link}>
                  Create a kitchen pass
                </Link>
              </View>
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
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.primarySoft,
  },
  decorationCircle2: {
    position: 'absolute',
    bottom: -140,
    left: -120,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: colors.accentSoft,
    opacity: 0.7,
  },
  decorationCircle3: {
    position: 'absolute',
    top: 220,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.surfaceSoft,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  content: {
    paddingHorizontal: spacing.lg,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoContainer: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.soft,
  },
  title: {
    ...typography.title,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
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
    gap: spacing.md,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  inputLabel: {
    ...typography.label,
    marginLeft: 4,
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
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: spacing.sm,
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
  footer: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  linkText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '500',
  },
  link: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
});
