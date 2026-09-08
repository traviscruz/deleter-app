import React, {
  useCallback,
  useImperativeHandle,
  forwardRef,
  useRef,
  memo,
  useLayoutEffect,
  useEffect,
} from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
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
  SharedValue,
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
const SWIPE_THRESHOLD = 95;
const FLYOUT_DURATION = 220;
const FLYOUT_EASING = Easing.out(Easing.cubic);

const SPRING_CONFIG = {
  damping: 22,
  stiffness: 240,
  mass: 0.8,
};

interface TopCardRef {
  flyOut: (direction: 'left' | 'right') => void;
}

interface TopCardProps {
  asset: MediaAsset;
  swipeProgress: SharedValue<number>;
  isDeckLocked: SharedValue<boolean>;
  onSwipeComplete: (direction: 'left' | 'right') => void;
  isIOS: boolean;
}

/**
 * Top interactive card in the deck:
 * Directly receives gestures, rotates, translates, and drives swipeProgress.
 */
const TopCardItem = memo(
  forwardRef<TopCardRef, TopCardProps>(function TopCardItem(
    { asset, swipeProgress, isDeckLocked, onSwipeComplete, isIOS },
    ref
  ) {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const hasCrossedThreshold = useSharedValue(false);

    const triggerThresholdHaptic = useCallback(() => {
      Haptics.impactAsync(
        isIOS ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
      );
    }, [isIOS]);

    const performFlyOut = useCallback(
      (direction: 'left' | 'right', initialVelocityX = 0, initialVelocityY = 0) => {
        'worklet';
        if (isDeckLocked.value) return;
        isDeckLocked.value = true;

        const isRight = direction === 'right';
        const targetX = isRight ? SCREEN_WIDTH * 1.55 : -SCREEN_WIDTH * 1.55;
        const targetY = translateY.value + (initialVelocityY ? initialVelocityY * 0.1 : -18);

        translateX.value = withTiming(
          targetX,
          {
            duration: FLYOUT_DURATION,
            easing: FLYOUT_EASING,
          },
          (finished) => {
            'worklet';
            if (finished) {
              runOnJS(onSwipeComplete)(direction);
            }
          }
        );

        translateY.value = withTiming(targetY, {
          duration: FLYOUT_DURATION,
          easing: FLYOUT_EASING,
        });

        swipeProgress.value = withTiming(1, {
          duration: FLYOUT_DURATION,
          easing: FLYOUT_EASING,
        });
      },
      [isDeckLocked, onSwipeComplete, swipeProgress, translateX, translateY]
    );

    useImperativeHandle(
      ref,
      () => ({
        flyOut: (direction: 'left' | 'right') => {
          performFlyOut(direction);
        },
      }),
      [performFlyOut]
    );

    const panGesture = Gesture.Pan()
      .onBegin(() => {
        'worklet';
        if (isDeckLocked.value) return;
      })
      .onUpdate((event) => {
        'worklet';
        if (isDeckLocked.value) return;

        translateX.value = event.translationX;
        translateY.value = event.translationY * 0.38;

        const progress = Math.min(Math.abs(event.translationX) / (SCREEN_WIDTH * 0.7), 1);
        swipeProgress.value = progress;

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
        if (isDeckLocked.value) return;

        const isQuickFlickRight = event.velocityX > 450;
        const isQuickFlickLeft = event.velocityX < -450;

        if (translateX.value > SWIPE_THRESHOLD || isQuickFlickRight) {
          performFlyOut('right', event.velocityX, event.velocityY);
        } else if (translateX.value < -SWIPE_THRESHOLD || isQuickFlickLeft) {
          performFlyOut('left', event.velocityX, event.velocityY);
        } else {
          // Rebound back smoothly
          translateX.value = withSpring(0, {
            ...SPRING_CONFIG,
            velocity: event.velocityX,
          });
          translateY.value = withSpring(0, {
            ...SPRING_CONFIG,
            velocity: event.velocityY,
          });
          swipeProgress.value = withSpring(0, SPRING_CONFIG);
        }
        hasCrossedThreshold.value = false;
      });

    const cardAnimatedStyle = useAnimatedStyle(() => {
      const rotation = interpolate(
        translateX.value,
        [-SCREEN_WIDTH * 0.85, 0, SCREEN_WIDTH * 0.85],
        [-13, 0, 13],
        Extrapolation.CLAMP
      );

      const shadowOpacity = interpolate(
        swipeProgress.value,
        [0, 1],
        [0.5, 0.85],
        Extrapolation.CLAMP
      );

      const shadowRadius = interpolate(
        swipeProgress.value,
        [0, 1],
        [20, 32],
        Extrapolation.CLAMP
      );

      const shadowHeight = interpolate(
        swipeProgress.value,
        [0, 1],
        [10, 22],
        Extrapolation.CLAMP
      );

      return {
        zIndex: 10,
        shadowColor: '#000000',
        shadowOpacity,
        shadowRadius,
        shadowOffset: { width: 0, height: shadowHeight },
        elevation: 12,
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { rotate: `${rotation}deg` },
          { scale: 1.0 },
        ],
      };
    });

    const keepIndicatorAnimatedStyle = useAnimatedStyle(() => {
      const opacity = interpolate(
        translateX.value,
        [15, SWIPE_THRESHOLD * 0.65],
        [0, 1],
        Extrapolation.CLAMP
      );
      const scale = interpolate(
        translateX.value,
        [15, SWIPE_THRESHOLD],
        [0.8, 1.05],
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
        [-15, -SWIPE_THRESHOLD * 0.65],
        [0, 1],
        Extrapolation.CLAMP
      );
      const scale = interpolate(
        translateX.value,
        [-15, -SWIPE_THRESHOLD],
        [0.8, 1.05],
        Extrapolation.CLAMP
      );
      return {
        opacity,
        transform: [{ scale }],
      };
    });

    return (
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.cardLayer, cardAnimatedStyle]}>
          <SwipeCard asset={asset} isInteractive={true} />

          {/* Centered Minimalist Check Badge */}
          <Animated.View
            pointerEvents="none"
            style={[styles.centerIndicator, styles.indicatorKeep, keepIndicatorAnimatedStyle]}
          >
            <PlatformIcon name="check" size={24} color="#30D158" />
          </Animated.View>

          {/* Centered Minimalist X Badge */}
          <Animated.View
            pointerEvents="none"
            style={[styles.centerIndicator, styles.indicatorDelete, deleteIndicatorAnimatedStyle]}
          >
            <PlatformIcon name="close" size={22} color="#FF453A" />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    );
  })
);

interface BackgroundCardProps {
  asset: MediaAsset;
  level: 1 | 2; // 1 = immediate next card (scale 0.95 -> 1.0), 2 = 3rd card (scale 0.90 -> 0.95)
  swipeProgress: SharedValue<number>;
  isIOS: boolean;
}

/**
 * Background card (Card 2 or Card 3):
 * Dedicated layer that smoothly scales in without any index-switching race condition.
 */
const BackgroundCardItem = memo(function BackgroundCardItem({
  asset,
  level,
  swipeProgress,
  isIOS,
}: BackgroundCardProps) {
  const isLevel1 = level === 1;

  const cardAnimatedStyle = useAnimatedStyle(() => {
    if (isLevel1) {
      // Scales from 0.95 to 1.0 and translateY from 14 to 0
      const scale = interpolate(swipeProgress.value, [0, 1], [0.95, 1.0], Extrapolation.CLAMP);
      const translateY = interpolate(swipeProgress.value, [0, 1], [14, 0], Extrapolation.CLAMP);

      return {
        zIndex: 2,
        shadowColor: '#000000',
        shadowOpacity: 0.4,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
        transform: [{ translateX: 0 }, { translateY }, { scale }],
      };
    } else {
      // Scales from 0.90 to 0.95 and translateY from 28 to 14
      const scale = interpolate(swipeProgress.value, [0, 1], [0.90, 0.95], Extrapolation.CLAMP);
      const translateY = interpolate(swipeProgress.value, [0, 1], [28, 14], Extrapolation.CLAMP);

      return {
        zIndex: 1,
        shadowColor: '#000000',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
        transform: [{ translateX: 0 }, { translateY }, { scale }],
      };
    }
  });

  const scrimAnimatedStyle = useAnimatedStyle(() => {
    if (isLevel1) {
      const opacity = interpolate(swipeProgress.value, [0, 1], [0.22, 0.0], Extrapolation.CLAMP);
      return { opacity };
    } else {
      const opacity = interpolate(swipeProgress.value, [0, 1], [0.44, 0.22], Extrapolation.CLAMP);
      return { opacity };
    }
  });

  return (
    <Animated.View style={[styles.cardLayer, cardAnimatedStyle]}>
      <SwipeCard asset={asset} isInteractive={false} />

      {/* Depth Scrim */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: '#000000',
            borderRadius: isIOS ? 28 : 22,
          },
          scrimAnimatedStyle,
        ]}
      />
    </Animated.View>
  );
});

export const CardDeck = forwardRef<CardDeckRef, CardDeckProps>(function CardDeck(
  { currentAsset, nextAssets, onSwipeLeft, onSwipeRight },
  ref
) {
  const swipeProgress = useSharedValue(0);
  const isDeckLocked = useSharedValue(false);
  const topCardRef = useRef<TopCardRef>(null);

  const isIOS = Platform.OS === 'ios';

  const prevAssetIdRef = useRef<string | null>(null);
  if (currentAsset && prevAssetIdRef.current !== currentAsset.id) {
    prevAssetIdRef.current = currentAsset.id;
    // Reset swipe progress synchronously for the new active card stack during render phase
    swipeProgress.value = 0;
    isDeckLocked.value = false;
  }

  // Ahead-of-time image cache decoding
  useEffect(() => {
    const list = [currentAsset, ...(nextAssets || [])].filter(Boolean);
    const urls = list
      .filter((a) => a.mediaType !== 'video' && a.uri)
      .map((a) => a.uri);
    if (urls.length > 0) {
      Image.prefetch(urls);
    }
  }, [currentAsset, nextAssets]);

  const handleSwipeComplete = useCallback(
    (direction: 'left' | 'right') => {
      const assetId = currentAsset?.id;
      if (!assetId) return;

      // Advance parent queue. We deliberately do not reset swipeProgress here
      // so that the incoming card stays seamlessly at scale 1.0 until the new TopCardItem mounts.
      if (direction === 'left') {
        onSwipeLeft(assetId);
      } else {
        onSwipeRight(assetId);
      }
    },
    [currentAsset?.id, onSwipeLeft, onSwipeRight]
  );

  useImperativeHandle(ref, () => ({
    swipeLeft: () => {
      if (topCardRef.current && !isDeckLocked.value) {
        topCardRef.current.flyOut('left');
      }
    },
    swipeRight: () => {
      if (topCardRef.current && !isDeckLocked.value) {
        topCardRef.current.flyOut('right');
      }
    },
  }));

  if (!currentAsset) {
    return null;
  }

  const nextAsset1 = nextAssets?.[0];
  const nextAsset2 = nextAssets?.[1];

  return (
    <View style={styles.deckContainer}>
      {/* 3rd Card in background (lowest z-index) */}
      {nextAsset2 && (
        <BackgroundCardItem
          key={`bg-card-2-${nextAsset2.id}`}
          asset={nextAsset2}
          level={2}
          swipeProgress={swipeProgress}
          isIOS={isIOS}
        />
      )}

      {/* 2nd Card behind top (scales up to 1.0 during swipe) */}
      {nextAsset1 && (
        <BackgroundCardItem
          key={`bg-card-1-${nextAsset1.id}`}
          asset={nextAsset1}
          level={1}
          swipeProgress={swipeProgress}
          isIOS={isIOS}
        />
      )}

      {/* Top Active Card (receives gesture, flies out) */}
      <TopCardItem
        key={`top-card-${currentAsset.id}`}
        ref={topCardRef}
        asset={currentAsset}
        swipeProgress={swipeProgress}
        isDeckLocked={isDeckLocked}
        onSwipeComplete={handleSwipeComplete}
        isIOS={isIOS}
      />
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
    alignSelf: 'center',
    top: '50%',
    marginTop: -23,
    zIndex: 40,
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 10, 12, 0.85)',
    shadowColor: '#000000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  indicatorKeep: {
    borderColor: 'rgba(48, 209, 88, 0.8)',
  },
  indicatorDelete: {
    borderColor: 'rgba(255, 69, 58, 0.8)',
  },
});

export default CardDeck;
