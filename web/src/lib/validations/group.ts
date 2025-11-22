/**
 * Group Validation Schemas
 * Validation rules for group-related forms
 */

import { z } from 'zod';

// Group creation validation
export const createGroupSchema = z.object({
  name: z
    .string()
    .min(1, 'Group name is required')
    .min(2, 'Group name must be at least 2 characters')
    .max(100, 'Group name must not exceed 100 characters'),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
  category: z
    .enum([
      'trip',
      'household',
      'event',
      'couple',
      'friends',
      'project',
      'other',
    ])
    .optional(),
  currency: z
    .string()
    .length(3, 'Currency must be a 3-letter code')
    .regex(/^[A-Z]{3}$/, 'Currency must be uppercase letters'),
  memberEmails: z
    .array(z.string().email('Invalid email address'))
    .optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
});

// Group update validation
export const updateGroupSchema = z.object({
  name: z
    .string()
    .min(2, 'Group name must be at least 2 characters')
    .max(100, 'Group name must not exceed 100 characters')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
  category: z
    .enum([
      'trip',
      'household',
      'event',
      'couple',
      'friends',
      'project',
      'other',
    ])
    .optional(),
  currency: z
    .string()
    .length(3, 'Currency must be a 3-letter code')
    .regex(/^[A-Z]{3}$/, 'Currency must be uppercase letters')
    .optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
});

// Add member validation
export const addMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member']).default('member'),
});

// Update member role validation
export const updateMemberRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'member']),
});

// Transfer admin validation
export const transferAdminSchema = z.object({
  newOwnerId: z.string().min(1, 'New owner is required'),
});

// Invitation validation
export const invitationSchema = z.object({
  emails: z
    .array(z.string().email('Invalid email address'))
    .min(1, 'At least one email is required')
    .max(10, 'Cannot invite more than 10 members at once'),
  message: z.string().max(500, 'Message must not exceed 500 characters').optional(),
});

// Types inferred from schemas
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type TransferAdminInput = z.infer<typeof transferAdminSchema>;
export type InvitationInput = z.infer<typeof invitationSchema>;

// Currency options
export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'British Pound (GBP)' },
  { value: 'JPY', label: 'Japanese Yen (JPY)' },
  { value: 'CAD', label: 'Canadian Dollar (CAD)' },
  { value: 'AUD', label: 'Australian Dollar (AUD)' },
  { value: 'CHF', label: 'Swiss Franc (CHF)' },
  { value: 'CNY', label: 'Chinese Yuan (CNY)' },
  { value: 'INR', label: 'Indian Rupee (INR)' },
  { value: 'SGD', label: 'Singapore Dollar (SGD)' },
];

// Group category options
export const GROUP_CATEGORY_OPTIONS = [
  { value: 'trip', label: 'Trip/Vacation', icon: '✈️' },
  { value: 'household', label: 'Household/Roommates', icon: '🏠' },
  { value: 'event', label: 'Event/Party', icon: '🎉' },
  { value: 'couple', label: 'Couple', icon: '💑' },
  { value: 'friends', label: 'Friends', icon: '👥' },
  { value: 'project', label: 'Project', icon: '💼' },
  { value: 'other', label: 'Other', icon: '📋' },
];

// Role options
export const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner', description: 'Full control of the group' },
  { value: 'admin', label: 'Admin', description: 'Manage members and settings' },
  { value: 'member', label: 'Member', description: 'Add expenses and view balances' },
];
