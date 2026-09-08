import React, {
  useCallback,
  useImperativeHandle,
  forwardRef,
  useRef,
  memo,
  useLayoutEffect,
  useEffect,
} from 'react';
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
const FLYOUT_DURATION = 230;
const FLYOUT_EASING = Easing.out(Easing.cubic);

interface DeckCardItemRef {
  flyOut: (direction: 'left' | 'right') => void;
}

interface DeckCardItemProps {
  asset: MediaAsset;
  index: number; // 0 = top card, 1 = 2nd card, 2 = 3rd card
  dragProgress: SharedValue<number>;
  isDeckLocked: SharedValue<boolean>;
  onSwipeComplete: (id: string, direction: 'left' | 'right') => void;
  isIOS: boolean;
}

const DeckCardItem = memo(
  forwardRef<DeckCardItemRef, DeckCardItemProps>(function DeckCardItem(
    { asset, index, dragProgress, isDeckLocked, onSwipeComplete, isIOS },
    ref
  ) {
    const isTop = index === 0;
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
        const targetY = translateY.value + (initialVelocityY ? initialVelocityY * 0.12 : -20);

        translateX.value = withTiming(
          targetX,
          {
            duration: FLYOUT_DURATION,
            easing: FLYOUT_EASING,
          },
          () => {
            'worklet';
            runOnJS(onSwipeComplete)(asset.id, direction);
          }
        );

        translateY.value = withTiming(targetY, {
          duration: FLYOUT_DURATION,
          easing: FLYOUT_EASING,
        });

        dragProgress.value = withTiming(1, {
          duration: FLYOUT_DURATION,
          easing: FLYOUT_EASING,
        });
      },
      [asset.id, dragProgress, isDeckLocked, onSwipeComplete, translateX, translateY]
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
      .enabled(isTop)
      .onBegin(() => {
        'worklet';
        if (isDeckLocked.value || !isTop) return;
      })
      .onUpdate((event) => {
        'worklet';
        if (isDeckLocked.value || !isTop) return;

        translateX.value = event.translationX;
        translateY.value = event.translationY * 0.38;

        const progress = Math.min(Math.abs(event.translationX) / (SCREEN_WIDTH * 0.72), 1);
        dragProgress.value = progress;

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
        if (isDeckLocked.value || !isTop) return;

        const isQuickFlickRight = event.velocityX > 450;
        const isQuickFlickLeft = event.velocityX < -450;

        if (translateX.value > SWIPE_THRESHOLD || isQuickFlickRight) {
          performFlyOut('right', event.velocityX, event.velocityY);
        } else if (translateX.value < -SWIPE_THRESHOLD || isQuickFlickLeft) {
          performFlyOut('left', event.velocityX, event.velocityY);
        } else {
          // Rebound back with natural spring
          translateX.value = withSpring(0, {
            velocity: event.velocityX,
            damping: 20,
            stiffness: 220,
            mass: 0.8,
          });
          translateY.value = withSpring(0, {
            velocity: event.velocityY,
            damping: 20,
            stiffness: 220,
            mass: 0.8,
          });
          dragProgress.value = withSpring(0, {
            damping: 20,
            stiffness: 220,
            mass: 0.8,
          });
        }
        hasCrossedThreshold.value = false;
      });

    // Unified Card Stacking & Physical Depth Style
    const cardAnimatedStyle = useAnimatedStyle(() => {
      if (index === 0) {
        // TOP ACTIVE CARD
        const rotation = interpolate(
          translateX.value,
          [-SCREEN_WIDTH * 0.85, 0, SCREEN_WIDTH * 0.85],
          [-13, 0, 13],
          Extrapolation.CLAMP
        );

        const shadowOpacity = interpolate(
          dragProgress.value,
          [0, 1],
          [0.5, 0.85],
          Extrapolation.CLAMP
        );

        const shadowRadius = interpolate(
          dragProgress.value,
          [0, 1],
          [20, 32],
          Extrapolation.CLAMP
        );

        const shadowHeight = interpolate(
          dragProgress.value,
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
      } else if (index === 1) {
        // 2ND CARD (Smoothly scales from 0.95 to 1.0 with ZERO frame skip)
        const scale = interpolate(dragProgress.value, [0, 1], [0.95, 1.0], Extrapolation.CLAMP);
        const translateYVal = interpolate(dragProgress.value, [0, 1], [14, 0], Extrapolation.CLAMP);

        return {
          zIndex: 2,
          shadowColor: '#000000',
          shadowOpacity: 0.4,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
          transform: [
            { translateX: 0 },
            { translateY: translateYVal },
            { scale },
          ],
        };
      } else {
        // 3RD CARD (Smoothly scales from 0.90 to 0.95)
        const scale = interpolate(dragProgress.value, [0, 1], [0.90, 0.95], Extrapolation.CLAMP);
        const translateYVal = interpolate(dragProgress.value, [0, 1], [28, 14], Extrapolation.CLAMP);

        return {
          zIndex: 1,
          shadowColor: '#000000',
          shadowOpacity: 0.3,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
          transform: [
            { translateX: 0 },
            { translateY: translateYVal },
            { scale },
          ],
        };
      }
    });

    // Dark Depth Overlay (Ambient Occlusion)
    const scrimAnimatedStyle = useAnimatedStyle(() => {
      if (index === 0) {
        return { opacity: 0 };
      } else if (index === 1) {
        const opacity = interpolate(dragProgress.value, [0, 1], [0.22, 0.0], Extrapolation.CLAMP);
        return { opacity };
      } else {
        const opacity = interpolate(dragProgress.value, [0, 1], [0.44, 0.22], Extrapolation.CLAMP);
        return { opacity };
      }
    });

    // Centered Minimalist "KEEP" Icon
    const keepIndicatorAnimatedStyle = useAnimatedStyle(() => {
      if (index !== 0) return { opacity: 0 };
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

    // Centered Minimalist "DELETE" Icon
    const deleteIndicatorAnimatedStyle = useAnimatedStyle(() => {
      if (index !== 0) return { opacity: 0 };
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
          <SwipeCard asset={asset} isInteractive={isTop} />

          {/* Ambient occlusion depth scrim: Permanently mounted to guarantee zero native subview churn */}
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

export const CardDeck = forwardRef<CardDeckRef, CardDeckProps>(function CardDeck(
  { currentAsset, nextAssets, onSwipeLeft, onSwipeRight },
  ref
) {
  const dragProgress = useSharedValue(0);
  const isDeckLocked = useSharedValue(false);
  const topCardRef = useRef<DeckCardItemRef>(null);

  const isIOS = Platform.OS === 'ios';

  // Synchronously reset dragProgress when the active card changes during React's commit phase.
  // This guarantees that the incoming card is already evaluated as Top Card (scale 1.0)
  // before dragProgress resets, completely eliminating any frame skips or scale snapping!
  useLayoutEffect(() => {
    dragProgress.value = 0;
    isDeckLocked.value = false;
  }, [currentAsset.id, dragProgress, isDeckLocked]);

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
    (assetId: string, direction: 'left' | 'right') => {
      // Advance parent queue.
      // NOTE: We deliberately do NOT reset dragProgress here.
      // Leaving dragProgress at 1 keeps the upcoming card at scale 1.0 continuously
      // until React commits the new top card, at which point useLayoutEffect resets it seamlessly!
      if (direction === 'left') {
        onSwipeLeft(assetId);
      } else {
        onSwipeRight(assetId);
      }
    },
    [onSwipeLeft, onSwipeRight]
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

  // Build the list of cards: index 0 (top), index 1 (2nd), index 2 (3rd)
  const cardItems: { asset: MediaAsset; index: number }[] = [];
  if (currentAsset) {
    cardItems.push({ asset: currentAsset, index: 0 });
  }
  if (nextAssets && nextAssets[0]) {
    cardItems.push({ asset: nextAssets[0], index: 1 });
  }
  if (nextAssets && nextAssets[1]) {
    cardItems.push({ asset: nextAssets[1], index: 2 });
  }

  // Render from deepest (index 2) to top (index 0) so zIndex stacking is natural
  const renderedCards = cardItems.slice().reverse();

  return (
    <View style={styles.deckContainer}>
      {renderedCards.map((item) => (
        <DeckCardItem
          key={`card-stable-${item.asset.id}`}
          ref={item.index === 0 ? topCardRef : undefined}
          asset={item.asset}
          index={item.index}
          dragProgress={dragProgress}
          isDeckLocked={isDeckLocked}
          onSwipeComplete={handleSwipeComplete}
          isIOS={isIOS}
        />
      ))}
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
