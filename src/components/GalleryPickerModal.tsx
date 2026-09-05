import React, { useState, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Platform,
  StyleSheet,
  Dimensions,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { MediaAsset } from '@/types/media';
import { PlatformPressable } from '@/components/ui/PlatformPressable';
import { PlatformIcon } from '@/components/ui/PlatformIcon';
import { NativeGlassView } from '@/components/ui/NativeGlassView';

interface GalleryPickerModalProps {
  visible: boolean;
  assets: MediaAsset[];
  currentAssetId?: string;
  onSelectAsset: (assetId: string) => void;
  onClose: () => void;
  onFetchMore?: () => void;
  isFetchingMore?: boolean;
  hasNextPage?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SPACING = 2;

export function GalleryPickerModal({
  visible,
  assets,
  currentAssetId,
  onSelectAsset,
  onClose,
  onFetchMore,
  isFetchingMore = false,
  hasNextPage = false,
}: GalleryPickerModalProps) {
  const isIOS = Platform.OS === 'ios';
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  // Column Density state: 3 (Standard), 4 (Compact), 5 (Minimized)
  const [columns, setColumns] = useState<3 | 4 | 5>(4);

  // Fast Scrubber state
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubY, setScrubY] = useState(0);
  const [scrubDate, setScrubDate] = useState<string>('');
  const [scrubIndex, setScrubIndex] = useState<number>(0);
  const trackHeightRef = useRef<number>(400);

  const itemSize = (SCREEN_WIDTH - GRID_SPACING * (columns - 1)) / columns;

  const handleSelect = useCallback(
    (assetId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelectAsset(assetId);
      onClose();
    },
    [onSelectAsset, onClose]
  );

  const cycleColumns = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setColumns((prev) => (prev === 3 ? 4 : prev === 4 ? 5 : 3));
  };

  // Fast Scrubber PanResponder
  const updateScrubber = (pageY: number) => {
    if (assets.length === 0) return;

    const trackTop = 130 + insets.top;
    const relativeY = Math.max(0, Math.min(trackHeightRef.current, pageY - trackTop));
    const ratio = relativeY / trackHeightRef.current;
    const targetIdx = Math.max(0, Math.min(assets.length - 1, Math.floor(ratio * (assets.length - 1))));

    setScrubY(relativeY);
    setScrubIndex(targetIdx + 1);

    const asset = assets[targetIdx];
    if (asset) {
      const dateStr = new Date(asset.creationTime).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      });
      setScrubDate(dateStr);
    }

    try {
      flatListRef.current?.scrollToIndex({
        index: targetIdx,
        animated: false,
        viewPosition: 0.5,
      });
    } catch {
      // Fallback if index not yet laid out
      const approxOffset = (targetIdx / columns) * (itemSize + GRID_SPACING);
      flatListRef.current?.scrollToOffset({ offset: approxOffset, animated: false });
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsScrubbing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        updateScrubber(evt.nativeEvent.pageY);
      },
      onPanResponderMove: (evt) => {
        updateScrubber(evt.nativeEvent.pageY);
      },
      onPanResponderRelease: () => {
        setIsScrubbing(false);
      },
      onPanResponderTerminate: () => {
        setIsScrubbing(false);
      },
    })
  ).current;

  const renderItem = useCallback(
    ({ item, index }: { item: MediaAsset; index: number }) => {
      const isCurrent = item.id === currentAssetId;

      return (
        <PlatformPressable
          onPress={() => handleSelect(item.id)}
          activeOpacity={0.75}
          style={{
            width: itemSize,
            height: itemSize,
            marginBottom: GRID_SPACING,
            marginRight: (index + 1) % columns === 0 ? 0 : GRID_SPACING,
            backgroundColor: '#1c1c1e',
            position: 'relative',
            borderWidth: isCurrent ? 2 : 0,
            borderColor: '#30D158',
          }}
        >
          <Image
            source={{ uri: item.uri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={0}
          />

          {/* Minimalist Current Indicator (Subtle Emerald Corner Badge) */}
          {isCurrent && (
            <View style={styles.currentBadge}>
              <PlatformIcon name="check" size={10} color="#000000" />
            </View>
          )}

          {/* Video Duration Badge */}
          {item.mediaType === 'video' && (
            <View style={styles.videoPill}>
              <PlatformIcon name="play" size={7} color="#FFFFFF" style={{ marginRight: 2 }} />
              {item.duration > 0 && (
                <Text style={styles.videoDurationText}>
                  {Math.floor(item.duration / 60)}:
                  {Math.floor(item.duration % 60)
                    .toString()
                    .padStart(2, '0')}
                </Text>
              )}
            </View>
          )}
        </PlatformPressable>
      );
    },
    [columns, itemSize, currentAssetId, handleSelect]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.sheetContainer,
            { marginTop: Math.max(insets.top + 10, 44) },
          ]}
        >
          {isIOS && (
            <BlurView intensity={90} tint="systemMaterialDark" style={StyleSheet.absoluteFill} />
          )}

          {/* Material 3 Drag Handle on Android */}
          {!isIOS && (
            <View style={styles.androidDragHandle} />
          )}

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, !isIOS && { fontSize: 20, fontWeight: '500' }]}>
                Jump to Photo
              </Text>
              <Text style={styles.headerSubtitle}>
                {assets.length} photos & videos • Tap to jump
              </Text>
            </View>

            {/* Density / Zoom Toggle Button */}
            <PlatformPressable
              onPress={cycleColumns}
              style={styles.densityButton}
            >
              <Text style={styles.densityButtonText}>{columns}x</Text>
            </PlatformPressable>

            {/* Close Button */}
            <PlatformPressable
              onPress={onClose}
              style={[styles.closeButton, !isIOS && { backgroundColor: '#2B2930' }]}
            >
              <PlatformIcon name="close" size={18} color="#FFFFFF" />
            </PlatformPressable>
          </View>

          {/* Main Grid View Area with Fast Scrubber */}
          <View
            style={{ flex: 1, position: 'relative' }}
            onLayout={(e) => {
              trackHeightRef.current = Math.max(200, e.nativeEvent.layout.height - 40);
            }}
          >
            <FlatList
              ref={flatListRef}
              data={assets}
              key={columns} // Force re-render on column layout change
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              numColumns={columns}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: Math.max(insets.bottom + 24, 36),
              }}
              onEndReachedThreshold={0.5}
              onEndReached={() => {
                if (hasNextPage && !isFetchingMore && onFetchMore) {
                  onFetchMore();
                }
              }}
              onScrollToIndexFailed={(info) => {
                const approxOffset = (info.index / columns) * (itemSize + GRID_SPACING);
                flatListRef.current?.scrollToOffset({ offset: approxOffset, animated: false });
              }}
              ListFooterComponent={
                isFetchingMore ? (
                  <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                    <ActivityIndicator color={isIOS ? '#30D158' : '#6CDB94'} />
                  </View>
                ) : null
              }
            />

            {/* Draggable Fast Scrubber Track */}
            {assets.length > 15 && (
              <View
                style={styles.scrubberRail}
                {...panResponder.panHandlers}
              >
                {/* Visual Track Line */}
                <View style={styles.trackLine} />

                {/* Draggable Thumb */}
                <View
                  style={[
                    styles.scrubberThumb,
                    {
                      top: Math.max(0, Math.min(trackHeightRef.current, scrubY)),
                      backgroundColor: isScrubbing ? '#30D158' : 'rgba(255, 255, 255, 0.4)',
                    },
                  ]}
                />
              </View>
            )}

            {/* Floating Date Bubble Tooltip while Scrubbing */}
            {isScrubbing && (
              <View
                pointerEvents="none"
                style={[
                  styles.scrubBubble,
                  {
                    top: Math.max(10, Math.min(trackHeightRef.current - 20, scrubY)),
                  },
                ]}
              >
                <Text style={styles.scrubBubbleDate}>{scrubDate || 'Scrubbing'}</Text>
                <Text style={styles.scrubBubbleCount}>{scrubIndex} / {assets.length}</Text>
              </View>
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
    backgroundColor: Platform.OS === 'ios' ? 'rgba(20, 20, 24, 0.94)' : '#1E1F24',
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: 'rgba(235, 235, 245, 0.6)',
    fontSize: 12,
    marginTop: 1,
  },
  densityButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  densityButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#30D158',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 3,
  },
  videoPill: {
    position: 'absolute',
    bottom: 3,
    left: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoDurationText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
  },
  scrubberRail: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 40,
  },
  trackLine: {
    width: 3,
    height: '92%',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 1.5,
  },
  scrubberThumb: {
    position: 'absolute',
    right: 10,
    width: 16,
    height: 32,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  scrubBubble: {
    position: 'absolute',
    right: 44,
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 50,
  },
  scrubBubbleDate: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scrubBubbleCount: {
    color: 'rgba(235, 235, 245, 0.6)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
});

export default GalleryPickerModal;
