import React from 'react';
import { View, ViewProps, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

interface LiquidGlassViewProps extends ViewProps {
  children?: React.ReactNode;
  intensity?: number;
  tint?:
    | 'dark'
    | 'light'
    | 'default'
    | 'systemMaterialDark'
    | 'systemThinMaterialDark'
    | 'systemChromeMaterialDark'
    | 'systemUltraThinMaterialDark'
    | 'prominent';
  fallbackBg?: string;
  borderColor?: string;
  elevation?: number;
}

export function LiquidGlassView({
  children,
  style,
  intensity = 80,
  tint = 'systemMaterialDark',
  fallbackBg = 'rgba(28, 28, 30, 0.75)',
  borderColor = 'rgba(255, 255, 255, 0.12)',
  elevation = 2,
  ...props
}: LiquidGlassViewProps) {
  // On iOS, render native BlurView with Cupertino vibrancy
  if (Platform.OS === 'ios') {
    return (
      <View
        style={[
          {
            overflow: 'hidden',
            borderColor,
            borderWidth: StyleSheet.hairlineWidth,
            backgroundColor: fallbackBg,
          },
          style,
        ]}
        {...props}
      >
        <BlurView
          intensity={intensity}
          tint={tint as any}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </View>
    );
  }

  // On Android/Web: Native Material 3 Surface Container with elevation
  return (
    <View
      style={[
        {
          backgroundColor: '#1D1B20',
          elevation,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

export default LiquidGlassView;

