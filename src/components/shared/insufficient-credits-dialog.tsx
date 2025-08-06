'use client';

import { CreditCardIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState, useEffect } from 'react';

interface InsufficientCreditsDialogProps {
  open: boolean;
  required: number;
  current: number;
}

export function InsufficientCreditsDialog({
  open,
  required,
  current,
}: InsufficientCreditsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleUpgrade = () => {
    window.open('/pricing', '_blank');
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <CreditCardIcon className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle className="text-left">
                Not Enough Credits
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="text-left">
            You need {required} credits to generate this image, but your balance is {current}.
            <br />
            Top up now to keep creating!
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full sm:w-auto cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpgrade}
            className="w-full sm:w-auto cursor-pointer"
          >
            Add Credits
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
