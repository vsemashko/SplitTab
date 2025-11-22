'use client';

import { GroupMember } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Crown, Shield, MoreVertical, UserX } from 'lucide-react';

interface MemberCardProps {
  member: GroupMember;
  isCurrentUser?: boolean;
  canManage?: boolean;
  onChangeRole?: (member: GroupMember, newRole: 'owner' | 'admin' | 'member') => void;
  onRemove?: (member: GroupMember) => void;
}

export function MemberCard({
  member,
  isCurrentUser = false,
  canManage = false,
  onChangeRole,
  onRemove,
}: MemberCardProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default' as const;
      case 'admin':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
      <div className="flex items-center gap-4">
        {member.user?.profilePictureUrl ? (
          <img
            src={member.user.profilePictureUrl}
            alt={member.user?.name || 'User'}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
        )}

        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">
              {member.user?.name || 'Unknown User'}
              {isCurrentUser && <span className="text-muted-foreground text-sm">(You)</span>}
            </h4>
            <Badge variant={getRoleBadgeVariant(member.role)} className="flex items-center gap-1">
              {getRoleIcon(member.role)}
              {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{member.user?.email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Joined {formatDate(member.joinedAt)}
          </p>
        </div>
      </div>

      {canManage && !isCurrentUser && member.role !== 'owner' && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {member.role !== 'admin' && (
              <DropdownMenuItem onClick={() => onChangeRole?.(member, 'admin')}>
                <Shield className="mr-2 h-4 w-4" />
                Make Admin
              </DropdownMenuItem>
            )}
            {member.role === 'admin' && (
              <DropdownMenuItem onClick={() => onChangeRole?.(member, 'member')}>
                <User className="mr-2 h-4 w-4" />
                Make Member
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onRemove?.(member)}
              className="text-destructive"
            >
              <UserX className="mr-2 h-4 w-4" />
              Remove from Group
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
