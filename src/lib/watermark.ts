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

export async function applyCornerWatermark(
  imageBuffer: Buffer<any>,
  text: string,
  options: CornerWatermarkOptions = {}
): Promise<Buffer> {
  console.log('🔧 Watermark function called with text:', text);

  try {
    const {
      fontSizeRatio = 0.045,
      opacity = 0.9,
      margin = 18,
      fill = '#FFFFFF',
      strokeWidth = 2,
    } = options;

    const image = sharp(imageBuffer, { failOnError: false });
    const metadata = await image.metadata();
    const width = metadata.width || 1024;
    const height = metadata.height || 1024;

    console.log('📐 Image dimensions:', { width, height });

    // 计算字体大小
    const fontSize = Math.max(
      16,
      Math.round(Math.min(width, height) * fontSizeRatio)
    );

    console.log('🎨 Watermark settings:', {
      fontSize,
      fill,
      position: `${width - margin}, ${height - margin}`,
    });

    // 创建一个简单的文本SVG，使用最基础的配置
    const textSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <text x="${width - margin}" y="${height - margin - 5}" 
        text-anchor="end" 
        fill="${fill}" 
        font-size="${fontSize}" 
        font-family="Arial, sans-serif" 
        font-weight="bold">${text}</text>
</svg>`;

    console.log('📝 Generated text SVG length:', textSvg.length);

    // 使用Sharp合成水印
    const result = await image
      .composite([
        {
          input: Buffer.from(textSvg),
          top: 0,
          left: 0,
        },
      ])
      .png()
      .toBuffer();

    console.log('✅ Watermark applied successfully with Sharp text');
    return result;

  } catch (error) {
    console.error('❌ Watermark application failed:', error);
    console.log('🔙 Returning original image buffer');
    return imageBuffer;
  }
}