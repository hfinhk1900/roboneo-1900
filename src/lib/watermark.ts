import sharp from 'sharp';

export interface CornerWatermarkOptions {
  fontSizeRatio?: number; // relative to min(width, height)
  opacity?: number; // 0..1
  margin?: number; // px
  fill?: string; // text color
  stroke?: string; // stroke color
  strokeOpacity?: number; // stroke opacity 0..1
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
    opacity = 0.9,
    margin = 24,
    fill = '#FFFFFF',
    stroke = 'rgba(0,0,0,0.45)',
    strokeOpacity = 0.45,
    strokeWidth = 3,
    fontFamily = 'Arial, Helvetica, sans-serif',
    fontWeight = '700',
  } = options;

  const parseColor = (
    color: string,
    fallback: string,
    defaultOpacity: number
  ): { color: string; opacity: number } => {
    if (!color) {
      return { color: fallback, opacity: defaultOpacity };
    }

    const rgbaMatch = color
      .replace(/\s+/g, '')
      .match(/^rgba?\((\d{1,3}),(\d{1,3}),(\d{1,3})(?:,(\d*\.?\d+))?\)$/i);

    if (rgbaMatch) {
      const [_, r, g, b, a] = rgbaMatch;
      const toHex = (value: string) =>
        Math.max(0, Math.min(Number.parseInt(value, 10), 255))
          .toString(16)
          .padStart(2, '0');
      return {
        color: `#${toHex(r)}${toHex(g)}${toHex(b)}`,
        opacity:
          a !== undefined
            ? Math.max(0, Math.min(Number.parseFloat(a), 1))
            : defaultOpacity,
      };
    }

    if (/^#[0-9a-f]{3,8}$/i.test(color)) {
      return { color, opacity: defaultOpacity };
    }

    return { color, opacity: defaultOpacity };
  };

  const fontSize = Math.max(
    16,
    Math.round(Math.min(width, height) * fontSizeRatio)
  );

  const { color: fillColor, opacity: fillOpacity } = parseColor(
    fill,
    '#FFFFFF',
    opacity
  );
  const { color: strokeColor, opacity: strokeOpacityValue } = parseColor(
    stroke,
    '#000000',
    strokeOpacity
  );

  const safeText = escapeXml(text);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
  <text x="${width - margin}" y="${height - margin}"
        text-anchor="end"
        dominant-baseline="text-after-edge"
        fill="${fillColor}"
        fill-opacity="${fillOpacity}"
        stroke="${strokeColor}"
        stroke-opacity="${strokeOpacityValue}"
        stroke-width="${strokeWidth}"
        paint-order="stroke fill"
        font-family="${fontFamily}"
        font-weight="${String(fontWeight)}"
        font-size="${fontSize}px">${safeText}</text>
</svg>`;

  const overlay = Buffer.from(svg);

  const composited = await image
    .composite([
      {
        input: overlay,
        gravity: 'southeast',
        blend: 'over',
      },
    ])
    .png()
    .toBuffer();

  return composited;
}
