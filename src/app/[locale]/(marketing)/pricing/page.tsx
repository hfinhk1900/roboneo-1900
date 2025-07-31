import FaqSection from '@/components/blocks/faqs/faqs';
import Container from '@/components/layout/container';
import { PricingTable } from '@/components/pricing/pricing-table';

export default async function PricingPage() {
  return (
    <div>
      <Container className="max-w-6xl px-4 flex flex-col gap-16">
        <PricingTable />

        <FaqSection />
      </Container>
    </div>
  );
}
