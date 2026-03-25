'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useMemo, useCallback } from 'react';
import RemoteStorageService, { StorageItem } from '@/lib/remotestorage';

const LISTING_CACHE_TTL_MS = 30_000; // 30 seconds
const LISTING_CACHE_TTL_EMPTY_MS = 5_000; // 5 seconds for empty/404 so we refetch sooner

export type LocalDataSnapshot = {
  folders: string[];
  fileCount: number;
};

interface RemoteStorageContextType {
  connected: boolean;
  connecting: boolean;
  userAddress: string | null;
  rootListing: StorageItem[] | null;
  storage: RemoteStorageService | null;
  fetchListing: (path: string) => Promise<StorageItem[]>;
  getCachedListing: (path: string) => StorageItem[] | null;
  invalidateListing: (path: string) => void;
  prefetchListing: (path: string) => void;
  refreshRootListing: () => Promise<void>;
  disconnect: () => void;
  localDataSnapshot: LocalDataSnapshot | null;
  clearLocalDataSnapshot: () => void;
}

const RemoteStorageContext = createContext<RemoteStorageContextType | undefined>(undefined);

export function RemoteStorageProvider({ children }: { children: ReactNode }) {
  const [storage] = useState(() => new RemoteStorageService());
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [rootListing, setRootListing] = useState<StorageItem[] | null>(null);
  const [localDataSnapshot, setLocalDataSnapshot] = useState<LocalDataSnapshot | null>(null);
  const listingCacheRef = useRef(new Map<string, { items: StorageItem[]; ts: number }>());
  const inflightRef = useRef(new Map<string, Promise<StorageItem[]>>());

  useEffect(() => {
    if (!storage) return;
    
    const rs = storage.getRemoteStorage();
    if (!rs) return;

    console.log('[RemoteStorage] Initializing event handlers');
    let hasInitialized = false;

    // Define event handlers
    const onReady = () => {
      console.debug('rs.on ready');
    };

    const onConnected = () => {
      console.debug('rs.on connected');

      // Snapshot any non-empty local listings before wiping the cache, so
      // we can prompt the user to export data that might be overwritten.
      const rootEntry = listingCacheRef.current.get('');
      const folders = (rootEntry?.items ?? [])
        .filter(i => i.isFolder)
        .map(i => i.name.replace(/\/$/, ''));
      const fileCount = Array.from(listingCacheRef.current.values())
        .reduce((sum, { items }) => sum + items.filter(i => !i.isFolder).length, 0);
      if (folders.length > 0 || fileCount > 0) {
        setLocalDataSnapshot({ folders, fileCount });
      }

      // Wipe the cache so any locally-cached empty/stale listings are
      // discarded and fresh data is fetched from the remote.
      listingCacheRef.current.clear();
      setConnecting(false);
      setConnected(true);
      
      // Safely access remote property
      try {
        const rsAny = rs as any;
        if (rsAny && rsAny.remote && rsAny.remote.userAddress) {
          setUserAddress(rsAny.remote.userAddress);
        }
      } catch (e) {
        console.warn('Could not get user address:', e);
      }
    };

    const onNotConnected = () => {
      console.debug('rs.on not-connected');
      setConnecting(false);
      setConnected(false);
    };

    const onDisconnected = () => {
      console.debug('rs.on disconnected');
      setConnecting(false);
      setConnected(false);
      setUserAddress(null);
      setRootListing(null);
      listingCacheRef.current.clear();
    };

    const onConnecting = () => {
      console.debug('rs.on connecting');
      setConnecting(true);
      setConnected(false);
    };

    const onAuthing = () => {
      console.debug('rs.on authing');
      setConnecting(true);
      setConnected(false);
    };

    // Fix RS sync 404 loop bug:
    // When a remote GET returns 404 for a document, autoMerge returns
    // undefined (bare `return` on line 586 of sync.ts). This means
    // nodes[path] = undefined, but the old zombie node {common: {}}
    // stays in IndexedDB. needsFetch() returns true for it, causing
    // an infinite sync loop. Fix: patch completeFetch to delete the
    // node from local storage when autoMerge returns undefined.
    // Fix RS sync bugs for binary uploads:
    // 1. needsRemotePut only accepts string bodies, but storeFile with
    //    ArrayBuffer stores an object body. Patch to accept any truthy body.
    // 2. After a 404, autoMerge leaves zombie nodes {common: {}} that
    //    needsFetch re-queues forever. Patch doTask to clean these up.
    try {
      const rsAny = rs as any;
      const sync = rsAny.sync;
      if (sync) {
        const proto = Object.getPrototypeOf(sync);

        // Fix 1: needsRemotePut should accept non-string bodies (ArrayBuffer)
        proto.needsRemotePut = function (node: any) {
          return node.local && node.local.body !== undefined && node.local.body !== false;
        };

        // Fix 2: clean up zombie nodes in doTask
        const origDoTask = proto.doTask;
        proto.doTask = async function (path: string) {
          const nodes = await rsAny.local.getNodes([path]);
          const node = nodes[path];
          if (node && node.common && !node.local && !node.remote &&
              node.common.body === undefined && node.common.itemsMap === undefined) {
            console.warn(`[RemoteStorage] Removing zombie node: ${path}`);
            await rsAny.local.setNodes({ [path]: false });
            return { action: undefined, path };
          }
          return origDoTask.call(this, path);
        };
      }
    } catch (e) {
      console.warn('[RemoteStorage] Could not patch sync:', e);
    }

    // Attach event listeners
    rs.on('ready', onReady);
    rs.on('connected', onConnected);
    rs.on('not-connected', onNotConnected);
    rs.on('disconnected', onDisconnected);
    rs.on('connecting', onConnecting);
    rs.on('authing', onAuthing);

    hasInitialized = true;

    // Attempt to restore previous session on mount - DISABLED temporarily
    // Commenting this out to see if it's causing the reload loop
    // let reconnectTimeout: NodeJS.Timeout;
    // try {
    //   reconnectTimeout = setTimeout(() => {
    //     if (!rs || !hasInitialized) return;
    //     const rsAny = rs as any;
    //     if (rsAny && typeof rsAny.reconnect === 'function') {
    //       console.log('[RemoteStorage] Attempting reconnect');
    //       rsAny.reconnect();
    //     }
    //   }, 100);
    // } catch (e) {
    //   console.warn('Failed to trigger reconnect', e);
    // }

    // Cleanup function
    return () => {
      console.log('[RemoteStorage] Cleaning up event handlers');
      // clearTimeout(reconnectTimeout);
      rs.removeEventListener('ready', onReady);
      rs.removeEventListener('connected', onConnected);
      rs.removeEventListener('not-connected', onNotConnected);
      rs.removeEventListener('disconnected', onDisconnected);
      rs.removeEventListener('connecting', onConnecting);
      rs.removeEventListener('authing', onAuthing);
    };
  }, [storage]);

  const fetchListing = useCallback((path: string): Promise<StorageItem[]> => {
    const key = path || '';
    const cached = listingCacheRef.current.get(key);
    const ttl = cached?.items.length === 0 ? LISTING_CACHE_TTL_EMPTY_MS : LISTING_CACHE_TTL_MS;
    if (cached && Date.now() - cached.ts < ttl) {
      return Promise.resolve(cached.items);
    }
    const inflight = inflightRef.current.get(key);
    if (inflight) return inflight;
    const promise = storage.fetchListing(path).then(items => {
      listingCacheRef.current.set(key, { items, ts: Date.now() });
      inflightRef.current.delete(key);
      return items;
    }).catch(err => {
      console.warn('[RemoteStorage] fetchListing error (path not cached):', err instanceof Error ? err.message : err);
      inflightRef.current.delete(key);
      return [] as StorageItem[];
    });
    inflightRef.current.set(key, promise);
    return promise;
  }, [storage]);

  useEffect(() => {
    fetchListing('').then(items => {
      setRootListing(items);
    }).catch(err => {
      console.warn('[RemoteStorage] root listing failed:', err instanceof Error ? err.message : err);
      setRootListing([]);
    });
  }, [connected, fetchListing]);

  const getCachedListing = useCallback((path: string): StorageItem[] | null => {
    const key = path || '';
    const cached = listingCacheRef.current.get(key);
    const ttl = cached?.items.length === 0 ? LISTING_CACHE_TTL_EMPTY_MS : LISTING_CACHE_TTL_MS;
    if (cached && Date.now() - cached.ts < ttl) {
      return cached.items;
    }
    return null;
  }, []);

  const invalidateListing = useCallback((path: string) => {
    const key = path || '';
    listingCacheRef.current.delete(key);
  }, []);

  const prefetchListing = useCallback((path: string) => {
    const key = path || '';
    if (listingCacheRef.current.has(key)) return;
    storage.fetchListing(path).then((items) => {
      listingCacheRef.current.set(key, { items, ts: Date.now() });
    }).catch(() => { /* ignore prefetch errors */ });
  }, [storage]);

  const refreshRootListing = useCallback(async () => {
    const items = await storage.fetchListing("");
    setRootListing(items);
  }, [storage]);

  const disconnect = useCallback(() => {
    storage.disconnect();
  }, [storage]);

  const clearLocalDataSnapshot = useCallback(() => {
    setLocalDataSnapshot(null);
  }, []);

  const contextValue = useMemo(() => ({
    connected,
    connecting,
    userAddress,
    rootListing,
    storage,
    fetchListing,
    getCachedListing,
    invalidateListing,
    prefetchListing,
    refreshRootListing,
    disconnect,
    localDataSnapshot,
    clearLocalDataSnapshot,
  }), [connected, connecting, userAddress, rootListing, storage, fetchListing, getCachedListing, invalidateListing, prefetchListing, refreshRootListing, disconnect, localDataSnapshot, clearLocalDataSnapshot]);

  return (
    <RemoteStorageContext.Provider value={contextValue}>
      {children}
    </RemoteStorageContext.Provider>
  );
}

export function useRemoteStorage() {
  const context = useContext(RemoteStorageContext);
  if (context === undefined) {
    throw new Error('useRemoteStorage must be used within a RemoteStorageProvider');
  }
  return context;
}
