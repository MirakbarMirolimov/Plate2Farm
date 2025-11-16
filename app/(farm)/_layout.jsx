import { Stack } from 'expo-router';
import { View, SafeAreaView } from 'react-native';
import Logo from '../../components/Logo';

export default function FarmLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Logo Header */}
      <View style={{
        backgroundColor: '#ffffff',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}>
        <Logo size="medium" />
      </View>
      
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="listings" />
        </Stack>
      </View>
    </SafeAreaView>
  );
}
