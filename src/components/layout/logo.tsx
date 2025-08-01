import { websiteConfig } from '@/config/website';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function Logo({ className }: { className?: string }) {
  const logo = websiteConfig.metadata.images?.logoLight ?? '/logo.png';

  return (
    <Image
      src={logo}
      alt="RoboNeo AI Image Generator Logo"
      title="RoboNeo AI Image Generator"
      width={96}
      height={96}
      className={cn('size-8 rounded-md', className)}
    />
  );
}
