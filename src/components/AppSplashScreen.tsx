import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

interface AppSplashScreenProps {
  isReady: boolean;
  onFinish: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// High quality WebP icon asset
const DELETER_ICON_SOURCE = require('@/assets/images/deleter_icon.webp');

export function AppSplashScreen({ isReady, onFinish }: AppSplashScreenProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Pure simple fade in
    opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
  }, []);

  useEffect(() => {
    if (isReady) {
      // Hold for a comfortable duration (+1s longer), then smooth fade out
      const timer = setTimeout(() => {
        opacity.value = withTiming(
          0,
          { duration: 400, easing: Easing.inOut(Easing.quad) },
          (finished) => {
            'worklet';
            if (finished) {
              runOnJS(onFinish)();
            }
          }
        );
      }, 1400);

      return () => clearTimeout(timer);
    }
  }, [isReady, onFinish]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]} pointerEvents="box-only">
      <View style={styles.content}>
        <Image
          source={DELETER_ICON_SOURCE}
          style={styles.iconImage}
          contentFit="contain"
          priority="high"
          cachePolicy="memory-disk"
        />
        <Text style={styles.title}>Deleter</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 999999,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImage: {
    width: 104,
    height: 104,
    borderRadius: 24,
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
});

export default AppSplashScreen;
