import * as MediaLibrary from 'expo-media-library/legacy';
import { PermissionStatus } from 'expo-media-library/legacy';
import { MediaAsset } from '@/types/media';

export { PermissionStatus };

export interface FetchAssetsResult {
  assets: MediaAsset[];
  endCursor?: string;
  hasNextPage: boolean;
}

/**
 * Requests photo/media permissions from the user and handles 'granted', 'limited', and 'denied' states.
 */
export async function requestPermissions(): Promise<MediaLibrary.PermissionResponse> {
  try {
    const response = await MediaLibrary.requestPermissionsAsync();
    
    if (response.status === PermissionStatus.GRANTED) {
      console.log('[MediaService] Media library permission fully granted.');
    } else if (response.accessPrivileges === 'limited') {
      console.log('[MediaService] Media library permission granted with limited access (iOS).');
    } else if (response.status === PermissionStatus.DENIED) {
      console.warn('[MediaService] Media library permission was denied by user.');
    } else {
      console.log(`[MediaService] Media library permission status: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error('[MediaService] Error requesting media library permissions:', error);
    throw new Error(`Failed to request media library permissions: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Fetches photo and video assets sorted by creation time descending (newest first).
 * Uses pagination with first: 30 and an optional after cursor.
 */
export async function fetchAssets(after?: string): Promise<FetchAssetsResult> {
  try {
    const result = await MediaLibrary.getAssetsAsync({
      first: 30,
      after,
      mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
      sortBy: [MediaLibrary.SortBy.creationTime], // Defaults to descending order (newest first)
    });

    const assets: MediaAsset[] = (result.assets || []).map((asset) => ({
      id: asset.id,
      uri: asset.uri,
      mediaType: asset.mediaType,
      duration: asset.duration || 0,
      creationTime: asset.creationTime || Date.now(),
      filename: asset.filename,
      width: asset.width,
      height: asset.height,
      albumId: asset.albumId,
    }));

    return {
      assets,
      endCursor: result.endCursor,
      hasNextPage: result.hasNextPage,
    };
  } catch (error) {
    console.error('[MediaService] Error fetching media assets:', error);
    return {
      assets: [],
      hasNextPage: false,
    };
  }
}

/**
 * Deletes media assets by IDs.
 * 
 * NOTE: Calling MediaLibrary.deleteAssetsAsync() triggers the native OS confirmation prompt.
 * If the user cancels the OS prompt, iOS PhotoKit returns PHPhotosErrorDomain error -1,
 * which is caught and returned as false gracefully.
 */
export async function deleteAssets(assetIds: string[]): Promise<boolean> {
  if (!assetIds || assetIds.length === 0) {
    return true;
  }

  try {
    const success = await MediaLibrary.deleteAssetsAsync(assetIds);
    return success;
  } catch (error: any) {
    const msg = error?.message || String(error);
    // PHPhotosErrorDomain -1 is returned when the user cancels or dismisses the iOS deletion prompt
    if (msg.includes('error -1') || msg.includes('cancelled') || msg.includes('canceled') || msg.includes('User cancelled')) {
      console.log('[MediaService] User dismissed native deletion confirmation dialog.');
      return false;
    }
    console.warn('[MediaService] Failed to delete media assets:', msg);
    return false;
  }
}

/**
 * Fetches a single asset by its ID or URI (useful when chosen via the OS Photo Picker).
 */
export async function getAssetById(assetId: string): Promise<MediaAsset | null> {
  try {
    const asset = await MediaLibrary.getAssetInfoAsync(assetId);
    if (!asset) return null;
    return {
      id: asset.id,
      uri: asset.uri,
      mediaType: asset.mediaType,
      duration: asset.duration || 0,
      creationTime: asset.creationTime || Date.now(),
      filename: asset.filename,
      width: asset.width,
      height: asset.height,
      albumId: asset.albumId,
    };
  } catch (error) {
    console.warn('[MediaService] Could not fetch asset by ID:', error);
    return null;
  }
}

/**
 * Fetches assets starting from a specific starting asset and continuing forward/chronologically.
 * Used when the user picks a starting point from the photo gallery grid.
 */
export async function fetchAssetsFrom(asset: MediaAsset): Promise<FetchAssetsResult> {
  try {
    // 1. Try querying with after: asset.id
    const result = await MediaLibrary.getAssetsAsync({
      first: 30,
      after: asset.id,
      mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
      sortBy: [MediaLibrary.SortBy.creationTime],
    });

    const mappedSubsequent: MediaAsset[] = (result.assets || []).map((a) => ({
      id: a.id,
      uri: a.uri,
      mediaType: a.mediaType,
      duration: a.duration || 0,
      creationTime: a.creationTime || Date.now(),
      filename: a.filename,
      width: a.width,
      height: a.height,
      albumId: a.albumId,
    }));

    // Put the selected starting asset first, followed by all subsequent photos
    const combined = [asset, ...mappedSubsequent.filter((a) => a.id !== asset.id)];

    return {
      assets: combined,
      endCursor: result.endCursor,
      hasNextPage: result.hasNextPage,
    };
  } catch (error) {
    console.warn('[MediaService] Error fetching assets from starting asset:', error);
    return {
      assets: [asset],
      hasNextPage: false,
    };
  }
}

