'use client';

import { useState } from 'react';
import { SettlementSuggestion } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Info,
  TrendingDown,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SettlementSuggestionsProps {
  suggestions: SettlementSuggestion[];
  currentUserId: string;
  originalTransactionCount?: number;
  onCreateSettlement?: (suggestion: SettlementSuggestion) => void;
  onSettleAll?: () => void;
  isLoading?: boolean;
}

export function SettlementSuggestions({
  suggestions,
  currentUserId,
  originalTransactionCount,
  onCreateSettlement,
  onSettleAll,
  isLoading = false,
}: SettlementSuggestionsProps) {
  const [createdSettlements, setCreatedSettlements] = useState<Set<string>>(
    new Set()
  );

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const handleCreateSettlement = (suggestion: SettlementSuggestion) => {
    const key = `${suggestion.payerId}-${suggestion.payeeId}`;
    setCreatedSettlements(new Set(createdSettlements).add(key));
    onCreateSettlement?.(suggestion);
  };

  const isCreated = (suggestion: SettlementSuggestion) => {
    const key = `${suggestion.payerId}-${suggestion.payeeId}`;
    return createdSettlements.has(key);
  };

  if (suggestions.length === 0) {
    return (
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          All balances are settled! No settlements needed.
        </AlertDescription>
      </Alert>
    );
  }

  const reduction = originalTransactionCount
    ? originalTransactionCount - suggestions.length
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <CardTitle>Smart Settlement Suggestions</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Our algorithm minimizes the number of transactions needed to
                    settle all debts in your group.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {onSettleAll && (
            <Button
              onClick={onSettleAll}
              disabled={isLoading || createdSettlements.size === suggestions.length}
            >
              {isLoading ? 'Creating...' : 'Settle All'}
            </Button>
          )}
        </div>

        {reduction > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <TrendingDown className="h-4 w-4 text-green-600" />
            <p className="text-sm text-muted-foreground">
              Optimized from {originalTransactionCount} transactions to{' '}
              <span className="font-semibold text-green-600">
                {suggestions.length}
              </span>{' '}
              (saved {reduction} transaction{reduction !== 1 ? 's' : ''})
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {suggestions.map((suggestion, index) => {
          const created = isCreated(suggestion);
          const isCurrentUserPayer = suggestion.payerId === currentUserId;

          return (
            <div
              key={`${suggestion.payerId}-${suggestion.payeeId}-${index}`}
              className={`p-4 rounded-lg border transition-all ${
                created
                  ? 'bg-green-50 border-green-200'
                  : 'bg-card hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <Badge variant="outline" className="font-mono">
                    #{index + 1}
                  </Badge>

                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="mb-1">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {suggestion.payerName?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <p className="text-xs font-medium max-w-[80px] truncate">
                        {suggestion.payerName}
                      </p>
                    </div>

                    <div className="flex flex-col items-center">
                      <ArrowRight className="h-5 w-5 text-muted-foreground mb-1" />
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(suggestion.amount, suggestion.currency)}
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="mb-1">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {suggestion.payeeName?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <p className="text-xs font-medium max-w-[80px] truncate">
                        {suggestion.payeeName}
                      </p>
                    </div>
                  </div>

                  {isCurrentUserPayer && (
                    <Badge variant="secondary">You pay</Badge>
                  )}
                </div>

                <div>
                  {created ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-medium">Created</span>
                    </div>
                  ) : (
                    onCreateSettlement && (
                      <Button
                        size="sm"
                        onClick={() => handleCreateSettlement(suggestion)}
                        disabled={isLoading}
                      >
                        Create Settlement
                      </Button>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
