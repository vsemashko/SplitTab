'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

export interface ExpenseStatsData {
  totalSpent: number;
  totalOwed: number;
  totalOwing: number;
  expenseCount: number;
  currency?: string;
}

interface ExpenseStatsProps {
  stats: ExpenseStatsData;
}

export function ExpenseStats({ stats }: ExpenseStatsProps) {
  const currency = stats.currency || 'USD';

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.expenseCount}</div>
          <p className="text-xs text-muted-foreground">All time</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalSpent, currency)}</div>
          <p className="text-xs text-muted-foreground">Across all groups</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">You Owe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(stats.totalOwing, currency)}
          </div>
          <p className="text-xs text-muted-foreground">To be settled</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Owed to You</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.totalOwed, currency)}
          </div>
          <p className="text-xs text-muted-foreground">To be received</p>
        </CardContent>
      </Card>
    </div>
  );
}
