import React from 'react';
import {
  StyleProp,
  ViewStyle,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export interface NativeButtonProps {
  label?: string;
  systemImage?: string;
  role?: 'default' | 'cancel' | 'destructive';
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'destructive' | 'secondary' | 'tonal' | 'icon';
  size?: 'small' | 'regular' | 'large';
  tintColor?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

// Map SF symbol name hints to Ionicons for iOS Expo Go runtime
function getIOSIconName(systemImage?: string): keyof typeof Ionicons.glyphMap | null {
  if (!systemImage) return null;
  switch (systemImage) {
    case 'trash':
    case 'trash.fill':
      return 'trash-outline';
    case 'checkmark':
    case 'checkmark.circle':
      return 'checkmark';
    case 'arrow.uturn.backward':
    case 'arrow.counterclockwise':
      return 'arrow-undo';
    case 'sparkles':
      return 'sparkles';
    case 'lock':
    case 'lock.fill':
      return 'lock-closed-outline';
    case 'play':
    case 'play.fill':
      return 'play';
    case 'gear':
    case 'gearshape':
      return 'settings-outline';
    default:
      return null;
  }
}

export function NativeButton({
  label,
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
  // If running in development build with native SwiftUI module compiled in
  if (!isExpoGo) {
    try {
      const { Button } = require('@expo/ui/swift-ui');
      const {
        buttonStyle,
        controlSize,
        tint,
        disabled: disabledModifier,
      } = require('@expo/ui/swift-ui/modifiers');

      const modifiers: any[] = [];

      if (variant === 'destructive' || role === 'destructive') {
        modifiers.push(buttonStyle('borderedProminent'));
        modifiers.push(tint(tintColor || '#FF453A'));
      } else if (variant === 'primary') {
        modifiers.push(buttonStyle('borderedProminent'));
        if (tintColor) {
          modifiers.push(tint(tintColor));
        }
      } else if (variant === 'secondary' || variant === 'tonal') {
        modifiers.push(buttonStyle('bordered'));
        if (tintColor) {
          modifiers.push(tint(tintColor));
        }
      } else if (variant === 'icon') {
        modifiers.push(buttonStyle('borderless'));
        if (tintColor) {
          modifiers.push(tint(tintColor));
        }
      } else {
        modifiers.push(buttonStyle('automatic'));
      }

      if (size === 'large') {
        modifiers.push(controlSize('large'));
      } else if (size === 'small') {
        modifiers.push(controlSize('small'));
      } else {
        modifiers.push(controlSize('regular'));
      }

      if (disabled) {
        modifiers.push(disabledModifier(true));
      }

      return (
        <View style={style}>
          <Button
            label={label || ''}
            systemImage={systemImage}
            role={role}
            onPress={onPress}
            modifiers={modifiers}
          />
        </View>
      );
    } catch {
      // Fallback if SwiftUI native view manager isn't available
    }
  }

  // Graceful iOS Native Fallback for Expo Go (using iOS Human Interface Design specs)
  const isDestructive = variant === 'destructive' || role === 'destructive';
  const isSecondary = variant === 'secondary' || variant === 'tonal';
  const isIcon = variant === 'icon';

  const defaultBg = isDestructive
    ? tintColor || '#FF453A'
    : isSecondary
    ? 'rgba(255, 255, 255, 0.12)'
    : isIcon
    ? 'transparent'
    : tintColor || '#0A84FF';

  const textColor = isSecondary && !tintColor ? '#FFFFFF' : '#FFFFFF';
  const iconName = getIOSIconName(systemImage);

  const paddingVertical = size === 'large' ? 14 : size === 'small' ? 8 : 11;
  const paddingHorizontal = size === 'large' ? 24 : size === 'small' ? 12 : 18;
  const fontSize = size === 'large' ? 17 : size === 'small' ? 13 : 15;
  const iconSize = size === 'large' ? 20 : size === 'small' ? 14 : 17;

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
      disabled={disabled}
      style={[
        {
          backgroundColor: defaultBg,
          borderRadius: 999,
          paddingVertical,
          paddingHorizontal,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : 1,
        },
        isSecondary && {
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: 'rgba(255, 255, 255, 0.2)',
        },
        style,
      ]}
    >
      {iconName && (
        <Ionicons
          name={iconName}
          size={iconSize}
          color={textColor}
          style={label ? { marginRight: 6 } : undefined}
        />
      )}
      {label && (
        <Text
          style={{
            color: textColor,
            fontSize,
            fontWeight: '600',
            letterSpacing: -0.2,
          }}
        >
          {label}
        </Text>
      )}
      {children}
    </TouchableOpacity>
  );
}

export default NativeButton;
