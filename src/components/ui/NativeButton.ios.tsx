import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { SymbolView } from 'expo-symbols';
import { getSwiftUI } from '@/services/nativeUI';

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
 * Native iOS Button:
 * - Uses `@expo/ui/swift-ui` `Button` when running in a development build where ExpoUI is compiled.
 * - Falls back to styled native button in Expo Go.
 */
export function NativeButton({
  label = '',
  systemImage,
  role = 'default',
  onPress,
  disabled = false,
  variant = 'primary',
  size = 'regular',
  tintColor,
  style,
  children,
}: NativeButtonProps) {
  const isDestructive = variant === 'destructive' || role === 'destructive';
  const effectiveRole = isDestructive ? 'destructive' : role;
  const swiftUI = getSwiftUI();

  if (swiftUI) {
    const { ui, modifiers } = swiftUI;
    const { Button } = ui;
    const { buttonStyle, controlSize, tint, disabled: disabledModifier } = modifiers;

    const modArray: any[] = [];

    if (variant === 'glass') {
      modArray.push(buttonStyle('glass'));
    } else if (variant === 'primary' || isDestructive) {
      modArray.push(buttonStyle('borderedProminent'));
    } else if (variant === 'secondary' || variant === 'tonal') {
      modArray.push(buttonStyle('bordered'));
    } else {
      modArray.push(buttonStyle('automatic'));
    }

    if (size === 'large') {
      modArray.push(controlSize('large'));
    } else if (size === 'small') {
      modArray.push(controlSize('small'));
    } else {
      modArray.push(controlSize('regular'));
    }

    if (tintColor) {
      modArray.push(tint(tintColor));
    } else if (isDestructive) {
      modArray.push(tint('#FF453A'));
    }

    if (disabled) {
      modArray.push(disabledModifier(true));
    }

    return (
      <View style={style}>
        <Button
          label={label}
          systemImage={systemImage}
          role={effectiveRole}
          onPress={onPress}
          modifiers={modArray}
        />
      </View>
    );
  }

  // Fallback for Expo Go: Use Apple's native GlassView with SF Symbols
  const effectiveColor = isDestructive
    ? '#FF453A'
    : tintColor || (variant === 'secondary' || variant === 'tonal' ? 'rgba(255, 255, 255, 0.8)' : '#30D158');

  return (
    <GlassView
      isInteractive={true}
      glassEffectStyle={variant === 'glass' ? 'clear' : 'regular'}
      tintColor={isDestructive ? 'rgba(255, 69, 58, 0.25)' : undefined}
      onTouchEnd={disabled ? undefined : onPress}
      style={[
        {
          backgroundColor: isDestructive ? 'rgba(255, 69, 58, 0.2)' : undefined,
          borderRadius: size === 'large' ? 16 : 12,
          paddingVertical: size === 'large' ? 14 : 10,
          paddingHorizontal: 20,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          opacity: disabled ? 0.35 : 1,
        },
        style as ViewStyle,
      ]}
    >
      {systemImage && (
        <SymbolView
          name={systemImage}
          size={size === 'large' ? 18 : 15}
          tintColor={effectiveColor}
          style={{ marginRight: label ? 6 : 0 }}
        />
      )}
      {children || (
        <Text
          style={{
            color: effectiveColor,
            fontWeight: '600',
            fontSize: size === 'large' ? 16 : 14,
          }}
        >
          {label}
        </Text>
      )}
    </GlassView>
  );
}

export default NativeButton;
