import React from 'react';
import { View, Text, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { getJetpackCompose } from '@/services/nativeUI';

export interface NativeButtonProps {
  label?: string;
  systemImage?: any;
  leadingIcon?: any;
  role?: 'default' | 'cancel' | 'destructive';
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'destructive' | 'secondary' | 'tonal' | 'icon' | 'glass';
  size?: 'small' | 'regular' | 'large';
  tintColor?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Native Android Button:
 * - Uses `@expo/ui/jetpack-compose` `Button` when running in a development build where ExpoUI is compiled.
 * - Falls back to Material You styled button in Expo Go.
 */
export function NativeButton({
  label,
  leadingIcon,
  onPress,
  disabled = false,
  variant = 'primary',
  tintColor,
  style,
  children,
}: NativeButtonProps) {
  const isDestructive = variant === 'destructive';
  const compose = getJetpackCompose();

  if (compose && compose.Button) {
    const { Button: ComposeButton } = compose;

    let composeVariant: 'default' | 'bordered' | 'borderless' | 'outlined' | 'elevated' = 'elevated';
    if (variant === 'secondary' || variant === 'tonal') {
      composeVariant = 'outlined';
    } else if (variant === 'primary' || isDestructive) {
      composeVariant = 'elevated';
    }

    const effectiveColor = isDestructive ? '#BA1A1A' : tintColor;
    const buttonText = label || (typeof children === 'string' ? children : '');

    return (
      <View style={style}>
        <ComposeButton
          onPress={onPress}
          disabled={disabled}
          variant={composeVariant}
          color={effectiveColor}
          leadingIcon={leadingIcon}
        >
          {buttonText}
        </ComposeButton>
      </View>
    );
  }

  // Material fallback for Expo Go
  const bgColor = isDestructive
    ? '#8C1D18'
    : tintColor || (variant === 'secondary' || variant === 'tonal' ? '#2B2930' : '#1B5E20');

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        {
          backgroundColor: bgColor,
          borderRadius: 20,
          paddingVertical: 12,
          paddingHorizontal: 20,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : 1,
        },
        style as ViewStyle,
      ]}
    >
      {children || (
        <Text style={{ color: '#FFFFFF', fontWeight: '500', fontSize: 14 }}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default NativeButton;
