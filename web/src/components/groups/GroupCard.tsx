'use client';

import { Group } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Users, DollarSign, MoreVertical, Settings, Trash2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GroupCardProps {
  group: Group;
  onEdit?: (group: Group) => void;
  onDelete?: (group: Group) => void;
  onLeave?: (group: Group) => void;
  isAdmin?: boolean;
}

export function GroupCard({ group, onEdit, onDelete, onLeave, isAdmin = false }: GroupCardProps) {
  const router = useRouter();

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: group.currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleCardClick = () => {
    router.push(`/dashboard/groups/${group.id}`);
  };

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleCardClick}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-3 flex-1">
          {group.imageUrl ? (
            <img
              src={group.imageUrl}
              alt={group.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{group.name}</h3>
            {group.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">{group.description}</p>
            )}
          </div>
        </div>
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2"
        >
          {isAdmin && <Badge variant="secondary">Admin</Badge>}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/dashboard/groups/${group.id}`)}>
                View Details
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuItem onClick={() => router.push(`/dashboard/groups/${group.id}/settings`)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete?.(group)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Group
                  </DropdownMenuItem>
                </>
              )}
              {!isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onLeave?.(group)}
                    className="text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Leave Group
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="flex items-center text-muted-foreground mb-1">
              <Users className="h-4 w-4 mr-1" />
              <span className="text-xs">Members</span>
            </div>
            <p className="text-2xl font-bold">{group.memberCount || 0}</p>
          </div>
          <div>
            <div className="flex items-center text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4 mr-1" />
              <span className="text-xs">Total Expenses</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(group.totalExpenses)}</p>
          </div>
          <div>
            <div className="flex items-center text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4 mr-1" />
              <span className="text-xs">Your Balance</span>
            </div>
            <p
              className={`text-2xl font-bold ${
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
        </div>
      </CardContent>
    </Card>
  );
}
