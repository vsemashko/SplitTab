'use client';

import { useState } from 'react';
import { SettlementStatus, PaymentMethod } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface SettlementFilterValues {
  status?: SettlementStatus;
  groupId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: PaymentMethod;
}

interface SettlementFiltersProps {
  filters: SettlementFilterValues;
  onFiltersChange: (filters: SettlementFilterValues) => void;
  groups?: Array<{ id: string; name: string }>;
}

export function SettlementFilters({
  filters,
  onFiltersChange,
  groups = [],
}: SettlementFiltersProps) {
  const [localFilters, setLocalFilters] = useState<SettlementFilterValues>(filters);
  const [isOpen, setIsOpen] = useState(false);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const handleApply = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const emptyFilters: SettlementFilterValues = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const handleClearFilter = (key: keyof SettlementFilterValues) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
    setLocalFilters(newFilters);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter Settlements</SheetTitle>
              <SheetDescription>
                Apply filters to narrow down your settlement list
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Status Filter */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={localFilters.status || ''}
                  onValueChange={(value) =>
                    setLocalFilters({
                      ...localFilters,
                      status: value as SettlementStatus,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Group Filter */}
              {groups.length > 0 && (
                <div className="space-y-2">
                  <Label>Group</Label>
                  <Select
                    value={localFilters.groupId || ''}
                    onValueChange={(value) =>
                      setLocalFilters({ ...localFilters, groupId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All groups" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All groups</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Payment Method Filter */}
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={localFilters.paymentMethod || ''}
                  onValueChange={(value) =>
                    setLocalFilters({
                      ...localFilters,
                      paymentMethod: value as PaymentMethod,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All methods</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="debit_card">Debit Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="venmo">Venmo</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="zelle">Zelle</SelectItem>
                    <SelectItem value="apple_pay">Apple Pay</SelectItem>
                    <SelectItem value="google_pay">Google Pay</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="date"
                      value={localFilters.startDate || ''}
                      onChange={(e) =>
                        setLocalFilters({
                          ...localFilters,
                          startDate: e.target.value,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">From</p>
                  </div>
                  <div>
                    <Input
                      type="date"
                      value={localFilters.endDate || ''}
                      onChange={(e) =>
                        setLocalFilters({
                          ...localFilters,
                          endDate: e.target.value,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">To</p>
                  </div>
                </div>
              </div>

              {/* Amount Range */}
              <div className="space-y-2">
                <Label>Amount Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="number"
                      placeholder="Min"
                      value={localFilters.minAmount || ''}
                      onChange={(e) =>
                        setLocalFilters({
                          ...localFilters,
                          minAmount: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={localFilters.maxAmount || ''}
                      onChange={(e) =>
                        setLocalFilters({
                          ...localFilters,
                          maxAmount: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <Button onClick={handleApply} className="flex-1">
                Apply Filters
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.status}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleClearFilter('status')}
              />
            </Badge>
          )}
          {filters.paymentMethod && (
            <Badge variant="secondary" className="gap-1">
              Method: {filters.paymentMethod.replace('_', ' ')}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleClearFilter('paymentMethod')}
              />
            </Badge>
          )}
          {filters.minAmount && (
            <Badge variant="secondary" className="gap-1">
              Min: ${filters.minAmount}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleClearFilter('minAmount')}
              />
            </Badge>
          )}
          {filters.maxAmount && (
            <Badge variant="secondary" className="gap-1">
              Max: ${filters.maxAmount}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleClearFilter('maxAmount')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
