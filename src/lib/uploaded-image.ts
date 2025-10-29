import { generateAssetId } from '@/lib/asset-management';
import { getDb } from '@/db';
import { assets } from '@/db/schema';
import { uploadFile } from '@/storage';
import { eq } from 'drizzle-orm';

const EXTENSION_MAP: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

type StoreUploadedImageParams = {
  buffer: Buffer;
  contentType?: string | null;
  userId: string;
  tool: string;
  originalFilename?: string | null;
};

export type StoreUploadedImageResult = {
  assetId: string;
  key: string;
  url: string;
  filename: string;
};

export function decodeBase64Image(
  data: string,
  fallbackType = 'image/png'
): { buffer: Buffer; contentType: string } {
  let contentType = fallbackType;
  let base64Part = data;

  if (data.includes(',')) {
    const [prefix, actual] = data.split(',', 2);
    base64Part = actual;
    const match = prefix.match(/^data:(.+);base64$/);
    if (match?.[1]) {
      contentType = match[1];
    }
  }

  const buffer = Buffer.from(base64Part, 'base64');
  return { buffer, contentType };
}

function createToolFolder(tool: string): string {
  return `all-uploaded-images/${tool
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')}`;
}

function inferExtension(
  contentType?: string | null,
  fallback?: string | null
): string {
  if (contentType && EXTENSION_MAP[contentType]) {
    return EXTENSION_MAP[contentType];
  }
  if (fallback) {
    const ext = fallback.split('.').pop();
    if (ext) {
      return ext.toLowerCase();
    }
  }
  return contentType?.split('/')[1] || 'bin';
}

export async function storeUploadedImage(
  params: StoreUploadedImageParams
): Promise<StoreUploadedImageResult> {
  const { buffer, contentType, userId, tool, originalFilename } = params;
  const safeTool = tool.trim() || 'uploads';
  const folder = createToolFolder(safeTool);
  const assetId = generateAssetId();
  const ext = inferExtension(contentType, originalFilename);
  const filename = `${assetId}.${ext}`;
  const mime = contentType || 'application/octet-stream';

  const uploadResult = await uploadFile(buffer, filename, mime, folder);

  const db = await getDb();
  await db.insert(assets).values({
    id: assetId,
    key: uploadResult.key,
    filename,
    content_type: mime,
    size: buffer.byteLength,
    user_id: userId,
    metadata: JSON.stringify({
      source: 'upload',
      tool: safeTool,
      original_filename: originalFilename ?? null,
    }),
  });

  return {
    assetId,
    key: uploadResult.key,
    url: uploadResult.url,
    filename,
  };
}

export async function linkUploadedAsset(
  uploadAssetId: string,
  generatedAssetId: string
): Promise<void> {
  try {
    const db = await getDb();
    const existing = await db
      .select({ metadata: assets.metadata })
      .from(assets)
      .where(eq(assets.id, uploadAssetId))
      .limit(1);

    if (!existing.length) return;

    let metadata: Record<string, unknown> = {};
    if (existing[0].metadata) {
      try {
        metadata = JSON.parse(existing[0].metadata as string);
      } catch {}
    }

    metadata.linked_asset_id = generatedAssetId;
    metadata.linked_asset_type = 'generated';

    await db
      .update(assets)
      .set({ metadata: JSON.stringify(metadata) })
      .where(eq(assets.id, uploadAssetId));
  } catch (error) {
    console.warn('Failed to link uploaded asset', {
      uploadAssetId,
      generatedAssetId,
      error,
    });
  }
}
