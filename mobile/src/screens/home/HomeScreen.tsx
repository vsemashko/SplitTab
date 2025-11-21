/**
 * Home Screen (Placeholder for Phase 3)
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store';
import { Button } from '@/components/common';
import { colors, spacing } from '@/theme';

export const HomeScreen: React.FC = () => {
  const { user, logout } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to SplitTab!</Text>
      <Text style={styles.subtitle}>Hello, {user?.displayName || user?.username}!</Text>
      <Text style={styles.email}>{user?.email}</Text>

      <View style={styles.content}>
        <Text style={styles.info}>
          This is a placeholder home screen.{'\n\n'}
          Phase 3 will implement:{'\n'}
          • Dashboard with balance summary{'\n'}
          • Recent expenses{'\n'}
          • Quick actions{'\n'}
          • Bottom tab navigation
        </Text>
      </View>

      <Button title="Logout" onPress={logout} fullWidth variant="outline" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: colors.gray[700],
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  email: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  content: {
    backgroundColor: colors.gray[50],
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.xl,
  },
  info: {
    fontSize: 16,
    color: colors.gray[700],
    lineHeight: 24,
  },
});
