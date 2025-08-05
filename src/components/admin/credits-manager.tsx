'use client';

import { addCreditsAction, setCreditsAction } from '@/actions/credits-actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { User } from '@/lib/auth-types';
import { CreditCardIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CreditsManagerProps {
  user: User;
  onUpdate?: () => void;
}

export function CreditsManager({ user, onUpdate }: CreditsManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [setAmount, setSetAmount] = useState(user.credits?.toString() || '10');
  const [loading, setLoading] = useState(false);

  const handleAddCredits = async () => {
    const amount = parseInt(addAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const result = await addCreditsAction({ userId: user.id, amount });

      if (result?.data?.success) {
        toast.success(`Added ${amount} credits to ${user.name}`);
        setAddAmount('');
        setIsOpen(false);
        onUpdate?.();
      } else {
        toast.error(result?.data?.error || 'Failed to add credits');
      }
    } catch (error) {
      toast.error('Failed to add credits');
    } finally {
      setLoading(false);
    }
  };

  const handleSetCredits = async () => {
    const amount = parseInt(setAmount);
    if (amount < 0 || isNaN(amount)) {
      toast.error('Please enter a valid amount (0 or more)');
      return;
    }

    setLoading(true);
    try {
      const result = await setCreditsAction({ userId: user.id, credits: amount });

      if (result?.data?.success) {
        toast.success(`Set ${user.name}'s credits to ${amount}`);
        setIsOpen(false);
        onUpdate?.();
      } else {
        toast.error(result?.data?.error || 'Failed to set credits');
      }
    } catch (error) {
      toast.error('Failed to set credits');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          title="Manage Credits"
        >
          <CreditCardIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Credits for {user.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="text-sm text-muted-foreground">
            Current credits: <span className="font-semibold">{user.credits || 0}</span>
          </div>

          <div className="space-y-3">
            <Label htmlFor="add-credits">Add Credits</Label>
            <div className="flex gap-2">
              <Input
                id="add-credits"
                type="number"
                placeholder="Amount to add"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                min="1"
              />
              <Button
                onClick={handleAddCredits}
                disabled={loading}
                className="cursor-pointer"
              >
                Add
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="set-credits">Set Total Credits</Label>
            <div className="flex gap-2">
              <Input
                id="set-credits"
                type="number"
                placeholder="Total credits"
                value={setAmount}
                onChange={(e) => setSetAmount(e.target.value)}
                min="0"
              />
              <Button
                onClick={handleSetCredits}
                disabled={loading}
                variant="secondary"
                className="cursor-pointer"
              >
                Set
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
