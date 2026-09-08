import { PlatformIcon } from '@/components/ui/PlatformIcon';
import { PlatformPressable } from '@/components/ui/PlatformPressable';
import { getJetpackCompose } from '@/services/nativeUI';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { View } from 'react-native';

interface ActionButtonsProps {
  onKeep: () => void;
  onDelete: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  disabled?: boolean;
}

/**
 * Android Action Buttons:
 * - Uses `@expo/ui/jetpack-compose` `IconButton` when running in a development build.
 * - Falls back to Material surface + `PlatformIcon` in Expo Go.
 */
export function ActionButtons({
  onKeep,
  onDelete,
  onUndo,
  canUndo = false,
  disabled = false,
}: ActionButtonsProps) {
  const compose = getJetpackCompose();

  if (compose && compose.IconButton) {
    const { IconButton: ComposeIconButton } = compose;

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
        {/* Undo Button */}
        {onUndo && (
          <View style={{ marginRight: 20 }}>
            <ComposeIconButton
              onPress={onUndo}
              disabled={!canUndo || disabled}
              variant="bordered"
              color="#E6E1E5"
            >
              <PlatformIcon
                name="undo"
                size={20}
                color={!canUndo || disabled ? '#79747E' : '#E6E1E5'}
              />
            </ComposeIconButton>
          </View>
        )}

        {/* Delete Button (Compose Material You) */}
        <View style={{ marginRight: 20 }}>
          <ComposeIconButton
            onPress={onDelete}
            disabled={disabled}
            variant="bordered"
            color="#8C1D18"
          >
            <PlatformIcon name="close" size={28} color="#FF5449" />
          </ComposeIconButton>
        </View>

        {/* Keep Button (Compose Material You) */}
        <View>
          <ComposeIconButton
            onPress={onKeep}
            disabled={disabled}
            variant="bordered"
            color="#1B5E20"
          >
            <PlatformIcon name="check" size={30} color="#6CDB94" />
          </ComposeIconButton>
        </View>
      </View>
    );
  }

  // Graceful Native Material Fallback (Expo Go compatible)
  const handlePressDelete = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDelete();
  };

  const handlePressKeep = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      {/* Undo Button */}
      {onUndo && (
        <PlatformPressable
          onPress={handlePressUndo}
          disabled={!canUndo || disabled}
          style={{
            marginRight: 24,
            opacity: !canUndo || disabled ? 0.25 : 1,
          }}
        >
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
        </PlatformPressable>
      )}

      {/* Delete Button */}
      <PlatformPressable
        onPress={handlePressDelete}
        disabled={disabled}
        style={{
          opacity: disabled ? 0.35 : 1,
        }}
      >
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
      </PlatformPressable>

      <View style={{ width: 36 }} />

      {/* Keep Button */}
      <PlatformPressable
        onPress={handlePressKeep}
        disabled={disabled}
        style={{
          opacity: disabled ? 0.35 : 1,
        }}
      >
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
      </PlatformPressable>
    </View>
  );
}

export default ActionButtons;
