"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PerformanceDashboard from "@/components/blocks/library/performance-dashboard";
import ServiceWorkerStatusComponent from "@/components/blocks/library/service-worker-status";
import { IndexedDBManager } from "@/lib/image-library/indexeddb-manager";

interface Quota {
  used: number;
  available: number;
  total: number;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function AdminToolsPageClient() {
  const db = useMemo(() => IndexedDBManager.getInstance(), []);
  const [quota, setQuota] = useState<Quota | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await db.initialize();
        const q = await db.getStorageQuota();
        if (mounted) setQuota(q as Quota);
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [db]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin: Performance & Storage</h1>
        <p className="text-gray-600 text-sm">Monitoring widgets for admins only</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Core Web Vitals & Bandwidth</CardTitle>
        </CardHeader>
        <CardContent>
          <PerformanceDashboard />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Local Storage (IndexedDB)</CardTitle>
          </CardHeader>
          <CardContent>
            {quota ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Used</span>
                  <span>{formatBytes(quota.used)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Available</span>
                  <span>{formatBytes(quota.available)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Total</span>
                  <span>{formatBytes(quota.total)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(quota.used / quota.total) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Loading...</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Worker</CardTitle>
          </CardHeader>
          <CardContent>
            <ServiceWorkerStatusComponent />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminToolsPageClient;

