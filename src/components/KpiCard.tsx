import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface KpiCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color?: "primary" | "success" | "warning" | "destructive";
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  color = "primary",
}: KpiCardProps) {
  const colorClasses = {
    primary: "from-primary to-accent",
    success: "from-success to-green-400",
    warning: "from-warning to-orange-400",
    destructive: "from-destructive to-red-400",
  };

  return (
    <Card className="card-glass border-0 animate-slide-up">
      <CardContent className="p-3 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 truncate">
              {title}
            </p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              {value}
            </p>
          </div>
          <div
            className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg flex-shrink-0 ml-2`}
          >
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
