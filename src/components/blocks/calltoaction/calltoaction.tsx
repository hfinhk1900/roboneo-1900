'use client';

import { Button } from '@/components/ui/button';
import { useLocaleRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export default function CallToActionSection() {
  const t = useTranslations('HomePage.calltoaction');
  const router = useLocaleRouter();

  return (
    <section id="call-to-action" className="px-4 py-24 bg-[#F5F5F5]">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-balance text-4xl font-semibold lg:text-5xl">
            {t('title')}
          </h2>
          <p className="mt-4 text-muted-foreground">{t('description')}</p>

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
                borderColor: 'var(--primary)',
              }}
              onClick={() => {
                router.push('/#all-tools');
              }}
              className="cursor-pointer"
            >
              <span>{t('primaryButton')}</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
