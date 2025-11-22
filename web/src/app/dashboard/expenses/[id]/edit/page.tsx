'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CategoryPicker } from '@/components/expenses/CategoryPicker';
import { Expense, ExpenseCategory } from '@/types';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { ChevronLeft, Save, AlertCircle } from 'lucide-react';

export default function EditExpensePage() {
  const router = useRouter();
  const params = useParams();
  const expenseId = params.id as string;

  const [expense, setExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form fields
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await apiClient.get<Expense>(`/expenses/${expenseId}`);
        setExpense(data);

        // Populate form fields
        setDescription(data.description);
        setAmount(data.amount.toString());
        setExpenseDate(data.expenseDate.split('T')[0]);
        setCategory(data.category);
        setNotes(data.notes || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load expense');
      } finally {
        setIsLoading(false);
      }
    };

    if (expenseId) {
      fetchExpense();
    }
  }, [expenseId]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.length < 3) {
      newErrors.description = 'Description must be at least 3 characters';
    }

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!expenseDate) {
      newErrors.expenseDate = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setIsSaving(true);

      const updateData = {
        description: description.trim(),
        amount: parseFloat(amount),
        expenseDate,
        category,
        notes: notes.trim() || undefined,
      };

      await apiClient.put(`/expenses/${expenseId}`, updateData);

      toast.success('Expense updated successfully!');
      router.push(`/dashboard/expenses/${expenseId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update expense');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-3xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 flex-1" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="container max-w-3xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || 'Expense not found'}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/expenses')}
              className="ml-4"
            >
              Back to Expenses
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Edit Expense</h1>
          <p className="text-muted-foreground">Update expense details</p>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Expense Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Note: You can only edit basic information. To change the split or participants, please
                delete and create a new expense.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Dinner at restaurant"
                maxLength={200}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
              {errors.amount && <p className="text-sm text-red-600">{errors.amount}</p>}
              <p className="text-sm text-muted-foreground">
                Current currency: {expense.currency}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.expenseDate && (
                <p className="text-sm text-red-600">{errors.expenseDate}</p>
              )}
            </div>

            <CategoryPicker value={category} onChange={setCategory} />

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes..."
                maxLength={500}
                rows={4}
              />
              <p className="text-sm text-muted-foreground">{notes.length}/500 characters</p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
