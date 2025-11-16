import AsyncStorage from '@react-native-async-storage/async-storage';

// Reset onboarding status (useful for testing)
export const resetOnboardingStatus = async () => {
  try {
    await AsyncStorage.removeItem('onboarding_completed');
    console.log('🔄 Onboarding status reset');
  } catch (error) {
    console.error('❌ Error resetting onboarding status:', error);
  }
};

// Check if onboarding is completed
export const isOnboardingCompleted = async () => {
  try {
    const completed = await AsyncStorage.getItem('onboarding_completed');
    return completed === 'true';
  } catch (error) {
    console.error('❌ Error checking onboarding status:', error);
    return false;
  }
};

// Mark onboarding as completed
export const markOnboardingCompleted = async () => {
  try {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    console.log('✅ Onboarding marked as completed');
  } catch (error) {
    console.error('❌ Error marking onboarding as completed:', error);
  }
};
