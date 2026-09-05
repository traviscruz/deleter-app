import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

interface CardVideoProps {
  uri: string;
  isInteractive?: boolean;
}

export function CardVideo({ uri, isInteractive = true }: CardVideoProps) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = false; // Audio enabled
    p.volume = 1.0;
    if (isInteractive) {
      p.play();
    } else {
      p.pause();
    }
  });

  useEffect(() => {
    if (!player) return;
    if (isInteractive) {
      player.muted = false;
      player.volume = 1.0;
      player.play();
    } else {
      player.pause();
    }
  }, [isInteractive, player]);

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="contain"
      nativeControls={false}
    />
  );
}

export default CardVideo;
