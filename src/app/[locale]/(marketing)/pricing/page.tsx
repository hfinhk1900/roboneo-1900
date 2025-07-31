import FaqSection from '@/components/blocks/faqs/faqs';
import Container from '@/components/layout/container';
import { PricingTable } from '@/components/pricing/pricing-table';

export default async function PricingPage() {
  return (
    <div className="bg-[#F5F5F5] min-h-screen">
      <Container className="mt-8 max-w-6xl px-4 flex flex-col gap-16">
        <PricingTable />

        <FaqSection />
      </Container>
    </div>
  );
}
