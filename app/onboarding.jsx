import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Logo from '../components/Logo';
import { colors, spacing, radii, shadows, typography } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    title: 'Surplus finds a second harvest',
    subtitle: 'Plate2Farm',
    description:
      'Move good food from kitchens and markets to nearby farms—less waste, stronger local ties, and a cleaner plate-to-soil loop.',
    emoji: 'logo',
    tint: colors.primarySoft,
    accent: colors.primary,
  },
  {
    id: 2,
    title: 'List what you cannot keep',
    subtitle: 'Share surplus with care',
    description:
      'Post ingredients, prepared dishes, or produce with quantity and timing. Farms nearby can claim what still has value.',
    emoji: 'basket',
    tint: colors.accentSoft,
    accent: colors.accent,
  },
  {
    id: 3,
    title: 'Meet partners on the map',
    subtitle: 'Rescue close to home',
    description:
      'Browse listings around you, connect with kitchens and farms, and keep food moving within your community.',
    emoji: 'map',
    tint: colors.surfaceSoft,
    accent: colors.primaryDark,
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

  /** Drawn icons — no extra icon package; matches harvest theme. */
  const BasketIcon = ({ accent = colors.accent }) => (
    <View style={styles.iconScene} accessibilityLabel="Share surplus basket">
      <View style={[styles.basketRim, { borderColor: accent, backgroundColor: `${accent}22` }]} />
      <View style={[styles.basketBody, { borderColor: accent, backgroundColor: `${accent}14` }]}>
        <View style={[styles.basketWeave, { backgroundColor: accent }]} />
        <View style={[styles.basketWeave, styles.basketWeaveMid, { backgroundColor: accent }]} />
        <View style={[styles.basketWeave, { backgroundColor: accent }]} />
      </View>
      <View style={[styles.basketHandle, { borderColor: accent }]} />
      {/* Produce peeks */}
      <View style={[styles.produceDot, styles.produceLeft, { backgroundColor: colors.primary }]} />
      <View style={[styles.produceDot, styles.produceRight, { backgroundColor: colors.primaryDark }]} />
      <View style={[styles.produceLeaf, { borderBottomColor: colors.primary }]} />
    </View>
  );

  const MapPinIcon = ({ accent = colors.primaryDark }) => (
    <View style={styles.iconScene} accessibilityLabel="Nearby partners map">
      {/* Soft map card */}
      <View style={[styles.mapCard, { borderColor: colors.line, backgroundColor: colors.surfaceSoft }]}>
        <View style={[styles.mapRoadH, { backgroundColor: `${accent}55` }]} />
        <View style={[styles.mapRoadV, { backgroundColor: `${accent}40` }]} />
        <View style={[styles.mapBlock, styles.mapBlockTL, { backgroundColor: colors.primarySoft }]} />
        <View style={[styles.mapBlock, styles.mapBlockBR, { backgroundColor: colors.accentSoft }]} />
      </View>
      {/* Location pin */}
      <View style={styles.pinWrap}>
        <View style={[styles.pinHead, { backgroundColor: accent, borderColor: colors.surface }]}>
          <View style={styles.pinInner} />
        </View>
        <View style={[styles.pinPoint, { borderTopColor: accent }]} />
      </View>
    </View>
  );

  const renderMark = (emoji, accent) => {
    if (emoji === 'logo') {
      return <Logo size="large" />;
    }
    if (emoji === 'basket') {
      return <BasketIcon accent={accent} />;
    }
    return <MapPinIcon accent={accent} />;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentScreen.tint }]}>
      <View style={styles.backgroundDecoration}>
        <View style={[styles.decorationCircle1, { backgroundColor: `${currentScreen.accent}18` }]} />
        <View style={[styles.decorationCircle2, { backgroundColor: `${currentScreen.accent}12` }]} />
        <View style={[styles.decorationCircle3, { backgroundColor: colors.primarySoft }]} />
      </View>

      <TouchableOpacity style={styles.skipButton} onPress={handleSkip} accessibilityRole="button">
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View
          style={[
            styles.emojiContainer,
            { borderColor: `${currentScreen.accent}55` },
          ]}
        >
          {renderMark(currentScreen.emoji, currentScreen.accent)}
        </View>

        <View style={styles.textContent}>
          <Text style={styles.kicker}>{currentScreen.subtitle}</Text>
          <Text style={styles.title}>{currentScreen.title}</Text>
          <Text style={styles.description}>{currentScreen.description}</Text>
        </View>
      </Animated.View>

      <View style={styles.progressContainer}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              {
                backgroundColor:
                  index === currentIndex ? colors.primaryDark : colors.line,
                width: index === currentIndex ? 28 : 8,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.navigationContainer}>
        {currentIndex > 0 && (
          <TouchableOpacity style={styles.previousButton} onPress={handlePrevious}>
            <Text style={styles.previousText}>Back</Text>
          </TouchableOpacity>
        )}

        <View style={styles.spacer} />

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextText}>
            {currentIndex === onboardingData.length - 1 ? 'Enter Plate2Farm' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    top: -140,
    right: -120,
    width: 360,
    height: 360,
    borderRadius: 180,
  },
  decorationCircle2: {
    position: 'absolute',
    bottom: -180,
    left: -160,
    width: 420,
    height: 420,
    borderRadius: 210,
  },
  decorationCircle3: {
    position: 'absolute',
    top: height * 0.35,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.55,
  },
  skipButton: {
    position: 'absolute',
    top: 56,
    right: spacing.lg,
    zIndex: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.soft,
  },
  skipText: {
    color: colors.inkSoft,
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    zIndex: 1,
  },
  emojiContainer: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.line,
    ...shadows.card,
  },
  iconScene: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // —— Basket (screen 2: list surplus) ——
  basketRim: {
    position: 'absolute',
    top: 28,
    width: 72,
    height: 14,
    borderRadius: 8,
    borderWidth: 2.5,
    zIndex: 2,
  },
  basketBody: {
    position: 'absolute',
    top: 38,
    width: 64,
    height: 40,
    borderWidth: 2.5,
    borderTopWidth: 0,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 6,
  },
  basketWeave: {
    width: 44,
    height: 3,
    borderRadius: 2,
    opacity: 0.85,
  },
  basketWeaveMid: {
    width: 36,
  },
  basketHandle: {
    position: 'absolute',
    top: 10,
    width: 36,
    height: 28,
    borderWidth: 3,
    borderBottomWidth: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: 'transparent',
  },
  produceDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    top: 22,
    zIndex: 3,
  },
  produceLeft: {
    left: 28,
  },
  produceRight: {
    right: 28,
    top: 18,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  produceLeaf: {
    position: 'absolute',
    top: 12,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    zIndex: 3,
  },
  // —— Map pin (screen 3: nearby partners) ——
  mapCard: {
    position: 'absolute',
    width: 78,
    height: 62,
    borderRadius: 12,
    borderWidth: 1.5,
    top: 22,
    overflow: 'hidden',
  },
  mapRoadH: {
    position: 'absolute',
    top: 28,
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
  },
  mapRoadV: {
    position: 'absolute',
    left: 34,
    top: 0,
    bottom: 0,
    width: 4,
    borderRadius: 2,
  },
  mapBlock: {
    position: 'absolute',
    borderRadius: 4,
  },
  mapBlockTL: {
    top: 8,
    left: 8,
    width: 18,
    height: 14,
  },
  mapBlockBR: {
    bottom: 8,
    right: 10,
    width: 20,
    height: 12,
  },
  pinWrap: {
    position: 'absolute',
    top: 8,
    alignItems: 'center',
    zIndex: 4,
  },
  pinHead: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  pinInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  pinPoint: {
    width: 0,
    height: 0,
    marginTop: -3,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  textContent: {
    alignItems: 'center',
  },
  kicker: {
    ...typography.label,
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.hero,
    fontSize: 30,
    textAlign: 'center',
    marginBottom: spacing.md,
    color: colors.ink,
  },
  description: {
    ...typography.body,
    textAlign: 'center',
    maxWidth: 320,
    color: colors.inkSoft,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  progressDot: {
    height: 8,
    borderRadius: radii.pill,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  previousButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  previousText: {
    color: colors.inkSoft,
    fontSize: 15,
    fontWeight: '700',
  },
  spacer: {
    flex: 1,
  },
  nextButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primaryDark,
    borderRadius: radii.pill,
    ...shadows.soft,
  },
  nextText: {
    ...typography.button,
    color: colors.white,
  },
});
