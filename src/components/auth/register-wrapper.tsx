'use client';

import { RegisterForm } from '@/components/auth/register-form';
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

interface RegisterWrapperProps {
  children: React.ReactNode;
  mode?: 'modal' | 'redirect';
  asChild?: boolean;
  callbackUrl?: string;
}

export const RegisterWrapper = ({
  children,
  mode = 'redirect',
  asChild,
  callbackUrl,
}: RegisterWrapperProps) => {
  const router = useLocaleRouter();
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close this register modal when switching to login modal
  useEffect(() => {
    const closeRegister = () => setIsModalOpen(false);
    window.addEventListener('auth:switch-to-login', closeRegister);
    return () => window.removeEventListener('auth:switch-to-login', closeRegister);
  }, []);

  // Open this register modal on switch-to-register
  useEffect(() => {
    const openRegister = () => setIsModalOpen(true);
    window.addEventListener('auth:switch-to-register', openRegister);
    return () => window.removeEventListener('auth:switch-to-register', openRegister);
  }, []);

  const handleRegister = () => {
    // append callbackUrl as a query parameter if provided
    const registerPath = callbackUrl
      ? `${Routes.Register}?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : `${Routes.Register}`;
    console.log('register wrapper, registerPath', registerPath);
    router.push(registerPath);
  };

  // this is to prevent the register wrapper from being rendered on the server side
  // and causing a hydration error
  if (!mounted) {
    return null;
  }

  if (mode === 'modal') {
    return (
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger asChild={asChild}>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[400px] p-0">
          <DialogHeader className="hidden">
            <DialogTitle />
          </DialogHeader>
          <RegisterForm callbackUrl={callbackUrl} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <span onClick={handleRegister} className="cursor-pointer">
      {children}
    </span>
  );
};
