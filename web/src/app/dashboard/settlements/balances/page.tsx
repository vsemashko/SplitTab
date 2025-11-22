'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BalanceSummary,
  Group,
  SettlementSuggestion,
  SettlementCreate,
} from '@/types';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { BalanceBreakdown } from '@/components/settlements/BalanceBreakdown';
import { BalanceFlow } from '@/components/settlements/BalanceFlow';
import { SettlementSuggestions } from '@/components/settlements/SettlementSuggestions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export default function BalancesPage() {
  const router = useRouter();
  const [balanceSummary, setBalanceSummary] = useState<BalanceSummary | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [suggestions, setSuggestions] = useState<SettlementSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isCreatingSettlement, setIsCreatingSettlement] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedGroupId && selectedGroupId !== 'all') {
      fetchSuggestions(selectedGroupId);
    }
  }, [selectedGroupId]);

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

      // Calculate balance summary
      await calculateBalances(groupsData, userData.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load balances');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateBalances = async (groupsList: Group[], userId: string) => {
    try {
      // Fetch expenses and settlements for all groups
      const balancePromises = groupsList.map(async (group) => {
        try {
          const [expenses, settlements] = await Promise.all([
            apiClient.get<any[]>(`/groups/${group.id}/expenses`),
            apiClient.get<{ settlements: any[] }>(
              `/settlements?groupId=${group.id}`
            ),
          ]);

          // Calculate balances per member
          const memberBalances = new Map<
            string,
            { userId: string; userName: string; balance: number }
          >();

          // Initialize all members
          group.members?.forEach((member) => {
            if (member.user) {
              memberBalances.set(member.userId, {
                userId: member.userId,
                userName: member.user.name,
                balance: 0,
              });
            }
          });

          // Calculate from expenses
          expenses.forEach((expense) => {
            expense.participants?.forEach((participant: any) => {
              const current = memberBalances.get(participant.userId);
              if (current) {
                const paid = Number(participant.paidAmount || 0);
                const owed = Number(participant.owedAmount || 0);
                current.balance += paid - owed;
              }
            });
          });

          // Subtract confirmed settlements (payer)
          settlements.settlements
            .filter((s: any) => s.status === 'confirmed')
            .forEach((settlement: any) => {
              const payer = memberBalances.get(settlement.payerId);
              if (payer) {
                payer.balance -= Number(settlement.amount);
              }
              const payee = memberBalances.get(settlement.payeeId);
              if (payee) {
                payee.balance += Number(settlement.amount);
              }
            });

          // Calculate net balance for the group (user's perspective)
          const userBalance = memberBalances.get(userId);
          const netBalance = userBalance?.balance || 0;

          return {
            groupId: group.id,
            groupName: group.name,
            netBalance,
            currency: group.currency || 'USD',
            members: Array.from(memberBalances.values())
              .filter((m) => m.userId !== userId && Math.abs(m.balance) > 0.01)
              .map((m) => ({
                userId: m.userId,
                userName: m.userName,
                userProfilePicture: undefined,
                // Invert balance for display (positive = they owe you, negative = you owe them)
                balance: -m.balance,
                currency: group.currency || 'USD',
              })),
          };
        } catch (err) {
          console.error(`Error calculating balances for group ${group.id}:`, err);
          return null;
        }
      });

      const groupBalances = (await Promise.all(balancePromises)).filter(
        (b): b is NonNullable<typeof b> => b !== null
      );

      // Calculate totals
      const totalOwed = groupBalances.reduce((sum, group) => {
        const owedInGroup = group.members
          .filter((m) => m.balance > 0)
          .reduce((s, m) => s + m.balance, 0);
        return sum + owedInGroup;
      }, 0);

      const totalOwing = groupBalances.reduce((sum, group) => {
        const owingInGroup = group.members
          .filter((m) => m.balance < 0)
          .reduce((s, m) => s + Math.abs(m.balance), 0);
        return sum + owingInGroup;
      }, 0);

      // Collect all person balances
      const allPersonBalances = groupBalances.flatMap((group) => group.members);

      setBalanceSummary({
        totalOwed,
        totalOwing,
        netBalance: totalOwed - totalOwing,
        currency: 'USD',
        byGroup: groupBalances,
        byPerson: allPersonBalances,
      });
    } catch (err) {
      console.error('Error calculating balances:', err);
      throw err;
    }
  };

  const fetchSuggestions = async (groupId: string) => {
    try {
      const data = await apiClient.get<SettlementSuggestion[]>(
        `/groups/${groupId}/settlements/suggestions`
      );
      setSuggestions(data);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      toast.error('Failed to load settlement suggestions');
    }
  };

  const handleCreateSettlement = async (suggestion: SettlementSuggestion) => {
    try {
      setIsCreatingSettlement(true);

      const settlementData: SettlementCreate = {
        groupId: selectedGroupId !== 'all' ? selectedGroupId : undefined,
        payerId: suggestion.payerId,
        payeeId: suggestion.payeeId,
        amount: suggestion.amount,
        notes: 'Settlement from smart suggestion',
      };

      await apiClient.post('/settlements', settlementData);
      toast.success('Settlement created successfully');

      // Refresh data
      await fetchData();
      if (selectedGroupId && selectedGroupId !== 'all') {
        await fetchSuggestions(selectedGroupId);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create settlement');
    } finally {
      setIsCreatingSettlement(false);
    }
  };

  const handleSettleAll = async () => {
    try {
      setIsCreatingSettlement(true);

      // Create all settlements
      await Promise.all(
        suggestions.map((suggestion) =>
          apiClient.post('/settlements', {
            groupId: selectedGroupId !== 'all' ? selectedGroupId : undefined,
            payerId: suggestion.payerId,
            payeeId: suggestion.payeeId,
            amount: suggestion.amount,
            notes: 'Settlement from smart suggestion',
          })
        )
      );

      toast.success(`Created ${suggestions.length} settlements`);

      // Refresh data
      await fetchData();
      if (selectedGroupId && selectedGroupId !== 'all') {
        await fetchSuggestions(selectedGroupId);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create settlements');
    } finally {
      setIsCreatingSettlement(false);
    }
  };

  const handleSettleUp = (userId: string, amount: number, groupId?: string) => {
    router.push(
      `/dashboard/settlements/new?payeeId=${userId}&amount=${amount}${
        groupId ? `&groupId=${groupId}` : ''
      }`
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: balanceSummary?.currency || 'USD',
    }).format(amount);
  };

  const filteredBalances =
    selectedGroupId === 'all'
      ? balanceSummary?.byGroup || []
      : balanceSummary?.byGroup.filter((g) => g.groupId === selectedGroupId) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
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
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/settlements')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Balance Dashboard</h1>
            <p className="text-muted-foreground">
              View and manage your balances across all groups
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-800 font-medium">Total Owed to You</p>
                <p className="text-3xl font-bold text-green-700 mt-2">
                  {formatCurrency(balanceSummary?.totalOwed || 0)}
                </p>
              </div>
              <div className="bg-green-200 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-800 font-medium">Total You Owe</p>
                <p className="text-3xl font-bold text-red-700 mt-2">
                  {formatCurrency(balanceSummary?.totalOwing || 0)}
                </p>
              </div>
              <div className="bg-red-200 p-3 rounded-full">
                <TrendingDown className="h-6 w-6 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-to-br ${
            (balanceSummary?.netBalance || 0) >= 0
              ? 'from-blue-50 to-blue-100 border-blue-200'
              : 'from-orange-50 to-orange-100 border-orange-200'
          }`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm font-medium ${
                    (balanceSummary?.netBalance || 0) >= 0
                      ? 'text-blue-800'
                      : 'text-orange-800'
                  }`}
                >
                  Net Balance
                </p>
                <p
                  className={`text-3xl font-bold mt-2 ${
                    (balanceSummary?.netBalance || 0) >= 0
                      ? 'text-blue-700'
                      : 'text-orange-700'
                  }`}
                >
                  {formatCurrency(balanceSummary?.netBalance || 0)}
                </p>
              </div>
              <div
                className={`p-3 rounded-full ${
                  (balanceSummary?.netBalance || 0) >= 0
                    ? 'bg-blue-200'
                    : 'bg-orange-200'
                }`}
              >
                <DollarSign
                  className={`h-6 w-6 ${
                    (balanceSummary?.netBalance || 0) >= 0
                      ? 'text-blue-700'
                      : 'text-orange-700'
                  }`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Group Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Filter by Group:</label>
        <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Smart Suggestions */}
      {selectedGroupId !== 'all' && suggestions.length > 0 && (
        <SettlementSuggestions
          suggestions={suggestions}
          currentUserId={currentUserId}
          onCreateSettlement={handleCreateSettlement}
          onSettleAll={handleSettleAll}
          isLoading={isCreatingSettlement}
        />
      )}

      {selectedGroupId !== 'all' && suggestions.length === 0 && (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            All balances are settled for this group! No settlements needed.
          </AlertDescription>
        </Alert>
      )}

      {/* Balance Flow Visualization */}
      {balanceSummary && balanceSummary.byPerson.length > 0 && (
        <BalanceFlow
          balances={balanceSummary.byPerson}
          currentUserId={currentUserId}
        />
      )}

      {/* Balance Breakdown */}
      {filteredBalances.length > 0 ? (
        <BalanceBreakdown
          groupBalances={filteredBalances}
          currentUserId={currentUserId}
          onSettleUp={handleSettleUp}
        />
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">✨</div>
            <h3 className="text-lg font-semibold mb-2">All Settled Up!</h3>
            <p className="text-muted-foreground">
              You have no outstanding balances. Great job keeping things even!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
