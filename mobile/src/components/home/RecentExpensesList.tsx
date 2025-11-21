/**
 * Recent Expenses List Component
 */
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Card } from '@/components/common';
import { colors, spacing } from '@/theme';
import { formatCurrency, formatRelativeTime } from '@/utils';
import type { Expense } from '@/types';

interface RecentExpensesListProps {
  expenses: Expense[];
  onExpensePress?: (expense: Expense) => void;
  onViewAll?: () => void;
}

export const RecentExpensesList: React.FC<RecentExpensesListProps> = ({
  expenses,
  onExpensePress,
  onViewAll,
}) => {
  if (expenses.length === 0) {
    return (
      <Card style={styles.container}>
        <Text style={styles.title}>Recent Expenses</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyText}>No expenses yet</Text>
          <Text style={styles.emptySubtext}>Add your first expense to get started</Text>
        </View>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Expenses</Text>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      <Card style={styles.listContainer}>
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExpenseItem expense={item} onPress={() => onExpensePress?.(item)} />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          scrollEnabled={false}
        />
      </Card>
    </View>
  );
};

interface ExpenseItemProps {
  expense: Expense;
  onPress?: () => void;
}

const ExpenseItem: React.FC<ExpenseItemProps> = ({ expense, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.expenseItem}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.expenseIconContainer}>
        <Text style={styles.expenseIcon}>{getCategoryIcon(expense.category)}</Text>
      </View>

      <View style={styles.expenseDetails}>
        <Text style={styles.expenseDescription}>{expense.description}</Text>
        <Text style={styles.expenseDate}>{formatRelativeTime(expense.date)}</Text>
      </View>

      <View style={styles.expenseAmount}>
        <Text style={styles.expenseAmountText}>
          {formatCurrency(expense.amount, expense.currency)}
        </Text>
        <Text style={styles.expenseCategory}>{expense.category}</Text>
      </View>
    </TouchableOpacity>
  );
};

const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    'Food & Dining': '🍽️',
    Transportation: '🚗',
    Entertainment: '🎬',
    Shopping: '🛍️',
    Utilities: '💡',
    Housing: '🏠',
    Healthcare: '🏥',
    Travel: '✈️',
    Education: '📚',
    Other: '📌',
  };
  return icons[category] || '📌';
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
  },
  viewAll: {
    fontSize: 14,
    color: colors.primary[500],
    fontWeight: '600',
  },
  listContainer: {
    padding: 0,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  expenseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  expenseIcon: {
    fontSize: 24,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.gray[900],
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 12,
    color: colors.gray[500],
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  expenseAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 2,
  },
  expenseCategory: {
    fontSize: 11,
    color: colors.gray[500],
  },
  separator: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginLeft: spacing.md + 48 + spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray[500],
  },
});
