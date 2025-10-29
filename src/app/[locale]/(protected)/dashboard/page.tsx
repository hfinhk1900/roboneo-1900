import { ChartAreaInteractive } from '@/components/dashboard/chart-area-interactive';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import FeatureUsageShare from '@/components/dashboard/feature-usage-share';
import LowCreditsUsers from '@/components/dashboard/low-credits-users';
import RecentCredits from '@/components/dashboard/recent-credits';
import RecentGenerations from '@/components/dashboard/recent-generations';
import { SectionCards } from '@/components/dashboard/section-cards';
import StorageUsageCard from '@/components/dashboard/storage-usage-card';
import { getDb } from '@/db';
import {
  aibgHistory,
  assets,
  creditsTransaction,
  productshotHistory,
  profilePictureHistory,
  screamAiHistory,
  stickerHistory,
  user,
  watermarkHistory,
} from '@/db/schema';
import { SCREAM_PRESET_MAP } from '@/features/scream-ai/constants';
import { getStickerPrompt, getStickerStyleName } from '@/features/sticker/style-config';
import { Routes } from '@/routes';
import { desc, eq, sql } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
// Removed demo table data as it is unrelated to dashboard metrics

/**
 * Dashboard page
 *
 * NOTICE: This is a demo page for the dashboard, no real data is used,
 * we will show real data in the future
 */
export default async function DashboardPage() {
  const t = await getTranslations();

  // Gather metrics (RSC)
  let totalUsers = 0;
  let newUsers30d = 0;
  let creditsUsed7d = 0;
  let gens30d = 0;
  let chartPoints: Array<{ date: string; generations: number }> = [];
  let featureShare: {
    d7: Record<string, number>;
    d30: Record<string, number>;
    d90: Record<string, number>;
  } = { d7: {}, d30: {}, d90: {} };
  let recentGenerations: Array<{
    id: string;
    type: string;
    label: string;
    rawLabel: string;
    prompt: string;
    route: string | null;
    url?: string | null;
    assetId?: string | null;
    previewUrl?: string | null;
    uploadPreviewUrl?: string | null;
    userId: string;
    userEmail: string | null;
    ipAddress: string | null;
    createdAt: Date;
  }> = [];
  let recentCredits: Array<{
    id: string;
    type: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    createdAt: Date;
    userId: string;
  }> = [];
  let storageUsage: {
    totalCount: number;
    totalSize: number;
    d7Count: number;
    d7Size: number;
    d30Count: number;
    d30Size: number;
  } = {
    totalCount: 0,
    totalSize: 0,
    d7Count: 0,
    d7Size: 0,
    d30Count: 0,
    d30Size: 0,
  };
  let lowCredits: Array<{ id: string; email: string; credits: number }> = [];

  const FEATURE_ROUTES: Record<string, string> = {
    aibg: Routes.AIBackground,
    productshot: Routes.ProductShot,
    sticker: Routes.AISticker,
    watermark: Routes.RemoveWatermark,
    profile: Routes.ProfilePictureMaker,
    scream: Routes.ScreamAI,
  };

  const resolveLabel = (type: string, rawLabel: string): string => {
    if (type === 'sticker') {
      return getStickerStyleName(rawLabel) ?? rawLabel;
    }
    if (type === 'scream') {
      return SCREAM_PRESET_MAP.get(rawLabel ?? '')?.name ?? rawLabel;
    }
    return rawLabel;
  };

  const resolvePrompt = (type: string, rawLabel: string): string => {
    if (type === 'sticker') {
      return getStickerPrompt(rawLabel) ?? '';
    }
    if (type === 'scream') {
      return SCREAM_PRESET_MAP.get(rawLabel ?? '')?.prompt ?? '';
    }
    return '';
  };

  const parseMetadata = (
    meta: string | null | undefined
  ): Record<string, unknown> | null => {
    if (!meta) return null;
    try {
      return JSON.parse(meta);
    } catch {
      return null;
    }
  };

  const resolveAssetUrl = (url?: string | null, assetId?: string | null) => {
    if (assetId) {
      return `/api/assets/${assetId}`;
    }
    if (!url) {
      return null;
    }
    if (url.startsWith('/api/assets/download')) {
      try {
        const urlObj = new URL(url, 'http://localhost');
        const extracted = urlObj.searchParams.get('asset_id');
        if (extracted) {
          return `/api/assets/${extracted}`;
        }
      } catch {}
    }
    return url;
  };

  try {
    const db = await getDb();
    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const d90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    try {
      const usersCount = await db
        .select({ count: sql<number>`CAST(count(*) AS INT)` })
        .from(user);
      totalUsers = Number(usersCount?.[0]?.count ?? 0);
    } catch {}

    try {
      const users30d = await db
        .select({ count: sql<number>`CAST(count(*) AS INT)` })
        .from(user)
        .where(sql`${user.createdAt} >= ${d30.toISOString()}`);
      newUsers30d = Number(users30d?.[0]?.count ?? 0);
    } catch {}

    try {
      // credits used in last 7 days (usage is negative), present positive sum
      const used7d = await db
        .select({
          used: sql<number>`CAST(COALESCE(SUM(CASE WHEN ${creditsTransaction.type} = 'usage' THEN -${creditsTransaction.amount} ELSE 0 END), 0) AS INT)`,
        })
        .from(creditsTransaction)
        .where(sql`${creditsTransaction.created_at} >= ${d7.toISOString()}`);
      creditsUsed7d = Number(used7d?.[0]?.used ?? 0);
    } catch {}

    try {
      // generations total in last 30 days — sum across feature tables
      const [cntAibg] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(aibgHistory)
        .where(sql`${aibgHistory.createdAt} >= ${d30.toISOString()}`);
      const [cntProduct] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(productshotHistory)
        .where(sql`${productshotHistory.createdAt} >= ${d30.toISOString()}`);
      const [cntSticker] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(stickerHistory)
        .where(sql`${stickerHistory.createdAt} >= ${d30.toISOString()}`);
      const [cntWatermark] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(watermarkHistory)
        .where(sql`${watermarkHistory.createdAt} >= ${d30.toISOString()}`);
      const [cntProfile] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(profilePictureHistory)
        .where(sql`${profilePictureHistory.createdAt} >= ${d30.toISOString()}`);
      const [cntScream] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(screamAiHistory)
        .where(sql`${screamAiHistory.createdAt} >= ${d30.toISOString()}`);
      const nA = Number(cntAibg?.c ?? 0);
      const nP = Number(cntProduct?.c ?? 0);
      const nS = Number(cntSticker?.c ?? 0);
      const nW = Number(cntWatermark?.c ?? 0);
      const nR = Number(cntProfile?.c ?? 0);
      const nSc = Number(cntScream?.c ?? 0);
      gens30d = nA + nP + nS + nW + nR + nSc;
    } catch {}

    try {
      // daily generation counts for chart (90d) — merge across feature tables
      const merge = new Map<string, number>();

      const dailyAibg = await db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${aibgHistory.createdAt}), 'YYYY-MM-DD')`,
          cnt: sql<number>`CAST(count(*) AS INT)`,
        })
        .from(aibgHistory)
        .where(sql`${aibgHistory.createdAt} >= ${d90.toISOString()}`)
        .groupBy(sql`date_trunc('day', ${aibgHistory.createdAt})`)
        .orderBy(sql`date_trunc('day', ${aibgHistory.createdAt})`);
      for (const r of dailyAibg as any)
        merge.set(r.day, (merge.get(r.day) || 0) + (Number(r.cnt) || 0));

      const dailyProduct = await db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${productshotHistory.createdAt}), 'YYYY-MM-DD')`,
          cnt: sql<number>`CAST(count(*) AS INT)`,
        })
        .from(productshotHistory)
        .where(sql`${productshotHistory.createdAt} >= ${d90.toISOString()}`)
        .groupBy(sql`date_trunc('day', ${productshotHistory.createdAt})`)
        .orderBy(sql`date_trunc('day', ${productshotHistory.createdAt})`);
      for (const r of dailyProduct as any)
        merge.set(r.day, (merge.get(r.day) || 0) + (Number(r.cnt) || 0));

      const dailySticker = await db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${stickerHistory.createdAt}), 'YYYY-MM-DD')`,
          cnt: sql<number>`CAST(count(*) AS INT)`,
        })
        .from(stickerHistory)
        .where(sql`${stickerHistory.createdAt} >= ${d90.toISOString()}`)
        .groupBy(sql`date_trunc('day', ${stickerHistory.createdAt})`)
        .orderBy(sql`date_trunc('day', ${stickerHistory.createdAt})`);
      for (const r of dailySticker as any)
        merge.set(r.day, (merge.get(r.day) || 0) + (Number(r.cnt) || 0));

      const dailyWatermark = await db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${watermarkHistory.createdAt}), 'YYYY-MM-DD')`,
          cnt: sql<number>`CAST(count(*) AS INT)`,
        })
        .from(watermarkHistory)
        .where(sql`${watermarkHistory.createdAt} >= ${d90.toISOString()}`)
        .groupBy(sql`date_trunc('day', ${watermarkHistory.createdAt})`)
        .orderBy(sql`date_trunc('day', ${watermarkHistory.createdAt})`);
      for (const r of dailyWatermark as any)
        merge.set(r.day, (merge.get(r.day) || 0) + (Number(r.cnt) || 0));

      const dailyProfile = await db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${profilePictureHistory.createdAt}), 'YYYY-MM-DD')`,
          cnt: sql<number>`CAST(count(*) AS INT)`,
        })
        .from(profilePictureHistory)
        .where(sql`${profilePictureHistory.createdAt} >= ${d90.toISOString()}`)
        .groupBy(sql`date_trunc('day', ${profilePictureHistory.createdAt})`)
        .orderBy(sql`date_trunc('day', ${profilePictureHistory.createdAt})`);
      for (const r of dailyProfile as any)
        merge.set(r.day, (merge.get(r.day) || 0) + (Number(r.cnt) || 0));

      const dailyScream = await db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${screamAiHistory.createdAt}), 'YYYY-MM-DD')`,
          cnt: sql<number>`CAST(count(*) AS INT)`,
        })
        .from(screamAiHistory)
        .where(sql`${screamAiHistory.createdAt} >= ${d90.toISOString()}`)
        .groupBy(sql`date_trunc('day', ${screamAiHistory.createdAt})`)
        .orderBy(sql`date_trunc('day', ${screamAiHistory.createdAt})`);
      for (const r of dailyScream as any)
        merge.set(r.day, (merge.get(r.day) || 0) + (Number(r.cnt) || 0));

      const days = Array.from(merge.keys()).sort();
      chartPoints = days.map((day) => ({
        date: day,
        generations: merge.get(day) || 0,
      }));
    } catch {}

    // Feature usage share (counts per feature for 7/30/90 days)
    try {
      const [a7] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(aibgHistory)
        .where(sql`${aibgHistory.createdAt} >= ${d7.toISOString()}`);
      const [p7] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(productshotHistory)
        .where(sql`${productshotHistory.createdAt} >= ${d7.toISOString()}`);
      const [s7] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(stickerHistory)
        .where(sql`${stickerHistory.createdAt} >= ${d7.toISOString()}`);
      const [w7] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(watermarkHistory)
        .where(sql`${watermarkHistory.createdAt} >= ${d7.toISOString()}`);
      const [r7] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(profilePictureHistory)
        .where(sql`${profilePictureHistory.createdAt} >= ${d7.toISOString()}`);
      const [sc7] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(screamAiHistory)
        .where(sql`${screamAiHistory.createdAt} >= ${d7.toISOString()}`);
      featureShare.d7 = {
        aibg: Number(a7?.c || 0),
        productshot: Number(p7?.c || 0),
        sticker: Number(s7?.c || 0),
        watermark: Number(w7?.c || 0),
        profile: Number(r7?.c || 0),
        scream: Number(sc7?.c || 0),
      };

      const [a30] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(aibgHistory)
        .where(sql`${aibgHistory.createdAt} >= ${d30.toISOString()}`);
      const [p30] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(productshotHistory)
        .where(sql`${productshotHistory.createdAt} >= ${d30.toISOString()}`);
      const [s30] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(stickerHistory)
        .where(sql`${stickerHistory.createdAt} >= ${d30.toISOString()}`);
      const [w30] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(watermarkHistory)
        .where(sql`${watermarkHistory.createdAt} >= ${d30.toISOString()}`);
      const [r30] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(profilePictureHistory)
        .where(sql`${profilePictureHistory.createdAt} >= ${d30.toISOString()}`);
      const [sc30] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(screamAiHistory)
        .where(sql`${screamAiHistory.createdAt} >= ${d30.toISOString()}`);
      featureShare.d30 = {
        aibg: Number(a30?.c || 0),
        productshot: Number(p30?.c || 0),
        sticker: Number(s30?.c || 0),
        watermark: Number(w30?.c || 0),
        profile: Number(r30?.c || 0),
        scream: Number(sc30?.c || 0),
      };

      const [a90] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(aibgHistory)
        .where(sql`${aibgHistory.createdAt} >= ${d90.toISOString()}`);
      const [p90] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(productshotHistory)
        .where(sql`${productshotHistory.createdAt} >= ${d90.toISOString()}`);
      const [s90] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(stickerHistory)
        .where(sql`${stickerHistory.createdAt} >= ${d90.toISOString()}`);
      const [w90] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(watermarkHistory)
        .where(sql`${watermarkHistory.createdAt} >= ${d90.toISOString()}`);
      const [r90] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(profilePictureHistory)
        .where(sql`${profilePictureHistory.createdAt} >= ${d90.toISOString()}`);
      const [sc90] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(screamAiHistory)
        .where(sql`${screamAiHistory.createdAt} >= ${d90.toISOString()}`);
      featureShare.d90 = {
        aibg: Number(a90?.c || 0),
        productshot: Number(p90?.c || 0),
        sticker: Number(s90?.c || 0),
        watermark: Number(w90?.c || 0),
        profile: Number(r90?.c || 0),
        scream: Number(sc90?.c || 0),
      };
    } catch {}

    // Recent generations (merge last records from all feature tables)
    try {
      const limit = 120;
      const selectWithFallback = async <T,>(
        primary: () => Promise<T>,
        fallback: () => Promise<T>,
        label: string
      ): Promise<T> => {
        try {
          return await primary();
        } catch (error) {
          console.warn(
            `[Dashboard] Failed to load ${label} with assetId column, falling back.`,
            error
          );
          return fallback();
        }
      };

      const a = await selectWithFallback(
        () =>
          db
            .select({
              id: aibgHistory.id,
              url: aibgHistory.url,
              assetId: aibgHistory.assetId,
              rawLabel: aibgHistory.style,
              userId: aibgHistory.userId,
              userEmail: user.email,
              createdAt: aibgHistory.createdAt,
              metadata: assets.metadata,
            })
            .from(aibgHistory)
            .leftJoin(user, eq(aibgHistory.userId, user.id))
            .leftJoin(assets, eq(aibgHistory.assetId, assets.id))
            .orderBy(desc(aibgHistory.createdAt))
            .limit(limit),
        () =>
          db
            .select({
              id: aibgHistory.id,
              url: aibgHistory.url,
              assetId: sql<string | null>`NULL`,
              rawLabel: aibgHistory.style,
              userId: aibgHistory.userId,
              userEmail: user.email,
              createdAt: aibgHistory.createdAt,
              metadata: sql<string | null>`NULL`,
            })
            .from(aibgHistory)
            .leftJoin(user, eq(aibgHistory.userId, user.id))
            .orderBy(desc(aibgHistory.createdAt))
            .limit(limit),
        'AI Background history'
      );

      const p = await selectWithFallback(
        () =>
          db
            .select({
              id: productshotHistory.id,
              url: productshotHistory.url,
              assetId: productshotHistory.assetId,
              rawLabel: productshotHistory.scene,
              userId: productshotHistory.userId,
              userEmail: user.email,
              createdAt: productshotHistory.createdAt,
              metadata: assets.metadata,
            })
            .from(productshotHistory)
            .leftJoin(user, eq(productshotHistory.userId, user.id))
            .leftJoin(assets, eq(productshotHistory.assetId, assets.id))
            .orderBy(desc(productshotHistory.createdAt))
            .limit(limit),
        () =>
          db
            .select({
              id: productshotHistory.id,
              url: productshotHistory.url,
              assetId: sql<string | null>`NULL`,
              rawLabel: productshotHistory.scene,
              userId: productshotHistory.userId,
              userEmail: user.email,
              createdAt: productshotHistory.createdAt,
              metadata: sql<string | null>`NULL`,
            })
            .from(productshotHistory)
            .leftJoin(user, eq(productshotHistory.userId, user.id))
            .orderBy(desc(productshotHistory.createdAt))
            .limit(limit),
        'ProductShot history'
      );

      const s = await selectWithFallback(
        () =>
          db
            .select({
              id: stickerHistory.id,
              url: stickerHistory.url,
              assetId: stickerHistory.assetId,
              rawLabel: stickerHistory.style,
              userId: stickerHistory.userId,
              userEmail: user.email,
              createdAt: stickerHistory.createdAt,
              metadata: assets.metadata,
            })
            .from(stickerHistory)
            .leftJoin(user, eq(stickerHistory.userId, user.id))
            .leftJoin(assets, eq(stickerHistory.assetId, assets.id))
            .orderBy(desc(stickerHistory.createdAt))
            .limit(limit),
        () =>
          db
            .select({
              id: stickerHistory.id,
              url: stickerHistory.url,
              assetId: sql<string | null>`NULL`,
              rawLabel: stickerHistory.style,
              userId: stickerHistory.userId,
              userEmail: user.email,
              createdAt: stickerHistory.createdAt,
              metadata: sql<string | null>`NULL`,
            })
            .from(stickerHistory)
            .leftJoin(user, eq(stickerHistory.userId, user.id))
            .orderBy(desc(stickerHistory.createdAt))
            .limit(limit),
        'Sticker history'
      );

      const w = await selectWithFallback(
        () =>
          db
            .select({
              id: watermarkHistory.id,
              url: watermarkHistory.processedImageUrl,
              assetId: watermarkHistory.assetId,
              rawLabel: watermarkHistory.method,
              userId: watermarkHistory.userId,
              userEmail: user.email,
              createdAt: watermarkHistory.createdAt,
              metadata: assets.metadata,
            })
            .from(watermarkHistory)
            .leftJoin(user, eq(watermarkHistory.userId, user.id))
            .leftJoin(assets, eq(watermarkHistory.assetId, assets.id))
            .orderBy(desc(watermarkHistory.createdAt))
            .limit(limit),
        () =>
          db
            .select({
              id: watermarkHistory.id,
              url: watermarkHistory.processedImageUrl,
              assetId: sql<string | null>`NULL`,
              rawLabel: watermarkHistory.method,
              userId: watermarkHistory.userId,
              userEmail: user.email,
              createdAt: watermarkHistory.createdAt,
              metadata: sql<string | null>`NULL`,
            })
            .from(watermarkHistory)
            .leftJoin(user, eq(watermarkHistory.userId, user.id))
            .orderBy(desc(watermarkHistory.createdAt))
            .limit(limit),
        'Watermark history'
      );

      const r = await selectWithFallback(
        () =>
          db
            .select({
              id: profilePictureHistory.id,
              url: profilePictureHistory.url,
              assetId: profilePictureHistory.assetId,
              rawLabel: profilePictureHistory.style,
              userId: profilePictureHistory.userId,
              userEmail: user.email,
              createdAt: profilePictureHistory.createdAt,
              metadata: assets.metadata,
            })
            .from(profilePictureHistory)
            .leftJoin(user, eq(profilePictureHistory.userId, user.id))
            .leftJoin(assets, eq(profilePictureHistory.assetId, assets.id))
            .orderBy(desc(profilePictureHistory.createdAt))
            .limit(limit),
        () =>
          db
            .select({
              id: profilePictureHistory.id,
              url: profilePictureHistory.url,
              assetId: sql<string | null>`NULL`,
              rawLabel: profilePictureHistory.style,
              userId: profilePictureHistory.userId,
              userEmail: user.email,
              createdAt: profilePictureHistory.createdAt,
              metadata: sql<string | null>`NULL`,
            })
            .from(profilePictureHistory)
            .leftJoin(user, eq(profilePictureHistory.userId, user.id))
            .orderBy(desc(profilePictureHistory.createdAt))
            .limit(limit),
        'Profile picture history'
      );

      const scream = await selectWithFallback(
        () =>
          db
            .select({
              id: screamAiHistory.id,
              url: screamAiHistory.url,
              assetId: screamAiHistory.assetId,
              rawLabel: screamAiHistory.presetId,
              userId: screamAiHistory.userId,
              userEmail: user.email,
              createdAt: screamAiHistory.createdAt,
              metadata: assets.metadata,
            })
            .from(screamAiHistory)
            .leftJoin(user, eq(screamAiHistory.userId, user.id))
            .leftJoin(assets, eq(screamAiHistory.assetId, assets.id))
            .orderBy(desc(screamAiHistory.createdAt))
            .limit(limit),
        () =>
          db
            .select({
              id: screamAiHistory.id,
              url: screamAiHistory.url,
              assetId: sql<string | null>`NULL`,
              rawLabel: screamAiHistory.presetId,
              userId: screamAiHistory.userId,
              userEmail: user.email,
              createdAt: screamAiHistory.createdAt,
              metadata: sql<string | null>`NULL`,
            })
            .from(screamAiHistory)
            .leftJoin(user, eq(screamAiHistory.userId, user.id))
            .orderBy(desc(screamAiHistory.createdAt))
            .limit(limit),
        'Scream AI history'
      );
      recentGenerations = [
        ...a.map((x) => ({ ...x, type: 'aibg' })),
        ...p.map((x) => ({ ...x, type: 'productshot' })),
        ...s.map((x) => ({ ...x, type: 'sticker' })),
        ...w.map((x) => ({ ...x, type: 'watermark' })),
        ...r.map((x) => ({ ...x, type: 'profile' })),
        ...scream.map((x) => ({ ...x, type: 'scream' })),
      ]
        .map((item) => {
          const { metadata: rawMetadata, ...rest } = item as typeof item & {
            metadata?: string | null;
          };
          const rawLabel = rest.rawLabel ?? '';
          const resolvedUrl = resolveAssetUrl(rest.url, rest.assetId ?? null);
          const metadata = parseMetadata(rawMetadata ?? null);
          const metadataPrompt = typeof metadata?.prompt === 'string' ? metadata.prompt : null;
          const ipAddress = typeof metadata?.client_ip === 'string' ? metadata.client_ip : null;
          const uploadAssetId =
            typeof metadata?.upload_asset_id === 'string'
              ? metadata.upload_asset_id
              : null;
          const uploadPreviewUrl = uploadAssetId
            ? resolveAssetUrl(null, uploadAssetId)
            : null;

          return {
            ...rest,
            rawLabel,
            label: resolveLabel(rest.type, rawLabel),
            prompt: metadataPrompt ?? resolvePrompt(rest.type, rawLabel),
            route: FEATURE_ROUTES[rest.type] ?? null,
            previewUrl: resolvedUrl,
            url: resolvedUrl ?? rest.url ?? null,
            uploadPreviewUrl,
            ipAddress,
          };
        })
        .sort(
          (x, y) =>
            (y.createdAt?.getTime?.() || 0) - (x.createdAt?.getTime?.() || 0)
        )
        .slice(0, 100);
    } catch {}

    // Recent credits
    try {
      const rows = await db
        .select({
          id: creditsTransaction.id,
          type: creditsTransaction.type,
          amount: creditsTransaction.amount,
          balanceBefore: creditsTransaction.balance_before,
          balanceAfter: creditsTransaction.balance_after,
          createdAt: creditsTransaction.created_at,
          userId: creditsTransaction.user_id,
        })
        .from(creditsTransaction)
        .orderBy(desc(creditsTransaction.created_at))
        .limit(10);
      recentCredits = rows.map((r) => ({
        ...r,
        amount: Number(r.amount || 0),
        balanceBefore: Number(r.balanceBefore || 0),
        balanceAfter: Number(r.balanceAfter || 0),
      }));
    } catch {}

    // Storage usage
    try {
      const { assets } = await import('@/db/schema');
      const [{ c: totalCount = 0 } = { c: 0 }] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(assets);
      const [{ s: totalSize = 0 } = { s: 0 }] = await db
        .select({ s: sql<number>`COALESCE(SUM(${assets.size}), 0)` })
        .from(assets);

      const [{ c: d7Count = 0 } = { c: 0 }] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(assets)
        .where(sql`${assets.created_at} >= ${d7.toISOString()}`);
      const [{ s: d7Size = 0 } = { s: 0 }] = await db
        .select({ s: sql<number>`COALESCE(SUM(${assets.size}), 0)` })
        .from(assets)
        .where(sql`${assets.created_at} >= ${d7.toISOString()}`);

      const [{ c: d30Count = 0 } = { c: 0 }] = await db
        .select({ c: sql<number>`CAST(count(*) AS INT)` })
        .from(assets)
        .where(sql`${assets.created_at} >= ${d30.toISOString()}`);
      const [{ s: d30Size = 0 } = { s: 0 }] = await db
        .select({ s: sql<number>`COALESCE(SUM(${assets.size}), 0)` })
        .from(assets)
        .where(sql`${assets.created_at} >= ${d30.toISOString()}`);

      storageUsage = {
        totalCount: Number(totalCount),
        totalSize: Number(totalSize),
        d7Count: Number(d7Count),
        d7Size: Number(d7Size),
        d30Count: Number(d30Count),
        d30Size: Number(d30Size),
      };
    } catch {}

    // Low credits users (<= 5, top 5)
    try {
      const threshold = 5;
      const rows = await db
        .select({ id: user.id, email: user.email, credits: user.credits })
        .from(user)
        .where(sql`${user.credits} <= ${threshold}`)
        .orderBy(sql`${user.credits} ASC`)
        .limit(5);
      lowCredits = rows.map((r) => ({
        id: r.id,
        email: r.email ?? '',
        credits: Number(r.credits || 0),
      }));
    } catch {}
  } catch (error) {
    // Gracefully degrade on any server/DB failure to keep the page renderable
    // Avoid logging the full error object to prevent noisy RSC console replays in dev
    console.warn(
      'Dashboard metrics unavailable (tables missing or DB offline).'
    );
    totalUsers = 0;
    newUsers30d = 0;
    creditsUsed7d = 0;
    gens30d = 0;
    chartPoints = [];
    featureShare = { d7: {}, d30: {}, d90: {} };
    recentGenerations = [];
    recentCredits = [];
    storageUsage = {
      totalCount: 0,
      totalSize: 0,
      d7Count: 0,
      d7Size: 0,
      d30Count: 0,
      d30Size: 0,
    };
    lowCredits = [];
  }

  const breadcrumbs = [
    {
      label: t('Dashboard.dashboard.title'),
      isCurrentPage: true,
    },
  ];

  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards
              totalUsers={totalUsers}
              newUsers30d={newUsers30d}
              creditsUsed7d={creditsUsed7d}
              gens30d={gens30d}
            />
            <div className="px-4 lg:px-6">
              <ChartAreaInteractive data={chartPoints} />
            </div>
            <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
              <FeatureUsageShare totals={featureShare} />
              <StorageUsageCard usage={storageUsage} />
            </div>
            <div className="px-4 lg:px-6">
              <RecentGenerations items={recentGenerations} />
            </div>
            <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
              <RecentCredits items={recentCredits} />
              <LowCreditsUsers users={lowCredits} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
