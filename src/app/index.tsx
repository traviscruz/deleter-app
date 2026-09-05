import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Platform,
  Alert,
  StatusBar,
  StyleSheet,
} from 'react-native';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMediaQueue } from '@/hooks/useMediaQueue';
import { CardDeck, CardDeckRef } from '@/components/CardDeck';
import { ActionButtons } from '@/components/ActionButtons';
import { DeleteConfirmSheet } from '@/components/DeleteConfirmSheet';
import { GalleryPickerModal } from '@/components/GalleryPickerModal';
import { AppSplashScreen } from '@/components/AppSplashScreen';
import { NativeGlassView } from '@/components/ui/NativeGlassView';
import { NativeButton } from '@/components/ui/NativeButton';
import { PlatformPressable } from '@/components/ui/PlatformPressable';
import { PlatformIcon } from '@/components/ui/PlatformIcon';

export default function SwipeScreen() {
  const deckRef = useRef<CardDeckRef>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);

  const isIOS = Platform.OS === 'ios';

  const {
    assets,
    currentIndex,
    currentAsset,
    nextAssets,
    trashAssets,
    pendingDelete,
    keepCount,
    isLoading,
    isFetchingMore,
    hasNextPage,
    cursor,
    isEmpty,
    canUndo,
    hasPermission,
    markDelete,
    markKeep,
    undo,
    unmarkDelete,
    unmarkAllDelete,
    jumpToAssetId,
    fetchNextPage,
    commitDeletes,
    requestPermissions,
  } = useMediaQueue();

  const isAppReady = !isLoading || !!currentAsset || isEmpty || hasPermission === false;

  const handleButtonDelete = () => {
    if (deckRef.current) {
      deckRef.current.swipeLeft();
    } else if (currentAsset) {
      markDelete(currentAsset.id);
    }
  };

  const handleButtonKeep = () => {
    if (deckRef.current) {
      deckRef.current.swipeRight();
    } else if (currentAsset) {
      markKeep(currentAsset.id);
    }
  };

  const handleConfirmDeletion = async () => {
    try {
      setIsDeleting(true);
      await commitDeletes();
      setIsReviewOpen(false);
    } catch (error) {
      console.error('Failed to commit deletions:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenDeleteConfirmation = () => {
    if (pendingDelete.length === 0) return;
    setIsReviewOpen(true);
  };

  const handleOpenSettings = async () => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.alert('Photo permissions are managed in your browser or device settings.');
        }
      } else {
        await Linking.openSettings();
      }
    } catch (err) {
      console.warn('Failed to open settings:', err);
    }
  };

  // State: Permission Denied
  if (hasPermission === false) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: isIOS ? '#000000' : '#141218',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 32,
        }}
      >
        <StatusBar
          barStyle="light-content"
          translucent={isIOS}
          backgroundColor={isIOS ? 'transparent' : '#141218'}
        />
        <NativeGlassView
          style={{
            width: 76,
            height: 76,
            borderRadius: isIOS ? 26 : 18,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <PlatformIcon name="lock" size={30} color="#e4e4e7" />
        </NativeGlassView>
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 24,
            fontWeight: '700',
            textAlign: 'center',
            letterSpacing: -0.5,
            marginBottom: 8,
          }}
        >
          Photo Access Needed
        </Text>
        <Text
          style={{
            color: '#A1A1AA',
            fontSize: 14,
            textAlign: 'center',
            marginBottom: 32,
            lineHeight: 24,
            maxWidth: 280,
          }}
        >
          Deleter needs access to your gallery to help you review and clean up photos and videos.
        </Text>
        <NativeButton
          label="Open Settings"
          size="large"
          variant="primary"
          onPress={handleOpenSettings}
          style={{ width: '100%' }}
        />
        <NativeButton
          label="Try Again"
          size="regular"
          variant="secondary"
          onPress={() => requestPermissions()}
          style={{ width: '100%', marginTop: 12 }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: isIOS ? '#000000' : '#141218',
        justifyContent: 'space-between',
      }}
    >
      {/* Platform-Adapted Status Bar */}
      <StatusBar
        barStyle="light-content"
        translucent={isIOS}
        backgroundColor={isIOS ? 'transparent' : '#141218'}
      />

      {/* Top Navigation Bar / Top App Bar */}
      {isIOS ? (
        /* iOS Navigation Bar */
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: 4,
            paddingBottom: 8,
            zIndex: 30,
            position: 'relative',
            minHeight: 52,
          }}
        >
          {/* iOS Left Item: Undo & Gallery Grid Buttons */}
          <View style={{ flexDirection: 'row', alignItems: 'center', zIndex: 10 }}>
            <PlatformPressable
              onPress={undo}
              disabled={!canUndo}
              activeOpacity={0.7}
              style={{
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: canUndo ? 1 : 0.25,
                marginRight: 6,
              }}
            >
              <NativeGlassView
                isInteractive={true}
                glassEffectStyle="clear"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PlatformIcon name="undo" size={20} color="#FFFFFF" />
              </NativeGlassView>
            </PlatformPressable>

            <PlatformPressable
              onPress={() => setIsPickerOpen(true)}
              activeOpacity={0.7}
              style={{
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <NativeGlassView
                isInteractive={true}
                glassEffectStyle="clear"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PlatformIcon name="grid" size={19} color="#FFFFFF" />
              </NativeGlassView>
            </PlatformPressable>
          </View>

          {/* Absolutely Centered: Filename & Date (outside card) */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 100,
              zIndex: 5,
            }}
          >
            {currentAsset ? (
              <>
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: '600',
                    letterSpacing: -0.2,
                    textAlign: 'center',
                  }}
                  numberOfLines={1}
                >
                  {currentAsset.filename || (currentAsset.mediaType === 'video' ? 'Video' : 'Photo')}
                </Text>
                <Text
                  style={{
                    color: 'rgba(235, 235, 245, 0.6)',
                    fontSize: 11,
                    fontWeight: '400',
                    marginTop: 1,
                    textAlign: 'center',
                  }}
                >
                  {new Date(currentAsset.creationTime).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {currentAsset.mediaType === 'video' && currentAsset.duration > 0
                    ? ` • ${Math.floor(currentAsset.duration / 60)}:${Math.floor(
                        currentAsset.duration % 60
                      )
                        .toString()
                        .padStart(2, '0')}`
                    : ''}
                </Text>
              </>
            ) : (
              <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '600', textAlign: 'center' }}>
                Deleter
              </Text>
            )}
          </View>

          {/* iOS Right Item: Delete Counter Pill */}
          <View style={{ zIndex: 10 }}>
            {pendingDelete.length > 0 ? (
              <PlatformPressable
                onPress={handleOpenDeleteConfirmation}
                activeOpacity={0.7}
                style={{
                  height: 42,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 69, 58, 0.2)',
                  borderColor: 'rgba(255, 69, 58, 0.5)',
                  borderWidth: StyleSheet.hairlineWidth,
                  borderRadius: 21,
                  paddingHorizontal: 14,
                }}
              >
                <PlatformIcon name="trash" size={15} color="#FF453A" style={{ marginRight: 5 }} />
                <Text style={{ color: '#FF453A', fontSize: 14, fontWeight: '700' }}>
                  {pendingDelete.length}
                </Text>
              </PlatformPressable>
            ) : (
              <View style={{ width: 44, height: 44 }} />
            )}
          </View>
        </View>
      ) : (
        /* Android Material 3 Top App Bar */
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#141218',
            elevation: 2,
            paddingHorizontal: 12,
            paddingVertical: 8,
            zIndex: 30,
            position: 'relative',
            minHeight: 52,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', zIndex: 10 }}>
            <PlatformPressable
              onPress={undo}
              disabled={!canUndo}
              rippleBorderless
              rippleColor="rgba(255, 255, 255, 0.15)"
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 4,
              }}
            >
              <PlatformIcon name="undo" size={20} color={canUndo ? '#E6E1E5' : '#49454F'} />
            </PlatformPressable>

            <PlatformPressable
              onPress={() => setIsPickerOpen(true)}
              rippleBorderless
              rippleColor="rgba(255, 255, 255, 0.15)"
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PlatformIcon name="grid" size={20} color="#E6E1E5" />
            </PlatformPressable>
          </View>

          {/* Absolutely Centered: Filename & Date (Android) */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 96,
              zIndex: 5,
            }}
          >
            {currentAsset ? (
              <>
                <Text
                  style={{
                    color: '#E6E1E5',
                    fontSize: 15,
                    fontWeight: '500',
                    textAlign: 'center',
                  }}
                  numberOfLines={1}
                >
                  {currentAsset.filename || (currentAsset.mediaType === 'video' ? 'Video' : 'Photo')}
                </Text>
                <Text style={{ color: '#CAC4D0', fontSize: 11, textAlign: 'center', marginTop: 1 }}>
                  {new Date(currentAsset.creationTime).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {currentAsset.mediaType === 'video' && currentAsset.duration > 0
                    ? ` • ${Math.floor(currentAsset.duration / 60)}:${Math.floor(
                        currentAsset.duration % 60
                      )
                        .toString()
                        .padStart(2, '0')}`
                    : ''}
                </Text>
              </>
            ) : (
              <Text style={{ color: '#E6E1E5', fontSize: 16, fontWeight: '500', textAlign: 'center' }}>
                Deleter
              </Text>
            )}
          </View>

          <View style={{ zIndex: 10 }}>
            {pendingDelete.length > 0 ? (
              <PlatformPressable
                onPress={handleOpenDeleteConfirmation}
                rippleBorderless
                rippleColor="rgba(255, 255, 255, 0.2)"
                style={{
                  height: 40,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#8C1D18',
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  elevation: 1,
                }}
              >
                <PlatformIcon name="trash" size={16} color="#FFDAD6" style={{ marginRight: 6 }} />
                <Text style={{ color: '#FFDAD6', fontSize: 13, fontWeight: '600' }}>
                  {pendingDelete.length}
                </Text>
              </PlatformPressable>
            ) : (
              <View style={{ width: 44, height: 44 }} />
            )}
          </View>
        </View>
      )}

      {/* Main Card Deck Container */}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 12,
          paddingVertical: 4,
          position: 'relative',
        }}
      >
        {isEmpty ? (
          /* Empty State View */
          <NativeGlassView
            style={{
              borderRadius: isIOS ? 28 : 24,
              overflow: 'hidden',
              padding: 32,
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              maxWidth: 340,
            }}
          >
            <View
              style={{
                backgroundColor: isIOS ? 'rgba(48, 209, 88, 0.15)' : '#2E6A44',
                width: 64,
                height: 64,
                borderRadius: isIOS ? 32 : 20,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <PlatformIcon name="sparkles" size={32} color={isIOS ? '#30D158' : '#6CDB94'} />
            </View>
            <Text style={{ color: isIOS ? '#FFFFFF' : '#E6E1E5', fontSize: 20, fontWeight: isIOS ? '700' : '500', letterSpacing: -0.3, marginBottom: 6 }}>
              All Caught Up
            </Text>
            <Text style={{ color: isIOS ? 'rgba(235, 235, 245, 0.6)' : '#CAC4D0', fontSize: 13, textAlign: 'center', lineHeight: 18, marginBottom: 24 }}>
              You have reviewed your latest photos and videos.
            </Text>
            {pendingDelete.length > 0 ? (
              <NativeButton
                label={`Delete ${pendingDelete.length} Selected ${pendingDelete.length === 1 ? 'Item' : 'Items'}`}
                systemImage="trash"
                role="destructive"
                variant="destructive"
                size="large"
                onPress={handleOpenDeleteConfirmation}
                style={{ width: '100%' }}
              />
            ) : (
              <View
                style={{
                  backgroundColor: isIOS ? 'rgba(255, 255, 255, 0.1)' : '#2B2930',
                  borderRadius: isIOS ? 999 : 12,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <PlatformIcon name="check" size={14} color="#30D158" style={{ marginRight: 6 }} />
                <Text style={{ color: isIOS ? 'rgba(235, 235, 245, 0.8)' : '#CAC4D0', fontSize: 12, fontWeight: '500' }}>
                  Gallery is clean
                </Text>
              </View>
            )}
          </NativeGlassView>
        ) : (
          currentAsset && (
            <CardDeck
              ref={deckRef}
              currentAsset={currentAsset}
              nextAssets={nextAssets}
              onSwipeLeft={markDelete}
              onSwipeRight={markKeep}
            />
          )
        )}

        {/* Floating Action Buttons directly in Front / on Top of the Image */}
        {!isEmpty && currentAsset && (
          <View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              bottom: 20,
              left: 0,
              right: 0,
              alignItems: 'center',
              zIndex: 50,
            }}
          >
            <ActionButtons
              onDelete={handleButtonDelete}
              onKeep={handleButtonKeep}
              disabled={isEmpty || !currentAsset}
            />
          </View>
        )}
      </View>

      {/* Review & Delete Confirmation Sheet */}
      <DeleteConfirmSheet
        visible={isReviewOpen}
        items={trashAssets}
        onConfirm={handleConfirmDeletion}
        onCancel={() => setIsReviewOpen(false)}
        onUnmarkItem={unmarkDelete}
        onUnmarkAll={() => {
          unmarkAllDelete();
          setIsReviewOpen(false);
        }}
        isDeleting={isDeleting}
      />

      {/* Gallery / Jump-To Picker Modal */}
      <GalleryPickerModal
        visible={isPickerOpen}
        assets={assets}
        currentAssetId={currentAsset?.id}
        onSelectAsset={jumpToAssetId}
        onClose={() => setIsPickerOpen(false)}
        onFetchMore={() => fetchNextPage(cursor)}
        isFetchingMore={isFetchingMore}
        hasNextPage={hasNextPage}
      />

      {/* App Opening Splash Screen */}
      {splashVisible && (
        <AppSplashScreen
          isReady={isAppReady}
          onFinish={() => setSplashVisible(false)}
        />
      )}
    </SafeAreaView>
  );
}
