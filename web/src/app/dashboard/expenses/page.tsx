'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExpenseCard } from '@/components/expenses/ExpenseCard';
import { ExpenseFilters, ExpenseFilterValues } from '@/components/expenses/ExpenseFilters';
import { ExpenseStats, ExpenseStatsData } from '@/components/expenses/ExpenseStats';
import { Expense, Group } from '@/types';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Plus, AlertCircle } from 'lucide-react';

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'group';

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExpenseFilterValues>({});
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stats, setStats] = useState<ExpenseStatsData>({
    totalSpent: 0,
    totalOwed: 0,
    totalOwing: 0,
    expenseCount: 0,
  });

  // Fetch expenses and groups
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [expensesData, groupsData] = await Promise.all([
          apiClient.get<Expense[]>('/expenses'),
          apiClient.get<Group[]>('/groups'),
        ]);

        setExpenses(expensesData);
        setGroups(groupsData);

        // Calculate stats
        const totalSpent = expensesData.reduce((sum, exp) => sum + exp.amount, 0);
        setStats({
          totalSpent,
          totalOwed: 0, // Would need to calculate from settlements
          totalOwing: 0, // Would need to calculate from settlements
          expenseCount: expensesData.length,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load expenses');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...expenses];

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter((exp) =>
        exp.description.toLowerCase().includes(searchLower)
      );
    }

    if (filters.groupId) {
      result = result.filter((exp) => exp.groupId === filters.groupId);
    }

    if (filters.category) {
      result = result.filter((exp) => exp.category === filters.category);
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      result = result.filter((exp) => new Date(exp.expenseDate) >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      result = result.filter((exp) => new Date(exp.expenseDate) <= endDate);
    }

    if (filters.minAmount !== undefined) {
      result = result.filter((exp) => exp.amount >= filters.minAmount!);
    }

    if (filters.maxAmount !== undefined) {
      result = result.filter((exp) => exp.amount <= filters.maxAmount!);
    }

    if (filters.paidBy) {
      result = result.filter((exp) => exp.paidBy === filters.paidBy);
    }

    // Apply sorting
    switch (sortBy) {
      case 'date-desc':
        result.sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());
        break;
      case 'date-asc':
        result.sort((a, b) => new Date(a.expenseDate).getTime() - new Date(b.expenseDate).getTime());
        break;
      case 'amount-desc':
        result.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount-asc':
        result.sort((a, b) => a.amount - b.amount);
        break;
      case 'group':
        result.sort((a, b) => (a.group?.name || '').localeCompare(b.group?.name || ''));
        break;
    }

    setFilteredExpenses(result);
  }, [expenses, filters, sortBy]);

  const handleEdit = (expense: Expense) => {
    router.push(`/dashboard/expenses/${expense.id}/edit`);
  };

  const handleDelete = (expense: Expense) => {
    setExpenseToDelete(expense);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;

    try {
      setIsDeleting(true);
      await apiClient.delete(`/expenses/${expenseToDelete.id}`);

      // Remove from state
      setExpenses(expenses.filter((exp) => exp.id !== expenseToDelete.id));

      toast.success('Expense deleted successfully');
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete expense');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
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
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">Manage all your expenses</p>
        </div>
        <Button onClick={() => router.push('/dashboard/expenses/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Stats */}
      <ExpenseStats stats={stats} />

      {/* Filters */}
      <ExpenseFilters
        filters={filters}
        onFiltersChange={setFilters}
        groups={groups}
        onReset={() => setFilters({})}
      />

      {/* Sort and Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredExpenses.length} of {expenses.length} expenses
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm">Sort by:</span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="amount-desc">Highest Amount</SelectItem>
              <SelectItem value="amount-asc">Lowest Amount</SelectItem>
              <SelectItem value="group">Group Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Expenses List */}
      {filteredExpenses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💸</div>
          <h3 className="text-lg font-semibold mb-2">No expenses found</h3>
          <p className="text-muted-foreground mb-4">
            {expenses.length === 0
              ? 'Get started by adding your first expense'
              : 'Try adjusting your filters'}
          </p>
          {expenses.length === 0 && (
            <Button onClick={() => router.push('/dashboard/expenses/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Expense
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredExpenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onEdit={handleEdit}
              onDelete={handleDelete}
              showGroup
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{expenseToDelete?.description}"? This action cannot be
              undone.
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
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
