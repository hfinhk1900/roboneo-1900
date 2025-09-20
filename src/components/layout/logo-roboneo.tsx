import { cn } from '@/lib/utils';
import Image from 'next/image';

export function RoboNeoLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/favicon.svg"
      alt="Logo of RoboNeo"
      title="Logo of RoboNeo"
      width={96}
      height={96}
      className={cn('size-8 rounded-md', className)}
    />
  );
}
