import React from 'react';
import { View, Platform, StyleProp, ViewStyle, ViewProps } from 'react-native';
import { GlassView, GlassStyle } from 'expo-glass-effect';

export interface NativeGlassViewProps extends ViewProps {
  glassEffectStyle?: GlassStyle;
  tintColor?: string;
  isInteractive?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Real Native OS Surface Component:
 * - iOS: Renders native Liquid Glass material via `expo-glass-effect` (automatically adapts to iOS version).
 * - Android: Renders solid Material You surface (no glass effect exists on Android).
 *
 * Strictly branches on Platform.OS, never on OS version numbers.
 */
export function NativeGlassView({
  glassEffectStyle = 'regular',
  tintColor,
  isInteractive = false,
  style,
  children,
  ...props
}: NativeGlassViewProps) {
  if (Platform.OS === 'ios') {
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
