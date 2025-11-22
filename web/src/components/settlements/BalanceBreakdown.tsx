'use client';

import { GroupBalance } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BalanceCard } from './BalanceCard';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BalanceBreakdownProps {
  groupBalances: GroupBalance[];
  currentUserId: string;
  onSettleUp?: (userId: string, amount: number, groupId?: string) => void;
}

export function BalanceBreakdown({
  groupBalances,
  currentUserId,
  onSettleUp,
}: BalanceBreakdownProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(Math.abs(amount));
  };

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="all">All Groups</TabsTrigger>
        <TabsTrigger value="by-group">By Group</TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="space-y-4 mt-6">
        {groupBalances.map((group) =>
          group.members
            .filter((member) => Math.abs(member.balance) > 0.01)
            .map((member) => (
              <BalanceCard
                key={`${group.groupId}-${member.userId}`}
                balance={member}
                currentUserId={currentUserId}
                onSettleUp={
                  onSettleUp
                    ? (userId, amount) => onSettleUp(userId, amount, group.groupId)
                    : undefined
                }
              />
            ))
        )}
      </TabsContent>

      <TabsContent value="by-group" className="space-y-6 mt-6">
        {groupBalances.map((group) => {
          const hasBalances = group.members.some(
            (member) => Math.abs(member.balance) > 0.01
          );

          if (!hasBalances) return null;

          return (
            <Card key={group.groupId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{group.groupName}</CardTitle>
                  <Badge
                    variant={group.netBalance >= 0 ? 'default' : 'destructive'}
                  >
                    Net: {formatCurrency(group.netBalance, group.currency)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.members
                  .filter((member) => Math.abs(member.balance) > 0.01)
                  .map((member) => (
                    <BalanceCard
                      key={member.userId}
                      balance={member}
                      currentUserId={currentUserId}
                      onSettleUp={
                        onSettleUp
                          ? (userId, amount) => onSettleUp(userId, amount, group.groupId)
                          : undefined
                      }
                    />
                  ))}
              </CardContent>
            </Card>
          );
        })}
      </TabsContent>
    </Tabs>
  );
}
