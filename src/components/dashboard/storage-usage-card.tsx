import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function formatBytes(bytes: number) {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(1)} ${units[i]}`;
}

export default function StorageUsageCard({
  usage,
}: {
  usage: {
    totalCount: number;
    totalSize: number;
    d7Count: number;
    d7Size: number;
    d30Count: number;
    d30Size: number;
  };
}) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Storage</CardTitle>
        <CardDescription>Assets uploaded and total size</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 px-4 sm:grid-cols-3">
        <div>
          <div className="text-muted-foreground text-sm">Total Files</div>
          <div className="text-2xl font-semibold tabular-nums">
            {usage.totalCount.toLocaleString()}
          </div>
          <div className="text-muted-foreground text-xs">
            {formatBytes(usage.totalSize)}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-sm">Last 7 days</div>
          <div className="text-2xl font-semibold tabular-nums">
            {usage.d7Count.toLocaleString()}
          </div>
          <div className="text-muted-foreground text-xs">
            {formatBytes(usage.d7Size)}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-sm">Last 30 days</div>
          <div className="text-2xl font-semibold tabular-nums">
            {usage.d30Count.toLocaleString()}
          </div>
          <div className="text-muted-foreground text-xs">
            {formatBytes(usage.d30Size)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
