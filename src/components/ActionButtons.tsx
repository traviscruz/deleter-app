import { NativeGlassView } from '@/components/ui/NativeGlassView';
import { PlatformIcon } from '@/components/ui/PlatformIcon';
import { PlatformPressable } from '@/components/ui/PlatformPressable';
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onUndo();
    }
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
      }}
    >
      {/* Optional Undo Button */}
      {onUndo && (
        <PlatformPressable
          onPress={handlePressUndo}
          disabled={!canUndo || disabled}
          activeOpacity={0.7}
          style={{
            marginRight: 24,
            opacity: !canUndo || disabled ? 0.25 : 1,
          }}
        >
          {isIOS ? (
            <NativeGlassView
              isInteractive={true}
              glassEffectStyle="clear"
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PlatformIcon name="undo" size={20} color="#FFFFFF" />
            </NativeGlassView>
          ) : (
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: '#2B2930',
                alignItems: 'center',
                justifyContent: 'center',
                elevation: 2,
              }}
            >
              <PlatformIcon name="undo" size={20} color="#E6E1E5" />
            </View>
          )}
        </PlatformPressable>
      )}

      {/* Delete "X" Button (Strokeless Pure Glass) */}
      <PlatformPressable
        onPress={handlePressDelete}
        disabled={disabled}
        activeOpacity={0.75}
        style={{
          opacity: disabled ? 0.35 : 1,
        }}
      >
        {isIOS ? (
          <NativeGlassView
            isInteractive={true}
            glassEffectStyle="clear"
            style={{
              width: 68,
              height: 68,
              borderRadius: 34,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PlatformIcon name="close" size={30} color="#FF453A" />
          </NativeGlassView>
        ) : (
          <View
            style={{
              width: 68,
              height: 68,
              borderRadius: 34,
              backgroundColor: '#2B2930',
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 4,
            }}
          >
            <PlatformIcon name="close" size={30} color="#FF5449" />
          </View>
        )}
      </PlatformPressable>

      {/* Spacing between main action buttons */}
      <View style={{ width: 36 }} />

      {/* Keep "✓" Button (Strokeless Pure Glass) */}
      <PlatformPressable
        onPress={handlePressKeep}
        disabled={disabled}
        activeOpacity={0.75}
        style={{
          opacity: disabled ? 0.35 : 1,
        }}
      >
        {isIOS ? (
          <NativeGlassView
            isInteractive={true}
            glassEffectStyle="clear"
            style={{
              width: 68,
              height: 68,
              borderRadius: 34,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PlatformIcon name="check" size={32} color="#30D158" />
          </NativeGlassView>
        ) : (
          <View
            style={{
              width: 68,
              height: 68,
              borderRadius: 34,
              backgroundColor: '#2B2930',
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 4,
            }}
          >
            <PlatformIcon name="check" size={32} color="#6CDB94" />
          </View>
        )}
      </PlatformPressable>
    </View>
  );
}

export default ActionButtons;
