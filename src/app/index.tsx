import { ActionButtons } from '@/components/ActionButtons';
import { AppSplashScreen } from '@/components/AppSplashScreen';
import { CardDeck, CardDeckRef } from '@/components/CardDeck';
import { DeleteConfirmSheet } from '@/components/DeleteConfirmSheet';
import { NativeButton } from '@/components/ui/NativeButton';
import { NativeIconButton } from '@/components/ui/NativeIconButton';
import { NativeGlassView } from '@/components/ui/NativeGlassView';
import { PlatformIcon } from '@/components/ui/PlatformIcon';
import { PlatformPressable } from '@/components/ui/PlatformPressable';
import { useMediaQueue } from '@/hooks/useMediaQueue';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import React, { useRef, useState } from 'react';
import {
  Alert,
  ActionSheetIOS,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SwipeScreen() {
  const deckRef = useRef<CardDeckRef>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
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
    jumpToPickedAsset,
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

  /**
   * Native OS Delete Confirmation:
   * Uses ActionSheetIOS on iOS (the native iPhone photo deletion sheet)
   * and Alert.alert on Android.
   */
  const handleTriggerDeleteConfirmation = () => {
    if (pendingDelete.length === 0) return;

    const count = pendingDelete.length;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: `Delete ${count} ${count === 1 ? 'Item' : 'Items'}`,
          message: 'These items will be permanently removed from your photo library.',
          options: ['Cancel', `Delete ${count} ${count === 1 ? 'Item' : 'Items'}`, 'Review Trash'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleConfirmDeletion();
          } else if (buttonIndex === 2) {
            setIsReviewOpen(true);
          }
        }
      );
    } else {
      Alert.alert(
        `Delete ${count} ${count === 1 ? 'Item' : 'Items'}?`,
        'These items will be permanently removed from your photo library.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Review Items',
            style: 'default',
            onPress: () => setIsReviewOpen(true),
          },
          {
            text: `Delete (${count})`,
            style: 'destructive',
            onPress: handleConfirmDeletion,
          },
        ]
      );
    }
  };

  const handleOpenOSPhotoPicker = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const picked = result.assets[0];
        await jumpToPickedAsset(picked.assetId, picked.uri, picked.fileName ?? undefined);
      }
    } catch (error) {
      console.warn('[SwipeScreen] Failed to launch OS Photo Picker:', error);
    }
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
          {/* iOS Left Item: Standalone Native Liquid Glass Controls */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 10 }}>
            <NativeIconButton
              action="undo"
              size={44}
              iconSize={20}
              disabled={!canUndo}
              onPress={undo}
            />

            <NativeIconButton
              action="grid"
              size={44}
              iconSize={20}
              onPress={handleOpenOSPhotoPicker}
            />
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

          {/* iOS Right Item: Native Trash Button with Badge */}
          <View style={{ zIndex: 10 }}>
            <NativeIconButton
              action="trash"
              size={44}
              iconSize={20}
              badgeCount={pendingDelete.length}
              disabled={pendingDelete.length === 0}
              onPress={() => setIsReviewOpen(true)}
            />
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
              onPress={handleOpenOSPhotoPicker}
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
            <NativeIconButton
              action="trash"
              size={40}
              iconSize={20}
              badgeCount={pendingDelete.length}
              disabled={pendingDelete.length === 0}
              onPress={() => setIsReviewOpen(true)}
            />
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
                onPress={() => setIsReviewOpen(true)}
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
