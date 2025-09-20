import { createHmac } from 'crypto';
import { join } from 'path';
import { access, readFile, writeFile } from 'fs/promises';
import { nanoid } from 'nanoid';

export interface AssetMetadata {
  asset_id: string;
  original_url: string;
  file_name: string;
  content_type: string;
  size: number;
  created_at: number;
  user_id: string;
}

export interface SignedDownloadUrl {
  url: string;
  expires_at: number;
}

export interface AssetDownloadParams {
  asset_id: string;
  exp: number;
  sig: string;
  disp?: 'inline' | 'attachment';
}

// 资产元数据存储路径
const ASSETS_DIR = join(process.cwd(), 'temp', 'assets');

/**
 * 确保资产目录存在
 */
async function ensureAssetsDir(): Promise<void> {
  try {
    await access(ASSETS_DIR);
  } catch {
    // 目录不存在，创建它
    const fs = await import('fs');
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }
}

/**
 * 生成资产ID
 */
export function generateAssetId(): string {
  return nanoid(32);
}

/**
 * 存储资产元数据
 */
export async function storeAssetMetadata(
  metadata: AssetMetadata
): Promise<void> {
  await ensureAssetsDir();
  const filePath = join(ASSETS_DIR, `${metadata.asset_id}.json`);
  await writeFile(filePath, JSON.stringify(metadata, null, 2));
}

/**
 * 获取资产元数据
 */
export async function getAssetMetadata(
  assetId: string
): Promise<AssetMetadata | null> {
  try {
    await ensureAssetsDir();
    const filePath = join(ASSETS_DIR, `${assetId}.json`);
    const data = await readFile(filePath, 'utf-8');
    return JSON.parse(data) as AssetMetadata;
  } catch {
    return null;
  }
}

/**
 * 生成下载签名
 */
export function generateDownloadSignature(
  assetId: string,
  expiresAt: number,
  displayMode: 'inline' | 'attachment' = 'inline'
): string {
  const secret = process.env.URL_SIGNING_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV !== 'production') {
      // Dev fallback for local testing; strongly recommend setting real secret
      console.warn(
        'URL_SIGNING_SECRET is not set; using insecure dev fallback'
      );
      return createHmac('sha256', 'dev-insecure-secret')
        .update(`${assetId}|${expiresAt}|${displayMode}`)
        .digest('base64url');
    }
    throw new Error('URL_SIGNING_SECRET is not configured');
  }
  const dataToSign = `${assetId}|${expiresAt}|${displayMode}`;

  return createHmac('sha256', secret).update(dataToSign).digest('base64url');
}

/**
 * 验证下载签名
 */
export function verifyDownloadSignature(
  assetId: string,
  expiresAt: number,
  signature: string,
  displayMode: 'inline' | 'attachment' = 'inline'
): boolean {
  const expectedSignature = generateDownloadSignature(
    assetId,
    expiresAt,
    displayMode
  );
  return signature === expectedSignature;
}

/**
 * 生成签名下载URL
 */
export function generateSignedDownloadUrl(
  assetId: string,
  displayMode: 'inline' | 'attachment' = 'inline',
  expiresIn = 3600
): SignedDownloadUrl {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
  const signature = generateDownloadSignature(assetId, expiresAt, displayMode);

  const url = `/api/assets/download?asset_id=${assetId}&exp=${expiresAt}&sig=${signature}&disp=${displayMode}`;

  return {
    url,
    expires_at: expiresAt,
  };
}

/**
 * 解析下载URL参数
 */
export function parseDownloadUrl(url: string): AssetDownloadParams | null {
  try {
    const urlObj = new URL(url, 'http://localhost');
    const asset_id = urlObj.searchParams.get('asset_id');
    const exp = urlObj.searchParams.get('exp');
    const sig = urlObj.searchParams.get('sig');
    const disp =
      (urlObj.searchParams.get('disp') as 'inline' | 'attachment') || 'inline';

    if (!asset_id || !exp || !sig) {
      return null;
    }

    return {
      asset_id,
      exp: Number.parseInt(exp),
      sig,
      disp,
    };
  } catch {
    return null;
  }
}
