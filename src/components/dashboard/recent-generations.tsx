import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Item = {
  id: string;
  type: string; // aibg | productshot | sticker | watermark | profile | scream
  label: string;
  prompt: string;
  route: string | null;
  url?: string | null;
  previewUrl?: string | null;
  userId: string;
  userEmail?: string | null;
  createdAt: Date;
};

const TYPE_LABELS: Record<string, string> = {
  aibg: 'AI Background',
  productshot: 'Product Shot',
  sticker: 'Sticker',
  watermark: 'Watermark',
  profile: 'Profile Picture',
  scream: 'Scream AI',
};

export default function RecentGenerations({ items }: { items: Item[] }) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Recent Generations</CardTitle>
        <CardDescription>Last 10 operations</CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[90px]">Preview</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Prompt</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it) => (
              <TableRow key={`${it.type}-${it.id}`}>
                <TableCell>
                  {it.previewUrl ? (
                    <img
                      src={it.previewUrl}
                      alt={it.label || 'Preview'}
                      className="h-16 w-16 rounded-md object-cover border"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-md border bg-muted" />
                  )}
                </TableCell>
                <TableCell className="capitalize">
                  {TYPE_LABELS[it.type] ?? it.type}
                </TableCell>
                <TableCell className="truncate max-w-[14rem]" title={it.label}>
                  {it.label}
                </TableCell>
                <TableCell className="truncate max-w-[18rem]" title={it.prompt}>
                  {it.prompt || '—'}
                </TableCell>
                <TableCell className="truncate max-w-[10rem]" title={it.route ?? ''}>
                  {it.route ? (
                    <a
                      href={it.route}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {it.route}
                    </a>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="truncate max-w-[12rem]" title={it.userId}>
                  {it.userId}
                </TableCell>
                <TableCell
                  className="truncate max-w-[14rem]"
                  title={it.userEmail ?? ''}
                >
                  {it.userEmail ?? '—'}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {new Date(it.createdAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground"
                >
                  No recent items
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
