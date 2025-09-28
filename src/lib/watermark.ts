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
  console.log('🔧 Watermark function called with text:', text);
  
  try {
    const image = sharp(imageBuffer, { failOnError: false });
    const metadata = await image.metadata();
    const width = metadata.width || 1024;
    const height = metadata.height || 1024;
    
    console.log('📐 Image dimensions:', { width, height });

    const {
      fontSizeRatio = 0.045,
      opacity = 0.85,
      margin = 18,
      fill = '#FFFFFF',
      stroke = 'rgba(0,0,0,0.35)',
      strokeOpacity = undefined,
      strokeWidth = 2,
      fontFamily = 'sans-serif',
      fontWeight = 'bold',
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

    const { color: fillColor, opacity: fillOpacity } = parseColor(
      fill,
      '#FFFFFF',
      opacity
    );
    const { color: strokeColor, opacity: strokeOpacityValue } = parseColor(
      stroke,
      '#000000',
      strokeOpacity ?? 0.35
    );

    const fontSize = Math.max(
      10,
      Math.round(Math.min(width, height) * fontSizeRatio)
    );

    console.log('🎨 Watermark settings:', {
      fontSize,
      fillColor,
      strokeColor,
      position: `${width - margin}, ${height - margin}`
    });

    const safeText = escapeXml(text);
    
    // 使用最简单的SVG，确保兼容性
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <text x="${width - margin}" y="${height - margin}" text-anchor="end" 
    fill="${fillColor}"
    stroke="${strokeColor}"
    stroke-width="${strokeWidth}"
    font-family="sans-serif"
    font-weight="bold"
    font-size="${fontSize}px"
  >${safeText}</text>
</svg>`;

    console.log('📝 Generated SVG length:', svg.length);
    console.log('🎨 SVG preview:', svg.substring(0, 200) + '...');
    
    const overlay = Buffer.from(svg);

    const composited = await image
      .composite([
        {
          input: overlay,
          gravity: 'southeast',
        },
      ])
      .toBuffer();

    console.log('✅ Watermark applied successfully');
    return composited;
    
  } catch (error) {
    console.error('❌ Watermark application failed:', error);
    console.log('🔙 Returning original image buffer');
    return imageBuffer;
  }
}