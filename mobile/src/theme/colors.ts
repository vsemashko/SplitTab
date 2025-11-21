/**
 * Color palette
 */

export const colors = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  success: {
    light: '#4ade80',
    DEFAULT: '#10b981',
    dark: '#059669',
  },
  warning: {
    light: '#fbbf24',
    DEFAULT: '#f59e0b',
    dark: '#d97706',
  },
  error: {
    light: '#f87171',
    DEFAULT: '#ef4444',
    dark: '#dc2626',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const lightTheme = {
  background: colors.white,
  surface: colors.gray[50],
  surfaceVariant: colors.gray[100],
  text: {
    primary: colors.gray[900],
    secondary: colors.gray[600],
    tertiary: colors.gray[500],
    disabled: colors.gray[400],
  },
  border: colors.gray[200],
  divider: colors.gray[200],
  primary: colors.primary[500],
  primaryVariant: colors.primary[700],
  success: colors.success.DEFAULT,
  warning: colors.warning.DEFAULT,
  error: colors.error.DEFAULT,
} as const;

export const darkTheme = {
  background: colors.gray[900],
  surface: colors.gray[800],
  surfaceVariant: colors.gray[700],
  text: {
    primary: colors.white,
    secondary: colors.gray[300],
    tertiary: colors.gray[400],
    disabled: colors.gray[600],
  },
  border: colors.gray[700],
  divider: colors.gray[700],
  primary: colors.primary[400],
  primaryVariant: colors.primary[600],
  success: colors.success.light,
  warning: colors.warning.light,
  error: colors.error.light,
} as const;

export type Theme = typeof lightTheme;
