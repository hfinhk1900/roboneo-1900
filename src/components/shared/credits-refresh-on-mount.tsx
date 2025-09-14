'use client';

import { useEffect } from 'react';
import { useCredits } from '@/hooks/use-credits';

export default function CreditsRefreshOnMount() {
  const { refresh } = useCredits();
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return null;
}

