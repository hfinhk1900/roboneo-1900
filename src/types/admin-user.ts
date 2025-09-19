import type { User } from '@/lib/auth-types';

export interface AdminUserPlan {
  planId: string | null;
  planName: string | null;
  priceId: string | null;
  status: string | null;
  interval: string | null;
  type: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean | null;
  updatedAt: string | null;
  customerId: string | null;
}

export type AdminUser = User & {
  subscriptionPlan?: AdminUserPlan | null;
};
