'use client';

import Container from '@/components/layout/container';
import { Logo } from '@/components/layout/logo';
import { ModeSwitcherHorizontal } from '@/components/layout/mode-switcher-horizontal';
import { getFooterLinks } from '@/config/footer-config';
import { getSocialLinks } from '@/config/social-config';
import { LocaleLink, useLocalePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type React from 'react';
// removed unused ThemeSelector/BuiltWithButton imports for MVP cleanup

export function Footer({ className }: React.HTMLAttributes<HTMLElement>) {
  const t = useTranslations();
  const footerLinks = getFooterLinks();
  const socialLinks = getSocialLinks();
  const pathname = useLocalePathname();

  return (
    <footer className={cn('border-t', className)}>
      <Container className="px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 py-16">
          <div className="flex flex-col items-start col-span-full md:col-span-2">
            <div className="space-y-4">
              {/* logo and name */}
              <div className="items-center space-x-2 flex">
                <Logo />
                <span className="text-xl font-semibold">
                  {t('Metadata.name')}
                </span>
              </div>

              {/* tagline */}
              <p className="text-muted-foreground text-base py-2 md:pr-12">
                {t('Marketing.footer.tagline')}
              </p>

              {/* social links */}
              <div className="flex items-center gap-4 py-2">
                <div className="flex items-center gap-2">
                  {socialLinks?.map((link) => (
                    <a
                      key={link.title}
                      href={link.href || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.title}
                      className="border border-border inline-flex h-8 w-8 items-center
                          justify-center rounded-full hover:bg-accent hover:text-accent-foreground"
                    >
                      <span className="sr-only">{link.title}</span>
                      {link.icon ? link.icon : null}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* footer links */}
          {footerLinks?.map((section) => (
            <div
              key={section.title}
              className="col-span-1 md:col-span-1 items-start"
            >
              <span className="text-sm font-semibold uppercase">
                {section.title}
              </span>
              <ul className="mt-4 list-inside space-y-3">
                {section.items?.map((item) => {
                  if (!item.href) return null;
                  const normalize = (s: string) =>
                    s && s !== '/' ? s.replace(/\/$/, '') : s || '/';
                  const current = normalize(pathname);
                  const href = normalize(item.href);
                  const isActive =
                    current === href || current.endsWith(href as string);
                  return (
                    <li key={item.title}>
                      <LocaleLink
                        href={item.href}
                        target={item.external ? '_blank' : undefined}
                        rel={item.external ? 'noopener noreferrer' : undefined}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'text-sm hover:text-primary',
                          isActive
                            ? 'text-foreground font-medium'
                            : 'text-muted-foreground'
                        )}
                      >
                        {item.title}
                      </LocaleLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      <div className="border-t py-8">
        <Container className="px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-muted-foreground text-sm text-center md:text-left flex-shrink-0">
            &copy; {new Date().getFullYear()} {t('Metadata.name')} All Rights
            Reserved.
          </span>

          <div className="w-full md:w-auto overflow-x-auto overflow-y-hidden footer-badges-scroll">
            <div className="flex flex-nowrap items-center justify-start md:justify-end gap-3 md:gap-4 py-2 min-w-max">
              {/* <ThemeSelector /> */}
              <ModeSwitcherHorizontal />
              <a
                href="https://startupfa.me/s/roboneo?utm_source=roboneo.art"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <img
                  src="https://startupfa.me/badges/featured-badge-small.webp"
                  alt="Featured on Startup Fame"
                  width="218"
                  height="30"
                  className="h-4 sm:h-5 w-auto"
                />
              </a>
              <a
                href="https://twelve.tools"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <img
                  src="https://twelve.tools/badge0-light.svg"
                  alt="Featured on Twelve Tools"
                  width="200"
                  height="54"
                  className="h-4 sm:h-5 w-auto"
                />
              </a>
              <a
                href="https://yo.directory/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <img
                  src="https://cdn.prod.website-files.com/65c1546fa73ea974db789e3d/65e1e171f89ebfa7bd0129ac_yodirectory-featured.png"
                  alt="yo.directory"
                  width="150"
                  height="54"
                  className="h-4 sm:h-5 w-auto"
                />
              </a>
              <a
                href="https://www.deepbluedirectory.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-[11px] sm:text-xs text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
              >
                Deep Blue Directory.com
              </a>
              <a
                href="https://submithunt.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
              >
                <span
                  role="img"
                  aria-label="rocket"
                  className="text-sm sm:text-base"
                >
                  🚀
                </span>
                <span>SubmitHunt</span>
              </a>
              {/* productburst-badge-start */}
              <a
                href="https://productburst.com/product/roboneo-art"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <img
                  src="https://3188a5210b07f4ad511bbcdc967bc67b.cdn.bubble.io/f1747781918344x939992978866771600/pB-Badge.png"
                  alt="Featured on ProductBurst"
                  width="160"
                  height="30"
                  className="h-4 sm:h-5 w-auto"
                />
              </a>
              {/* productburst-badge-end */}
              <a
                href="https://goodaitools.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <img
                  src="https://goodaitools.com/assets/images/badge.png"
                  alt="Good AI Tools"
                  width="180"
                  height="54"
                  className="h-4 sm:h-5 w-auto"
                />
              </a>
              <a
                href="https://dang.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <img
                  src="https://cdn.prod.website-files.com/63d8afd87da01fb58ea3fbcb/6487e2868c6c8f93b4828827_dang-badge.png"
                  alt="Dang.ai"
                  width="150"
                  height="54"
                  className="h-4 sm:h-5 w-auto"
                />
              </a>
              <a
                href="https://fazier.com/launches/roboneo.art"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <img
                  src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=launched&theme=neutral"
                  alt="Fazier badge"
                  width="120"
                  height="40"
                  className="h-4 sm:h-5 w-auto"
                />
              </a>
              <a
                href="https://www.aidirectori.es"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <img
                  src="https://cdn.aidirectori.es/ai-tools/badges/dark-mode.png"
                  alt="AI Directories Badge"
                  width="150"
                  height="40"
                  className="h-4 sm:h-5 w-auto"
                />
              </a>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}
