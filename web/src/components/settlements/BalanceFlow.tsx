'use client';

import { PersonBalance } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowRight } from 'lucide-react';

interface BalanceFlowProps {
  balances: PersonBalance[];
  currentUserId: string;
}

export function BalanceFlow({ balances, currentUserId }: BalanceFlowProps) {
  const creditors = balances.filter((b) => b.balance > 0);
  const debtors = balances.filter((b) => b.balance < 0);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(Math.abs(amount));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balance Flow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Creditors */}
          {creditors.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-green-600 mb-3">
                People who are owed money
              </h3>
              <div className="space-y-3">
                {creditors.map((creditor) => (
                  <div
                    key={creditor.userId}
                    className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={creditor.userProfilePicture} />
                      <AvatarFallback>
                        {creditor.userName?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{creditor.userName}</p>
                      <p className="text-sm text-muted-foreground">is owed</p>
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      +{formatCurrency(creditor.balance, creditor.currency)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flow Arrow */}
          {creditors.length > 0 && debtors.length > 0 && (
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-px w-20 bg-border" />
                <ArrowRight className="h-5 w-5" />
                <div className="h-px w-20 bg-border" />
              </div>
            </div>
          )}

          {/* Debtors */}
          {debtors.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-600 mb-3">
                People who owe money
              </h3>
              <div className="space-y-3">
                {debtors.map((debtor) => (
                  <div
                    key={debtor.userId}
                    className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={debtor.userProfilePicture} />
                      <AvatarFallback>
                        {debtor.userName?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{debtor.userName}</p>
                      <p className="text-sm text-muted-foreground">owes</p>
                    </div>
                    <p className="text-lg font-bold text-red-600">
                      {formatCurrency(debtor.balance, debtor.currency)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {creditors.length === 0 && debtors.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>All balanced! No money owed.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
