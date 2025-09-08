import { Users, User, UserX } from "lucide-react";
import { KpiCard } from "@/components/KpiCard";
import { useDB } from "@/hooks/useDB";
import { Logo } from "@/components/Logo";

export function OverviewPage() {
  const { getKPIs } = useDB();
  const kpis = getKPIs();

  return (
    <div className="space-y-4 sm:space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="text-center mb-4 sm:mb-8">
        <div className="flex flex-col items-center gap-4 mb-6">
          <Logo size="lg" className="text-primary" />
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2">
              Dashboard Overview
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground px-4">
              Monitor your devices and stay updated with the latest activities
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        <KpiCard
          title="Total Devices"
          value={kpis.totalDevices}
          icon={Users}
          color="primary"
        />
        <KpiCard
          title="Online Devices"
          value={kpis.onlineDevices}
          icon={User}
          color="primary"
        />
        <KpiCard
          title="Offline Devices"
          value={kpis.offlineDevices}
          icon={UserX}
          color="primary"
        />
      </div>

      {/* Recent Messages removed from overview */}
    </div>
  );
}

export default OverviewPage;
