/**
 * Home Dashboard Screen
 */
import React, { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useAuthStore } from '@/store';
import { BalanceSummary, QuickActions, RecentExpensesList } from '@/components/home';
import { colors, spacing } from '@/theme';
import type { Expense } from '@/types';

export const HomeScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for now - will be replaced with React Query in Phase 5
  const [mockBalance] = useState({
    totalOwed: 250.5,
    totalOwing: 120.75,
  });

  // Mock expenses data - dates calculated using useMemo to avoid impure function calls during render
  const mockExpenses = useMemo<Expense[]>(() => {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    return [
      {
        id: '1',
        groupId: 'group1',
        description: 'Dinner at Restaurant',
        amount: 85.5,
        currency: 'USD',
        category: 'Food & Dining',
        date: new Date(now - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        createdBy: user?.id || '',
        splitMethod: 'equal',
        paidBy: [],
        splitBetween: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        groupId: 'group1',
        description: 'Uber to Airport',
        amount: 45.25,
        currency: 'USD',
        category: 'Transportation',
        date: new Date(now - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        createdBy: user?.id || '',
        splitMethod: 'equal',
        paidBy: [],
        splitBetween: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        groupId: 'group2',
        description: 'Movie Tickets',
        amount: 32.0,
        currency: 'USD',
        category: 'Entertainment',
        date: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        createdBy: user?.id || '',
        splitMethod: 'equal',
        paidBy: [],
        splitBetween: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const quickActions = [
    {
      icon: '➕',
      label: 'Add Expense',
      onPress: () => Alert.alert('Add Expense', 'This feature will be implemented in Phase 5'),
    },
    {
      icon: '💰',
      label: 'Settle Up',
      onPress: () => Alert.alert('Settle Up', 'This feature will be implemented in Phase 7'),
    },
    {
      icon: '👥',
      label: 'New Group',
      onPress: () => Alert.alert('New Group', 'This feature will be implemented in Phase 4'),
    },
  ];

  const handleExpensePress = (expense: Expense) => {
    Alert.alert(expense.description, `Amount: ${expense.amount}\nCategory: ${expense.category}`, [
      { text: 'OK' },
    ]);
  };

  const handleViewAllExpenses = () => {
    Alert.alert('View All Expenses', 'This will navigate to the expenses screen in Phase 5');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <BalanceSummary
        totalOwed={mockBalance.totalOwed}
        totalOwing={mockBalance.totalOwing}
        currency={user?.defaultCurrency || 'USD'}
      />

      <QuickActions actions={quickActions} />

      <RecentExpensesList
        expenses={mockExpenses}
        onExpensePress={handleExpensePress}
        onViewAll={handleViewAllExpenses}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  content: {
    padding: spacing.lg,
  },
});
