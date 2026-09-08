import React, { memo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { MediaAsset } from '@/types/media';
import { CardVideo } from '@/components/CardVideo';

interface SwipeCardProps {
  asset: MediaAsset;
  isInteractive?: boolean;
}

export const SwipeCard = memo(function SwipeCard({ asset, isInteractive = false }: SwipeCardProps) {
  const isVideo = asset.mediaType === 'video';
  const isIOS = Platform.OS === 'ios';

  return (
    <View
      style={[
        styles.shadowWrapper,
        {
          borderRadius: isIOS ? 28 : 22,
        },
        isIOS ? styles.iosShadow : styles.androidElevation,
      ]}
    >
      <View
        style={[
          styles.innerContent,
          {
            borderRadius: isIOS ? 28 : 22,
          },
        ]}
      >
        {/* Media Presentation with Real Aspect Ratio */}
        {isVideo ? (
          <CardVideo uri={asset.uri} isInteractive={isInteractive} />
        ) : (
          <Image
            source={{ uri: asset.uri }}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            priority="high"
            cachePolicy="memory-disk"
            transition={0}
          />
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  shadowWrapper: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0c0c0e',
    position: 'relative',
  },
  innerContent: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0c0c0e',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iosShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.65,
    shadowRadius: 28,
  },
  androidElevation: {
    elevation: 12,
  },
});

export default SwipeCard;
