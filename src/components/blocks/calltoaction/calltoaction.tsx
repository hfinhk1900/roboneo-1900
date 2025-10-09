'use client';

import { RegisterWrapper } from '@/components/auth/register-wrapper';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useLocaleRouter } from '@/i18n/navigation';

const CTA_TITLE = 'Claim 10 Free Generations';
const CTA_DESCRIPTION =
  'Create a RoboNeo AI account today to unlock 10 complimentary credits and try every workflow—stickers, product shots, backgrounds, and more.';
const CTA_LABEL = 'Claim 10 Free Credits';

export default function CallToActionSection() {
  const router = useLocaleRouter();
  const currentUser = useCurrentUser();

  if (currentUser) {
    return null;
  }

  const handleClick = () => {
    router.push('/sticker');
  };

  return (
    <section id="call-to-action" className="px-4 py-24 bg-[#F5F5F5]">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center space-y-6">
          <h2 className="text-balance text-4xl font-semibold lg:text-5xl">
            {CTA_TITLE}
          </h2>
          <p className="text-muted-foreground text-lg lg:text-xl">
            {CTA_DESCRIPTION}
          </p>

          {currentUser ? (
            <Button
              size="lg"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
                borderColor: 'var(--primary)',
              }}
              onClick={handleClick}
              className="cursor-pointer rounded-full px-8"
            >
              {CTA_LABEL}
            </Button>
          ) : (
            <RegisterWrapper mode="modal" asChild callbackUrl="/sticker">
              <Button
                size="lg"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  borderColor: 'var(--primary)',
                }}
                className="cursor-pointer rounded-full px-8"
              >
                {CTA_LABEL}
              </Button>
            </RegisterWrapper>
          )}
        </div>
      </div>
    </section>
  );
}
