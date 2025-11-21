import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, spacing, textStyles } from '@/theme';
import type { Group } from '@/types';

interface GroupCardProps {
  group: Group;
  onPress: () => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, onPress }) => {
  const getGroupTypeIcon = (type: Group['groupType']) => {
    switch (type) {
      case 'trip':
        return '\u{1F30D}';
      case 'home':
        return '\u{1F3E0}';
      case 'couple':
        return '\u{1F491}';
      default:
        return '\u{1F465}';
    }
  };

  const formatBalance = (balance: number) => {
    const absBalance = Math.abs(balance);
    const formattedAmount = `${group.defaultCurrency} ${absBalance.toFixed(2)}`;

    if (balance > 0) {
      return { text: `You are owed ${formattedAmount}`, color: colors.success.dark };
    } else if (balance < 0) {
      return { text: `You owe ${formattedAmount}`, color: colors.error.dark };
    } else {
      return { text: 'Settled up', color: colors.gray[600] };
    }
  };

  const balanceInfo = group.yourBalance !== undefined ? formatBalance(group.yourBalance) : null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          {group.imageUrl ? (
            <Image source={{ uri: group.imageUrl }} style={styles.groupImage} />
          ) : (
            <Text style={styles.groupEmoji}>{getGroupTypeIcon(group.groupType)}</Text>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.groupName} numberOfLines={1}>
            {group.name}
          </Text>
          {group.description && (
            <Text style={styles.groupDescription} numberOfLines={1}>
              {group.description}
            </Text>
          )}
          <Text style={styles.memberCount}>
            {group.memberCount || group.members.length} member{(group.memberCount || group.members.length) !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {balanceInfo && (
        <View style={styles.balanceContainer}>
          <Text style={[styles.balanceText, { color: balanceInfo.color }]}>
            {balanceInfo.text}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  groupImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  groupEmoji: {
    fontSize: 28,
  },
  info: {
    flex: 1,
  },
  groupName: {
    ...textStyles.h4,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  groupDescription: {
    ...textStyles.bodySmall,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  memberCount: {
    ...textStyles.caption,
    color: colors.gray[500],
  },
  balanceContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  balanceText: {
    ...textStyles.bodySmall,
    fontWeight: '600',
  },
});
