import { BlurView } from 'expo-blur';
import { getGlassEffect } from '@/services/nativeUI';
import React, { useMemo } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

export interface NativeGlassViewProps extends ViewProps {
  glassEffectStyle?: 'regular' | 'clear';
  tintColor?: string;
  isInteractive?: boolean;
  children?: React.ReactNode;
}

export function NativeGlassView({
  glassEffectStyle = 'regular',
  tintColor,
  isInteractive = false,
  style,
  children,
  ...props
}: NativeGlassViewProps) {
  // getGlassEffect() returns null in Expo Go (guarded by IS_EXPO_GO) and on non-iOS 26 devices.
  const glassEffect = useMemo(() => getGlassEffect(), []);

  if (glassEffect && glassEffect.GlassView) {
    const { GlassView } = glassEffect;
    // Strip conflicting backgroundColor / shadows so native Liquid Glass lens renders cleanly
    const flattened = StyleSheet.flatten(style) || {};
    const {
      backgroundColor: _bg,
      shadowColor: _sc,
      shadowOffset: _so,
      shadowOpacity: _sop,
      shadowRadius: _sr,
      ...cleanStyle
    } = flattened as any;

    return (
      <GlassView
        glassEffectStyle={glassEffectStyle}
        tintColor={tintColor}
        colorScheme="dark"
        isInteractive={isInteractive}
        style={cleanStyle}
        {...props}
      >
        {children}
      </GlassView>
    );
  }

  // Fallback: BlurView for Expo Go and non-iOS 26 devices
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

export default NativeGlassView;
