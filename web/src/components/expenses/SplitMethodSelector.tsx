'use client';

import { ShareType } from '@/types';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { shareTypeLabels } from '@/lib/validations/expense';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SplitMethodSelectorProps {
  value: ShareType;
  onChange: (value: ShareType) => void;
  disabled?: boolean;
}

export function SplitMethodSelector({ value, onChange, disabled = false }: SplitMethodSelectorProps) {
  const getDescription = (shareType: ShareType): string => {
    switch (shareType) {
      case 'equal':
        return 'Split the total amount equally among all participants';
      case 'percentage':
        return 'Each participant pays a percentage of the total (must add up to 100%)';
      case 'exact':
        return 'Specify exact amounts for each participant (must add up to total)';
      case 'shares':
        return 'Assign shares to each participant (calculated proportionally)';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="splitMethod">Split Method</Label>
      <Select value={value} onValueChange={(v) => onChange(v as ShareType)} disabled={disabled}>
        <SelectTrigger id="splitMethod">
          <SelectValue placeholder="Select split method" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(shareTypeLabels).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">{getDescription(value)}</p>
    </div>
  );
}

interface SplitMethodCardProps {
  shareType: ShareType;
  participants: Array<{ userId: string; share: number; name?: string }>;
  totalAmount: number;
  currency: string;
}

export function SplitMethodCard({
  shareType,
  participants,
  totalAmount,
  currency,
}: SplitMethodCardProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const calculateAmount = (share: number): number => {
    switch (shareType) {
      case 'equal':
        return totalAmount / participants.length;
      case 'percentage':
        return (totalAmount * share) / 100;
      case 'exact':
        return share;
      case 'shares':
        const totalShares = participants.reduce((sum, p) => sum + p.share, 0);
        return (totalAmount * share) / totalShares;
      default:
        return 0;
    }
  };

  const total = participants.reduce((sum, p) => sum + calculateAmount(p.share), 0);
  const isValid = Math.abs(total - totalAmount) < 0.01;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Split Preview</CardTitle>
        <CardDescription>How the expense will be split</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {participants.map((participant, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
              <span className="font-medium">{participant.name || `Participant ${index + 1}`}</span>
              <div className="text-right">
                <div className="font-semibold">{formatAmount(calculateAmount(participant.share))}</div>
                {shareType === 'percentage' && (
                  <div className="text-xs text-muted-foreground">{participant.share}%</div>
                )}
                {shareType === 'shares' && (
                  <div className="text-xs text-muted-foreground">{participant.share} shares</div>
                )}
              </div>
            </div>
          ))}

          <div className="pt-2 mt-2 border-t-2">
            <div className="flex justify-between items-center font-bold">
              <span>Total</span>
              <span className={isValid ? 'text-green-600' : 'text-red-600'}>
                {formatAmount(total)}
              </span>
            </div>
            {!isValid && (
              <p className="text-sm text-red-600 mt-1">
                Total does not match expense amount ({formatAmount(totalAmount)})
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
