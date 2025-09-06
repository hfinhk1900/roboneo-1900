import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface SectionCardsProps {
  totalUsers?: number;
  newUsers30d?: number;
  creditsUsed7d?: number; // total credits used in last 7 days
  gens30d?: number; // total generations last 30 days
}

export function SectionCards({
  totalUsers,
  newUsers30d,
  creditsUsed7d,
  gens30d,
}: SectionCardsProps) {
  const fmt = (n: number | undefined, fallback: string) =>
    typeof n === 'number' ? n.toLocaleString() : fallback;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Users</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {fmt(totalUsers, '—')}
          </CardTitle>
          {/* Removed fake percentage badge */}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Users in system <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Includes all registered accounts
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>New Users (30d)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {fmt(newUsers30d, '—')}
          </CardTitle>
          {/* Removed fake percentage badge */}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Joined last 30 days <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Recent growth metric</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Credits Used (7d)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {fmt(creditsUsed7d, '—')}
          </CardTitle>
          {/* Removed fake percentage badge */}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total credits consumed <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Across all tools</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Generations (30d)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {fmt(gens30d, '—')}
          </CardTitle>
          {/* Removed fake percentage badge */}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Successful operations <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">aibg/productshot/sticker…</div>
        </CardFooter>
      </Card>
    </div>
  );
}
