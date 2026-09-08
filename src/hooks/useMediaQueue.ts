import { useState, useCallback, useEffect, useRef } from 'react';
import { MediaAsset } from '@/types/media';
import {
  fetchAssets,
  requestPermissions,
  deleteAssets,
  getAssetById,
} from '@/services/mediaService';

export interface ActionHistoryItem {
  assetId: string;
  type: 'delete' | 'keep';
}

export function useMediaQueue() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<string[]>([]);
  const [keepCount, setKeepCount] = useState(0);
  const [actionHistory, setActionHistory] = useState<ActionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const isFetchingRef = useRef(false);

  // Load next page of assets
  const fetchNextPage = useCallback(
    async (nextCursor?: string, isInitial = false) => {
      if (isFetchingRef.current) return;
      if (!isInitial && !hasNextPage) return;

      try {
        isFetchingRef.current = true;
        if (isInitial) {
          setIsLoading(true);
        } else {
          setIsFetchingMore(true);
        }

        const result = await fetchAssets(nextCursor);
        setAssets((prev) => (isInitial ? result.assets : [...prev, ...result.assets]));
        setCursor(result.endCursor);
        setHasNextPage(result.hasNextPage);
      } catch (error) {
        console.error('[useMediaQueue] Failed to load assets:', error);
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    },
    [hasNextPage]
  );

  // Initial load and permissions check
  const initQueue = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await requestPermissions();
      const granted = response.granted || response.accessPrivileges === 'limited' || response.accessPrivileges === 'all';
      setHasPermission(granted);

      if (granted) {
        await fetchNextPage(undefined, true);
      }
    } catch (error) {
      console.error('[useMediaQueue] Permission/Init error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchNextPage]);

  useEffect(() => {
    initQueue();
  }, [initQueue]);

  // Current top of the stack
  const currentAsset: MediaAsset | null = assets[currentIndex] || null;
  const remainingCount = assets.length - currentIndex;
  const isEmpty = !isLoading && (assets.length === 0 || currentIndex >= assets.length);

  // Auto-fetch next page when remaining local assets drop below 5
  useEffect(() => {
    if (
      !isLoading &&
      !isFetchingMore &&
      hasNextPage &&
      remainingCount > 0 &&
      remainingCount <= 5 &&
      cursor
    ) {
      fetchNextPage(cursor, false);
    }
  }, [remainingCount, hasNextPage, isLoading, isFetchingMore, cursor, fetchNextPage]);

  // Mark for deletion
  const markDelete = useCallback(
    (assetId?: string) => {
      setCurrentIndex((prevIndex) => {
        const activeAsset = (assetId ? assets.find((a) => a.id === assetId) : assets[prevIndex]) || assets[prevIndex];
        if (!activeAsset) return prevIndex;

        setPendingDelete((prev) => (prev.includes(activeAsset.id) ? prev : [...prev, activeAsset.id]));
        setActionHistory((prev) => [...prev, { assetId: activeAsset.id, type: 'delete' }]);
        return prevIndex + 1;
      });
    },
    [assets]
  );

  // Mark as kept
  const markKeep = useCallback(
    (assetId?: string) => {
      setCurrentIndex((prevIndex) => {
        const activeAsset = (assetId ? assets.find((a) => a.id === assetId) : assets[prevIndex]) || assets[prevIndex];
        if (!activeAsset) return prevIndex;

        setKeepCount((prev) => prev + 1);
        setActionHistory((prev) => [...prev, { assetId: activeAsset.id, type: 'keep' }]);
        return prevIndex + 1;
      });
    },
    [assets]
  );

  // Undo previous swipes step-by-step
  const undo = useCallback(() => {
    setActionHistory((prevHistory) => {
      if (prevHistory.length === 0) return prevHistory;

      const last = prevHistory[prevHistory.length - 1];
      const newHistory = prevHistory.slice(0, -1);

      if (last.type === 'delete') {
        setPendingDelete((prev) => prev.filter((id) => id !== last.assetId));
      } else if (last.type === 'keep') {
        setKeepCount((prev) => Math.max(0, prev - 1));
      }

      setCurrentIndex((prev) => Math.max(0, prev - 1));
      return newHistory;
    });
  }, []);

  // Unmark a specific asset from deletion (restore it)
  const unmarkDelete = useCallback((assetId: string) => {
    setPendingDelete((prev) => prev.filter((id) => id !== assetId));
    setActionHistory((prev) => prev.filter((item) => !(item.assetId === assetId && item.type === 'delete')));
  }, []);

  // Unmark all assets from deletion
  const unmarkAllDelete = useCallback(() => {
    setPendingDelete([]);
    setActionHistory((prev) => prev.filter((item) => item.type !== 'delete'));
  }, []);

  // Commit all pending deletions via mediaService
  const commitDeletes = useCallback(async (): Promise<number> => {
    if (pendingDelete.length === 0) return 0;

    const count = pendingDelete.length;
    try {
      setIsLoading(true);
      const success = await deleteAssets(pendingDelete);
      if (success) {
        const deletedSet = new Set(pendingDelete);
        setAssets((prev) => prev.filter((a) => !deletedSet.has(a.id)));
        setActionHistory((prev) => prev.filter((item) => !deletedSet.has(item.assetId)));
        setPendingDelete([]);
        return count;
      }
      return 0;
    } catch (error) {
      console.warn('[useMediaQueue] Commit deletes notice:', error);
      return 0;
    } finally {
      setIsLoading(false);
    }
  }, [pendingDelete]);

  // Jump directly to an asset index or ID
  const jumpToIndex = useCallback((index: number) => {
    setCurrentIndex((prev) => {
      if (index >= 0 && index < assets.length) {
        return index;
      }
      return prev;
    });
  }, [assets.length]);

  const jumpToAssetId = useCallback((assetId: string) => {
    const index = assets.findIndex((a) => a.id === assetId);
    if (index !== -1) {
      setCurrentIndex(index);
    }
  }, [assets]);

  // Jump to an asset picked from OS photo picker
  const jumpToPickedAsset = useCallback(
    async (assetId?: string | null, uri?: string, filename?: string) => {
      if (!assetId && !uri && !filename) return;

      // 1. Check if already loaded in local queue
      if (assetId) {
        const foundIndex = assets.findIndex((a) => a.id === assetId);
        if (foundIndex !== -1) {
          setCurrentIndex(foundIndex);
          return;
        }
      }

      // Fallback matching by uri or filename
      const fallbackIndex = assets.findIndex(
        (a) => (filename && a.filename === filename) || (uri && a.uri === uri)
      );
      if (fallbackIndex !== -1) {
        setCurrentIndex(fallbackIndex);
        return;
      }

      // 2. Fetch full metadata from MediaLibrary if not in current local page
      if (assetId) {
        try {
          const fetched = await getAssetById(assetId);
          if (fetched) {
            setAssets((prev) => {
              const updated = [...prev];
              // Insert directly at the current active position
              updated.splice(currentIndex, 0, fetched);
              return updated;
            });
          }
        } catch (err) {
          console.warn('[useMediaQueue] Failed to load picked asset:', err);
        }
      }
    },
    [assets, currentIndex]
  );

  const nextAssets = assets.slice(currentIndex + 1, currentIndex + 4);
  const trashAssets = assets.filter((item) => pendingDelete.includes(item.id));

  return {
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
    canUndo: actionHistory.length > 0 && currentIndex > 0,
    actionHistory,
    hasPermission,
    markDelete,
    markKeep,
    undo,
    unmarkDelete,
    unmarkAllDelete,
    jumpToIndex,
    jumpToAssetId,
    jumpToPickedAsset,
    fetchNextPage,
    commitDeletes,
    refresh: initQueue,
    requestPermissions: initQueue,
  };
}

export default useMediaQueue;
