'use client';

import { PersonBalance } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface BalanceCardProps {
  balance: PersonBalance;
  currentUserId: string;
  onSettleUp?: (userId: string, amount: number) => void;
}

export function BalanceCard({ balance, currentUserId, onSettleUp }: BalanceCardProps) {
  const isOwed = balance.balance > 0;
  const absAmount = Math.abs(balance.balance);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: balance.currency || 'USD',
    }).format(amount);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <Avatar className="h-12 w-12">
              <AvatarImage src={balance.userProfilePicture} />
              <AvatarFallback>
                {balance.userName?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <p className="font-semibold text-lg">{balance.userName}</p>
              <div className="flex items-center gap-2 mt-1">
                {isOwed ? (
                  <>
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-green-600 font-medium">
                      owes you
                    </p>
                  </>
                ) : (
                  <>
                    <ArrowDownLeft className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-600 font-medium">
                      you owe
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <p
              className={`text-2xl font-bold ${
                isOwed ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(absAmount)}
            </p>
            {!isOwed && onSettleUp && absAmount > 0 && (
              <Button
                size="sm"
                onClick={() => onSettleUp(balance.userId, absAmount)}
                className="mt-2"
              >
                Settle Up
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
