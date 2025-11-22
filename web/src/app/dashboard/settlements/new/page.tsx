'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Group, PaymentMethod, SettlementCreate } from '@/types';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PaymentMethodPicker } from '@/components/settlements/PaymentMethodPicker';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function NewSettlementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [groups, setGroups] = useState<Group[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<SettlementCreate>({
    groupId: searchParams.get('groupId') || undefined,
    payerId: '',
    payeeId: searchParams.get('payeeId') || '',
    amount: searchParams.get('amount') ? Number(searchParams.get('amount')) : 0,
    paymentMethod: undefined,
    referenceNumber: '',
    notes: '',
    settledAt: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [proofFiles, setProofFiles] = useState<File[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.groupId && groups.length > 0) {
      const group = groups.find((g) => g.id === formData.groupId);
      setSelectedGroup(group || null);
    } else {
      setSelectedGroup(null);
    }
  }, [formData.groupId, groups]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const [groupsData, userData] = await Promise.all([
        apiClient.get<Group[]>('/groups'),
        apiClient.get<{ id: string }>('/users/me'),
      ]);

      setGroups(groupsData);
      setCurrentUserId(userData.id);

      // Set current user as payer by default
      setFormData((prev) => ({
        ...prev,
        payerId: userData.id,
      }));
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.payerId) {
      newErrors.payerId = 'Payer is required';
    }

    if (!formData.payeeId) {
      newErrors.payeeId = 'Payee is required';
    }

    if (formData.payerId === formData.payeeId) {
      newErrors.payeeId = 'Payer and payee must be different';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (formData.amount > 1000000) {
      newErrors.amount = 'Amount is too large';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setIsSubmitting(true);

      // Create settlement
      const settlement = await apiClient.post('/settlements', formData);

      // Upload proof of payment if any
      if (proofFiles.length > 0) {
        // TODO: Implement file upload
        console.log('Files to upload:', proofFiles);
      }

      toast.success('Settlement created successfully');
      router.push('/dashboard/settlements');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create settlement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setProofFiles([...proofFiles, ...files]);
  };

  const removeFile = (index: number) => {
    setProofFiles(proofFiles.filter((_, i) => i !== index));
  };

  const getGroupMembers = () => {
    if (!selectedGroup || !selectedGroup.members) return [];
    return selectedGroup.members.filter((m) => m.user);
  };

  const getUserName = (userId: string) => {
    if (userId === currentUserId) return 'Me';

    if (selectedGroup) {
      const member = selectedGroup.members?.find((m) => m.userId === userId);
      return member?.user?.name || 'Unknown';
    }

    return 'Unknown';
  };

  const getAvailablePayees = () => {
    const members = getGroupMembers();
    return members.filter((m) => m.userId !== formData.payerId);
  };

  const getAvailablePayers = () => {
    const members = getGroupMembers();
    return members.filter((m) => m.userId !== formData.payeeId);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/settlements')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Settlement</h1>
          <p className="text-muted-foreground">Record a payment between group members</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Settlement Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Group Selection */}
            <div className="space-y-2">
              <Label htmlFor="group">
                Group <span className="text-xs text-muted-foreground">(Optional)</span>
              </Label>
              <Select
                value={formData.groupId || ''}
                onValueChange={(value) =>
                  setFormData({ ...formData, groupId: value || undefined })
                }
              >
                <SelectTrigger id="group">
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No group</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payer Selection */}
            <div className="space-y-2">
              <Label htmlFor="payer">
                Payer <span className="text-destructive">*</span>
              </Label>
              {selectedGroup ? (
                <Select
                  value={formData.payerId}
                  onValueChange={(value) => setFormData({ ...formData, payerId: value })}
                >
                  <SelectTrigger
                    id="payer"
                    className={errors.payerId ? 'border-destructive' : ''}
                  >
                    <SelectValue placeholder="Select payer" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailablePayers().map((member) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.user?.profilePictureUrl} />
                            <AvatarFallback className="text-xs">
                              {member.user?.name?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          {member.user?.name}
                          {member.userId === currentUserId && ' (You)'}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="payer"
                  value={getUserName(formData.payerId)}
                  disabled
                  placeholder="Select a group first"
                />
              )}
              {errors.payerId && (
                <p className="text-sm text-destructive">{errors.payerId}</p>
              )}
            </div>

            {/* Payee Selection */}
            <div className="space-y-2">
              <Label htmlFor="payee">
                Payee (Recipient) <span className="text-destructive">*</span>
              </Label>
              {selectedGroup ? (
                <Select
                  value={formData.payeeId}
                  onValueChange={(value) => setFormData({ ...formData, payeeId: value })}
                >
                  <SelectTrigger
                    id="payee"
                    className={errors.payeeId ? 'border-destructive' : ''}
                  >
                    <SelectValue placeholder="Select payee" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailablePayees().map((member) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.user?.profilePictureUrl} />
                            <AvatarFallback className="text-xs">
                              {member.user?.name?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          {member.user?.name}
                          {member.userId === currentUserId && ' (You)'}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="payee"
                  disabled
                  placeholder="Select a group first"
                  className={errors.payeeId ? 'border-destructive' : ''}
                />
              )}
              {errors.payeeId && (
                <p className="text-sm text-destructive">{errors.payeeId}</p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max="1000000"
                value={formData.amount || ''}
                onChange={(e) =>
                  setFormData({ ...formData, amount: Number(e.target.value) })
                }
                className={errors.amount ? 'border-destructive' : ''}
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount}</p>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <PaymentMethodPicker
                value={formData.paymentMethod}
                onChange={(value) => setFormData({ ...formData, paymentMethod: value })}
              />
            </div>

            {/* Reference Number */}
            <div className="space-y-2">
              <Label htmlFor="referenceNumber">
                Reference Number{' '}
                <span className="text-xs text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="referenceNumber"
                value={formData.referenceNumber || ''}
                onChange={(e) =>
                  setFormData({ ...formData, referenceNumber: e.target.value })
                }
                placeholder="Transaction ID, check number, etc."
                maxLength={100}
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Settlement Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.settledAt?.split('T')[0] || ''}
                onChange={(e) =>
                  setFormData({ ...formData, settledAt: e.target.value })
                }
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">
                Notes <span className="text-xs text-muted-foreground">(Optional)</span>
              </Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any additional notes..."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.notes?.length || 0}/500
              </p>
            </div>

            {/* Proof of Payment Upload */}
            <div className="space-y-2">
              <Label htmlFor="proof">
                Proof of Payment{' '}
                <span className="text-xs text-muted-foreground">(Optional)</span>
              </Label>
              <div className="space-y-2">
                <Input
                  id="proof"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {proofFiles.length > 0 && (
                  <div className="space-y-2">
                    {proofFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded"
                      >
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          <span className="text-sm">{file.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {formData.payerId && formData.payeeId && formData.amount > 0 && (
          <Card className="bg-muted/50">
            <CardContent className="p-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Summary</p>
                <p className="text-lg">
                  <span className="font-semibold">{getUserName(formData.payerId)}</span>{' '}
                  paid{' '}
                  <span className="font-semibold">{getUserName(formData.payeeId)}</span>
                </p>
                <p className="text-3xl font-bold text-green-600">
                  ${formData.amount.toFixed(2)}
                </p>
                {formData.paymentMethod && (
                  <p className="text-sm text-muted-foreground">
                    via {formData.paymentMethod.replace('_', ' ')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/settlements')}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Creating...' : 'Create Settlement'}
          </Button>
        </div>
      </form>
    </div>
  );
}
