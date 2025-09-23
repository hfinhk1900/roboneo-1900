'use client';

import { BlueskyIcon } from '@/components/icons/bluesky';
import { DiscordIcon } from '@/components/icons/discord';
import { FacebookIcon } from '@/components/icons/facebook';
import { GitHubIcon } from '@/components/icons/github';
import { InstagramIcon } from '@/components/icons/instagram';
import { LinkedInIcon } from '@/components/icons/linkedin';
import { MastodonIcon } from '@/components/icons/mastodon';
import { TelegramIcon } from '@/components/icons/telegram';
import { TikTokIcon } from '@/components/icons/tiktok';
import { XTwitterIcon } from '@/components/icons/x';
import { YouTubeIcon } from '@/components/icons/youtube';
import type { MenuItem } from '@/types';
import { MailIcon } from 'lucide-react';
import { websiteConfig } from './website';

/**
 * Get social config
 *
 * NOTICE: used in client components only
 *
 * docs:
 * https://mksaas.com/docs/config/social
 *
 * @returns The social config
 */
export function getSocialLinks(): MenuItem[] {
  // Only show support email in footer social links
  return [
    {
      title: 'Email',
      href: '/contact',
      icon: <MailIcon className="size-4 shrink-0" />,
    },
  ];
}
