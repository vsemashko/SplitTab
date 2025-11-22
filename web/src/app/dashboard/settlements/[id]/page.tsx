'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Settlement } from '@/types';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Check,
  X,
  Clock,
  ArrowRight,
  Calendar,
  DollarSign,
  FileText,
  Image as ImageIcon,
  Edit,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function SettlementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const settlementId = params.id as string;

  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [settlementId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [settlementData, userData] = await Promise.all([
        apiClient.get<Settlement>(`/settlements/${settlementId}`),
        apiClient.get<{ id: string }>('/users/me'),
      ]);

      setSettlement(settlementData);
      setCurrentUserId(userData.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settlement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setIsConfirming(true);
      await apiClient.post(`/settlements/${settlementId}/confirm`);

      setSettlement((prev) => (prev ? { ...prev, status: 'confirmed' } : null));
      toast.success('Settlement confirmed');
      setConfirmDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to confirm settlement');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = async () => {
    try {
      setIsCancelling(true);
      await apiClient.post(`/settlements/${settlementId}/cancel`);

      setSettlement((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
      toast.success('Settlement cancelled');
      setCancelDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel settlement');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await apiClient.delete(`/settlements/${settlementId}`);

      toast.success('Settlement deleted');
      router.push('/dashboard/settlements');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete settlement');
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error || !settlement) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert variant="destructive">
          <X className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || 'Settlement not found'}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/settlements')}
              className="ml-4"
            >
              Back to Settlements
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isPayer = settlement.payerId === currentUserId;
  const isPayee = settlement.payeeId === currentUserId;
  const canConfirm = isPayee && settlement.status === 'pending';
  const canCancel = (isPayer || isPayee) && settlement.status === 'pending';
  const canDelete =
    (isPayer || isPayee) && settlement.status !== 'confirmed';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: settlement.currency || 'USD',
    }).format(amount);
  };

  const getStatusBadge = () => {
    switch (settlement.status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'confirmed':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Check className="h-3 w-3 mr-1" />
            Confirmed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <X className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
    }
  };

  const getPaymentMethodLabel = (method?: string) => {
    if (!method) return 'Not specified';
    const labels: Record<string, string> = {
      cash: 'Cash',
      credit_card: 'Credit Card',
      debit_card: 'Debit Card',
      bank_transfer: 'Bank Transfer',
      venmo: 'Venmo',
      paypal: 'PayPal',
      zelle: 'Zelle',
      apple_pay: 'Apple Pay',
      google_pay: 'Google Pay',
      other: 'Other',
    };
    return labels[method] || method;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
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
            <h1 className="text-3xl font-bold">Settlement Details</h1>
            <p className="text-muted-foreground">
              Created {format(new Date(settlement.createdAt), 'PPP')}
            </p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Amount Card */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <Avatar className="h-16 w-16 mx-auto mb-2">
                  <AvatarImage src={settlement.payer?.profilePictureUrl} />
                  <AvatarFallback>
                    {settlement.payer?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <p className="font-semibold">{settlement.payer?.name}</p>
                <p className="text-xs text-muted-foreground">Payer</p>
              </div>

              <div className="flex flex-col items-center">
                <ArrowRight className="h-8 w-8 text-green-700 mb-2" />
                <p className="text-4xl font-bold text-green-700">
                  {formatCurrency(settlement.amount)}
                </p>
              </div>

              <div className="text-center">
                <Avatar className="h-16 w-16 mx-auto mb-2">
                  <AvatarImage src={settlement.payee?.profilePictureUrl} />
                  <AvatarFallback>
                    {settlement.payee?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <p className="font-semibold">{settlement.payee?.name}</p>
                <p className="text-xs text-muted-foreground">Payee</p>
              </div>
            </div>

            {isPayer && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                You paid {settlement.payee?.name}
              </Badge>
            )}
            {isPayee && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {settlement.payer?.name} paid you
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Payment Method</span>
              </div>
              <p className="font-medium">
                {getPaymentMethodLabel(settlement.paymentMethod)}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Settlement Date</span>
              </div>
              <p className="font-medium">
                {settlement.settledAt
                  ? format(new Date(settlement.settledAt), 'PPP')
                  : 'Not specified'}
              </p>
            </div>
          </div>

          {settlement.referenceNumber && (
            <>
              <Separator />
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Reference Number</span>
                </div>
                <p className="font-medium font-mono">{settlement.referenceNumber}</p>
              </div>
            </>
          )}

          {settlement.group && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Group</p>
                <p className="font-medium">{settlement.group.name}</p>
              </div>
            </>
          )}

          {settlement.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Notes</p>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm">{settlement.notes}</p>
                </div>
              </div>
            </>
          )}

          {settlement.proofOfPaymentUrl && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ImageIcon className="h-4 w-4" />
                  <span>Proof of Payment</span>
                </div>
                <img
                  src={settlement.proofOfPaymentUrl}
                  alt="Proof of payment"
                  className="max-w-md rounded-lg border"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div className="w-px flex-1 bg-border my-2" />
              </div>
              <div className="flex-1 pb-4">
                <p className="font-medium">Settlement created</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(settlement.createdAt), 'PPP p')}
                </p>
              </div>
            </div>

            {settlement.status === 'confirmed' && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Payment confirmed</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(settlement.updatedAt), 'PPP p')}
                  </p>
                </div>
              </div>
            )}

            {settlement.status === 'cancelled' && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <X className="h-4 w-4 text-gray-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Settlement cancelled</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(settlement.updatedAt), 'PPP p')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {canConfirm && (
          <Button onClick={() => setConfirmDialogOpen(true)} className="flex-1">
            <Check className="h-4 w-4 mr-2" />
            Confirm Payment
          </Button>
        )}

        {canCancel && (
          <Button
            variant="outline"
            onClick={() => setCancelDialogOpen(true)}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel Settlement
          </Button>
        )}

        {canDelete && (
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            className="flex-1"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
      </div>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Settlement</DialogTitle>
            <DialogDescription>
              Are you sure you want to confirm this settlement? This indicates that you
              have received the payment of {formatCurrency(settlement.amount)}.
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
            <Button onClick={handleConfirm} disabled={isConfirming}>
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
              Are you sure you want to cancel this settlement? This action cannot be
              undone.
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
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Settlement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Settlement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this settlement? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
