'use client';

import { SettlementStats as Stats } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Clock, XCircle, DollarSign } from 'lucide-react';

interface SettlementStatsProps {
  stats: Stats;
}

export function SettlementStats({ stats }: SettlementStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: stats.currency || 'USD',
    }).format(amount);
  };

  const statCards = [
    {
      title: 'Total Settled',
      value: formatCurrency(stats.totalSettled),
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Pending',
      value: stats.pendingSettlements,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Completed',
      value: stats.completedSettlements,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Cancelled',
      value: stats.cancelledSettlements,
      icon: XCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-full`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
