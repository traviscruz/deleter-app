import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

interface CardVideoProps {
  uri: string;
  isInteractive?: boolean;
}

export function CardVideo({ uri, isInteractive = true }: CardVideoProps) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = false;
    if (isInteractive) {
      p.play();
    }
  });

  useEffect(() => {
    if (!player) return;
    if (isInteractive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isInteractive, player]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="contain"
        nativeControls={false}
      />
    </View>
  );
}

export default CardVideo;
