import React, { useCallback, useImperativeHandle, forwardRef, useLayoutEffect, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { MediaAsset } from '@/types/media';
import { SwipeCard } from '@/components/SwipeCard';
import { PlatformIcon } from '@/components/ui/PlatformIcon';

export interface CardDeckRef {
  swipeLeft: () => void;
  swipeRight: () => void;
}

interface CardDeckProps {
  currentAsset: MediaAsset;
  nextAssets: MediaAsset[];
  onSwipeLeft: (id: string) => void;
  onSwipeRight: (id: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 90;
const FLYOUT_DURATION = 220;
const SWIPE_EASING = Easing.bezier(0.2, 0.9, 0.42, 1);

export const CardDeck = forwardRef<CardDeckRef, CardDeckProps>(function CardDeck(
  { currentAsset, nextAssets, onSwipeLeft, onSwipeRight },
  ref
) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isSwiping = useSharedValue(false);
  const hasCrossedThreshold = useSharedValue(false);

  const isIOS = Platform.OS === 'ios';

  // Immediate reset when the active card changes
  useLayoutEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
    isSwiping.value = false;
    hasCrossedThreshold.value = false;
  }, [currentAsset.id, translateX, translateY, isSwiping, hasCrossedThreshold]);

  // Pre-decode upcoming photos into memory cache so there is 0ms frame lag/flash
  useEffect(() => {
    if (nextAssets && nextAssets.length > 0) {
      const urls = nextAssets
        .filter((a) => a.mediaType !== 'video' && a.uri)
        .map((a) => a.uri);
      if (urls.length > 0) {
        Image.prefetch(urls);
      }
    }
  }, [nextAssets]);

  const triggerThresholdHaptic = useCallback(() => {
    const feedbackStyle = isIOS
      ? Haptics.ImpactFeedbackStyle.Light
      : Haptics.ImpactFeedbackStyle.Medium;
    Haptics.impactAsync(feedbackStyle);
  }, [isIOS]);

  const triggerSwipeLeft = useCallback(() => {
    if (isSwiping.value) return;
    isSwiping.value = true;
    const currentId = currentAsset.id;
    translateX.value = withTiming(
      -SCREEN_WIDTH * 1.3,
      {
        duration: FLYOUT_DURATION,
        easing: SWIPE_EASING,
      },
      () => {
        'worklet';
        runOnJS(onSwipeLeft)(currentId);
      }
    );
  }, [currentAsset.id, onSwipeLeft, translateX, isSwiping]);

  const triggerSwipeRight = useCallback(() => {
    if (isSwiping.value) return;
    isSwiping.value = true;
    const currentId = currentAsset.id;
    translateX.value = withTiming(
      SCREEN_WIDTH * 1.3,
      {
        duration: FLYOUT_DURATION,
        easing: SWIPE_EASING,
      },
      () => {
        'worklet';
        runOnJS(onSwipeRight)(currentId);
      }
    );
  }, [currentAsset.id, onSwipeRight, translateX, isSwiping]);

  useImperativeHandle(ref, () => ({
    swipeLeft: triggerSwipeLeft,
    swipeRight: triggerSwipeRight,
  }));

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      'worklet';
      if (isSwiping.value) return;
    })
    .onUpdate((event) => {
      'worklet';
      if (isSwiping.value) return;
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.2;

      const isPast = Math.abs(event.translationX) >= SWIPE_THRESHOLD;
      if (isPast && !hasCrossedThreshold.value) {
        hasCrossedThreshold.value = true;
        runOnJS(triggerThresholdHaptic)();
      } else if (!isPast && hasCrossedThreshold.value) {
        hasCrossedThreshold.value = false;
      }
    })
    .onEnd((event) => {
      'worklet';
      if (isSwiping.value) return;

      const isQuickFlickRight = event.velocityX > 450;
      const isQuickFlickLeft = event.velocityX < -450;

      if (translateX.value > SWIPE_THRESHOLD || isQuickFlickRight) {
        isSwiping.value = true;
        const currentId = currentAsset.id;
        translateX.value = withTiming(
          SCREEN_WIDTH * 1.3,
          {
            duration: FLYOUT_DURATION,
            easing: SWIPE_EASING,
          },
          () => {
            'worklet';
            runOnJS(onSwipeRight)(currentId);
          }
        );
      } else if (translateX.value < -SWIPE_THRESHOLD || isQuickFlickLeft) {
        isSwiping.value = true;
        const currentId = currentAsset.id;
        translateX.value = withTiming(
          -SCREEN_WIDTH * 1.3,
          {
            duration: FLYOUT_DURATION,
            easing: SWIPE_EASING,
          },
          () => {
            'worklet';
            runOnJS(onSwipeLeft)(currentId);
          }
        );
      } else {
        translateX.value = withSpring(0, {
          velocity: event.velocityX,
          damping: 20,
          stiffness: 180,
          mass: 0.8,
        });
        translateY.value = withSpring(0, {
          velocity: event.velocityY,
          damping: 20,
          stiffness: 180,
          mass: 0.8,
        });
      }
      hasCrossedThreshold.value = false;
    });

  // Top Card Animated Style
  const topCardAnimatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH * 0.9, 0, SCREEN_WIDTH * 0.9],
      [-10, 0, 10],
      Extrapolation.CLAMP
    );

    const shadowOpacity = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [0.55, 0.85],
      Extrapolation.CLAMP
    );

    const shadowRadius = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [24, 36],
      Extrapolation.CLAMP
    );

    return {
      shadowOpacity,
      shadowRadius,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
      ],
    };
  });

  // 2nd Card Animated Style (Smooth parallel scale & translate as top card drags)
  const secondCardAnimatedStyle = useAnimatedStyle(() => {
    const progress = Math.min(Math.abs(translateX.value) / (SCREEN_WIDTH * 0.8), 1);
    const scale = interpolate(progress, [0, 1], [0.94, 1.0], Extrapolation.CLAMP);
    const translateYVal = interpolate(progress, [0, 1], [12, 0], Extrapolation.CLAMP);
    const opacity = interpolate(progress, [0, 1], [0.8, 1.0], Extrapolation.CLAMP);

    return {
      opacity,
      transform: [{ scale }, { translateY: translateYVal }],
    };
  });

  // 3rd Card Animated Style (Smooth parallel rise)
  const thirdCardAnimatedStyle = useAnimatedStyle(() => {
    const progress = Math.min(Math.abs(translateX.value) / (SCREEN_WIDTH * 0.8), 1);
    const scale = interpolate(progress, [0, 1], [0.88, 0.94], Extrapolation.CLAMP);
    const translateYVal = interpolate(progress, [0, 1], [24, 12], Extrapolation.CLAMP);
    const opacity = interpolate(progress, [0, 1], [0.5, 0.8], Extrapolation.CLAMP);

    return {
      opacity,
      transform: [{ scale }, { translateY: translateYVal }],
    };
  });

  // Swipe Indicators Animated Styles
  const keepIndicatorAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [15, SWIPE_THRESHOLD * 0.55],
      [0, 1],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      translateX.value,
      [15, SWIPE_THRESHOLD],
      [0.85, 1.05],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const deleteIndicatorAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-15, -SWIPE_THRESHOLD * 0.55],
      [0, 1],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      translateX.value,
      [-15, -SWIPE_THRESHOLD],
      [0.85, 1.05],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <View style={styles.deckContainer}>
      {/* 3rd Card (deepest in stack) */}
      {nextAssets && nextAssets[1] && (
        <Animated.View
          style={[styles.cardLayer, { zIndex: 1 }, thirdCardAnimatedStyle]}
        >
          <SwipeCard asset={nextAssets[1]} />
        </Animated.View>
      )}

      {/* 2nd Card (middle in stack, smoothly scales up in parallel) */}
      {nextAssets && nextAssets[0] && (
        <Animated.View
          style={[styles.cardLayer, { zIndex: 2 }, secondCardAnimatedStyle]}
        >
          <SwipeCard asset={nextAssets[0]} />
        </Animated.View>
      )}

      {/* Top Active Card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[styles.cardLayer, { zIndex: 10 }, topCardAnimatedStyle]}
        >
          <SwipeCard asset={currentAsset} isInteractive={true} />

          {/* Minimalist KEEP Swipe Indicator */}
          <Animated.View
            pointerEvents="none"
            style={[styles.centerIndicator, keepIndicatorAnimatedStyle]}
          >
            <View style={[styles.indicatorPill, { borderColor: isIOS ? 'rgba(48, 209, 88, 0.4)' : '#2E6A44', backgroundColor: isIOS ? 'rgba(0, 0, 0, 0.7)' : '#1D1B20' }]}>
              <PlatformIcon name="check" size={20} color={isIOS ? '#30D158' : '#6CDB94'} style={{ marginRight: 6 }} />
              <Text style={{ color: isIOS ? '#30D158' : '#6CDB94', fontSize: 14, fontWeight: '700', letterSpacing: 2 }}>
                KEEP
              </Text>
            </View>
          </Animated.View>

          {/* Minimalist DELETE Swipe Indicator */}
          <Animated.View
            pointerEvents="none"
            style={[styles.centerIndicator, deleteIndicatorAnimatedStyle]}
          >
            <View style={[styles.indicatorPill, { borderColor: isIOS ? 'rgba(255, 69, 58, 0.4)' : '#8C1D18', backgroundColor: isIOS ? 'rgba(0, 0, 0, 0.7)' : '#1D1B20' }]}>
              <PlatformIcon name="close" size={20} color={isIOS ? '#FF453A' : '#FFB4AB'} style={{ marginRight: 6 }} />
              <Text style={{ color: isIOS ? '#FF453A' : '#FFB4AB', fontSize: 14, fontWeight: '700', letterSpacing: 2 }}>
                DELETE
              </Text>
            </View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

const styles = StyleSheet.create({
  deckContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  centerIndicator: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    zIndex: 35,
  },
  indicatorPill: {
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});

export default CardDeck;
