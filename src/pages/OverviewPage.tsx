import { Users, MessageSquare, Battery } from 'lucide-react';
import { KpiCard } from '@/components/KpiCard';
import { MessageCard } from '@/components/MessageCard';
import { useDB } from '@/hooks/useDB';

export function OverviewPage() {
  const { getKPIs, getRecentMessages } = useDB();
  const kpis = getKPIs();
  const recentMessages = getRecentMessages();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h1>
        <p className="text-muted-foreground">Monitor your devices and stay updated with the latest activities</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard 
          title="Total Victims" 
          value={kpis.totalVictims} 
          icon={Users} 
          color="primary"
        />
        <KpiCard 
          title="Inbox Messages" 
          value={kpis.inboxMessages} 
          icon={MessageSquare} 
          color="success"
        />
        <KpiCard 
          title="Battery < 20%" 
          value={kpis.lowBatteryDevices} 
          icon={Battery} 
          color="destructive"
        />
      </div>

      {/* Recent Messages */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Recent Messages</h2>
          <p className="text-sm text-muted-foreground">Last 5 messages</p>
        </div>
        <div className="grid gap-4">
          {recentMessages.map((message, index) => (
            <MessageCard key={`${message.VictimId}-${index}`} message={message} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default OverviewPage;