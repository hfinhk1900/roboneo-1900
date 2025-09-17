'use client';

import { useCurrentUserContext } from '@/contexts/current-user-context';

export const useCurrentUser = () => {
  return useCurrentUserContext();
};
