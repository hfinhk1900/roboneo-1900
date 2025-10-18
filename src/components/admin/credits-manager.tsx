'use client';

import { addCreditsAction, setCreditsAction } from '@/actions/credits-actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { User } from '@/lib/auth-types';
import { CreditCardIcon, EditIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CreditsManagerProps {
  user: User;
  onUpdate?: () => void;
}

export function CreditsManager({ user, onUpdate }: CreditsManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [subtractAmount, setSubtractAmount] = useState('');
  const [setAmount, setSetAmount] = useState(user.credits?.toString() || '10');
  const [loading, setLoading] = useState(false);

  const handleAddCredits = async () => {
    const amount = Number.parseInt(addAmount);
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

  const handleSubtractCredits = async () => {
    const amount = Number.parseInt(subtractAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const currentCredits = user.credits || 0;
    if (amount > currentCredits) {
      toast.error(
        `Cannot subtract ${amount} credits. User only has ${currentCredits} credits.`
      );
      return;
    }

    const newTotal = currentCredits - amount;

    setLoading(true);
    try {
      const result = await setCreditsAction({
        userId: user.id,
        credits: newTotal,
      });

      if (result?.data?.success) {
        toast.success(`Subtracted ${amount} credits from ${user.name}`);
        setSubtractAmount('');
        setIsOpen(false);
        onUpdate?.();
      } else {
        toast.error(result?.data?.error || 'Failed to subtract credits');
      }
    } catch (error) {
      toast.error('Failed to subtract credits');
    } finally {
      setLoading(false);
    }
  };

  const handleSetCredits = async () => {
    const amount = Number.parseInt(setAmount);
    if (amount < 0 || Number.isNaN(amount)) {
      toast.error('Please enter a valid amount (0 or more)');
      return;
    }

    setLoading(true);
    try {
      const result = await setCreditsAction({
        userId: user.id,
        credits: amount,
      });

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
          <EditIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCardIcon className="h-5 w-5" />
            Manage Credits for {user.name}
          </DialogTitle>
          <DialogDescription>
            Add, subtract, or set the total credits for this user.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">{user.credits || 0}</div>
              <div className="text-sm text-muted-foreground">
                Current Credits
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label htmlFor="add-credits" className="flex items-center gap-2">
                <PlusIcon className="h-4 w-4 text-green-600" />
                Add Credits
              </Label>
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
                  size="sm"
                >
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="subtract-credits"
                className="flex items-center gap-2"
              >
                <span className="h-4 w-4 text-red-600 font-bold">-</span>
                Subtract Credits
              </Label>
              <div className="flex gap-2">
                <Input
                  id="subtract-credits"
                  type="number"
                  placeholder="Amount to subtract"
                  value={subtractAmount}
                  onChange={(e) => setSubtractAmount(e.target.value)}
                  min="1"
                  max={user.credits || 0}
                />
                <Button
                  onClick={handleSubtractCredits}
                  disabled={loading}
                  variant="destructive"
                  className="cursor-pointer"
                  size="sm"
                >
                  Subtract
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label htmlFor="set-credits" className="flex items-center gap-2">
              <EditIcon className="h-4 w-4 text-blue-600" />
              Set Total Credits
            </Label>
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

        <DialogFooter className="pt-4">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={loading}
            className="cursor-pointer"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
