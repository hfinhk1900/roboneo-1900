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

type Tx = {
  id: string;
  type: string; // usage | refund | bonus | purchase
  amount: number; // usage is negative in DB
  balanceBefore: number;
  balanceAfter: number;
  createdAt: Date;
  userId: string;
};

export default function RecentCredits({ items }: { items: Tx[] }) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Recent Credit Transactions</CardTitle>
        <CardDescription>Last 10 entries</CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="capitalize">{t.type}</TableCell>
                <TableCell>
                  {t.type === 'usage' ? `-${Math.abs(t.amount)}` : `${t.amount}`}
                </TableCell>
                <TableCell>
                  {t.balanceBefore} → {t.balanceAfter}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {new Date(t.createdAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No recent transactions
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

