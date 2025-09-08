import { DeviceTable } from '@/components/DeviceTable';
import { useDB } from '@/hooks/useDB';
import { Logo } from '@/components/Logo';

export function DevicesPage() {
  const { db, loading, error } = useDB();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex flex-col items-center gap-4 mb-6">
          <Logo size="lg" className="text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Device Management</h1>
            <p className="text-muted-foreground mt-2">View and manage all connected devices</p>
          </div>
        </div>
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