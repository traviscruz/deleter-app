import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleProp,
  ViewStyle,
} from 'react-native';

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
 * Universal Fallback NativeButton (used for web or non-native platforms).
 * On iOS, Metro automatically resolves NativeButton.ios.tsx (@expo/ui/swift-ui).
 * On Android, Metro automatically resolves NativeButton.android.tsx (@expo/ui/jetpack-compose).
 */
export function NativeButton({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
  tintColor,
  style,
  children,
}: NativeButtonProps) {
  const isDestructive = variant === 'destructive';
  const bgColor = isDestructive
    ? '#dc2626'
    : tintColor || (variant === 'secondary' || variant === 'tonal' ? '#27272a' : '#10b981');

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        {
          backgroundColor: bgColor,
          borderRadius: 12,
          paddingVertical: 14,
          paddingHorizontal: 20,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : 1,
        },
        style as ViewStyle,
      ]}
    >
      {children || (
        <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 15 }}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default NativeButton;
