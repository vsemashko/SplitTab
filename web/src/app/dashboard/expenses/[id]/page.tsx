'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Expense } from '@/types';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { categoryIcons, categoryLabels } from '@/lib/validations/expense';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ChevronLeft, Edit, Trash2, AlertCircle, Download, Receipt } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function ExpenseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const expenseId = params.id as string;

  const [expense, setExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await apiClient.get<Expense>(`/expenses/${expenseId}`);
        setExpense(data);
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

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await apiClient.delete(`/expenses/${expenseId}`);
      toast.success('Expense deleted successfully');
      router.push('/dashboard/expenses');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete expense');
    } finally {
      setIsDeleting(false);
    }
  };

  const calculateParticipantAmount = (share: number, shareType: string): number => {
    if (!expense) return 0;

    switch (shareType) {
      case 'equal':
        return expense.amount / (expense.participants?.length || 1);
      case 'percentage':
        return (expense.amount * share) / 100;
      case 'exact':
        return share;
      case 'shares':
        const totalShares = expense.participants?.reduce((sum, p) => sum + p.share, 0) || 1;
        return (expense.amount * share) / totalShares;
      default:
        return 0;
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
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

  const categoryIcon = categoryIcons[expense.category];
  const categoryLabel = categoryLabels[expense.category];

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Expense Details</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/expenses/${expenseId}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{categoryIcon}</span>
              <div>
                <CardTitle className="text-2xl">{expense.description}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{categoryLabel}</Badge>
                  {expense.group && (
                    <Link href={`/dashboard/groups/${expense.groupId}`}>
                      <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                        {expense.group.name}
                      </Badge>
                    </Link>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {formatCurrency(expense.amount, expense.currency)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(expense.expenseDate), 'MMMM dd, yyyy')}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Paid By</p>
              <p className="font-semibold">{expense.payer?.name || 'Unknown'}</p>
              <p className="text-sm text-muted-foreground">{expense.payer?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-semibold">{format(new Date(expense.createdAt), 'PPp')}</p>
            </div>
          </div>

          {expense.notes && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Notes</p>
              <p className="text-sm bg-muted p-3 rounded-md">{expense.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Participants Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Split Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expense.participants?.map((participant) => {
              const amount = calculateParticipantAmount(participant.share, participant.shareType);
              const isPayer = participant.userId === expense.paidBy;

              return (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                      {participant.user?.name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-semibold">{participant.user?.name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">
                        {participant.user?.email}
                        {isPayer && ' (Paid)'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">
                      {formatCurrency(amount, expense.currency)}
                    </p>
                    {participant.shareType === 'percentage' && (
                      <p className="text-sm text-muted-foreground">{participant.share}%</p>
                    )}
                    {participant.shareType === 'shares' && (
                      <p className="text-sm text-muted-foreground">{participant.share} shares</p>
                    )}
                    {participant.isPaid && (
                      <Badge variant="success" className="mt-1">
                        Settled
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <span className="font-semibold">Total</span>
            <span className="text-2xl font-bold">
              {formatCurrency(expense.amount, expense.currency)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Images */}
      {expense.receiptUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Receipt Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div
                className="aspect-square relative rounded-lg overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedReceipt(expense.receiptUrl!)}
              >
                <Image
                  src={expense.receiptUrl}
                  alt="Receipt"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-2 bg-primary rounded-full" />
              <div className="flex-1 pb-3">
                <p className="font-semibold">Expense created</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(expense.createdAt), 'PPp')}
                </p>
              </div>
            </div>
            {expense.updatedAt !== expense.createdAt && (
              <div className="flex gap-3">
                <div className="w-2 bg-muted rounded-full" />
                <div className="flex-1">
                  <p className="font-semibold">Expense updated</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(expense.updatedAt), 'PPp')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{expense.description}"? This action cannot be undone and
              will affect all participants.
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
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Image Dialog */}
      {selectedReceipt && (
        <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Receipt Image</DialogTitle>
            </DialogHeader>
            <div className="relative w-full h-[600px]">
              <Image
                src={selectedReceipt}
                alt="Receipt"
                fill
                className="object-contain"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedReceipt(null)}>
                Close
              </Button>
              <Button asChild>
                <a href={selectedReceipt} download target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
