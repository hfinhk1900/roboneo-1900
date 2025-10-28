import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';

export interface CornerWatermarkOptions {
  widthRatio?: number; // relative to image width
  fontSizeRatio?: number; // legacy option to maintain API compatibility
  margin?: number; // px
  opacity?: number; // 0..1 multiplier applied to embedded watermark
}

const WATERMARK_PATH = path.join(
  process.cwd(),
  'public',
  'watermark',
  'roboneo-watermark.png'
);
const BASE_WATERMARK_WIDTH = 640;
const BASE_WATERMARK_HEIGHT = 160;

let cachedWatermark: Buffer | null = null;

async function getWatermarkBuffer(): Promise<Buffer> {
  if (cachedWatermark) {
    return cachedWatermark;
  }

  try {
    cachedWatermark = await fs.readFile(WATERMARK_PATH);
    return cachedWatermark;
  } catch (error) {
    console.error('[watermark] Failed to read watermark asset:', error);
    throw error;
  }
}

export async function applyCornerWatermark(
  imageBuffer: Buffer<any>,
  _text: string,
  options: CornerWatermarkOptions = {}
): Promise<Buffer> {
  const image = sharp(imageBuffer, { failOnError: false });
  const metadata = await image.metadata();

  // Determine average luminance to decide watermark color
  let useDarkWatermark = false;
  try {
    const stats = await image.clone().stats();
    const r = stats.channels[0]?.mean ?? 255;
    const g = stats.channels[1]?.mean ?? 255;
    const b = stats.channels[2]?.mean ?? 255;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    useDarkWatermark = luminance > 180; // bright background → dark watermark
  } catch (error) {
    console.warn('[watermark] Failed to compute image luminance:', error);
  }
  const width = metadata.width || 1024;
  const height = metadata.height || 1024;

  const resolvedWidthRatio = (() => {
    if (typeof options.widthRatio === 'number') {
      return options.widthRatio;
    }
    if (typeof options.fontSizeRatio === 'number') {
      // Historically, fontSizeRatio defaulted to 0.045 for typography.
      // Map legacy value to a comparable width coverage (~0.32 when 0.045).
      return Math.max(0.05, Math.min(options.fontSizeRatio * 7, 0.5));
    }
    return 0.28;
  })();
  const { margin = 32, opacity = 0.9 } = options;

  const targetWidth = Math.max(
    160,
    Math.round(width * Math.min(Math.max(resolvedWidthRatio, 0.05), 0.5))
  );
  const targetHeight = Math.round(
    (BASE_WATERMARK_HEIGHT / BASE_WATERMARK_WIDTH) * targetWidth
  );

  const watermark = await getWatermarkBuffer();
  const overlaySharp = sharp(watermark)
    .resize({ width: targetWidth, height: targetHeight, fit: 'inside' })
    .ensureAlpha();

  const normalizedOpacity = Math.max(0, Math.min(opacity, 1));
  const { data, info } = await overlaySharp
    .raw()
    .toBuffer({ resolveWithObject: true });
  const alphaIndex = info.channels - 1;

  // Adjust watermark color (RGB) based on background brightness
  for (let i = 0; i < data.length; i += info.channels) {
    if (info.channels >= 3) {
      const colorValue = useDarkWatermark ? 24 : 245; // dark gray vs light
      data[i] = colorValue; // R
      data[i + 1] = colorValue; // G
      data[i + 2] = colorValue; // B
    }
  }

  if (normalizedOpacity < 1) {
    for (let i = alphaIndex; i < data.length; i += info.channels) {
      data[i] = Math.round(data[i] * normalizedOpacity);
    }
  }

  const scaledWatermark = await sharp(data, { raw: info }).png().toBuffer();

  const left = Math.max(margin, width - targetWidth - margin);
  const top = Math.max(margin, height - targetHeight - margin);

  return image
    .composite([
      {
        input: scaledWatermark,
        left,
        top,
        blend: 'over',
      },
    ])
    .png()
    .toBuffer();
}
