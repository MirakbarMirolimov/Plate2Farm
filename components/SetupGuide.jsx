import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, radii, shadows, typography } from '../constants/theme';

export default function SetupGuide() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>Configuration</Text>
      <Text style={styles.title}>Connect Supabase</Text>
      <Text style={styles.subtitle}>
        Plate2Farm needs a Supabase project before accounts, listings, and maps can load.
      </Text>

      <View style={styles.section}>
        <Text style={styles.stepBadge}>1</Text>
        <View style={styles.sectionBody}>
          <Text style={styles.sectionTitle}>Create a project</Text>
          <Text style={styles.text}>
            Visit supabase.com, create a new project, and wait until it is fully provisioned.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.stepBadge}>2</Text>
        <View style={styles.sectionBody}>
          <Text style={styles.sectionTitle}>Copy credentials</Text>
          <Text style={styles.text}>
            In Settings → API, copy the Project URL and the anon/public key.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.stepBadge}>3</Text>
        <View style={styles.sectionBody}>
          <Text style={styles.sectionTitle}>Update .env</Text>
          <Text style={styles.code}>
            EXPO_PUBLIC_SUPABASE_URL=your_project_url{'\n'}
            EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.stepBadge}>4</Text>
        <View style={styles.sectionBody}>
          <Text style={styles.sectionTitle}>Create tables</Text>
          <Text style={styles.text}>
            Run the SQL from README.md (or supabase-schema.sql) in the Supabase SQL editor.
          </Text>
        </View>
      </View>

      <View style={styles.footerCard}>
        <Text style={styles.footer}>
          Restart the app after setup to open Plate2Farm with a live backend.
        </Text>
      </View>
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
    marginBottom: spacing.xl,
    color: colors.muted,
  },
  section: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    ...shadows.soft,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    overflow: 'hidden',
    backgroundColor: colors.primarySoft,
    color: colors.primaryDark,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '800',
    fontSize: 13,
  },
  sectionBody: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  text: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 21,
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
  footerCard: {
    marginTop: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  footer: {
    ...typography.body,
    textAlign: 'center',
    color: colors.primaryDark,
    fontWeight: '600',
    fontSize: 15,
  },
});
