'use client';

import { HeaderSection } from '@/components/layout/header-section';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { IconName } from 'lucide-react/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';

type FAQItem = {
  id: string;
  icon: IconName;
  question: string;
  answer: string;
};

// Function to convert email addresses to clickable links
const renderTextWithEmailLinks = (text: string) => {
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const parts = text.split(emailRegex);

  return parts.map((part, index) => {
    if (emailRegex.test(part)) {
      return (
        <a
          key={index}
          href="/contact"
          className="text-primary hover:underline"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export default function FaqSection() {
  const locale = useLocale();
  const t = useTranslations('HomePage.faqs');

  const faqItems: FAQItem[] = [
    {
      id: 'item-1',
      icon: 'help-circle',
      question: t('items.item-1.question'),
      answer: t('items.item-1.answer'),
    },
    {
      id: 'item-2',
      icon: 'briefcase',
      question: t('items.item-2.question'),
      answer: t('items.item-2.answer'),
    },
    {
      id: 'item-3',
      icon: 'shield-check',
      question: t('items.item-3.question'),
      answer: t('items.item-3.answer'),
    },
    {
      id: 'item-4',
      icon: 'file-type',
      question: t('items.item-4.question'),
      answer: t('items.item-4.answer'),
    },
    {
      id: 'item-5',
      icon: 'zap',
      question: t('items.item-5.question'),
      answer: t('items.item-5.answer'),
    },
    {
      id: 'item-6',
      icon: 'x-circle',
      question: t('items.item-6.question'),
      answer: t('items.item-6.answer'),
    },
    {
      id: 'item-7',
      icon: 'credit-card',
      question: t('items.item-7.question'),
      answer: t('items.item-7.answer'),
    },
    {
      id: 'item-8',
      icon: 'headphones',
      question: t('items.item-8.question'),
      answer: t('items.item-8.answer'),
    },
  ];

  // Generate JSON-LD structured data for FAQ rich results
  const faqJsonLd = useMemo(() => {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };
  }, [faqItems]);

  return (
    <>
      {/* JSON-LD structured data for FAQ rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd),
        }}
      />

      <section id="faqs" className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <HeaderSection
            title={t('title')}
            titleAs="h2"
            subtitle={t('subtitle')}
            subtitleAs="h2"
            subtitleClassName="text-balance text-[32px] font-bold text-foreground"
          />

          <div className="mx-auto max-w-4xl mt-12">
            <Accordion
              type="single"
              collapsible
              className="ring-muted w-full rounded-2xl border px-8 py-3 shadow-sm ring-4 dark:ring-0"
            >
              {faqItems.map((item, index) => (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  className="border-dashed"
                >
                  <AccordionTrigger
                    className="cursor-pointer text-base hover:no-underline"
                    aria-label={`Question ${index + 1}: ${item.question}`}
                  >
                    <span className="flex items-start gap-3">
                      <span
                        className="flex-shrink-0 text-primary font-semibold"
                        aria-hidden="true"
                      >
                        {index + 1}.
                      </span>
                      <span className="flex-1 text-left">{item.question}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div
                      className="text-base text-muted-foreground ml-6"
                      role="region"
                      aria-label={`Answer to: ${item.question}`}
                    >
                      {renderTextWithEmailLinks(item.answer)}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </>
  );
}
