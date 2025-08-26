import { createHmac, randomBytes } from 'crypto';

/**
 * 生成带签名的临时URL，用于安全访问图片
 */
export interface SignedUrlOptions {
  expiresIn?: number; // 过期时间（秒），默认1小时
  userId?: string; // 用户ID，用于访问控制
  imageKey?: string; // 图片存储键
}

export interface SignedUrlResult {
  url: string;
  expiresAt: number;
  signature: string;
}

/**
 * 生成签名URL
 */
export function generateSignedUrl(
  baseUrl: string,
  options: SignedUrlOptions = {}
): SignedUrlResult {
  const { expiresIn = 3600, userId, imageKey } = options;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

  // 创建签名数据
  const dataToSign = `${baseUrl}|${expiresAt}|${userId || ''}|${imageKey || ''}`;

  // 使用环境变量中的密钥进行签名
  const secret = process.env.URL_SIGNING_SECRET || 'default-secret-key';
  const signature = createHmac('sha256', secret)
    .update(dataToSign)
    .digest('hex');

  // 构建签名URL
  const separator = baseUrl.includes('?') ? '&' : '?';
  const signedUrl = `${baseUrl}${separator}expires=${expiresAt}&signature=${signature}${userId ? `&uid=${userId}` : ''}`;

  return {
    url: signedUrl,
    expiresAt,
    signature,
  };
}

/**
 * 验证签名URL
 */
export function verifySignedUrl(url: string, userId?: string): boolean {
  try {
    const urlObj = new URL(url);
    const expires = Number.parseInt(urlObj.searchParams.get('expires') || '0');
    const signature = urlObj.searchParams.get('signature') || '';
    const uid = urlObj.searchParams.get('uid') || '';

    // 检查过期时间
    if (expires < Math.floor(Date.now() / 1000)) {
      return false;
    }

    // 检查用户ID匹配
    if (userId && uid !== userId) {
      return false;
    }

    // 重建原始URL（移除签名参数）
    const baseUrl = url.split('?')[0];
    const dataToSign = `${baseUrl}|${expires}||${uid}`;

    // 验证签名
    const secret = process.env.URL_SIGNING_SECRET || 'default-secret-key';
    const expectedSignature = createHmac('sha256', secret)
      .update(dataToSign)
      .digest('hex');

    return signature === expectedSignature;
  } catch (error) {
    console.error('URL verification failed:', error);
    return false;
  }
}

/**
 * 从签名URL中提取图片键
 */
export function extractImageKeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    return pathParts[pathParts.length - 1] || null;
  } catch {
    return null;
  }
}
