'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InviteMemberDialog } from '@/components/groups/InviteMemberDialog';
import { MemberList } from '@/components/groups/MemberList';
import { Group, GroupMember } from '@/types';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  updateGroupSchema,
  UpdateGroupInput,
  CURRENCY_OPTIONS,
  GROUP_CATEGORY_OPTIONS,
} from '@/lib/validations/group';
import { ArrowLeft, AlertCircle, Trash2, LogOut, UserCog } from 'lucide-react';

export default function GroupSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<UpdateGroupInput>({
    resolver: zodResolver(updateGroupSchema),
  });

  const selectedCurrency = watch('currency');
  const selectedCategory = watch('category');

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

        // Set form values
        reset({
          name: groupData.name,
          description: groupData.description || '',
          currency: groupData.currency,
          category: undefined, // Assuming category is not in the current Group type
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load group');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [groupId, reset]);

  const isUserAdmin = () => {
    if (!group || !currentUserId) return false;
    const userMember = group.members?.find((m) => m.userId === currentUserId);
    return userMember?.role === 'owner' || userMember?.role === 'admin';
  };

  const isUserOwner = () => {
    if (!group || !currentUserId) return false;
    const userMember = group.members?.find((m) => m.userId === currentUserId);
    return userMember?.role === 'owner';
  };

  const onSubmit = async (data: UpdateGroupInput) => {
    try {
      setIsUpdating(true);
      await apiClient.patch(`/groups/${groupId}`, data);

      // Update local state
      if (group) {
        setGroup({ ...group, ...data });
      }

      toast.success('Group updated successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update group');
    } finally {
      setIsUpdating(false);
    }
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

  const handleDeleteGroup = async () => {
    try {
      setIsDeleting(true);
      await apiClient.delete(`/groups/${groupId}`);
      toast.success('Group deleted successfully');
      router.push('/dashboard/groups');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete group');
      setIsDeleting(false);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await apiClient.post(`/groups/${groupId}/leave`);
      toast.success('Left group successfully');
      router.push('/dashboard/groups');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to leave group');
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
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

  if (!isUserAdmin()) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to manage this group's settings.
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/dashboard/groups/${groupId}`)}
              className="ml-4"
            >
              Back to Group
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
        <h1 className="text-3xl font-bold">Group Settings</h1>
        <p className="text-muted-foreground">Manage {group.name}</p>
      </div>

      {/* Basic Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Update group name, description, and settings</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                {...register('name')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                className={errors.description ? 'border-destructive' : ''}
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={selectedCurrency}
                onValueChange={(value) => setValue('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Updating...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Member Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Members</CardTitle>
              <CardDescription>Manage group members and permissions</CardDescription>
            </div>
            <InviteMemberDialog groupId={groupId} onInvite={handleInviteMembers} />
          </div>
        </CardHeader>
        <CardContent>
          <MemberList
            members={group.members || []}
            currentUserId={currentUserId}
            canManage={true}
            onChangeRole={handleChangeRole}
            onRemove={handleRemoveMember}
          />
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isUserOwner() && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">Leave Group</h4>
                <p className="text-sm text-muted-foreground">
                  You will no longer have access to this group
                </p>
              </div>
              <Button variant="destructive" onClick={() => setLeaveDialogOpen(true)}>
                <LogOut className="mr-2 h-4 w-4" />
                Leave Group
              </Button>
            </div>
          )}

          {isUserOwner() && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">Delete Group</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this group and all its data
                </p>
              </div>
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Group
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{group.name}"? This action cannot be undone and
              will permanently delete all expenses, settlements, and member data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteGroup} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Confirmation Dialog */}
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave "{group.name}"? You will lose access to this group
              and its data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLeaveGroup}>
              Leave Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
