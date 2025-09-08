// Test script to verify the new UPI pins table structure
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

// Test the new UPI pins structure that the React app will use
async function testUPIPinsTable() {
  try {
    console.log('🧪 Testing UPI Pins Table Structure...\n');
    
    const deviceId = 'Xiaomi 23076PC4BI';
    
    // Test UPI Pins path
    console.log('💳 Testing UPI Pins path...');
    const upiPinsSnapshot = await get(ref(database, `UPIPins/${deviceId}`));
    const upiPins = upiPinsSnapshot.val();
    console.log('✅ UPI Pins data:', upiPins);
    
    if (upiPins) {
      console.log('\n📊 UPI Pins structure analysis:');
      const pinsArray = Object.values(upiPins).map((pinObj) => ({
        pin: pinObj.pin || pinObj.toString(),
        timestamp: pinObj.timestamp || new Date().toISOString()
      }));
      
      console.log('🔐 Processed UPI Pins for table:');
      pinsArray.forEach((pinData, idx) => {
        console.log(`  Row ${idx + 1}:`);
        console.log(`    - Pin: ${pinData.pin}`);
        console.log(`    - Timestamp: ${pinData.timestamp}`);
        console.log(`    - Formatted Date: ${new Date(pinData.timestamp).toLocaleString()}`);
      });
      
      console.log('\n📋 Table structure preview:');
      console.log('┌─────────────┬─────────────────────────────────┐');
      console.log('│   Upi Pin   │        Added Date Time          │');
      console.log('├─────────────┼─────────────────────────────────┤');
      pinsArray.forEach((pinData) => {
        const pin = pinData.pin.padEnd(11);
        const date = new Date(pinData.timestamp).toLocaleString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }).padEnd(33);
        console.log(`│ ${pin} │ ${date} │`);
      });
      console.log('└─────────────┴─────────────────────────────────┘');
    } else {
      console.log('❌ No UPI Pins found for device:', deviceId);
    }
    
    console.log('\n🎉 UPI Pins table test completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// Run the test
testUPIPinsTable().then(() => {
  console.log('\n✅ Test completed successfully!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
