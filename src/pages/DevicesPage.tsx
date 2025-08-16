import { DeviceTable } from '@/components/DeviceTable';
import { useDB } from '@/hooks/useDB';

export function DevicesPage() {
  const { db, loading, error } = useDB();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Device Management</h1>
        <p className="text-muted-foreground">View and manage all connected devices</p>
      </div>

      {/* Device Table */}
      <DeviceTable 
        devices={db.DeviceInfo} 
        loading={loading}
        error={error}
      />
    </div>
  );
}

export default DevicesPage;