'use client';

import { useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExpenseCategory, Group } from '@/types';
import { categoryLabels } from '@/lib/validations/expense';

export interface ExpenseFilterValues {
  groupId?: string;
  category?: ExpenseCategory;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

interface ExpenseFiltersProps {
  filters: ExpenseFilterValues;
  onFiltersChange: (filters: ExpenseFilterValues) => void;
  groups?: Group[];
  onReset?: () => void;
}

export function ExpenseFilters({
  filters,
  onFiltersChange,
  groups = [],
  onReset,
}: ExpenseFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof ExpenseFilterValues, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const handleReset = () => {
    onFiltersChange({});
    onReset?.();
  };

  const activeFilterCount = Object.values(filters).filter((v) => v !== undefined && v !== '').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          <div className="flex gap-2">
            {activeFilterCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleReset}>
                Clear ({activeFilterCount})
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Hide' : 'Show'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              type="text"
              placeholder="Search by description..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          {/* Group Filter */}
          {groups.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="group">Group</Label>
              <Select
                value={filters.groupId || ''}
                onValueChange={(value) => handleFilterChange('groupId', value)}
              >
                <SelectTrigger id="group">
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

          {/* Category Filter */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={filters.category || ''}
              onValueChange={(value) => handleFilterChange('category', value as ExpenseCategory)}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>

          {/* Amount Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minAmount">Min Amount</Label>
              <Input
                id="minAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={filters.minAmount || ''}
                onChange={(e) =>
                  handleFilterChange('minAmount', e.target.value ? parseFloat(e.target.value) : undefined)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxAmount">Max Amount</Label>
              <Input
                id="maxAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={filters.maxAmount || ''}
                onChange={(e) =>
                  handleFilterChange('maxAmount', e.target.value ? parseFloat(e.target.value) : undefined)
                }
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
