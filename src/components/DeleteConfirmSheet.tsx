import React from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Platform,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { MediaAsset } from '@/types/media';
import { PlatformPressable } from '@/components/ui/PlatformPressable';
import { PlatformIcon } from '@/components/ui/PlatformIcon';
import { NativeGlassView } from '@/components/ui/NativeGlassView';

interface DeleteConfirmSheetProps {
  visible: boolean;
  items: MediaAsset[];
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  onUnmarkItem: (id: string) => void;
  onUnmarkAll?: () => void;
  isDeleting?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const GRID_SPACING = 8;
const HORIZONTAL_PADDING = 16;
const ITEM_SIZE = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - GRID_SPACING * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

export function DeleteConfirmSheet({
  visible,
  items,
  onConfirm,
  onCancel,
  onUnmarkItem,
  onUnmarkAll,
  isDeleting = false,
}: DeleteConfirmSheetProps) {
  const isIOS = Platform.OS === 'ios';
  const insets = useSafeAreaInsets();

  const handleToggleItem = (assetId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUnmarkItem(assetId);
  };

  const renderItem = ({ item }: { item: MediaAsset }) => {
    return (
      <PlatformPressable
        onPress={() => handleToggleItem(item.id)}
        activeOpacity={0.8}
        style={{
          width: ITEM_SIZE,
          height: ITEM_SIZE,
          borderRadius: 14,
          marginBottom: GRID_SPACING,
          marginRight: GRID_SPACING,
          overflow: 'hidden',
          backgroundColor: '#1c1c1e',
          position: 'relative',
          borderWidth: 1.5,
          borderColor: 'rgba(255, 69, 58, 0.4)',
        }}
      >
        <Image
          source={{ uri: item.uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={0}
        />

        {/* Video Duration Badge */}
        {item.mediaType === 'video' && (
          <View
            style={{
              position: 'absolute',
              bottom: 6,
              left: 6,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              borderRadius: 6,
              paddingHorizontal: 5,
              paddingVertical: 2,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <PlatformIcon name="play" size={8} color="#FFFFFF" style={{ marginRight: 3 }} />
            {item.duration > 0 && (
              <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>
                {Math.floor(item.duration / 60)}:
                {Math.floor(item.duration % 60)
                  .toString()
                  .padStart(2, '0')}
              </Text>
            )}
          </View>
        )}

        {/* Delete Tag Pill / Unmark Button */}
        <View
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            backgroundColor: '#FF453A',
            width: 24,
            height: 24,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
            elevation: 3,
          }}
        >
          <PlatformIcon name="trash" size={12} color="#FFFFFF" />
        </View>
      </PlatformPressable>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.sheetContainer,
            { marginTop: Math.max(insets.top + 12, 48) },
          ]}
        >
          {isIOS && (
            <BlurView intensity={90} tint="systemMaterialDark" style={StyleSheet.absoluteFill} />
          )}

          {/* Material 3 Drag Handle on Android */}
          {!isIOS && (
            <View style={styles.androidDragHandle} />
          )}

          {/* Sheet Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.headerTitle, !isIOS && { fontSize: 22, fontWeight: '500' }]}>
                  Review Deletions
                </Text>
                {items.length > 0 && (
                  <View style={[styles.countBadge, !isIOS && { backgroundColor: '#8C1D18', borderColor: '#FFB4AB' }]}>
                    <Text style={[styles.countBadgeText, !isIOS && { color: '#FFDAD6' }]}>{items.length}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.headerSubtitle}>
                {items.length > 0
                  ? 'Tap any item to remove it from the delete list and keep it.'
                  : 'All items have been removed from the delete list.'}
              </Text>
            </View>

            {/* Close Button */}
            <PlatformPressable
              onPress={onCancel}
              style={[styles.closeButton, !isIOS && { backgroundColor: '#2B2930' }]}
            >
              <PlatformIcon name="close" size={18} color="#FFFFFF" />
            </PlatformPressable>
          </View>

          {/* Grid Content */}
          {items.length > 0 ? (
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              numColumns={COLUMN_COUNT}
              contentContainerStyle={{
                paddingHorizontal: HORIZONTAL_PADDING,
                paddingTop: 12,
                paddingBottom: 24,
              }}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <NativeGlassView
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <PlatformIcon name="sparkles" size={28} color="#30D158" />
              </NativeGlassView>
              <Text style={styles.emptyTitle}>No Items Marked</Text>
              <Text style={styles.emptySubtitle}>
                You have unmarked all items. None will be deleted.
              </Text>
            </View>
          )}

          {/* Bottom Action Bar extending all the way to screen bottom edge */}
          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom + 8, 20) }]}>
            {items.length > 0 ? (
              <PlatformPressable
                onPress={onConfirm}
                disabled={isDeleting}
                style={styles.deleteButton}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <PlatformIcon name="trash" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.deleteButtonText}>
                      Delete {items.length} {items.length === 1 ? 'Item' : 'Items'}
                    </Text>
                  </>
                )}
              </PlatformPressable>
            ) : (
              <PlatformPressable
                onPress={onCancel}
                style={[styles.deleteButton, { backgroundColor: '#30D158' }]}
              >
                <PlatformIcon name="check" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.deleteButtonText}>Done</Text>
              </PlatformPressable>
            )}

            {items.length > 0 && onUnmarkAll && (
              <PlatformPressable
                onPress={onUnmarkAll}
                disabled={isDeleting}
                style={styles.keepAllButton}
              >
                <Text style={styles.keepAllButtonText}>Keep All & Cancel</Text>
              </PlatformPressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(24, 24, 27, 0.94)' : '#1E1F24',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  androidDragHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#79747E',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  countBadge: {
    backgroundColor: 'rgba(255, 69, 58, 0.25)',
    borderColor: 'rgba(255, 69, 58, 0.6)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  countBadgeText: {
    color: '#FF453A',
    fontSize: 12,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(235, 235, 245, 0.65)',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: 'rgba(235, 235, 245, 0.6)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(24, 24, 27, 0.7)' : '#1E1F24',
  },
  deleteButton: {
    backgroundColor: '#FF453A',
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#FF453A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  keepAllButton: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepAllButtonText: {
    color: 'rgba(235, 235, 245, 0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default DeleteConfirmSheet;
