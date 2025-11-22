'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategoryPicker } from '@/components/expenses/CategoryPicker';
import { SplitMethodSelector, SplitMethodCard } from '@/components/expenses/SplitMethodSelector';
import { ParticipantSelector, ParticipantShare } from '@/components/expenses/ParticipantSelector';
import { ReceiptUpload } from '@/components/expenses/ReceiptUpload';
import { ExpenseCategory, ShareType, Group, User } from '@/types';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { validateSplitTotal } from '@/lib/validations/expense';

type Step = 'basic' | 'group' | 'split' | 'receipt' | 'review';

export default function NewExpensePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form data
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [notes, setNotes] = useState('');
  const [groupId, setGroupId] = useState('');
  const [paidBy, setPaidBy] = useState(user?.id || '');
  const [shareType, setShareType] = useState<ShareType>('equal');
  const [participants, setParticipants] = useState<ParticipantShare[]>([]);
  const [receiptImages, setReceiptImages] = useState<File[]>([]);

  // Load groups on mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await apiClient.get<Group[]>('/groups');
        setGroups(data);
      } catch (err) {
        toast.error('Failed to load groups');
      }
    };
    fetchGroups();
  }, []);

  // Load group members when group changes
  useEffect(() => {
    if (!groupId) {
      setGroupMembers([]);
      return;
    }

    const fetchGroupMembers = async () => {
      try {
        const data = await apiClient.get<User[]>(`/groups/${groupId}/members`);
        setGroupMembers(data);
      } catch (err) {
        toast.error('Failed to load group members');
      }
    };
    fetchGroupMembers();
  }, [groupId]);

  const steps: Step[] = ['basic', 'group', 'split', 'receipt', 'review'];
  const currentStepIndex = steps.indexOf(currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const validateStep = (step: Step): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 'basic':
        if (!description.trim()) newErrors.description = 'Description is required';
        if (description.length < 3) newErrors.description = 'Description must be at least 3 characters';
        if (!amount || parseFloat(amount) <= 0) newErrors.amount = 'Amount must be greater than 0';
        if (!expenseDate) newErrors.expenseDate = 'Date is required';
        break;

      case 'group':
        if (!groupId) newErrors.groupId = 'Please select a group';
        if (!paidBy) newErrors.paidBy = 'Please select who paid';
        break;

      case 'split':
        if (participants.length === 0) {
          newErrors.participants = 'At least one participant is required';
        } else {
          const validation = validateSplitTotal(participants, parseFloat(amount));
          if (!validation.valid) {
            newErrors.participants = validation.message || 'Invalid split configuration';
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    try {
      setIsSubmitting(true);

      // Create expense
      const expenseData = {
        groupId,
        description: description.trim(),
        amount: parseFloat(amount),
        currency,
        paidBy,
        expenseDate,
        category,
        notes: notes.trim() || undefined,
        participants: participants.map((p) => ({
          userId: p.userId,
          share: p.share,
          shareType: p.shareType,
        })),
      };

      const createdExpense = await apiClient.post('/expenses', expenseData);

      // Upload receipts if any
      if (receiptImages.length > 0) {
        for (const image of receiptImages) {
          try {
            await apiClient.upload(`/expenses/${createdExpense.id}/receipt`, image);
          } catch (err) {
            console.error('Failed to upload receipt:', err);
          }
        }
      }

      toast.success('Expense created successfully!');
      router.push(`/dashboard/expenses/${createdExpense.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Dinner at restaurant"
                maxLength={200}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
                {errors.amount && <p className="text-sm text-red-600">{errors.amount}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.expenseDate && (
                <p className="text-sm text-red-600">{errors.expenseDate}</p>
              )}
            </div>

            <CategoryPicker value={category} onChange={setCategory} />

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes..."
                maxLength={500}
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                {notes.length}/500 characters
              </p>
            </div>
          </div>
        );

      case 'group':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="group">Select Group *</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger id="group">
                  <SelectValue placeholder="Choose a group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.groupId && <p className="text-sm text-red-600">{errors.groupId}</p>}
            </div>

            {groupId && groupMembers.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="paidBy">Who Paid? *</Label>
                <Select value={paidBy} onValueChange={setPaidBy}>
                  <SelectTrigger id="paidBy">
                    <SelectValue placeholder="Select who paid" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} {member.id === user?.id && '(You)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.paidBy && <p className="text-sm text-red-600">{errors.paidBy}</p>}
              </div>
            )}

            {!groupId && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please select a group to continue. If you don't have any groups, create one first.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 'split':
        return (
          <div className="space-y-6">
            <SplitMethodSelector value={shareType} onChange={setShareType} />

            <ParticipantSelector
              participants={participants}
              availableUsers={groupMembers}
              shareType={shareType}
              totalAmount={parseFloat(amount) || 0}
              onChange={setParticipants}
            />

            {errors.participants && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.participants}</AlertDescription>
              </Alert>
            )}

            {participants.length > 0 && parseFloat(amount) > 0 && (
              <SplitMethodCard
                shareType={shareType}
                participants={participants.map((p) => ({
                  userId: p.userId,
                  share: p.share,
                  name: p.user?.name,
                }))}
                totalAmount={parseFloat(amount)}
                currency={currency}
              />
            )}
          </div>
        );

      case 'receipt':
        return (
          <div className="space-y-6">
            <ReceiptUpload images={receiptImages} onChange={setReceiptImages} />
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Receipt images are optional but recommended for record keeping.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Expense Summary</CardTitle>
                <CardDescription>Review your expense details before submitting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-semibold">{description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-semibold text-2xl">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency,
                      }).format(parseFloat(amount))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-semibold">{expenseDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <Badge>{category}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Group</p>
                    <p className="font-semibold">
                      {groups.find((g) => g.id === groupId)?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Paid By</p>
                    <p className="font-semibold">
                      {groupMembers.find((m) => m.id === paidBy)?.name}
                    </p>
                  </div>
                </div>

                {notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="text-sm">{notes}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Split ({participants.length} participants)
                  </p>
                  <SplitMethodCard
                    shareType={shareType}
                    participants={participants.map((p) => ({
                      userId: p.userId,
                      share: p.share,
                      name: p.user?.name,
                    }))}
                    totalAmount={parseFloat(amount)}
                    currency={currency}
                  />
                </div>

                {receiptImages.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Receipt Images</p>
                    <p className="font-semibold">{receiptImages.length} image(s)</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  const getStepTitle = (): string => {
    switch (currentStep) {
      case 'basic':
        return 'Basic Information';
      case 'group':
        return 'Group & Payer';
      case 'split':
        return 'Split Details';
      case 'receipt':
        return 'Receipt Upload';
      case 'review':
        return 'Review & Submit';
      default:
        return '';
    }
  };

  return (
    <div className="container max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Add New Expense</h1>
          <p className="text-muted-foreground">Step {currentStepIndex + 1} of {steps.length}</p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex gap-2">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`flex-1 h-2 rounded-full ${
              index <= currentStepIndex ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{getStepTitle()}</CardTitle>
        </CardHeader>
        <CardContent>{renderStepContent()}</CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrevious} disabled={isFirstStep}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        {!isLastStep ? (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              'Creating...'
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Create Expense
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
