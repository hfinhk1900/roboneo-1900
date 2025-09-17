import sharp from 'sharp';

export interface CornerWatermarkOptions {
  fontSizeRatio?: number; // relative to min(width, height)
  opacity?: number; // 0..1
  margin?: number; // px
  fill?: string; // text color
  stroke?: string; // stroke color
  strokeWidth?: number; // stroke width
  fontFamily?: string;
  fontWeight?: number | string;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function applyCornerWatermark(
  imageBuffer: Buffer<any>,
  text: string,
  options: CornerWatermarkOptions = {}
): Promise<Buffer> {
  const image = sharp(imageBuffer, { failOnError: false });
  const metadata = await image.metadata();
  const width = metadata.width || 1024;
  const height = metadata.height || 1024;

  const {
    fontSizeRatio = 0.045,
    opacity = 0.85,
    margin = 18,
    fill = '#FFFFFF',
    stroke = 'rgba(0,0,0,0.35)',
    strokeWidth = 2,
    fontFamily = 'Inter, Arial, Helvetica, sans-serif',
    fontWeight = 700,
  } = options;

  const fontSize = Math.max(
    10,
    Math.round(Math.min(width, height) * fontSizeRatio)
  );

  const safeText = escapeXml(text);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <style>
    .wm { font-family: ${fontFamily}; font-weight: ${String(fontWeight)}; font-size: ${fontSize}px; fill: ${fill}; opacity: ${opacity}; }
  </style>
  <text x="${width - margin}" y="${height - margin}" text-anchor="end" dominant-baseline="text-after-edge" class="wm" stroke="${stroke}" stroke-width="${strokeWidth}">${safeText}</text>
</svg>`;

  const overlay = Buffer.from(svg);

  const composited = await image
    .composite([
      {
        input: overlay,
        gravity: 'southeast',
      },
    ])
    .toBuffer();

  return composited;
}
