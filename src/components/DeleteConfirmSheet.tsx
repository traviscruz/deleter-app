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
const GRID_SPACING = 6;
const HORIZONTAL_PADDING = 16;
const ITEM_SIZE =
  (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - GRID_SPACING * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

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
          borderRadius: 10,
          marginBottom: GRID_SPACING,
          marginRight: GRID_SPACING,
          overflow: 'hidden',
          backgroundColor: '#1c1c1e',
          position: 'relative',
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
              bottom: 5,
              left: 5,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              borderRadius: 4,
              paddingHorizontal: 4,
              paddingVertical: 1.5,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <PlatformIcon name="play" size={8} color="#FFFFFF" style={{ marginRight: 2 }} />
            {item.duration > 0 && (
              <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '600' }}>
                {Math.floor(item.duration / 60)}:
                {Math.floor(item.duration % 60)
                  .toString()
                  .padStart(2, '0')}
              </Text>
            )}
          </View>
        )}

        {/* Minimalist Unmark Button */}
        <View
          style={{
            position: 'absolute',
            top: 5,
            right: 5,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            width: 20,
            height: 20,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PlatformIcon name="close" size={10} color="#FFFFFF" />
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
            <BlurView intensity={85} tint="systemMaterialDark" style={StyleSheet.absoluteFill} />
          )}

          {/* Minimalist Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Sheet Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.headerTitle}>Review Deletions</Text>
                {items.length > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{items.length}</Text>
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
            <PlatformPressable onPress={onCancel} style={styles.closeButton}>
              <PlatformIcon name="close" size={16} color="#FFFFFF" />
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
                paddingTop: 8,
                paddingBottom: 24,
              }}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <NativeGlassView
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <PlatformIcon name="sparkles" size={24} color="#30D158" />
              </NativeGlassView>
              <Text style={styles.emptyTitle}>No Items Marked</Text>
              <Text style={styles.emptySubtitle}>
                You have unmarked all items. None will be deleted.
              </Text>
            </View>
          )}

          {/* Bottom Action Bar */}
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
                    <PlatformIcon name="trash" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
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
                <PlatformIcon name="check" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(18, 18, 20, 0.95)' : '#141218',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  dragHandle: {
    width: 32,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    marginLeft: 8,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: 'rgba(235, 235, 245, 0.6)',
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: 'rgba(235, 235, 245, 0.55)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(18, 18, 20, 0.6)' : '#141218',
  },
  deleteButton: {
    backgroundColor: '#FF453A',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  keepAllButton: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepAllButtonText: {
    color: 'rgba(235, 235, 245, 0.55)',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default DeleteConfirmSheet;
