'use client';

import { GroupMember } from '@/types';
import { MemberCard } from './MemberCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useState, useMemo } from 'react';

interface MemberListProps {
  members: GroupMember[];
  currentUserId?: string;
  canManage?: boolean;
  onChangeRole?: (member: GroupMember, newRole: 'owner' | 'admin' | 'member') => void;
  onRemove?: (member: GroupMember) => void;
}

export function MemberList({
  members,
  currentUserId,
  canManage = false,
  onChangeRole,
  onRemove,
}: MemberListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const filteredMembers = useMemo(() => {
    let filtered = members;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (member) =>
          member.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.user?.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((member) => member.role === roleFilter);
    }

    // Sort by role priority (owner > admin > member), then by name
    return filtered.sort((a, b) => {
      const rolePriority = { owner: 0, admin: 1, member: 2 };
      const aPriority = rolePriority[a.role as keyof typeof rolePriority] || 3;
      const bPriority = rolePriority[b.role as keyof typeof rolePriority] || 3;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      return (a.user?.name || '').localeCompare(b.user?.name || '');
    });
  }, [members, searchQuery, roleFilter]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="member">Member</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Members list */}
      <div className="space-y-2">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No members found</p>
          </div>
        ) : (
          filteredMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              isCurrentUser={member.userId === currentUserId}
              canManage={canManage}
              onChangeRole={onChangeRole}
              onRemove={onRemove}
            />
          ))
        )}
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredMembers.length} of {members.length} members
      </div>
    </div>
  );
}
