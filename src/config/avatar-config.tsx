'use client';

import type { User } from '@/lib/auth-types';
import { isAdmin } from '@/lib/auth-utils';
import { Routes } from '@/routes';
import type { MenuItem } from '@/types';
import {
  CreditCardIcon,
  LayoutDashboardIcon,
  Settings2Icon,
  ImageIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Get avatar config with translations
 *
 * NOTICE: used in client components only
 *
 * docs:
 * https://mksaas.com/docs/config/avatar
 *
 * @returns The avatar config with translated titles
 */
export function getAvatarLinks(user?: User | null): MenuItem[] {
  const t = useTranslations('Marketing.avatar');

  const baseLinks: MenuItem[] = [
    {
      title: t('viewMyGallery') || 'View My Gallery',
      href: '/my-library',
      icon: <ImageIcon className="size-4 shrink-0" />,
    },
    {
      title: t('billing'),
      href: Routes.SettingsBilling,
      icon: <CreditCardIcon className="size-4 shrink-0" />,
    },
    {
      title: t('settings'),
      href: Routes.SettingsProfile,
      icon: <Settings2Icon className="size-4 shrink-0" />,
    },
  ];

  // Only add dashboard link for admin users
  if (isAdmin(user)) {
    baseLinks.unshift({
      title: t('dashboard'),
      href: Routes.Dashboard,
      icon: <LayoutDashboardIcon className="size-4 shrink-0" />,
    });
  }

  return baseLinks;
}
