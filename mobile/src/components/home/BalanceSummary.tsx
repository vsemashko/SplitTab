/**
 * Balance Summary Component
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/common';
import { colors, spacing } from '@/theme';
import { formatCurrency } from '@/utils';

interface BalanceSummaryProps {
  totalOwed: number;
  totalOwing: number;
  currency?: string;
}

export const BalanceSummary: React.FC<BalanceSummaryProps> = ({
  totalOwed,
  totalOwing,
  currency = 'USD',
}) => {
  const netBalance = totalOwed - totalOwing;
  const isPositive = netBalance >= 0;

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>Your Balance</Text>

      <View style={styles.netBalance}>
        <Text style={styles.netBalanceLabel}>Net Balance</Text>
        <Text style={[styles.netBalanceAmount, isPositive ? styles.positive : styles.negative]}>
          {formatCurrency(Math.abs(netBalance), currency)}
        </Text>
        <Text style={styles.netBalanceStatus}>
          {netBalance === 0 ? 'All settled up!' : isPositive ? 'You are owed' : 'You owe'}
        </Text>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>You are owed</Text>
          <Text style={[styles.detailAmount, styles.positive]}>
            {formatCurrency(totalOwed, currency)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>You owe</Text>
          <Text style={[styles.detailAmount, styles.negative]}>
            {formatCurrency(totalOwing, currency)}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: spacing.md,
  },
  netBalance: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  netBalanceLabel: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: spacing.xs,
  },
  netBalanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  netBalanceStatus: {
    fontSize: 14,
    color: colors.gray[600],
  },
  positive: {
    color: colors.success.DEFAULT,
  },
  negative: {
    color: colors.error.DEFAULT,
  },
  detailsContainer: {
    flexDirection: 'row',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: spacing.xs,
  },
  detailAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    backgroundColor: colors.gray[200],
    marginHorizontal: spacing.md,
  },
});
