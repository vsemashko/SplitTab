/**
 * Groups List Screen
 * Displays all groups the user is a member of
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import type { MainTabScreenProps } from '@/types';
import { groupsApi } from '@/api';
import { GroupCard } from '@/components/group';
import { colors, spacing, textStyles } from '@/theme';
import type { Group } from '@/types';

export const GroupsListScreen: React.FC = () => {
  // const navigation = useNavigation<MainTabScreenProps<'Groups'>['navigation']>();
  // TODO: Enable navigation when implementing group details and create group screens
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const response = await groupsApi.list();
      setGroups(response.data.items);
    } catch (error) {
      Alert.alert('Error', 'Failed to load groups. Please try again.');
      console.error('Failed to load groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroups(false);
    setRefreshing(false);
  };

  const handleGroupPress = (group: Group) => {
    // Navigation to GroupDetail will be implemented in next step
    Alert.alert(group.name, 'Group details coming soon!');
  };

  const handleCreateGroup = () => {
    // Navigation to CreateGroup will be implemented in next step
    Alert.alert('Create Group', 'Create group screen coming soon!');
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>👥</Text>
      <Text style={styles.emptyTitle}>No Groups Yet</Text>
      <Text style={styles.emptyText}>
        Create a group to start splitting expenses with friends and family
      </Text>
      <TouchableOpacity style={styles.createButton} onPress={handleCreateGroup}>
        <Text style={styles.createButtonText}>Create Your First Group</Text>
      </TouchableOpacity>
    </View>
  );

  const renderGroup = ({ item }: { item: Group }) => (
    <GroupCard group={item} onPress={() => handleGroupPress(item)} />
  );

  if (isLoading && groups.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading groups...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        renderItem={renderGroup}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, groups.length === 0 && styles.listContentEmpty]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {groups.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleCreateGroup} activeOpacity={0.8}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
  },
  loadingText: {
    ...textStyles.body,
    color: colors.gray[600],
  },
  listContent: {
    padding: spacing.lg,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...textStyles.h2,
    color: colors.gray[900],
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    ...textStyles.body,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  createButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  createButtonText: {
    ...textStyles.button,
    color: colors.white,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 32,
    color: colors.white,
    fontWeight: 'bold',
  },
});
