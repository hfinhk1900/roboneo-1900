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
  // Return empty array to remove all social media icons from footer
  return [];

  // Original code commented out to preserve for future use:
  /*
  const socialLinks: MenuItem[] = [];

  if (websiteConfig.metadata.social?.twitter) {
    socialLinks.push({
      title: 'X (Twitter)',
      href: websiteConfig.metadata.social.twitter,
      icon: <XTwitterIcon className="size-4 shrink-0" />,
    });
  }

  if (websiteConfig.metadata.social?.youtube) {
    socialLinks.push({
      title: 'YouTube',
      href: websiteConfig.metadata.social.youtube,
      icon: <YouTubeIcon className="size-4 shrink-0" />,
    });
  }

  if (websiteConfig.mail.supportEmail) {
    socialLinks.push({
      title: 'Email',
      href: `mailto:${websiteConfig.mail.supportEmail}`,
      icon: <MailIcon className="size-4 shrink-0" />,
    });
  }

  return socialLinks;
  */
}
