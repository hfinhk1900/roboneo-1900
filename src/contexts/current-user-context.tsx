'use client';

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@/lib/auth-types';

const CurrentUserContext = createContext<User | null>(null);

interface CurrentUserProviderProps {
  value: User | null;
  children: ReactNode;
}

export function CurrentUserProvider({ value, children }: CurrentUserProviderProps) {
  return (
    <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>
  );
}

export function useCurrentUserContext(): User | null {
  return useContext(CurrentUserContext);
}
