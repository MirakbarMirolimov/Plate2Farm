import { Stack } from 'expo-router';
import { View, SafeAreaView, StyleSheet } from 'react-native';
import Logo from '../../components/Logo';
import { colors, shadows, spacing } from '../../constants/theme';

export default function FarmLayout() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Logo size="medium" />
      </View>
      
      <View style={styles.body}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="listings" />
        </Stack>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    ...shadows.soft,
  },
  body: {
    flex: 1,
  },
});
