import React, { useState, useEffect } from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';

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
  const [hasGlass, setHasGlass] = useState<boolean>(() => {
    try {
      return typeof isGlassEffectAPIAvailable === 'function' && isGlassEffectAPIAvailable();
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (typeof isGlassEffectAPIAvailable === 'function') {
        const available = isGlassEffectAPIAvailable();
        setHasGlass(available);
      }
    } catch {
      setHasGlass(false);
    }
  }, []);

  if (hasGlass) {
    // Strip conflicting backgroundColor / shadows so native Liquid Glass lens renders cleanly without double backing
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

  // Graceful fallback for iOS environments without native Liquid Glass API
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
