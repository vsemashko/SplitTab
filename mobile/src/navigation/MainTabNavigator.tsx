/**
 * Main Bottom Tab Navigator
 */
import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '@/screens/home';
import { GroupsListScreen } from '@/screens/groups';
import { ProfileScreen } from '@/screens/profile';
import type { MainTabParamList } from '@/types';
import { colors } from '@/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Placeholder components for tabs not yet implemented
const AddExpenseScreen = () => null;
const ActivityScreen = () => null;

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.gray[500],
        tabBarStyle: {
          borderTopColor: colors.gray[200],
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        headerStyle: {
          backgroundColor: colors.primary[500],
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Home',
          tabBarIcon: () => <TabIcon>🏠</TabIcon>,
        }}
      />
      <Tab.Screen
        name="Groups"
        component={GroupsListScreen}
        options={{
          title: 'My Groups',
          tabBarLabel: 'Groups',
          tabBarIcon: () => <TabIcon>👥</TabIcon>,
        }}
      />
      <Tab.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={{
          title: 'Add Expense',
          tabBarLabel: 'Add',
          tabBarIcon: () => <TabIcon>➕</TabIcon>,
        }}
      />
      <Tab.Screen
        name="Activity"
        component={ActivityScreen}
        options={{
          title: 'Activity',
          tabBarLabel: 'Activity',
          tabBarIcon: () => <TabIcon>📊</TabIcon>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: () => <TabIcon>👤</TabIcon>,
        }}
      />
    </Tab.Navigator>
  );
};

// Simple tab icon component (using emoji until icons are added)
const TabIcon: React.FC<{ children: string }> = ({ children }) => (
  <Text style={{ fontSize: 24 }}>{children}</Text>
);
