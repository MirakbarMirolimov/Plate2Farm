import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, spacing, radii, shadows, typography } from '../constants/theme';

export default function DatabaseError({ error, onRetry }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>Setup</Text>
      <Text style={styles.title}>Database not ready</Text>
      <Text style={styles.subtitle}>
        Tables haven’t been created in Supabase yet. Run the schema once, then retry.
      </Text>

      <View style={styles.errorBox}>
        <Text style={styles.errorTitle}>Error details</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick fix</Text>
        <Text style={styles.text}>
          1. Open your Supabase dashboard{'\n'}
          2. Go to the SQL Editor{'\n'}
          3. Run the SQL from supabase-schema.sql{'\n'}
          4. Return here and tap Retry
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SQL to run</Text>
        <Text style={styles.code}>
          -- Create profiles table{'\n'}
          CREATE TABLE profiles ({'\n'}
          {'  '}id UUID REFERENCES auth.users ON DELETE CASCADE,{'\n'}
          {'  '}email TEXT NOT NULL,{'\n'}
          {'  '}name TEXT NOT NULL,{'\n'}
          {'  '}role TEXT NOT NULL CHECK (role IN ('restaurant', 'farm')),{'\n'}
          {'  '}created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),{'\n'}
          {'  '}PRIMARY KEY (id){'\n'}
          );{'\n\n'}
          -- Enable RLS{'\n'}
          ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;{'\n\n'}
          -- Add policies (see full schema file)
        </Text>
      </View>

      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Retry connection</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        Once the schema is applied, Plate2Farm will load normally.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.xxl,
  },
  kicker: {
    ...typography.label,
    color: colors.warn,
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
  errorBox: {
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#E8B4B4',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger,
    marginBottom: spacing.xs,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  section: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.soft,
  },
  sectionTitle: {
    ...typography.h2,
    fontSize: 17,
    marginBottom: spacing.sm,
  },
  text: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 22,
  },
  code: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: colors.surfaceSoft,
    padding: spacing.sm,
    borderRadius: radii.sm,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.line,
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radii.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
    ...shadows.soft,
  },
  retryButtonText: {
    ...typography.button,
    color: colors.white,
  },
  footer: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.primary,
    fontWeight: '600',
  },
});
