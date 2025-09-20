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
  type: string; // aibg | productshot | sticker | watermark | profile
  label: string;
  url?: string | null;
  userId: string;
  createdAt: Date;
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
              <TableHead>Type</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it) => (
              <TableRow key={`${it.type}-${it.id}`}>
                <TableCell className="capitalize">{it.type}</TableCell>
                <TableCell className="truncate max-w-[14rem]" title={it.label}>
                  {it.label}
                </TableCell>
                <TableCell className="truncate max-w-[12rem]" title={it.userId}>
                  {it.userId}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {new Date(it.createdAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
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
