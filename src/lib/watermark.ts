import { Jimp, loadFont } from 'jimp';
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
    } = options;

    // 先用Sharp获取图片信息
    const image = sharp(imageBuffer, { failOnError: false });
    const metadata = await image.metadata();
    const width = metadata.width || 1024;
    const height = metadata.height || 1024;

    console.log('📐 Image dimensions:', { width, height });

    // 计算字体大小
    const fontSize = Math.max(
      10,
      Math.round(Math.min(width, height) * fontSizeRatio)
    );

    console.log('🎨 Watermark settings:', {
      fontSize,
      fill,
      position: `${width - margin}, ${height - margin}`,
    });

    // 使用Jimp来添加文本水印
    const jimpImage = await Jimp.read(imageBuffer);

    // 选择合适的Jimp字体
    let font: any;
    if (fontSize >= 64) {
      font = await loadFont(
        'open-sans/open-sans-64-white/open-sans-64-white.fnt'
      );
    } else if (fontSize >= 32) {
      font = await loadFont(
        'open-sans/open-sans-32-white/open-sans-32-white.fnt'
      );
    } else if (fontSize >= 16) {
      font = await loadFont(
        'open-sans/open-sans-16-white/open-sans-16-white.fnt'
      );
    } else {
      font = await loadFont(
        'open-sans/open-sans-8-white/open-sans-8-white.fnt'
      );
    }

    console.log('📝 Selected font size tier for:', fontSize);

    // 计算文本位置（右下角）
    const textWidth = jimpImage.measureText(font, text);
    const textHeight = jimpImage.measureTextHeight(font, text, textWidth);

    const x = width - textWidth - margin;
    const y = height - textHeight - margin;

    console.log('📍 Text position:', { x, y, textWidth, textHeight });

    // 添加文本水印
    jimpImage.print(font, x, y, text);

    // 转换回Buffer
    const watermarkedBuffer = await jimpImage.getBufferAsync(Jimp.MIME_PNG);

    console.log('✅ Watermark applied successfully with Jimp');
    return watermarkedBuffer;
  } catch (error) {
    console.error('❌ Watermark application failed:', error);
    console.log('🔙 Returning original image buffer');
    return imageBuffer;
  }
}
