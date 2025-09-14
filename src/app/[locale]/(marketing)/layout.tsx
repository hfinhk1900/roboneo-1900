import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import CreditsRefreshOnMount from '@/components/shared/credits-refresh-on-mount';
import type { ReactNode } from 'react';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar scroll={true} />
      {/* Ensure credits are in sync after auth redirects */}
      <CreditsRefreshOnMount />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
