import React from 'react';
import { View, Text, Platform, StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SymbolView, SFSymbol } from 'expo-symbols';
import { GlassView } from 'expo-glass-effect';
import { getSwiftUI, getJetpackCompose } from '@/services/nativeUI';
import { PlatformPressable } from '@/components/ui/PlatformPressable';
import { PlatformIcon, PlatformIconName } from '@/components/ui/PlatformIcon';

export type NativeIconAction = 'undo' | 'grid' | 'close' | 'check' | 'trash';

export interface NativeIconButtonProps {
  action: NativeIconAction;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
  iconSize?: number;
  tintColor?: string;
  role?: 'default' | 'destructive';
  style?: StyleProp<ViewStyle>;
  label?: string;
  badgeCount?: number;
}

const ACTION_CONFIG: Record<
  NativeIconAction,
  {
    sfSymbol: SFSymbol;
    platformIcon: PlatformIconName;
    defaultLabel: string;
    iosColor: string;
    androidColor: string;
    isDestructive?: boolean;
  }
> = {
  undo: {
    sfSymbol: 'arrow.uturn.backward',
    platformIcon: 'undo',
    defaultLabel: 'Undo',
    iosColor: '#FFFFFF',
    androidColor: '#E6E1E5',
  },
  grid: {
    sfSymbol: 'square.grid.2x2',
    platformIcon: 'grid',
    defaultLabel: 'Photo Library',
    iosColor: '#FFFFFF',
    androidColor: '#E6E1E5',
  },
  close: {
    sfSymbol: 'xmark',
    platformIcon: 'close',
    defaultLabel: 'Delete',
    iosColor: '#FF453A',
    androidColor: '#FF5449',
    isDestructive: true,
  },
  check: {
    sfSymbol: 'checkmark',
    platformIcon: 'check',
    defaultLabel: 'Keep',
    iosColor: '#30D158',
    androidColor: '#6CDB94',
  },
  trash: {
    sfSymbol: 'trash',
    platformIcon: 'trash',
    defaultLabel: 'Trash',
    iosColor: '#FF453A',
    androidColor: '#FF5449',
    isDestructive: true,
  },
};

/**
 * Native OS Icon Button:
 * - On iOS: Renders native GlassView (UIGlassEffect with isInteractive={true}) + native Apple SF Symbols (SymbolView).
 *   No custom JavaScript animations — native iOS 26 Liquid Glass optics and touch handling.
 * - On Android: Renders Jetpack Compose Material You IconButton or Material 3 container with dynamic ripple.
 */
export function NativeIconButton({
  action,
  onPress,
  disabled = false,
  size = 44,
  iconSize = 20,
  tintColor,
  role,
  style,
  label,
  badgeCount,
}: NativeIconButtonProps) {
  const isIOS = Platform.OS === 'ios';
  const config = ACTION_CONFIG[action];
  const effectiveRole = role || (config.isDestructive ? 'destructive' : 'default');
  const effectiveLabel = label || config.defaultLabel;
  const effectiveColor = tintColor || (isIOS ? config.iosColor : config.androidColor);

  const handlePress = () => {
    if (disabled) return;
    if (isIOS) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  const renderBadge = () => {
    if (badgeCount == null || badgeCount <= 0) return null;
    return (
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -2,
          right: -4,
          backgroundColor: '#FF453A',
          borderRadius: 999,
          minWidth: 18,
          height: 18,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 4,
          borderWidth: 1.5,
          borderColor: isIOS ? '#000000' : '#141218',
          zIndex: 99,
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>
          {badgeCount > 99 ? '99+' : badgeCount}
        </Text>
      </View>
    );
  };

  // 1. iOS: Real iPhone Native SwiftUI Button
  if (isIOS) {
    const swiftUI = getSwiftUI();
    if (swiftUI) {
      const { Button } = swiftUI.ui;
      const { buttonStyle, controlSize, tint, labelStyle, disabled: disabledModifier } =
        swiftUI.modifiers;

      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <Button
            label={effectiveLabel}
            systemImage={config.sfSymbol}
            role={effectiveRole}
            onPress={handlePress}
            modifiers={[
              buttonStyle('glass'),
              controlSize(size >= 60 ? 'large' : size <= 44 ? 'small' : 'regular'),
              labelStyle('iconOnly'),
              tint(effectiveColor),
              ...(disabled ? [disabledModifier(true)] : []),
            ]}
          />
          {renderBadge()}
        </View>
      );
    }

    // iOS Native Liquid Glass using iPhone's native GlassView
    return (
      <View style={[{ width: size, height: size }, style]}>
        <GlassView
          isInteractive={true}
          glassEffectStyle="clear"
          onTouchEnd={disabled ? undefined : handlePress}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: disabled ? 0.25 : 1,
          }}
        >
          <SymbolView
            name={config.sfSymbol}
            size={iconSize}
            tintColor={effectiveColor}
            weight="semibold"
            fallback={
              <PlatformIcon
                name={config.platformIcon}
                size={iconSize}
                color={effectiveColor}
              />
            }
          />
        </GlassView>
        {renderBadge()}
      </View>
    );
  }

  // 3. Android: Check for @expo/ui/jetpack-compose IconButton
  const compose = getJetpackCompose();
  if (compose && compose.IconButton) {
    const { IconButton: ComposeIconButton } = compose;

    return (
      <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
        <ComposeIconButton
          onPress={handlePress}
          disabled={disabled}
          variant="bordered"
          color={effectiveColor}
        >
          <PlatformIcon
            name={config.platformIcon}
            size={iconSize}
            color={effectiveColor}
          />
        </ComposeIconButton>
        {renderBadge()}
      </View>
    );
  }

  // 4. Android Native Material 3 Fallback
  return (
    <View style={[{ width: size, height: size }, style]}>
      <PlatformPressable
        onPress={handlePress}
        disabled={disabled}
        rippleBorderless
        rippleColor="rgba(255, 255, 255, 0.2)"
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#2B2930',
          alignItems: 'center',
          justifyContent: 'center',
          elevation: size >= 60 ? 4 : 2,
          opacity: disabled ? 0.38 : 1,
        }}
      >
        <PlatformIcon
          name={config.platformIcon}
          size={iconSize}
          color={effectiveColor}
        />
      </PlatformPressable>
      {renderBadge()}
    </View>
  );
}

export default NativeIconButton;
