'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import * as React from 'react';
import { Cell, Pie, PieChart } from 'recharts';

const chartConfig = {
  aibg: { label: 'AI Backgrounds', color: 'hsl(var(--chart-1))' },
  productshot: { label: 'ProductShot', color: 'hsl(var(--chart-2))' },
  sticker: { label: 'Stickers', color: 'hsl(var(--chart-3))' },
  watermark: { label: 'Watermark', color: 'hsl(var(--chart-4))' },
  profile: { label: 'Profile', color: 'hsl(var(--chart-5))' },
} satisfies ChartConfig;

type Totals = {
  d7: Record<string, number>;
  d30: Record<string, number>;
  d90: Record<string, number>;
};

export default function FeatureUsageShare({ totals }: { totals: Totals }) {
  const [range, setRange] = React.useState<'d7' | 'd30' | 'd90'>('d30');
  const base = totals?.[range] || {};
  const data = Object.entries(base)
    .map(([k, v]) => ({ key: k, value: v }))
    .filter((d) => d.value > 0);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Feature Usage</CardTitle>
        <CardDescription>Share of generations by feature</CardDescription>
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={range}
            onValueChange={(v) => v && setRange(v as any)}
            variant="outline"
            className="hidden @[767px]/card:flex"
          >
            <ToggleGroupItem value="d90">90d</ToggleGroupItem>
            <ToggleGroupItem value="d30">30d</ToggleGroupItem>
            <ToggleGroupItem value="d7">7d</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="key"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
              ))}
            </Pie>
            <ChartTooltip
              content={<ChartTooltipContent hideLabel nameKey="key" />}
            />
            <ChartLegend content={<ChartLegendContent nameKey="key" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
