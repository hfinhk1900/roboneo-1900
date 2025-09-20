'use client';

import { LoginForm } from '@/components/auth/login-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useLocaleRouter } from '@/i18n/navigation';
import { Routes } from '@/routes';
import { useEffect, useState } from 'react';

interface LoginWrapperProps {
  children: React.ReactNode;
  mode?: 'modal' | 'redirect';
  asChild?: boolean;
  callbackUrl?: string;
}

export const LoginWrapper = ({
  children,
  mode = 'redirect',
  asChild,
  callbackUrl,
}: LoginWrapperProps) => {
  const router = useLocaleRouter();
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close this login modal when switching to register modal
  useEffect(() => {
    const closeLogin = () => setIsModalOpen(false);
    window.addEventListener('auth:switch-to-register', closeLogin);
    return () =>
      window.removeEventListener('auth:switch-to-register', closeLogin);
  }, []);

  // Open this login modal on switch-to-login
  useEffect(() => {
    const openLogin = () => setIsModalOpen(true);
    window.addEventListener('auth:switch-to-login', openLogin);
    return () => window.removeEventListener('auth:switch-to-login', openLogin);
  }, []);

  // Add custom styles to ensure dialog appears above mobile menu (only for modal mode)
  useEffect(() => {
    if (mode !== 'modal' || !isModalOpen) return;

    const style = document.createElement('style');
    style.id = 'login-dialog-z-index-fix';
    style.textContent = `
      [data-slot="dialog-overlay"] {
        z-index: 60 !important;
      }
      [data-slot="dialog-content"] {
        z-index: 60 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById('login-dialog-z-index-fix');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, [mode, isModalOpen]);

  const handleLogin = () => {
    // append callbackUrl as a query parameter if provided
    const loginPath = callbackUrl
      ? `${Routes.Login}?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : `${Routes.Login}`;
    console.log('login wrapper, loginPath', loginPath);
    router.push(loginPath);
  };

  // this is to prevent the login wrapper from being rendered on the server side
  // and causing a hydration error
  if (!mounted) {
    return null;
  }

  if (mode === 'modal') {
    return (
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          console.log('LoginWrapper: Dialog onOpenChange', open);
          setIsModalOpen(open);
          if (open) {
            // Notify that auth modal is opening (for mobile menu to close)
            window.dispatchEvent(new CustomEvent('auth:modal-opening'));
          }
        }}
      >
        <DialogTrigger
          asChild={asChild}
          onClick={() => {
            console.log('LoginWrapper: DialogTrigger clicked');
          }}
        >
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[400px] p-0">
          <DialogHeader className="hidden">
            <DialogTitle />
          </DialogHeader>
          <LoginForm callbackUrl={callbackUrl} className="border-none" />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <span onClick={handleLogin} className="cursor-pointer">
      {children}
    </span>
  );
};
