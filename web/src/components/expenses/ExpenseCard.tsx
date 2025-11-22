'use client';

import { Expense } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { categoryIcons, categoryLabels } from '@/lib/validations/expense';
import { format } from 'date-fns';
import Link from 'next/link';

interface ExpenseCardProps {
  expense: Expense;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
  showGroup?: boolean;
}

export function ExpenseCard({ expense, onEdit, onDelete, showGroup = true }: ExpenseCardProps) {
  const categoryIcon = categoryIcons[expense.category];
  const categoryLabel = categoryLabels[expense.category];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{categoryIcon}</span>
              <div>
                <Link
                  href={`/dashboard/expenses/${expense.id}`}
                  className="font-semibold hover:underline"
                >
                  {expense.description}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {categoryLabel}
                  </Badge>
                  {showGroup && expense.group && (
                    <Badge variant="secondary" className="text-xs">
                      {expense.group.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <span>Paid by {expense.payer?.name || 'Unknown'}</span>
              <span>{format(new Date(expense.expenseDate), 'MMM dd, yyyy')}</span>
              {expense.participants && (
                <span>{expense.participants.length} participant{expense.participants.length !== 1 ? 's' : ''}</span>
              )}
            </div>

            {expense.notes && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{expense.notes}</p>
            )}
          </div>

          <div className="text-right ml-4">
            <div className="text-2xl font-bold">
              {formatCurrency(expense.amount, expense.currency)}
            </div>
            <div className="mt-2 flex gap-1">
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    onEdit(expense);
                  }}
                >
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete(expense);
                  }}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
