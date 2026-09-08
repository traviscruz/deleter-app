import { PlatformIcon, PlatformIconName } from '@/components/ui/PlatformIcon';
import { PlatformPressable } from '@/components/ui/PlatformPressable';
import { getGlassEffect, getJetpackCompose, getSwiftUI } from '@/services/nativeUI';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { SFSymbol, SymbolView } from 'expo-symbols';
import React, { useMemo } from 'react';
import { Platform, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

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
 * - iOS dev build: SwiftUI glass button → GlassView → BlurView fallback
 * - iOS Expo Go: BlurView + PlatformPressable (no expo-glass-effect native modules touched)
 * - Android: Jetpack Compose IconButton or Material 3 fallback
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
  // getGlassEffect() is null in Expo Go — safe, no native crash.
  const glassEffect = useMemo(() => (isIOS ? getGlassEffect() : null), [isIOS]);

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

  if (isIOS) {
    // 1. iOS 26+: Real Apple Native Liquid Glass Button (GlassView + SF Symbols)
    // Uses iPhone GPU for interactive glass physics and fluid merging with GlassContainer
    if (glassEffect && glassEffect.GlassView) {
      const { GlassView } = glassEffect;
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

    // 2. iOS dev build fallback: SwiftUI Button
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

    // 3. Expo Go / older iOS fallback: BlurView + PlatformPressable — safe with no native crash
    return (
      <View style={[{ width: size, height: size }, style]}>
        <PlatformPressable
          onPress={handlePress}
          disabled={disabled}
          activeOpacity={0.7}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: 'hidden',
            backgroundColor: config.isDestructive
              ? 'rgba(255, 69, 58, 0.2)'
              : action === 'check'
              ? 'rgba(48, 209, 88, 0.2)'
              : 'rgba(28, 28, 30, 0.75)',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: disabled ? 0.25 : 1,
          }}
        >
          <BlurView intensity={80} tint="systemMaterialDark" style={StyleSheet.absoluteFill} />
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
        </PlatformPressable>
        {renderBadge()}
      </View>
    );
  }

  // 4. Android: Jetpack Compose IconButton
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

  // 5. Android Native Material 3 Fallback
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
