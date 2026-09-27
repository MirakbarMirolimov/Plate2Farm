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
  Animated,
  Dimensions,
} from 'react-native';
import { Link } from 'expo-router';
import { signUp } from '../../lib/auth';
import Logo from '../../components/Logo';
import { colors, spacing, radii, shadows, typography } from '../../constants/theme';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Missing details', 'Please fill in email and password.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak password', 'Use at least 6 characters for your password.');
      return;
    }

    setLoading(true);
    const { data, error } = await signUp(email, password);

    if (error) {
      const msg = error.message || '';
      const isRateLimited =
        error.status === 429 ||
        /rate limit|over_email|too many requests/i.test(msg);
      Alert.alert(
        isRateLimited ? 'Email limit reached' : 'Could not create account',
        isRateLimited
          ? 'Supabase built-in email allows only 2 messages per hour. Wait a bit, turn off Confirm email under Authentication → Providers, or add custom SMTP to raise the limit.'
          : msg
      );
    } else {
      Alert.alert(
        'Account ready',
        'Check your email to verify your account, then sign in to finish setup.',
        [{ text: 'OK' }]
      );
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

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Logo size="large" />
            </View>
            <Text style={styles.title}>Create your kitchen pass</Text>
            <Text style={styles.subtitle}>Join the local rescue network</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@business.local"
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
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Creating account…' : 'Create account'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <View style={styles.linkContainer}>
                <Text style={styles.linkText}>Already rescue with us? </Text>
                <Link href="/(auth)/login" style={styles.link}>
                  Sign in
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
    top: -110,
    right: -90,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.accentSoft,
  },
  decorationCircle2: {
    position: 'absolute',
    bottom: -160,
    left: -140,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: colors.primarySoft,
    opacity: 0.85,
  },
  decorationCircle3: {
    position: 'absolute',
    top: 160,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
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
