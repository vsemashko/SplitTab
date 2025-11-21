/**
 * Groups List Screen (Placeholder for Phase 4)
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme';

export const GroupsListScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Groups</Text>
      <Text style={styles.text}>Phase 4 will implement group management</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  text: {
    fontSize: 16,
    color: colors.gray[600],
  },
});
