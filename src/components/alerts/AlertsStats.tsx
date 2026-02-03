import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Clock, Check, CheckCircle } from "lucide-react";

interface StatsItem {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

interface AlertsStatsProps {
  total: number;
  pending: number;
  acknowledged: number;
  resolved: number;
}

export const AlertsStats = memo(
  ({ total, pending, acknowledged, resolved }: AlertsStatsProps) => {
    const stats: StatsItem[] = [
      {
        icon: <Bell className="h-5 w-5 text-muted-foreground" />,
        label: "Total",
        value: total,
        color: "bg-muted",
      },
      {
        icon: <Clock className="h-5 w-5 text-orange-500" />,
        label: "Pendientes",
        value: pending,
        color: "bg-orange-100 dark:bg-orange-900/30",
      },
      {
        icon: <Check className="h-5 w-5 text-blue-500" />,
        label: "Reconocidas",
        value: acknowledged,
        color: "bg-blue-100 dark:bg-blue-900/30",
      },
      {
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        label: "Resueltas",
        value: resolved,
        color: "bg-green-100 dark:bg-green-900/30",
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-full ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
);

AlertsStats.displayName = "AlertsStats";
