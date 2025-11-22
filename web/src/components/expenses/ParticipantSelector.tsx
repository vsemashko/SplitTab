'use client';

import { useState } from 'react';
import { User, ShareType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { X } from 'lucide-react';

export interface ParticipantShare {
  userId: string;
  share: number;
  shareType: ShareType;
  user?: User;
}

interface ParticipantSelectorProps {
  participants: ParticipantShare[];
  availableUsers: User[];
  shareType: ShareType;
  totalAmount: number;
  onChange: (participants: ParticipantShare[]) => void;
}

export function ParticipantSelector({
  participants,
  availableUsers,
  shareType,
  totalAmount,
  onChange,
}: ParticipantSelectorProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const addParticipant = () => {
    if (!selectedUserId) return;

    const user = availableUsers.find((u) => u.id === selectedUserId);
    if (!user) return;

    // Check if user is already a participant
    if (participants.some((p) => p.userId === selectedUserId)) {
      return;
    }

    // Calculate default share based on share type
    let defaultShare = 0;
    switch (shareType) {
      case 'equal':
        defaultShare = totalAmount / (participants.length + 1);
        break;
      case 'percentage':
        // Calculate remaining percentage
        const usedPercentage = participants.reduce((sum, p) => sum + p.share, 0);
        defaultShare = Math.max(0, 100 - usedPercentage);
        break;
      case 'exact':
        // Calculate remaining amount
        const usedAmount = participants.reduce((sum, p) => sum + p.share, 0);
        defaultShare = Math.max(0, totalAmount - usedAmount);
        break;
      case 'shares':
        defaultShare = 1;
        break;
    }

    const newParticipants = [
      ...participants,
      {
        userId: selectedUserId,
        share: defaultShare,
        shareType,
        user,
      },
    ];

    // For equal split, recalculate all shares
    if (shareType === 'equal') {
      const equalShare = totalAmount / newParticipants.length;
      newParticipants.forEach((p) => {
        p.share = equalShare;
      });
    }

    onChange(newParticipants);
    setSelectedUserId('');
  };

  const removeParticipant = (userId: string) => {
    const newParticipants = participants.filter((p) => p.userId !== userId);

    // For equal split, recalculate shares
    if (shareType === 'equal' && newParticipants.length > 0) {
      const equalShare = totalAmount / newParticipants.length;
      newParticipants.forEach((p) => {
        p.share = equalShare;
      });
    }

    onChange(newParticipants);
  };

  const updateShare = (userId: string, share: number) => {
    const newParticipants = participants.map((p) =>
      p.userId === userId ? { ...p, share, shareType } : p
    );

    // For equal split, update all shares
    if (shareType === 'equal') {
      newParticipants.forEach((p) => {
        p.share = share;
      });
    }

    onChange(newParticipants);
  };

  const getShareLabel = (): string => {
    switch (shareType) {
      case 'equal':
        return 'Amount';
      case 'percentage':
        return 'Percentage (%)';
      case 'exact':
        return 'Amount';
      case 'shares':
        return 'Shares';
      default:
        return 'Amount';
    }
  };

  const getShareStep = (): string => {
    return shareType === 'percentage' || shareType === 'exact' ? '0.01' : '1';
  };

  // Get users that are not already participants
  const availableUsersFiltered = availableUsers.filter(
    (u) => !participants.some((p) => p.userId === u.id)
  );

  return (
    <div className="space-y-4">
      {/* Add Participant */}
      <div className="flex gap-2">
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
        >
          <option value="">Select a participant...</option>
          {availableUsersFiltered.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
        <Button type="button" onClick={addParticipant} disabled={!selectedUserId}>
          Add
        </Button>
      </div>

      {/* Participants List */}
      {participants.length > 0 && (
        <div className="space-y-2">
          <Label>Participants ({participants.length})</Label>
          {participants.map((participant) => (
            <Card key={participant.userId}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="font-medium">
                      {participant.user?.name || 'Unknown User'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {participant.user?.email}
                    </div>
                  </div>

                  <div className="w-32">
                    <Label htmlFor={`share-${participant.userId}`} className="sr-only">
                      {getShareLabel()}
                    </Label>
                    <Input
                      id={`share-${participant.userId}`}
                      type="number"
                      step={getShareStep()}
                      min="0"
                      value={participant.share}
                      onChange={(e) =>
                        updateShare(participant.userId, parseFloat(e.target.value) || 0)
                      }
                      disabled={shareType === 'equal' && participants.length > 0}
                      placeholder={getShareLabel()}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeParticipant(participant.userId)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {participants.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          No participants added yet. Add at least one participant to continue.
        </div>
      )}
    </div>
  );
}
