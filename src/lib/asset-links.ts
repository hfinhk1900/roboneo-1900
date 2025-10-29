import { generateSignedDownloadUrl } from '@/lib/asset-management';
import { getFileSignedUrl } from '@/storage';

type DisplayMode = 'inline' | 'attachment';

interface BuildAssetUrlOptions {
  assetId: string;
  assetKey?: string | null;
  filename?: string;
  contentType?: string;
  expiresIn?: number;
  displayMode?: DisplayMode;
}

interface AssetUrlResult {
  directUrl: string | null;
  stableUrl: string;
  signedDownloadUrl: string;
  attachmentDownloadUrl: string;
  expiresAt: number;
  displayMode: DisplayMode;
}

/**
 * Helper to build asset URLs for API responses.
 * - Always returns a stable `/api/assets/<id>` URL.
 * - Tries to produce a direct R2 signed URL when assetKey is available.
 * - Provides a legacy `/api/assets/download?...` fallback to keep older flows working.
 */
export async function buildAssetUrls(
  options: BuildAssetUrlOptions
): Promise<AssetUrlResult> {
  const {
    assetId,
    assetKey,
    filename,
    contentType,
    expiresIn = 5 * 60,
    displayMode = 'inline',
  } = options;

  const stableUrl = `/api/assets/${assetId}`;

  const signed = generateSignedDownloadUrl(assetId, displayMode, expiresIn);
  const attachment = generateSignedDownloadUrl(assetId, 'attachment', expiresIn);

  let directUrl: string | null = null;
  if (assetKey) {
    try {
      const safeFilename = filename ?? `${assetId}.bin`;
      directUrl = await getFileSignedUrl(assetKey, {
        expiresIn,
        responseDisposition:
          displayMode === 'attachment'
            ? `attachment; filename="${safeFilename}"`
            : `inline; filename="${safeFilename}"`,
        responseContentType: contentType ?? undefined,
      });
    } catch (error) {
      console.warn('Failed to generate direct storage URL', {
        assetId,
        error,
      });
    }
  }

  return {
    directUrl,
    stableUrl,
    signedDownloadUrl: signed.url,
    attachmentDownloadUrl: attachment.url,
    expiresAt: signed.expires_at,
    displayMode,
  };
}
