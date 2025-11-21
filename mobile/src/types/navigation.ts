/**
 * Navigation types
 */
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// Root Stack
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Groups: undefined;
  AddExpense: undefined;
  Activity: undefined;
  Profile: undefined;
};

// Groups Stack
export type GroupsStackParamList = {
  GroupsList: undefined;
  GroupDetail: { groupId: string };
  CreateGroup: undefined;
  GroupSettings: { groupId: string };
  InviteMembers: { groupId: string };
};

// Expenses Stack
export type ExpensesStackParamList = {
  ExpensesList: { groupId?: string };
  ExpenseDetail: { expenseId: string };
  CreateExpense: { groupId?: string };
  EditExpense: { expenseId: string };
  ScanReceipt: { groupId?: string };
};

// Settlements Stack
export type SettlementsStackParamList = {
  SettlementsList: { groupId?: string };
  CreateSettlement: { groupId: string; fromUserId?: string; toUserId?: string };
  SettlementDetail: { settlementId: string };
};

// Screen Props Types
export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

export type GroupsStackScreenProps<T extends keyof GroupsStackParamList> = NativeStackScreenProps<
  GroupsStackParamList,
  T
>;

export type ExpensesStackScreenProps<T extends keyof ExpensesStackParamList> =
  NativeStackScreenProps<ExpensesStackParamList, T>;

export type SettlementsStackScreenProps<T extends keyof SettlementsStackParamList> =
  NativeStackScreenProps<SettlementsStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
