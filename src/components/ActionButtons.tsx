import { NativeIconButton } from '@/components/ui/NativeIconButton';
import { isGlassEffectAvailable } from '@/services/nativeUI';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, View } from 'react-native';

interface ActionButtonsProps {
  onKeep: () => void;
  onDelete: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  disabled?: boolean;
}

export function ActionButtons({
  onKeep,
  onDelete,
  onUndo,
  canUndo = false,
  disabled = false,
}: ActionButtonsProps) {
  const isIOS = Platform.OS === 'ios';

  const handlePressDelete = () => {
    if (disabled) return;
    Haptics.impactAsync(
      isIOS ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    );
    onDelete();
  };

  const handlePressKeep = () => {
    if (disabled) return;
    Haptics.impactAsync(
      isIOS ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    );
    onKeep();
  };

  const handlePressUndo = () => {
    if (onUndo && canUndo && !disabled) {
      Haptics.impactAsync(
        isIOS ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
      );
      onUndo();
    }
  };

  const buttons = (
    <>
      {/* Undo Button */}
      {onUndo && (
        <View style={{ marginRight: 24 }}>
          <NativeIconButton
            action="undo"
            size={52}
            iconSize={22}
            disabled={!canUndo || disabled}
            onPress={handlePressUndo}
          />
        </View>
      )}

      {/* Delete "X" Button */}
      <NativeIconButton
        action="close"
        size={72}
        iconSize={32}
        disabled={disabled}
        onPress={handlePressDelete}
      />

      <View style={{ width: 28 }} />

      {/* Keep "✓" Button */}
      <NativeIconButton
        action="check"
        size={72}
        iconSize={34}
        disabled={disabled}
        onPress={handlePressKeep}
      />
    </>
  );

  const containerStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 24,
  };

  if (isIOS && isGlassEffectAvailable()) {
    try {
      const { GlassContainer } = require('expo-glass-effect');
      return (
        <GlassContainer spacing={20} style={containerStyle}>
          {buttons}
        </GlassContainer>
      );
    } catch {
      // fallback to View container
    }
  }

  return <View style={containerStyle}>{buttons}</View>;
}

export default ActionButtons;

