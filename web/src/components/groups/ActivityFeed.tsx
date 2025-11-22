'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Receipt,
  UserPlus,
  UserMinus,
  Settings,
  DollarSign,
  Shield,
  Crown,
} from 'lucide-react';

export interface Activity {
  id: string;
  type: 'expense_added' | 'member_joined' | 'member_left' | 'settings_changed' | 'settlement_made' | 'role_changed';
  description: string;
  user?: {
    name: string;
    profilePictureUrl?: string;
  };
  metadata?: {
    amount?: number;
    currency?: string;
    expenseName?: string;
    settingChanged?: string;
    newRole?: string;
    oldRole?: string;
  };
  createdAt: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  maxItems?: number;
}

export function ActivityFeed({ activities, maxItems = 10 }: ActivityFeedProps) {
  const displayActivities = maxItems ? activities.slice(0, maxItems) : activities;

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'expense_added':
        return <Receipt className="h-4 w-4 text-blue-500" />;
      case 'member_joined':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'member_left':
        return <UserMinus className="h-4 w-4 text-red-500" />;
      case 'settings_changed':
        return <Settings className="h-4 w-4 text-gray-500" />;
      case 'settlement_made':
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'role_changed':
        return <Shield className="h-4 w-4 text-purple-500" />;
      default:
        return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'expense_added':
        return 'bg-blue-50 dark:bg-blue-950';
      case 'member_joined':
        return 'bg-green-50 dark:bg-green-950';
      case 'member_left':
        return 'bg-red-50 dark:bg-red-950';
      case 'settings_changed':
        return 'bg-gray-50 dark:bg-gray-950';
      case 'settlement_made':
        return 'bg-green-50 dark:bg-green-950';
      case 'role_changed':
        return 'bg-purple-50 dark:bg-purple-950';
      default:
        return 'bg-gray-50 dark:bg-gray-950';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (displayActivities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayActivities.map((activity) => (
        <Card key={activity.id} className={getActivityColor(activity.type)}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="mt-1">{getActivityIcon(activity.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {activity.user?.name && (
                        <span className="font-semibold">{activity.user.name} </span>
                      )}
                      {activity.description}
                    </p>
                    {activity.metadata && (
                      <div className="mt-1 space-y-1">
                        {activity.metadata.expenseName && (
                          <Badge variant="outline" className="text-xs">
                            {activity.metadata.expenseName}
                          </Badge>
                        )}
                        {activity.metadata.amount !== undefined && (
                          <span className="text-sm font-semibold ml-2">
                            {formatCurrency(
                              activity.metadata.amount,
                              activity.metadata.currency || 'USD'
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(activity.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
