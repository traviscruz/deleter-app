import React from 'react';
import { Platform } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export type PlatformIconName =
  | 'check'
  | 'trash'
  | 'undo'
  | 'close'
  | 'play'
  | 'image'
  | 'grid'
  | 'lock'
  | 'sparkles'
  | 'settings';

interface PlatformIconProps {
  name: PlatformIconName;
  size?: number;
  color?: string;
  style?: any;
}

export function PlatformIcon({
  name,
  size = 20,
  color = '#ffffff',
  style,
}: PlatformIconProps) {
  const isIOS = Platform.OS === 'ios';

  switch (name) {
    case 'check':
      return isIOS ? (
        <Ionicons name="checkmark" size={size} color={color} style={style} />
      ) : (
        <MaterialIcons name="check" size={size} color={color} style={style} />
      );

    case 'trash':
      return isIOS ? (
        <Ionicons name="trash-outline" size={size} color={color} style={style} />
      ) : (
        <MaterialIcons name="delete-outline" size={size} color={color} style={style} />
      );

    case 'undo':
      return isIOS ? (
        <Ionicons name="arrow-undo" size={size} color={color} style={style} />
      ) : (
        <MaterialIcons name="undo" size={size} color={color} style={style} />
      );

    case 'close':
      return isIOS ? (
        <Ionicons name="close" size={size} color={color} style={style} />
      ) : (
        <MaterialIcons name="close" size={size} color={color} style={style} />
      );

    case 'grid':
      return isIOS ? (
        <Ionicons name="grid-outline" size={size} color={color} style={style} />
      ) : (
        <MaterialIcons name="grid-view" size={size} color={color} style={style} />
      );

    case 'play':
      return isIOS ? (
        <Ionicons name="play" size={size} color={color} style={style} />
      ) : (
        <MaterialIcons name="play-arrow" size={size} color={color} style={style} />
      );

    case 'image':
      return isIOS ? (
        <Ionicons name="image-outline" size={size} color={color} style={style} />
      ) : (
        <MaterialIcons name="photo" size={size} color={color} style={style} />
      );

    case 'lock':
      return isIOS ? (
        <Ionicons name="lock-closed-outline" size={size} color={color} style={style} />
      ) : (
        <MaterialIcons name="lock-outline" size={size} color={color} style={style} />
      );

    case 'sparkles':
      return isIOS ? (
        <Ionicons name="sparkles" size={size} color={color} style={style} />
      ) : (
        <MaterialIcons name="auto-awesome" size={size} color={color} style={style} />
      );

    case 'settings':
      return isIOS ? (
        <Ionicons name="settings-outline" size={size} color={color} style={style} />
      ) : (
        <MaterialIcons name="settings" size={size} color={color} style={style} />
      );

    default:
      return null;
  }
}

export default PlatformIcon;
