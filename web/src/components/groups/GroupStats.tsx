'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

export interface GroupStatsData {
  totalMembers: number;
  totalExpenses: number;
  totalAmount: number;
  yourBalance: number;
  currency: string;
}

interface GroupStatsProps {
  stats: GroupStatsData;
}

export function GroupStats({ stats }: GroupStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: stats.currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Members</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalMembers}</div>
          <p className="text-xs text-muted-foreground">Active group members</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalExpenses}</div>
          <p className="text-xs text-muted-foreground">Expenses recorded</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
          <p className="text-xs text-muted-foreground">Total spent</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Your Balance</CardTitle>
          {stats.yourBalance >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              stats.yourBalance > 0
                ? 'text-green-600'
                : stats.yourBalance < 0
                ? 'text-red-600'
                : ''
            }`}
          >
            {formatCurrency(stats.yourBalance)}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.yourBalance > 0
              ? 'You are owed'
              : stats.yourBalance < 0
              ? 'You owe'
              : 'Settled up'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
