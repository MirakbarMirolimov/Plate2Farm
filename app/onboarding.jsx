import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    title: "Welcome to Plate2Farm",
    subtitle: "Connecting Restaurants & Farms",
    description: "Transform your surplus food into opportunities. Connect directly with local farms and reduce food waste while building sustainable partnerships.",
    emoji: "🌱",
    backgroundColor: "#6366f1",
    accentColor: "#4f46e5",
  },
  {
    id: 2,
    title: "Share Your Surplus",
    subtitle: "Post Available Food Items",
    description: "Easily list your excess ingredients, prepared foods, or produce. Set quantities, expiration times, and let farms discover what you have to offer.",
    emoji: "🍽️",
    backgroundColor: "#10b981",
    accentColor: "#059669",
  },
  {
    id: 3,
    title: "Discover & Connect",
    subtitle: "Find Partners Near You",
    description: "Browse available food items on an interactive map. Connect with restaurants and farms in your area to create meaningful partnerships.",
    emoji: "🗺️",
    backgroundColor: "#8b5cf6",
    accentColor: "#7c3aed",
  },
];

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const router = useRouter();
  
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleNext = async () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      
      // Animate transition
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0.3,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.95,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
      
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
    } else {
      // Mark onboarding as completed and navigate to sign in screen
      await AsyncStorage.setItem('onboarding_completed', 'true');
      router.replace('/(auth)/login');
    }
  };

  const handleSkip = async () => {
    // Mark onboarding as completed even when skipped
    await AsyncStorage.setItem('onboarding_completed', 'true');
    router.replace('/(auth)/login');
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      
      scrollViewRef.current?.scrollTo({
        x: prevIndex * width,
        animated: true,
      });
    }
  };

  const currentScreen = onboardingData[currentIndex];

  return (
    <View style={[styles.container, { backgroundColor: currentScreen.backgroundColor }]}>
      {/* Background Decoration */}
      <View style={styles.backgroundDecoration}>
        <View style={[styles.decorationCircle1, { backgroundColor: `${currentScreen.accentColor}30` }]} />
        <View style={[styles.decorationCircle2, { backgroundColor: `${currentScreen.accentColor}20` }]} />
        <View style={[styles.decorationCircle3, { backgroundColor: `${currentScreen.accentColor}15` }]} />
      </View>

      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Content */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Emoji Container */}
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>{currentScreen.emoji}</Text>
        </View>

        {/* Text Content */}
        <View style={styles.textContent}>
          <Text style={styles.title}>{currentScreen.title}</Text>
          <Text style={styles.subtitle}>{currentScreen.subtitle}</Text>
          <Text style={styles.description}>{currentScreen.description}</Text>
        </View>
      </Animated.View>

      {/* Progress Indicators */}
      <View style={styles.progressContainer}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              {
                backgroundColor: index === currentIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                width: index === currentIndex ? 30 : 10,
              },
            ]}
          />
        ))}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {currentIndex > 0 && (
          <TouchableOpacity style={styles.previousButton} onPress={handlePrevious}>
            <Text style={styles.previousText}>← Previous</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.spacer} />
        
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextText}>
            {currentIndex === onboardingData.length - 1 ? 'Get Started 🚀' : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    top: -150,
    right: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  decorationCircle2: {
    position: 'absolute',
    bottom: -200,
    left: -200,
    width: 500,
    height: 500,
    borderRadius: 250,
  },
  decorationCircle3: {
    position: 'absolute',
    top: 300,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 30,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  skipText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 1,
  },
  emojiContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 80,
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 15,
  },
  emoji: {
    fontSize: 80,
  },
  textContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
    maxWidth: 300,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
    gap: 8,
  },
  progressDot: {
    height: 10,
    borderRadius: 5,
    transition: 'all 0.3s ease',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  previousButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
  },
  previousText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
  },
  nextButton: {
    paddingHorizontal: 30,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  nextText: {
    color: '#374151',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
