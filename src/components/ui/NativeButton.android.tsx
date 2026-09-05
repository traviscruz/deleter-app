import React from 'react';
import {
  StyleProp,
  ViewStyle,
  View,
  Text,
  Pressable,
} from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { MaterialIcons } from '@expo/vector-icons';
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

function getAndroidIconName(systemImage?: string): keyof typeof MaterialIcons.glyphMap | null {
  if (!systemImage) return null;
  switch (systemImage) {
    case 'trash':
    case 'trash.fill':
      return 'delete-outline';
    case 'checkmark':
    case 'checkmark.circle':
      return 'check';
    case 'arrow.uturn.backward':
    case 'arrow.counterclockwise':
      return 'undo';
    case 'sparkles':
      return 'auto-awesome';
    case 'lock':
    case 'lock.fill':
      return 'lock-outline';
    case 'play':
    case 'play.fill':
      return 'play-arrow';
    case 'gear':
    case 'gearshape':
      return 'settings';
    default:
      return null;
  }
}

export function NativeButton({
  label,
  systemImage,
  onPress,
  disabled = false,
  variant = 'primary',
  size = 'regular',
  tintColor,
  style,
  children,
}: NativeButtonProps) {
  // If running in development build with Jetpack Compose module compiled in
  if (!isExpoGo) {
    try {
      const {
        Button,
        FilledTonalButton,
        Text: ComposeText,
      } = require('@expo/ui/jetpack-compose');

      const content = children || (label ? <ComposeText>{label}</ComposeText> : null);

      if (variant === 'destructive') {
        return (
          <View style={style}>
            <Button
              onClick={onPress}
              enabled={!disabled}
              colors={{
                containerColor: tintColor || '#B3261E',
                contentColor: '#FFFFFF',
              }}
            >
              {content}
            </Button>
          </View>
        );
      }

      if (variant === 'tonal' || variant === 'secondary') {
        return (
          <View style={style}>
            <FilledTonalButton onClick={onPress} enabled={!disabled}>
              {content}
            </FilledTonalButton>
          </View>
        );
      }

      return (
        <View style={style}>
          <Button
            onClick={onPress}
            enabled={!disabled}
            colors={
              tintColor
                ? {
                    containerColor: tintColor,
                  }
                : undefined
            }
          >
            {content}
          </Button>
        </View>
      );
    } catch {
      // Fallback if Jetpack Compose native view manager isn't available
    }
  }

  // Graceful Android Material 3 Native Fallback for Expo Go
  const isDestructive = variant === 'destructive';
  const isTonal = variant === 'tonal' || variant === 'secondary';

  const containerColor = isDestructive
    ? tintColor || '#B3261E'
    : isTonal
    ? '#4A4458'
    : tintColor || '#6750A4';

  const contentColor = isTonal ? '#E8DEF8' : '#FFFFFF';
  const iconName = getAndroidIconName(systemImage);

  const paddingVertical = size === 'large' ? 14 : size === 'small' ? 8 : 10;
  const paddingHorizontal = size === 'large' ? 24 : size === 'small' ? 14 : 20;
  const fontSize = size === 'large' ? 15 : size === 'small' ? 13 : 14;
  const iconSize = size === 'large' ? 18 : size === 'small' ? 14 : 16;

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', borderless: false }}
      style={[
        {
          backgroundColor: containerColor,
          borderRadius: 20,
          paddingVertical,
          paddingHorizontal,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          elevation: disabled ? 0 : 2,
          opacity: disabled ? 0.38 : 1,
        },
        style,
      ]}
    >
      {iconName && (
        <MaterialIcons
          name={iconName}
          size={iconSize}
          color={contentColor}
          style={label ? { marginRight: 6 } : undefined}
        />
      )}
      {label && (
        <Text
          style={{
            color: contentColor,
            fontSize,
            fontWeight: '500',
            letterSpacing: 0.1,
          }}
        >
          {label}
        </Text>
      )}
      {children}
    </Pressable>
  );
}

export default NativeButton;
