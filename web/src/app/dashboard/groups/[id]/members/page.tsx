'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MemberList } from '@/components/groups/MemberList';
import { InviteMemberDialog } from '@/components/groups/InviteMemberDialog';
import { Group, GroupMember } from '@/types';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function GroupMembersPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Fetch group data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [groupData, userData] = await Promise.all([
          apiClient.get<Group>(`/groups/${groupId}`),
          apiClient.get<{ id: string }>('/users/me'),
        ]);

        setGroup(groupData);
        setCurrentUserId(userData.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load group');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [groupId]);

  const isUserAdmin = () => {
    if (!group || !currentUserId) return false;
    const userMember = group.members?.find((m) => m.userId === currentUserId);
    return userMember?.role === 'owner' || userMember?.role === 'admin';
  };

  const handleInviteMembers = async (emails: string[]) => {
    await apiClient.post(`/groups/${groupId}/invite`, { emails });
    // Refresh group data
    const groupData = await apiClient.get<Group>(`/groups/${groupId}`);
    setGroup(groupData);
  };

  const handleChangeRole = async (member: GroupMember, newRole: 'owner' | 'admin' | 'member') => {
    try {
      await apiClient.patch(`/groups/${groupId}/members/${member.id}`, { role: newRole });

      // Update local state
      if (group) {
        setGroup({
          ...group,
          members: group.members?.map((m) =>
            m.id === member.id ? { ...m, role: newRole } : m
          ),
        });
      }

      toast.success('Member role updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update member role');
    }
  };

  const handleRemoveMember = async (member: GroupMember) => {
    try {
      await apiClient.delete(`/groups/${groupId}/members/${member.id}`);

      // Update local state
      if (group) {
        setGroup({
          ...group,
          members: group.members?.filter((m) => m.id !== member.id),
          memberCount: (group.memberCount || 0) - 1,
        });
      }

      toast.success('Member removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-32" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || 'Group not found'}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/groups')}
              className="ml-4"
            >
              Back to Groups
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/groups/${groupId}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Group
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Members</h1>
            <p className="text-muted-foreground">{group.name}</p>
          </div>
          {isUserAdmin() && (
            <InviteMemberDialog groupId={groupId} onInvite={handleInviteMembers} />
          )}
        </div>
      </div>

      {/* Member List */}
      <MemberList
        members={group.members || []}
        currentUserId={currentUserId}
        canManage={isUserAdmin()}
        onChangeRole={handleChangeRole}
        onRemove={handleRemoveMember}
      />
    </div>
  );
}
