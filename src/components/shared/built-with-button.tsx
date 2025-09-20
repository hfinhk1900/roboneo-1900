import { RoboNeoLogo } from '@/components/layout/logo-roboneo';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function BuiltWithButton() {
  return (
    <Link
      target="_blank"
      href="https://roboneo.art"
      className={cn(
        buttonVariants({ variant: 'outline', size: 'sm' }),
        'border border-border px-4 rounded-md'
      )}
    >
      <span>Built with</span>
      <span>
        <RoboNeoLogo className="size-5 rounded-full" />
      </span>
      <span className="font-semibold">RoboNeo</span>
    </Link>
  );
}
