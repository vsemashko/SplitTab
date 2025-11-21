/**
 * Profile Screen (Placeholder for Phase 9)
 */
import React from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { useAuthStore } from '@/store';
import { Button, Card } from '@/components/common';
import { colors, spacing } from '@/theme';

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuthStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>

      <Card style={styles.card}>
        <Text style={styles.label}>Display Name</Text>
        <Text style={styles.value}>{user?.displayName || 'Not set'}</Text>

        <Text style={[styles.label, styles.spacer]}>Username</Text>
        <Text style={styles.value}>@{user?.username}</Text>

        <Text style={[styles.label, styles.spacer]}>Email</Text>
        <Text style={styles.value}>{user?.email}</Text>

        <Text style={[styles.label, styles.spacer]}>Default Currency</Text>
        <Text style={styles.value}>{user?.defaultCurrency || 'USD'}</Text>
      </Card>

      <Text style={styles.info}>
        Phase 9 will implement:{'\n'}• Edit profile{'\n'}• Upload avatar{'\n'}• Settings &
        preferences
        {'\n'}• Notification settings
      </Text>

      <Button title="Logout" onPress={logout} variant="outline" fullWidth />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.lg,
  },
  card: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[500],
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: 16,
    color: colors.gray[900],
  },
  spacer: {
    marginTop: spacing.md,
  },
  info: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 22,
    marginBottom: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: 8,
  },
});
