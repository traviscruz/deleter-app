import React from 'react';
import {
  Platform,
  TouchableOpacity,
  Pressable,
  GestureResponderEvent,
  StyleProp,
  ViewStyle,
  AccessibilityProps,
} from 'react-native';

export interface PlatformPressableProps extends AccessibilityProps {
  onPress?: ((event: GestureResponderEvent) => void) | null;
  onLongPress?: ((event: GestureResponderEvent) => void) | null;
  onPressIn?: ((event: GestureResponderEvent) => void) | null;
  onPressOut?: ((event: GestureResponderEvent) => void) | null;
  disabled?: boolean | null;
  style?: StyleProp<ViewStyle>;
  rippleColor?: string;
  rippleBorderless?: boolean;
  children?: React.ReactNode;
  activeOpacity?: number;
  hitSlop?: any;
  testID?: string;
}

export function PlatformPressable({
  children,
  style,
  rippleColor = 'rgba(255, 255, 255, 0.12)',
  rippleBorderless = false,
  activeOpacity = 0.7,
  disabled,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  hitSlop,
  testID,
  ...props
}: PlatformPressableProps) {
  if (Platform.OS === 'android') {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        hitSlop={hitSlop}
        testID={testID}
        android_ripple={{
          color: rippleColor,
          borderless: rippleBorderless,
        }}
        style={({ pressed }) => [
          style as ViewStyle,
          pressed && Platform.OS === 'web' && { opacity: 0.8 },
        ]}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress ?? undefined}
      onLongPress={onLongPress ?? undefined}
      onPressIn={onPressIn ?? undefined}
      onPressOut={onPressOut ?? undefined}
      disabled={disabled ?? undefined}
      hitSlop={hitSlop}
      testID={testID}
      activeOpacity={activeOpacity}
      style={style as ViewStyle}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}

export default PlatformPressable;

