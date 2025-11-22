'use client';

import { Settlement } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ArrowRight,
  Check,
  X,
  Clock,
  MoreVertical,
  Eye
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';

interface SettlementCardProps {
  settlement: Settlement;
  currentUserId: string;
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function SettlementCard({
  settlement,
  currentUserId,
  onConfirm,
  onCancel,
  onDelete,
}: SettlementCardProps) {
  const router = useRouter();

  const isPayer = settlement.payerId === currentUserId;
  const isPayee = settlement.payeeId === currentUserId;
  const otherUser = isPayer ? settlement.payee : settlement.payer;

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: settlement.currency || 'USD',
    }).format(amount);
  };

  const getPaymentMethodLabel = (method?: string) => {
    if (!method) return null;
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
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarImage src={settlement.payer?.profilePictureUrl} />
              <AvatarFallback>
                {settlement.payer?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>

            <ArrowRight className="h-4 w-4 text-muted-foreground" />

            <Avatar className="h-10 w-10">
              <AvatarImage src={settlement.payee?.profilePictureUrl} />
              <AvatarFallback>
                {settlement.payee?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">
                  {settlement.payer?.name || 'Unknown'}
                </p>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <p className="font-medium">
                  {settlement.payee?.name || 'Unknown'}
                </p>
              </div>
              {settlement.group && (
                <p className="text-sm text-muted-foreground">
                  {settlement.group.name}
                </p>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/dashboard/settlements/${settlement.id}`)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              {settlement.status === 'pending' && isPayee && onConfirm && (
                <DropdownMenuItem onClick={() => onConfirm(settlement.id)}>
                  <Check className="h-4 w-4 mr-2" />
                  Confirm Payment
                </DropdownMenuItem>
              )}
              {settlement.status === 'pending' && (isPayer || isPayee) && onCancel && (
                <DropdownMenuItem onClick={() => onCancel(settlement.id)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </DropdownMenuItem>
              )}
              {settlement.status !== 'confirmed' && (isPayer || isPayee) && onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(settlement.id)}
                  className="text-destructive"
                >
                  <X className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(settlement.amount)}
            </p>
            {settlement.paymentMethod && (
              <p className="text-sm text-muted-foreground">
                via {getPaymentMethodLabel(settlement.paymentMethod)}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {getStatusBadge()}
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(settlement.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        {settlement.notes && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-sm">{settlement.notes}</p>
          </div>
        )}

        {isPayer && (
          <div className="mt-3 text-sm text-amber-600 font-medium">
            You paid {otherUser?.name || 'someone'}
          </div>
        )}
        {isPayee && (
          <div className="mt-3 text-sm text-green-600 font-medium">
            {otherUser?.name || 'Someone'} paid you
          </div>
        )}
      </CardContent>
    </Card>
  );
}
