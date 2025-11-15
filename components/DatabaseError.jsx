import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function DatabaseError({ error, onRetry }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🗄️ Database Setup Required</Text>
      <Text style={styles.subtitle}>
        The database tables haven't been created yet.
      </Text>

      <View style={styles.errorBox}>
        <Text style={styles.errorTitle}>Error Details:</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Fix:</Text>
        <Text style={styles.text}>
          1. Go to your Supabase dashboard{'\n'}
          2. Open the SQL Editor{'\n'}
          3. Run the SQL from supabase-schema.sql{'\n'}
          4. Come back and tap "Retry"
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SQL to Run:</Text>
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
        <Text style={styles.retryButtonText}>Retry Connection</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        After running the SQL, the app will work normally! 🚀
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
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#2d3748',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#718096',
    lineHeight: 24,
  },
  errorBox: {
    backgroundColor: '#fed7d7',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#feb2b2',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#c53030',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#c53030',
    fontFamily: 'monospace',
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
  retryButton: {
    backgroundColor: '#48bb78',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    fontSize: 16,
    textAlign: 'center',
    color: '#48bb78',
    fontWeight: '600',
  },
});
