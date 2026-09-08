import type { Asset, MediaTypeValue } from 'expo-media-library';

export interface MediaAsset {
  id: string;
  uri: string;
  mediaType: MediaTypeValue;
  duration: number;
  creationTime: number;
  filename?: string;
  width?: number;
  height?: number;
  albumId?: string;
}

export type SwipeAction = 'keep' | 'delete' | 'skip';

export interface MediaQueueState {
  items: MediaAsset[];
  currentIndex: number;
  trashQueue: MediaAsset[];
  keptQueue: MediaAsset[];
  isLoading: boolean;
  hasMore: boolean;
}
