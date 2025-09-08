// This is a fixed version of the deleteDevice method that should be used
// to replace the existing one in firebaseService.ts

async deleteDevice(deviceId: string): Promise<void> {
  try {
    // List all paths that need to be deleted
    const paths = [
      `DeviceInfo/${deviceId}`,
      `Sims/${deviceId}`,
      `Keylogs/${deviceId}`,
      `UPIPins/${deviceId}`,
      `UserEntered/${deviceId}`,
      `AppsInstalled/${deviceId}`,
      // Note: Not deleting from SmsData as it might be shared across devices
    ];
    
    // Delete all paths in parallel
    await Promise.all(
      paths.map(path => remove(ref(database, path)))
    );
    
    console.log(`Successfully deleted all data for device: ${deviceId}`);
  } catch (error) {
    console.error("Error deleting device:", error);
    throw error;
  }
}
