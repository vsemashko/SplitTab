'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  createGroupSchema,
  CreateGroupInput,
  CURRENCY_OPTIONS,
  GROUP_CATEGORY_OPTIONS,
} from '@/lib/validations/group';
import { ArrowLeft, Plus, X } from 'lucide-react';

export default function CreateGroupPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberEmails, setMemberEmails] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateGroupInput>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: '',
      description: '',
      currency: 'USD',
      memberEmails: [],
    },
  });

  const selectedCategory = watch('category');
  const selectedCurrency = watch('currency');

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleAddMember = () => {
    const trimmedEmail = memberEmail.trim();

    if (!trimmedEmail) {
      toast.error('Please enter an email address');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (memberEmails.includes(trimmedEmail)) {
      toast.error('Email already added');
      return;
    }

    const newEmails = [...memberEmails, trimmedEmail];
    setMemberEmails(newEmails);
    setValue('memberEmails', newEmails);
    setMemberEmail('');
  };

  const handleRemoveMember = (emailToRemove: string) => {
    const newEmails = memberEmails.filter((e) => e !== emailToRemove);
    setMemberEmails(newEmails);
    setValue('memberEmails', newEmails);
  };

  const onSubmit = async (data: CreateGroupInput) => {
    try {
      setIsSubmitting(true);
      const group = await apiClient.post('/groups', {
        ...data,
        memberEmails: memberEmails.length > 0 ? memberEmails : undefined,
      });
      toast.success('Group created successfully');
      router.push(`/dashboard/groups/${(group as { id: string }).id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Create New Group</h1>
        <p className="text-muted-foreground">Set up a new expense group</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the basic details for your group</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Group Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Group Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Trip to Paris, Household Expenses"
                {...register('name')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description for your group"
                {...register('description')}
                className={errors.description ? 'border-destructive' : ''}
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={selectedCategory}
                onValueChange={(value) => setValue('category', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency">
                Currency <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedCurrency}
                onValueChange={(value) => setValue('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.currency && (
                <p className="text-sm text-destructive">{errors.currency.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Initial Members */}
        <Card>
          <CardHeader>
            <CardTitle>Initial Members (Optional)</CardTitle>
            <CardDescription>
              Invite members to your group by adding their email addresses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="member@example.com"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMember();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddMember}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {memberEmails.length > 0 && (
              <div className="space-y-2">
                <Label>Members to invite ({memberEmails.length})</Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-md">
                  {memberEmails.map((email) => (
                    <Badge key={email} variant="secondary" className="px-3 py-1">
                      {email}
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(email)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Group'}
          </Button>
        </div>
      </form>
    </div>
  );
}
