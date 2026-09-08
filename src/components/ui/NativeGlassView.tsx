import { BlurView } from 'expo-blur';
import { getGlassEffect } from '@/services/nativeUI';
import React, { useMemo } from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';

export type GlassStyle = 'regular' | 'clear';

export interface NativeGlassViewProps extends ViewProps {
  glassEffectStyle?: GlassStyle;
  tintColor?: string;
  isInteractive?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Real Native OS Surface Component:
 * - iOS: Renders native Liquid Glass via `expo-glass-effect` when available (dev build, iOS 26+),
 *        or falls back to native BlurView in Expo Go / older iOS.
 * - Android: Renders solid Material You surface.
 */
export function NativeGlassView({
  glassEffectStyle = 'regular',
  tintColor,
  isInteractive = false,
  style,
  children,
  ...props
}: NativeGlassViewProps) {
  // getGlassEffect() is null in Expo Go (IS_EXPO_GO guard) and on non-iOS 26 devices.
  const glassEffect = useMemo(() => (Platform.OS === 'ios' ? getGlassEffect() : null), []);

  if (Platform.OS === 'ios') {
    if (glassEffect && glassEffect.GlassView) {
      const { GlassView } = glassEffect;
      return (
        <GlassView
          glassEffectStyle={glassEffectStyle}
          tintColor={tintColor}
          isInteractive={isInteractive}
          style={style}
          {...props}
        >
          {children}
        </GlassView>
      );
    }

    // Expo Go / non-iOS 26 fallback: BlurView
    return (
      <View
        style={[
          {
            overflow: 'hidden',
            backgroundColor: 'rgba(28, 28, 30, 0.75)',
          },
          style,
        ]}
        {...props}
      >
        <BlurView intensity={85} tint="systemMaterialDark" style={StyleSheet.absoluteFill} />
        {children}
      </View>
    );
  }

  // Android & fallback: Solid Material You surface
  return (
    <View
      style={[
        {
          backgroundColor: '#1C1B1F',
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

export default NativeGlassView;
