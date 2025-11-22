'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Settlement, SettlementStats, Group } from '@/types';
import { apiClient } from '@/lib/api-client';
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
import { SettlementCard } from '@/components/settlements/SettlementCard';
import { SettlementStats as StatsComponent } from '@/components/settlements/SettlementStats';
import {
  SettlementFilters,
  SettlementFilterValues,
} from '@/components/settlements/SettlementFilters';
import { Plus, AlertCircle, Search, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

export default function SettlementsPage() {
  const router = useRouter();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [stats, setStats] = useState<SettlementStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [filters, setFilters] = useState<SettlementFilterValues>({});
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [settlementToConfirm, setSettlementToConfirm] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [settlementToCancel, setSettlementToCancel] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [settlementsData, groupsData, userData] = await Promise.all([
        apiClient.get<{ settlements: Settlement[]; total: number }>('/settlements'),
        apiClient.get<Group[]>('/groups'),
        apiClient.get<{ id: string }>('/users/me'),
      ]);

      setSettlements(settlementsData.settlements);
      setGroups(groupsData);
      setCurrentUserId(userData.id);

      // Calculate stats
      const pending = settlementsData.settlements.filter(
        (s) => s.status === 'pending'
      ).length;
      const confirmed = settlementsData.settlements.filter(
        (s) => s.status === 'confirmed'
      ).length;
      const cancelled = settlementsData.settlements.filter(
        (s) => s.status === 'cancelled'
      ).length;
      const totalSettled = settlementsData.settlements
        .filter((s) => s.status === 'confirmed')
        .reduce((sum, s) => sum + s.amount, 0);
      const avgAmount =
        confirmed > 0
          ? settlementsData.settlements
              .filter((s) => s.status === 'confirmed')
              .reduce((sum, s) => sum + s.amount, 0) / confirmed
          : 0;

      setStats({
        totalSettled,
        pendingSettlements: pending,
        completedSettlements: confirmed,
        cancelledSettlements: cancelled,
        averageSettlementAmount: avgAmount,
        currency: 'USD',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settlements');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedSettlements = useMemo(() => {
    let filtered = settlements;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (settlement) =>
          settlement.payer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          settlement.payee?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          settlement.group?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          settlement.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter((s) => s.status === filters.status);
    }

    // Group filter
    if (filters.groupId) {
      filtered = filtered.filter((s) => s.groupId === filters.groupId);
    }

    // Payment method filter
    if (filters.paymentMethod) {
      filtered = filtered.filter((s) => s.paymentMethod === filters.paymentMethod);
    }

    // Amount range filter
    if (filters.minAmount !== undefined) {
      filtered = filtered.filter((s) => s.amount >= filters.minAmount!);
    }
    if (filters.maxAmount !== undefined) {
      filtered = filtered.filter((s) => s.amount <= filters.maxAmount!);
    }

    // Date range filter
    if (filters.startDate) {
      filtered = filtered.filter(
        (s) => new Date(s.createdAt) >= new Date(filters.startDate!)
      );
    }
    if (filters.endDate) {
      filtered = filtered.filter(
        (s) => new Date(s.createdAt) <= new Date(filters.endDate!)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

    return sorted;
  }, [settlements, searchQuery, sortBy, filters]);

  const pendingSettlements = filteredAndSortedSettlements.filter(
    (s) => s.status === 'pending'
  );
  const confirmedSettlements = filteredAndSortedSettlements.filter(
    (s) => s.status === 'confirmed'
  );
  const cancelledSettlements = filteredAndSortedSettlements.filter(
    (s) => s.status === 'cancelled'
  );

  const handleConfirm = (id: string) => {
    setSettlementToConfirm(id);
    setConfirmDialogOpen(true);
  };

  const confirmSettlement = async () => {
    if (!settlementToConfirm) return;

    try {
      setIsConfirming(true);
      await apiClient.post(`/settlements/${settlementToConfirm}/confirm`);

      // Update local state
      setSettlements(
        settlements.map((s) =>
          s.id === settlementToConfirm ? { ...s, status: 'confirmed' as const } : s
        )
      );

      toast.success('Settlement confirmed');
      setConfirmDialogOpen(false);
      setSettlementToConfirm(null);
      fetchData(); // Refresh to update stats
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to confirm settlement');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = (id: string) => {
    setSettlementToCancel(id);
    setCancelDialogOpen(true);
  };

  const cancelSettlement = async () => {
    if (!settlementToCancel) return;

    try {
      setIsCancelling(true);
      await apiClient.post(`/settlements/${settlementToCancel}/cancel`);

      // Update local state
      setSettlements(
        settlements.map((s) =>
          s.id === settlementToCancel ? { ...s, status: 'cancelled' as const } : s
        )
      );

      toast.success('Settlement cancelled');
      setCancelDialogOpen(false);
      setSettlementToCancel(null);
      fetchData(); // Refresh to update stats
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel settlement');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/settlements/${id}`);
      setSettlements(settlements.filter((s) => s.id !== id));
      toast.success('Settlement deleted');
      fetchData(); // Refresh to update stats
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete settlement');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
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
            <Button variant="outline" size="sm" onClick={fetchData} className="ml-4">
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
          <h1 className="text-3xl font-bold">Settlements</h1>
          <p className="text-muted-foreground">Track and manage your payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/settlements/balances')}>
            <DollarSign className="mr-2 h-4 w-4" />
            View Balances
          </Button>
          <Button onClick={() => router.push('/dashboard/settlements/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Settlement
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && <StatsComponent stats={stats} />}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search settlements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Newest First</SelectItem>
            <SelectItem value="date-asc">Oldest First</SelectItem>
            <SelectItem value="amount-desc">Highest Amount</SelectItem>
            <SelectItem value="amount-asc">Lowest Amount</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <SettlementFilters filters={filters} onFiltersChange={setFilters} groups={groups} />

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredAndSortedSettlements.length} of {settlements.length} settlements
      </p>

      {/* Settlements Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            All ({filteredAndSortedSettlements.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pendingSettlements.length})
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Confirmed ({confirmedSettlements.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({cancelledSettlements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {filteredAndSortedSettlements.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-lg font-semibold mb-2">No settlements found</h3>
              <p className="text-muted-foreground mb-4">
                {settlements.length === 0
                  ? 'Get started by creating your first settlement'
                  : 'Try adjusting your filters'}
              </p>
              {settlements.length === 0 && (
                <Button onClick={() => router.push('/dashboard/settlements/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Settlement
                </Button>
              )}
            </div>
          ) : (
            filteredAndSortedSettlements.map((settlement) => (
              <SettlementCard
                key={settlement.id}
                settlement={settlement}
                currentUserId={currentUserId}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                onDelete={handleDelete}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pendingSettlements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No pending settlements</p>
            </div>
          ) : (
            pendingSettlements.map((settlement) => (
              <SettlementCard
                key={settlement.id}
                settlement={settlement}
                currentUserId={currentUserId}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                onDelete={handleDelete}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-4 mt-6">
          {confirmedSettlements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No confirmed settlements</p>
            </div>
          ) : (
            confirmedSettlements.map((settlement) => (
              <SettlementCard
                key={settlement.id}
                settlement={settlement}
                currentUserId={currentUserId}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4 mt-6">
          {cancelledSettlements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No cancelled settlements</p>
            </div>
          ) : (
            cancelledSettlements.map((settlement) => (
              <SettlementCard
                key={settlement.id}
                settlement={settlement}
                currentUserId={currentUserId}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Settlement</DialogTitle>
            <DialogDescription>
              Are you sure you want to confirm this settlement? This indicates that you have
              received the payment.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={isConfirming}
            >
              Cancel
            </Button>
            <Button onClick={confirmSettlement} disabled={isConfirming}>
              {isConfirming ? 'Confirming...' : 'Confirm Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Settlement</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this settlement? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isCancelling}
            >
              Keep Settlement
            </Button>
            <Button
              variant="destructive"
              onClick={cancelSettlement}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Settlement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
