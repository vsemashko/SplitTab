'use client';

import { Group } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, DollarSign, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GroupHeaderProps {
  group: Group;
  isAdmin?: boolean;
}

export function GroupHeader({ group, isAdmin = false }: GroupHeaderProps) {
  const router = useRouter();

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: group.currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="bg-card border rounded-lg p-6 shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          {group.imageUrl ? (
            <img
              src={group.imageUrl}
              alt={group.name}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-10 w-10 text-primary" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">{group.name}</h1>
              {isAdmin && <Badge variant="secondary">Admin</Badge>}
            </div>
            {group.description && (
              <p className="text-muted-foreground max-w-2xl">{group.description}</p>
            )}
          </div>
        </div>
        {isAdmin && (
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/groups/${group.id}/settings`)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center text-muted-foreground mb-2">
            <Users className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Members</span>
          </div>
          <p className="text-3xl font-bold">{group.memberCount || 0}</p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center text-muted-foreground mb-2">
            <DollarSign className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Total Expenses</span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(group.totalExpenses)}</p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center text-muted-foreground mb-2">
            <DollarSign className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Your Balance</span>
          </div>
          <p
            className={`text-3xl font-bold ${
              (group.yourBalance || 0) > 0
                ? 'text-green-600'
                : (group.yourBalance || 0) < 0
                ? 'text-red-600'
                : ''
            }`}
          >
            {formatCurrency(group.yourBalance)}
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center text-muted-foreground mb-2">
            <DollarSign className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Currency</span>
          </div>
          <p className="text-3xl font-bold">{group.currency}</p>
        </div>
      </div>
    </div>
  );
}
