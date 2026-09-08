import React from 'react';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { GlassContainer } from 'expo-glass-effect';
import { NativeIconButton } from '@/components/ui/NativeIconButton';

interface ActionButtonsProps {
  onKeep: () => void;
  onDelete: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  disabled?: boolean;
}

/**
 * Native iOS Action Buttons:
 * Uses Apple's legitimate native UIGlassContainerEffect (`GlassContainer`) and
 * UIGlassEffect (`GlassView` with `isInteractive={true}`) from `expo-glass-effect`.
 * Renders native Apple SF Symbols via `expo-symbols`.
 *
 * No fake JavaScript animations — interactive glass physics and fluid merging
 * are handled directly by iOS on the iPhone GPU.
 */
export function ActionButtons({
  onKeep,
  onDelete,
  onUndo,
  canUndo = false,
  disabled = false,
}: ActionButtonsProps) {
  const handlePressDelete = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDelete();
  };

  const handlePressKeep = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onKeep();
  };

  const handlePressUndo = () => {
    if (onUndo && canUndo && !disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onUndo();
    }
  };

  return (
    <GlassContainer
      spacing={20}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
      }}
    >
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

      {/* Delete "X" Button (iPhone Legitimate Native Button) */}
      <NativeIconButton
        action="close"
        size={72}
        iconSize={32}
        disabled={disabled}
        onPress={handlePressDelete}
      />

      <View style={{ width: 28 }} />

      {/* Keep "✓" Button (iPhone Legitimate Native Button) */}
      <NativeIconButton
        action="check"
        size={72}
        iconSize={34}
        disabled={disabled}
        onPress={handlePressKeep}
      />
    </GlassContainer>
  );
}

export default ActionButtons;
