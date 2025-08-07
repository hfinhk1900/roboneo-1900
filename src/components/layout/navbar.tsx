'use client';

import { LoginWrapper } from '@/components/auth/login-wrapper';
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
import { useScroll } from '@/hooks/use-scroll';
import { LocaleLink, useLocalePathname } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { Routes } from '@/routes';
import { ArrowUpRightIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useState } from 'react';
import { useEffect } from 'react';
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

export function Navbar({ scroll }: NavBarProps) {
  const t = useTranslations();
  const scrolled = useScroll(50);
  const menuLinks = getNavbarLinks();
  const localePathname = useLocalePathname();
  const [mounted, setMounted] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const { data: session, isPending } = authClient.useSession();
  const currentUser = session?.user;
  // console.log(`Navbar, user:`, user);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Function to toggle menu state
  const toggleMenu = (menuTitle: string) => {
    console.log('Toggling menu:', menuTitle); // Debug log
    setOpenMenus(prev => {
      const isCurrentlyOpen = prev[menuTitle];

      // If the menu is currently open, close it
      if (isCurrentlyOpen) {
        const newState = {
          ...prev,
          [menuTitle]: false
        };
        console.log('Closing menu, new state:', newState); // Debug log
        return newState;
      } else {
        // If the menu is closed, close all other menus and open this one
        const newState = {
          [menuTitle]: true // Only this menu will be open
        };
        console.log('Opening menu (closing others), new state:', newState); // Debug log
        return newState;
      }
    });
  };

  // Function to close all menus
  const closeAllMenus = () => {
    console.log('Closing all menus'); // Debug log
    setOpenMenus({});
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
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
              href="/"
              className="flex items-center space-x-2"
              aria-label="RoboNeo – AI Image Generator"
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
                    <NavigationMenuItem key={index} className="relative">
                      <button
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
                          'flex items-center gap-1'
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
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 z-50 mt-1.5 min-w-[400px] rounded-2xl border bg-white shadow-[0px_4px_4px_0px_rgba(170,170,170,0.25)] animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 w-[820px] max-h-[80vh] overflow-y-auto">
                          {/* Check if this is Text to Image menu */}
                          {item.title.includes('Text to Image') || item.title.includes('文本转图像') ? (
                            <div className="p-6 flex flex-col gap-6">
                              {/* Row 1: Main Text to Image item */}
                              {item.items?.[0] && (
                                                                                                <LocaleLink
                                  href={item.items[0].href || '#'}
                                  target={item.items[0].external ? '_blank' : undefined}
                                  rel={item.items[0].external ? 'noopener noreferrer' : undefined}
                                  onClick={() => closeAllMenus()}
                                                                    className="group flex items-center gap-4 p-2 w-full transition-colors hover:bg-gray-200 rounded-xl no-underline"
                                >
                                  {/* Image */}
                                  <div className="shrink-0 size-[70px] bg-center bg-cover bg-no-repeat rounded-2xl overflow-hidden">
                                    {item.items[0].icon && typeof item.items[0].icon === 'string' ? (
                                      <Image
                                        src={item.items[0].icon}
                                        alt=""
                                        width={70}
                                        height={70}
                                        className="size-full object-cover"
                                      />
                                    ) : (
                                      item.items[0].icon
                                    )}
                                  </div>

                                  {/* Text content */}
                                  <div className="flex flex-col gap-1 text-black text-[16px] min-w-0 flex-1">
                                    <div className="font-bold leading-normal">
                                      {item.items[0].title}
                                    </div>
                                    {item.items[0].description && (
                                      <div className="font-normal leading-normal text-gray-600">
                                        {item.items[0].description}
                                      </div>
                                    )}
                                  </div>

                                  {/* Arrow */}
                                  <div className="shrink-0 size-6">
                                    <ArrowUpRightIcon className="size-6 text-gray-600" />
                                  </div>
                                </LocaleLink>
                              )}

                                                            {/* Row 2: Two columns layout for remaining items */}
                              <div className="flex gap-6 w-full">
                                {/* Left Column */}
                                <div className="flex flex-col gap-6 w-[378px]">
                                  {item.items?.slice(1, 3).map((subItem, subIndex) => {
                                    return (
                                      <LocaleLink
                                        key={subIndex + 1}
                                        href={subItem.href || '#'}
                                        target={subItem.external ? '_blank' : undefined}
                                        rel={subItem.external ? 'noopener noreferrer' : undefined}
                                        onClick={() => closeAllMenus()}
                                        className="group flex items-center gap-4 p-2 w-full transition-colors hover:bg-gray-200 rounded-xl no-underline"
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

                                {/* Right Column */}
                                <div className="flex flex-col gap-6 w-[378px]">
                                  {item.items?.slice(3, 5).map((subItem, subIndex) => {
                                    return (
                                      <LocaleLink
                                        key={subIndex + 3}
                                        href={subItem.href || '#'}
                                        target={subItem.external ? '_blank' : undefined}
                                        rel={subItem.external ? 'noopener noreferrer' : undefined}
                                        onClick={() => closeAllMenus()}
                                        className="group flex items-center gap-4 p-2 w-full transition-colors hover:bg-gray-200 rounded-xl no-underline"
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
                            </div>
                          ) : (
                            /* Original layout for other menus */
                            <ul className="grid gap-2 grid-cols-2 items-start content-start">
                              {item.items?.map((subItem, subIndex) => {
                                const isSubItemActive =
                                  subItem.href &&
                                  localePathname.startsWith(subItem.href);
                                return (
                                  <li key={subIndex} className="min-h-[100px] flex">
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
                                      className={cn(
                                        'group flex select-none flex-row items-start gap-2 rounded-xl flex-1 h-full overflow-hidden',
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
                                          subItem.icon && typeof subItem.icon === 'string' ? 'w-[60px] h-[60px]' : 'size-8'
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
                                            // Text to Image和Image to Image菜单的标题使用黑色，其他菜单保持原色
                                            item.title.includes('Text to Image') || item.title.includes('文本转图像') ||
                                            item.title.includes('Image to Image') || item.title.includes('图像转图像')
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
            {!mounted || isPending ? (
              <Skeleton className="size-8 border rounded-full" />
            ) : currentUser ? (
              <UserButton user={currentUser} />
            ) : (
              <div className="flex items-center gap-x-4">
                <LoginWrapper mode="modal" asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                  >
                    {t('Common.login')}
                  </Button>
                </LoginWrapper>

                <LocaleLink
                  href={Routes.Register}
                  className={cn(
                    buttonVariants({
                      variant: 'default',
                      size: 'sm',
                    })
                  )}
                >
                  {t('Common.signUp')}
                </LocaleLink>
              </div>
            )}

            <ModeSwitcher />
            <LocaleSwitcher />
          </div>
        </nav>

        {/* mobile navbar */}
        <NavbarMobile className="lg:hidden" />
      </Container>
    </section>
  );
}
