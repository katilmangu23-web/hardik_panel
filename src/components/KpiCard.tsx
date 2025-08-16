import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface KpiCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color?: 'primary' | 'success' | 'warning' | 'destructive';
}

export function KpiCard({ title, value, icon: Icon, color = 'primary' }: KpiCardProps) {
  const colorClasses = {
    primary: 'from-primary to-accent',
    success: 'from-success to-green-400',
    warning: 'from-warning to-orange-400',
    destructive: 'from-destructive to-red-400'
  };

  return (
    <Card className="card-glass border-0 animate-slide-up">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}