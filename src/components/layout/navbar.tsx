'use client';
import { LoginWrapper } from '@/components/auth/login-wrapper';
import { RegisterWrapper } from '@/components/auth/register-wrapper';
import Container from '@/components/layout/container';
import { Logo } from '@/components/layout/logo';
import { ModeSwitcher } from '@/components/layout/mode-switcher';
import { NavbarMobile } from '@/components/layout/navbar-mobile';
import { UserButton } from '@/components/layout/user-button';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { getNavbarLinks } from '@/config/navbar-config';
import { useCurrentUserContext } from '@/contexts/current-user-context';
import { useCredits } from '@/hooks/use-credits';
import { useScroll } from '@/hooks/use-scroll';
import {
  LocaleLink,
  useLocalePathname,
  useLocaleRouter,
} from '@/i18n/navigation';
import type { User } from '@/lib/auth-types';
import { cn } from '@/lib/utils';
import { Routes } from '@/routes';
import { CoinsIcon } from 'lucide-react';
import { ArrowUpRightIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Skeleton } from '../ui/skeleton';
import LocaleSwitcher from './locale-switcher';

interface NavBarProps {
  scroll?: boolean;
}

const customNavigationMenuTriggerStyle = cn(
  navigationMenuTriggerStyle(),
  'relative bg-transparent text-muted-foreground cursor-pointer',
  'hover:bg-accent hover:text-accent-foreground',
  'focus:bg-accent focus:text-accent-foreground',
  'data-active:font-semibold data-active:bg-transparent data-active:text-foreground',
  'data-[state=open]:bg-transparent data-[state=open]:text-foreground'
);

function HeaderCreditsDisplay({ user }: { user: User | null }) {
  const { credits, loading } = useCredits({ enabled: Boolean(user) });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't show anything if user is not logged in
  if (!user) {
    return null;
  }

  if (!mounted || loading) {
    return (
      <div className="bg-white h-9 rounded-2xl w-[100px] flex items-center justify-center gap-2 px-3">
        <CoinsIcon className="size-5" />
        <span className="font-medium text-base text-black">...</span>
      </div>
    );
  }

  return (
    <div className="bg-white h-9 rounded-2xl min-w-[100px] flex items-center justify-center gap-2 px-3 border border-gray-100">
      <CoinsIcon className="size-5 text-yellow-500" />
      <span className="font-medium text-base text-black">
        {(credits || 0).toLocaleString()}
      </span>
      <button
        type="button"
        onClick={() => window.open('/pricing', '_blank')}
        className="size-[22px] rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center cursor-pointer"
      >
        <Image
          src="/icons/icon-add.svg"
          alt="Add credits"
          width={16}
          height={16}
          className="w-4 h-4"
        />
      </button>
    </div>
  );
}

interface NavBarProps {
  scroll?: boolean;
  currentUser?: User | null;
}

export function Navbar({ scroll, currentUser = null }: NavBarProps) {
  const currentUserFromContext = useCurrentUserContext();
  const effectiveUser = currentUser ?? currentUserFromContext ?? null;
  const t = useTranslations();
  const scrolled = useScroll(50);
  const menuLinks = getNavbarLinks();
  const localePathname = useLocalePathname();
  const localeRouter = useLocaleRouter();
  const [mounted, setMounted] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasPrefetchedCoreRoutes = useRef(false);
  // console.log(`Navbar, user:`, user);

  useEffect(() => {
    setMounted(true);
  }, []);

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const prefetchCoreRoutes = () => {
    if (hasPrefetchedCoreRoutes.current) return;
    hasPrefetchedCoreRoutes.current = true;
    const targets = [
      Routes.AISticker,
      Routes.ProductShot,
      Routes.AIBackground,
      Routes.RemoveWatermark,
      Routes.ProfilePictureMaker,
      Routes.ScreamAI,
      Routes.Pricing,
    ];
    targets.forEach((href) => {
      try {
        localeRouter.prefetch(href);
      } catch {}
    });
  };

  // Function to toggle menu state
  const toggleMenu = (menuTitle: string) => {
    console.log('Toggling menu:', menuTitle); // Debug log
    clearCloseTimeout();
    prefetchCoreRoutes();
    setOpenMenus((prev) => {
      const isCurrentlyOpen = prev[menuTitle];

      // If the menu is currently open, close it
      if (isCurrentlyOpen) {
        const newState = {
          ...prev,
          [menuTitle]: false,
        };
        console.log('Closing menu, new state:', newState); // Debug log
        return newState;
      }

      // If the menu is closed, close all other menus and open this one
      const newState = {
        [menuTitle]: true, // Only this menu will be open
      };
      console.log('Opening menu (closing others), new state:', newState); // Debug log
      return newState;
    });
  };

  // Function to close all menus
  const closeAllMenus = () => {
    console.log('Closing all menus'); // Debug log
    clearCloseTimeout();
    setOpenMenus({});
  };

  const scheduleCloseMenus = () => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      closeAllMenus();
    }, 200);
  };

  useEffect(() => {
    return () => {
      clearCloseTimeout();
    };
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      // Do not close menus if a link or a button is clicked, as they have their own actions.
      if (target.closest('button') || target.closest('[href]')) {
        return;
      }

      // Only close if clicking outside the navigation menu
      if (!target.closest('[data-navbar-menu]')) {
        closeAllMenus();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <section
      className={cn(
        'sticky inset-x-0 top-0 z-40 py-4 transition-all duration-300',
        scroll
          ? scrolled
            ? 'backdrop-blur-md border-b'
            : 'bg-[#F5F5F5]'
          : 'border-b bg-[#F5F5F5]'
      )}
      style={{
        backgroundColor:
          scroll && scrolled ? 'rgba(245, 245, 245, 0.6)' : '#F5F5F5',
      }}
    >
      <Container className="px-4">
        {/* desktop navbar */}
        <nav className="hidden lg:flex">
          {/* logo and name */}
          <div className="flex items-center">
            <LocaleLink
              href={Routes.Root}
              className="flex items-center space-x-2 cursor-pointer"
              aria-label="RoboNeo – AI Image Generator"
              prefetch={false}
            >
              <Logo />
              <span className="text-xl font-extrabold font-barlow">
                {t('Metadata.name')}
              </span>
            </LocaleLink>
          </div>

          {/* menu links */}
          <div className="flex-1 flex items-center justify-center space-x-2">
            <NavigationMenu className="relative" data-navbar-menu>
              <NavigationMenuList className="flex items-center">
                {menuLinks?.map((item, index) =>
                  item.items ? (
                    <NavigationMenuItem
                      key={index}
                      className="relative"
                      onMouseEnter={() => {
                        // Open this menu on hover (desktop)
                        clearCloseTimeout();
                        prefetchCoreRoutes();
                        setOpenMenus({ [item.title]: true });
                      }}
                      onMouseLeave={() => {
                        // Close when mouse leaves the item and its content
                        scheduleCloseMenus();
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMenu(item.title);
                        }}
                        data-active={
                          item.items.some((subItem) =>
                            subItem.href
                              ? localePathname.startsWith(subItem.href)
                              : false
                          )
                            ? 'true'
                            : undefined
                        }
                        className={cn(
                          customNavigationMenuTriggerStyle,
                          'flex items-center gap-1 cursor-pointer'
                        )}
                      >
                        {item.title}
                        <svg
                          className={cn(
                            'ml-1 h-3 w-3 transition-transform duration-200',
                            openMenus[item.title] ? 'rotate-180' : ''
                          )}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {openMenus[item.title] && (
                        <div
                          onMouseEnter={clearCloseTimeout}
                          onMouseLeave={scheduleCloseMenus}
                          className="absolute top-full left-1/2 -translate-x-1/2 z-50 mt-1.5 min-w-[400px] rounded-2xl border bg-white shadow-[0px_4px_4px_0px_rgba(170,170,170,0.25)] animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 w-[430px] max-h-[80vh] overflow-y-auto"
                        >
                          {/* Check if this is AI Tools menu */}
                          {item.title.includes('AI Tools') ||
                          item.title.includes('AI 工具') ? (
                            <div className="p-6">
                              {/* Single column layout for 5 tools */}
                              <div className="flex flex-col gap-6 w-full">
                                {item.items
                                  ?.slice(0, 5)
                                  .map((subItem, subIndex) => {
                                    return (
                                      <LocaleLink
                                        key={subIndex}
                                        href={subItem.href || '#'}
                                        target={
                                          subItem.external
                                            ? '_blank'
                                            : undefined
                                        }
                                        rel={
                                          subItem.external
                                            ? 'noopener noreferrer'
                                            : undefined
                                        }
                                        onClick={() => closeAllMenus()}
                                        prefetch={false}
                                        className="group flex items-center gap-4 p-2 w-full transition-colors hover:bg-gray-200 rounded-xl no-underline cursor-pointer"
                                      >
                                        {/* Image */}
                                        <div className="shrink-0 size-[70px] bg-center bg-cover bg-no-repeat rounded-2xl overflow-hidden">
                                          {subItem.icon ? (
                                            typeof subItem.icon === 'string' ? (
                                              <Image
                                                src={subItem.icon}
                                                alt=""
                                                width={70}
                                                height={70}
                                                className="size-full object-cover"
                                              />
                                            ) : (
                                              subItem.icon
                                            )
                                          ) : null}
                                        </div>

                                        {/* Text content */}
                                        <div className="flex flex-col gap-1 text-black text-[16px] min-w-0 flex-1">
                                          <div className="font-bold leading-normal">
                                            {subItem.title}
                                          </div>
                                          {subItem.description && (
                                            <div className="font-normal leading-normal text-gray-600">
                                              {subItem.description}
                                            </div>
                                          )}
                                        </div>
                                      </LocaleLink>
                                    );
                                  })}
                              </div>
                            </div>
                          ) : (
                            /* Original layout for other menus */
                            <ul className="grid gap-2 grid-cols-2 items-start content-start">
                              {item.items?.map((subItem, subIndex) => {
                                const isSubItemActive =
                                  subItem.href &&
                                  localePathname.startsWith(subItem.href);
                                return (
                                  <li
                                    key={subIndex}
                                    className="min-h-[100px] flex"
                                  >
                                    <LocaleLink
                                      href={subItem.href || '#'}
                                      target={
                                        subItem.external ? '_blank' : undefined
                                      }
                                      rel={
                                        subItem.external
                                          ? 'noopener noreferrer'
                                          : undefined
                                      }
                                      onClick={() => closeAllMenus()}
                                      prefetch
                                      className={cn(
                                        'group flex select-none flex-row items-start gap-2 rounded-xl flex-1 h-full overflow-hidden cursor-pointer',
                                        'p-2.5 leading-none no-underline outline-hidden transition-colors',
                                        'hover:bg-accent hover:text-accent-foreground',
                                        'focus:bg-accent focus:text-accent-foreground',
                                        isSubItemActive &&
                                          'bg-accent text-accent-foreground'
                                      )}
                                    >
                                      <div
                                        className={cn(
                                          'flex shrink-0 items-center justify-center transition-colors',
                                          'bg-transparent text-muted-foreground',
                                          'group-hover:bg-transparent group-hover:text-foreground',
                                          'group-focus:bg-transparent group-focus:text-foreground',
                                          isSubItemActive &&
                                            'bg-transparent text-foreground',
                                          // 对于图片图标使用更合适的尺寸
                                          subItem.icon &&
                                            typeof subItem.icon === 'string'
                                            ? 'w-[60px] h-[60px]'
                                            : 'size-8'
                                        )}
                                      >
                                        {subItem.icon ? (
                                          typeof subItem.icon === 'string' ? (
                                            <Image
                                              src={subItem.icon}
                                              alt=""
                                              width={60}
                                              height={60}
                                              className="rounded-xl"
                                            />
                                          ) : (
                                            subItem.icon
                                          )
                                        ) : null}
                                      </div>
                                      <div className="flex-1">
                                        <div
                                          className={cn(
                                            'text-sm font-medium',
                                            // AI Tools和Image to Image菜单的标题使用黑色，其他菜单保持原色
                                            item.title.includes('AI Tools') ||
                                              item.title.includes('AI 工具') ||
                                              item.title.includes(
                                                'Image to Image'
                                              ) ||
                                              item.title.includes('图像转图像')
                                              ? 'text-black'
                                              : 'text-muted-foreground',
                                            'group-hover:bg-transparent group-hover:text-foreground',
                                            'group-focus:bg-transparent group-focus:text-foreground',
                                            isSubItemActive &&
                                              'bg-transparent text-foreground'
                                          )}
                                        >
                                          {subItem.title}
                                        </div>
                                        {subItem.description && (
                                          <div
                                            className={cn(
                                              'text-sm text-muted-foreground',
                                              'group-hover:bg-transparent group-hover:text-foreground/80',
                                              'group-focus:bg-transparent group-focus:text-foreground/80',
                                              isSubItemActive &&
                                                'bg-transparent text-foreground/80'
                                            )}
                                          >
                                            {subItem.description}
                                          </div>
                                        )}
                                      </div>
                                      {subItem.external && (
                                        <ArrowUpRightIcon
                                          className={cn(
                                            'size-4 shrink-0 text-muted-foreground',
                                            'group-hover:bg-transparent group-hover:text-foreground',
                                            'group-focus:bg-transparent group-focus:text-foreground',
                                            isSubItemActive &&
                                              'bg-transparent text-foreground'
                                          )}
                                        />
                                      )}
                                    </LocaleLink>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      )}
                    </NavigationMenuItem>
                  ) : (
                    <NavigationMenuItem key={index}>
                      <NavigationMenuLink
                        asChild
                        active={
                          item.href
                            ? item.href === '/'
                              ? localePathname === '/'
                              : localePathname.startsWith(item.href)
                            : false
                        }
                        className={customNavigationMenuTriggerStyle}
                      >
                        <LocaleLink
                          href={item.href || '#'}
                          target={item.external ? '_blank' : undefined}
                          rel={
                            item.external ? 'noopener noreferrer' : undefined
                          }
                          prefetch={false}
                          className="cursor-pointer"
                        >
                          {item.title}
                        </LocaleLink>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  )
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* navbar right show sign in or user */}
          <div className="flex items-center gap-x-4">
            {!mounted ? (
              <Skeleton className="size-8 border rounded-full" />
            ) : effectiveUser ? (
              <div className="flex items-center gap-x-3">
                {/* Credits display for logged in users */}
                <div className="hidden sm:block">
                  <HeaderCreditsDisplay user={effectiveUser} />
                </div>
                <UserButton user={effectiveUser} />
              </div>
            ) : (
              <div
                className="flex items-center gap-x-4"
                onClick={(e) => e.stopPropagation()}
              >
                <LoginWrapper mode="modal" asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                  >
                    {t('Common.login')}
                  </Button>
                </LoginWrapper>

                <RegisterWrapper mode="modal" asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className="cursor-pointer"
                  >
                    {t('Common.signUp')}
                  </Button>
                </RegisterWrapper>
              </div>
            )}

            <ModeSwitcher />
            <LocaleSwitcher />
          </div>
        </nav>

        {/* mobile navbar */}
        <NavbarMobile currentUser={effectiveUser} className="lg:hidden" />
      </Container>
    </section>
  );
}
