'use client';

import { Settlement } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface SettlementHistoryProps {
  settlements: Settlement[];
  currentUserId: string;
}

export function SettlementHistory({
  settlements,
  currentUserId,
}: SettlementHistoryProps) {
  const formatCurrency = (amount: number, currency?: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-gray-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
  };

  const sortedSettlements = [...settlements].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settlement History</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedSettlements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No settlement history yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedSettlements.map((settlement) => {
              const isPayer = settlement.payerId === currentUserId;
              const isPayee = settlement.payeeId === currentUserId;

              return (
                <div
                  key={settlement.id}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        settlement.status === 'confirmed'
                          ? 'bg-green-100'
                          : settlement.status === 'cancelled'
                          ? 'bg-gray-100'
                          : 'bg-yellow-100'
                      }`}
                    >
                      {getStatusIcon(settlement.status)}
                    </div>
                  </div>

                  {/* Settlement Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={settlement.payer?.profilePictureUrl} />
                        <AvatarFallback className="text-xs">
                          {settlement.payer?.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {settlement.payer?.name}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={settlement.payee?.profilePictureUrl} />
                        <AvatarFallback className="text-xs">
                          {settlement.payee?.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {settlement.payee?.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{format(new Date(settlement.createdAt), 'MMM d, yyyy')}</span>
                      {settlement.paymentMethod && (
                        <>
                          <span>•</span>
                          <span className="capitalize">
                            {settlement.paymentMethod.replace('_', ' ')}
                          </span>
                        </>
                      )}
                      {settlement.group && (
                        <>
                          <span>•</span>
                          <span>{settlement.group.name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Amount and Status */}
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600 mb-1">
                      {formatCurrency(settlement.amount, settlement.currency)}
                    </p>
                    <Badge
                      variant="outline"
                      className={getStatusColor(settlement.status)}
                    >
                      {settlement.status}
                    </Badge>
                  </div>

                  {/* User Indicator */}
                  {(isPayer || isPayee) && (
                    <div className="text-xs font-medium">
                      {isPayer && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                          You paid
                        </Badge>
                      )}
                      {isPayee && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          You received
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
