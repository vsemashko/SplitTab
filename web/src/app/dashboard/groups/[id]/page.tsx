'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GroupHeader } from '@/components/groups/GroupHeader';
import { GroupStats, GroupStatsData } from '@/components/groups/GroupStats';
import { MemberList } from '@/components/groups/MemberList';
import { ActivityFeed, Activity } from '@/components/groups/ActivityFeed';
import { ExpenseCard } from '@/components/expenses/ExpenseCard';
import { Group, Expense, GroupMember, Balance } from '@/types';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { AlertCircle, Plus, ArrowLeft } from 'lucide-react';

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch group data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [groupData, expensesData, balancesData, activitiesData, userData] =
          await Promise.all([
            apiClient.get<Group>(`/groups/${groupId}`),
            apiClient.get<Expense[]>(`/groups/${groupId}/expenses`),
            apiClient.get<Balance[]>(`/groups/${groupId}/balances`),
            apiClient.get<Activity[]>(`/groups/${groupId}/activity`).catch(() => []),
            apiClient.get<{ id: string }>('/users/me'),
          ]);

        setGroup(groupData);
        setExpenses(expensesData);
        setBalances(balancesData);
        setActivities(activitiesData);
        setCurrentUserId(userData.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load group');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [groupId]);

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

  const handleDeleteExpense = async (expense: Expense) => {
    try {
      await apiClient.delete(`/expenses/${expense.id}`);
      setExpenses(expenses.filter((e) => e.id !== expense.id));
      toast.success('Expense deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete expense');
    }
  };

  const isUserAdmin = () => {
    if (!group || !currentUserId) return false;
    const userMember = group.members?.find((m) => m.userId === currentUserId);
    return userMember?.role === 'owner' || userMember?.role === 'admin';
  };

  const stats: GroupStatsData = {
    totalMembers: group?.memberCount || 0,
    totalExpenses: expenses.length,
    totalAmount: group?.totalExpenses || 0,
    yourBalance: group?.yourBalance || 0,
    currency: group?.currency || 'USD',
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-48" />
        <Skeleton className="h-12 w-full" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.push('/dashboard/groups')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Groups
      </Button>

      {/* Group Header */}
      <GroupHeader group={group} isAdmin={isUserAdmin()} />

      {/* Stats */}
      <GroupStats stats={stats} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expenses ({expenses.length})</TabsTrigger>
          <TabsTrigger value="members">Members ({group.memberCount || 0})</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Expenses */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Expenses</h3>
                <Button
                  size="sm"
                  onClick={() => router.push(`/dashboard/expenses/new?groupId=${groupId}`)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Expense
                </Button>
              </div>
              {expenses.slice(0, 5).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No expenses yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses.slice(0, 5).map((expense) => (
                    <ExpenseCard
                      key={expense.id}
                      expense={expense}
                      onEdit={(exp) => router.push(`/dashboard/expenses/${exp.id}/edit`)}
                      onDelete={handleDeleteExpense}
                      showGroup={false}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <ActivityFeed activities={activities} maxItems={5} />
            </div>
          </div>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">All Expenses</h3>
            <Button onClick={() => router.push(`/dashboard/expenses/new?groupId=${groupId}`)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </div>
          {expenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-6xl mb-4">💸</div>
              <h3 className="text-lg font-semibold mb-2">No expenses yet</h3>
              <p className="mb-4">Start by adding your first expense</p>
              <Button onClick={() => router.push(`/dashboard/expenses/new?groupId=${groupId}`)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Expense
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  onEdit={(exp) => router.push(`/dashboard/expenses/${exp.id}/edit`)}
                  onDelete={handleDeleteExpense}
                  showGroup={false}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <MemberList
            members={group.members || []}
            currentUserId={currentUserId}
            canManage={isUserAdmin()}
            onChangeRole={handleChangeRole}
            onRemove={handleRemoveMember}
          />
        </TabsContent>

        {/* Balances Tab */}
        <TabsContent value="balances" className="space-y-4">
          <h3 className="text-lg font-semibold">Group Balances</h3>
          {balances.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No balances to show</p>
            </div>
          ) : (
            <div className="space-y-3">
              {balances.map((balance, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {balance.otherUser?.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{balance.otherUser?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {balance.amount > 0 ? 'owes you' : 'you owe'}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`text-lg font-bold ${
                      balance.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: balance.currency || 'USD',
                    }).format(Math.abs(balance.amount))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <h3 className="text-lg font-semibold mb-4">Activity Feed</h3>
          <ActivityFeed activities={activities} />
        </TabsContent>
      </Tabs>

      {/* Floating Action Button */}
      <Button
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg"
        size="icon"
        onClick={() => router.push(`/dashboard/expenses/new?groupId=${groupId}`)}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}
