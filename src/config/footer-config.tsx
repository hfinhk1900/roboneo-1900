'use client';

import { Routes } from '@/routes';
import type { NestedMenuItem } from '@/types';
import { useTranslations } from 'next-intl';

/**
 * Get footer config with translations
 *
 * NOTICE: used in client components only
 *
 * docs:
 * https://mksaas.com/docs/config/footer
 *
 * @returns The footer config with translated titles
 */
export function getFooterLinks(): NestedMenuItem[] {
  const t = useTranslations('Marketing.footer');

  return [
    {
      title: 'Tools',
      items: [
        {
          title: 'Image to Sticker',
          href: Routes.AISticker,
          external: false,
        },
        {
          title: 'Scream AI',
          href: Routes.ScreamAI,
          external: false,
        },
        {
          title: 'Product Shots',
          href: Routes.ProductShot,
          external: false,
        },
        {
          title: 'AI Backgrounds',
          href: Routes.AIBackground,
          external: false,
        },
        {
          title: 'Remove Watermark',
          href: Routes.RemoveWatermark,
          external: false,
        },
        {
          title: 'Profile Picture Maker',
          href: Routes.ProfilePictureMaker,
          external: false,
        },
      ],
    },
    // Resources section removed for MVP
    {
      title: t('company.title'),
      items: [
        {
          title: 'About us',
          href: Routes.About,
          external: false,
        },
        {
          title: 'Pricing',
          href: Routes.Pricing,
          external: false,
        },
      ],
    },
    {
      title: t('legal.title'),
      items: [
        {
          title: t('legal.items.privacyPolicy'),
          href: Routes.PrivacyPolicy,
          external: false,
        },
        {
          title: t('legal.items.termsOfService'),
          href: Routes.TermsOfService,
          external: false,
        },
        {
          title: 'Refund Policy',
          href: Routes.RefundPolicy,
          external: false,
        },
      ],
    },
  ];
}
