'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GroupCard } from '@/components/groups/GroupCard';
import { Group } from '@/types';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Plus,
  AlertCircle,
  Search,
  Grid3x3,
  List,
  Users,
  DollarSign,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type ViewMode = 'grid' | 'list';
type SortOption = 'name-asc' | 'name-desc' | 'members-desc' | 'created-desc';
type RoleFilter = 'all' | 'admin' | 'member';

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('created-desc');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Fetch groups
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [groupsData, userData] = await Promise.all([
          apiClient.get<Group[]>('/groups'),
          apiClient.get<{ id: string }>('/users/me'),
        ]);

        setGroups(groupsData);
        setCurrentUserId(userData.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load groups');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter and sort groups
  const filteredAndSortedGroups = useMemo(() => {
    let filtered = groups;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (group) =>
          group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          group.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((group) => {
        const userMember = group.members?.find((m) => m.userId === currentUserId);
        if (roleFilter === 'admin') {
          return userMember?.role === 'owner' || userMember?.role === 'admin';
        }
        return userMember?.role === 'member';
      });
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'members-desc':
          return (b.memberCount || 0) - (a.memberCount || 0);
        case 'created-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return sorted;
  }, [groups, searchQuery, sortBy, roleFilter, currentUserId]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalGroups = groups.length;
    const totalMembers = groups.reduce((sum, group) => sum + (group.memberCount || 0), 0);
    const adminGroups = groups.filter((group) => {
      const userMember = group.members?.find((m) => m.userId === currentUserId);
      return userMember?.role === 'owner' || userMember?.role === 'admin';
    }).length;

    return { totalGroups, totalMembers, adminGroups };
  }, [groups, currentUserId]);

  const handleDelete = (group: Group) => {
    setGroupToDelete(group);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!groupToDelete) return;

    try {
      setIsDeleting(true);
      await apiClient.delete(`/groups/${groupToDelete.id}`);

      setGroups(groups.filter((g) => g.id !== groupToDelete.id));
      toast.success('Group deleted successfully');
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete group');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLeave = async (group: Group) => {
    try {
      await apiClient.post(`/groups/${group.id}/leave`);
      setGroups(groups.filter((g) => g.id !== group.id));
      toast.success('Left group successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to leave group');
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const isUserAdmin = (group: Group) => {
    const userMember = group.members?.find((m) => m.userId === currentUserId);
    return userMember?.role === 'owner' || userMember?.role === 'admin';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" onClick={handleRetry} className="ml-4">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Groups</h1>
          <p className="text-muted-foreground">Manage your expense groups</p>
        </div>
        <Button onClick={() => router.push('/dashboard/groups/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Groups</p>
              <p className="text-3xl font-bold">{stats.totalGroups}</p>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Admin Groups</p>
              <p className="text-3xl font-bold">{stats.adminGroups}</p>
            </div>
            <DollarSign className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Members</p>
              <p className="text-3xl font-bold">{stats.totalMembers}</p>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="member">Member</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created-desc">Newest First</SelectItem>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="members-desc">Most Members</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredAndSortedGroups.length} of {groups.length} groups
      </p>

      {/* Groups Grid/List */}
      {filteredAndSortedGroups.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-lg font-semibold mb-2">No groups found</h3>
          <p className="text-muted-foreground mb-4">
            {groups.length === 0
              ? 'Get started by creating your first group'
              : 'Try adjusting your filters'}
          </p>
          {groups.length === 0 && (
            <Button onClick={() => router.push('/dashboard/groups/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Group
            </Button>
          )}
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'
              : 'space-y-4'
          }
        >
          {filteredAndSortedGroups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onDelete={handleDelete}
              onLeave={handleLeave}
              isAdmin={isUserAdmin(group)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{groupToDelete?.name}"? This action cannot be
              undone and will delete all expenses and settlements in this group.
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
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
