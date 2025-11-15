import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function SetupGuide() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🚀 Setup Required</Text>
      <Text style={styles.subtitle}>
        Welcome to Plate2Farm! To get started, you need to configure Supabase.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Create Supabase Project</Text>
        <Text style={styles.text}>
          • Go to supabase.com and create a new project{'\n'}
          • Wait for the project to be ready
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Get Your Credentials</Text>
        <Text style={styles.text}>
          • Go to Settings → API{'\n'}
          • Copy your Project URL{'\n'}
          • Copy your anon/public key
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Update .env File</Text>
        <Text style={styles.code}>
          EXPO_PUBLIC_SUPABASE_URL=your_project_url{'\n'}
          EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Create Database Tables</Text>
        <Text style={styles.text}>
          Run the SQL commands from the README.md file in your Supabase SQL editor.
        </Text>
      </View>

      <Text style={styles.footer}>
        After setup, restart the app to begin using Plate2Farm! 🌱
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 24,
    paddingTop: 60,
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
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 20,
  },
  code: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: '#f7fafc',
    padding: 12,
    borderRadius: 4,
    color: '#2d3748',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  footer: {
    fontSize: 16,
    textAlign: 'center',
    color: '#48bb78',
    fontWeight: '600',
    marginTop: 16,
  },
});
