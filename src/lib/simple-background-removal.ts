/**
 * 简化的去背景服务
 * 使用 Canvas API 进行基本的背景处理
 * 作为 @imgly/background-removal 的临时替代方案
 */

export interface SimpleBackgroundRemovalOptions {
  threshold?: number; // 颜色相似度阈值 (0-255)
  backgroundColor?: string; // 要移除的背景颜色
  outputFormat?: 'image/png' | 'image/jpeg' | 'image/webp';
  quality?: number;
}

export interface SimpleBackgroundRemovalResult {
  success: boolean;
  image?: string;
  error?: string;
  processingTime?: number;
}

/**
 * 简化的去背景服务
 */
export class SimpleBackgroundRemovalService {
  private static instance: SimpleBackgroundRemovalService;

  static getInstance(): SimpleBackgroundRemovalService {
    if (!SimpleBackgroundRemovalService.instance) {
      SimpleBackgroundRemovalService.instance = new SimpleBackgroundRemovalService();
    }
    return SimpleBackgroundRemovalService.instance;
  }

  /**
   * 去除图片背景
   */
  async removeBackground(
    imageFile: File | string,
    options: SimpleBackgroundRemovalOptions = {}
  ): Promise<SimpleBackgroundRemovalResult> {
    const startTime = Date.now();

    try {
      const config = {
        threshold: options.threshold || 50, // 增加阈值，更宽松的匹配
        backgroundColor: options.backgroundColor || '#FFFFFF',
        outputFormat: options.outputFormat || 'image/png',
        quality: options.quality || 0.9
      };

      // 创建图片元素
      const img = new Image();

      if (typeof imageFile === 'string') {
        img.src = imageFile;
      } else {
        img.src = URL.createObjectURL(imageFile);
      }

      // 等待图片加载
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // 创建 Canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Cannot create canvas context');
      }

      canvas.width = img.width;
      canvas.height = img.height;

      // 绘制原始图片
      ctx.drawImage(img, 0, 0);

      // 获取图片数据
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // 解析背景颜色
      const bgColor = this.parseColor(config.backgroundColor);
      const threshold = config.threshold;

            // 改进的背景移除算法
      // 1. 首先检测图片边缘的背景色
      const edgeColors = this.detectEdgeColors(data, canvas.width, canvas.height);

      // 2. 使用边缘颜色作为背景色参考
      const detectedBgColor = edgeColors.length > 0 ? edgeColors[0] : bgColor;

      console.log('🎨 背景检测结果:', {
        originalBgColor: bgColor,
        detectedBgColor: detectedBgColor,
        threshold: threshold,
        imageSize: `${canvas.width}x${canvas.height}`
      });

      // 3. 处理每个像素
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // 计算与检测到的背景色的相似度
        const colorDiff = Math.sqrt(
          Math.pow(r - detectedBgColor.r, 2) +
          Math.pow(g - detectedBgColor.g, 2) +
          Math.pow(b - detectedBgColor.b, 2)
        );

        // 使用更宽松的阈值，并考虑亮度
        const brightness = (r + g + b) / 3;
        const bgBrightness = (detectedBgColor.r + detectedBgColor.g + detectedBgColor.b) / 3;
        const brightnessDiff = Math.abs(brightness - bgBrightness);

        // 如果颜色相似度超过阈值且亮度接近，设置为透明
        if (colorDiff <= threshold * 1.5 && brightnessDiff <= threshold) {
          data[i + 3] = 0; // 设置 alpha 为 0 (透明)
        }
      }

      // 将处理后的数据放回 Canvas
      ctx.putImageData(imageData, 0, 0);

      // 转换为 base64
      const dataUrl = canvas.toDataURL(config.outputFormat, config.quality);

      // 清理
      if (typeof imageFile === 'object') {
        URL.revokeObjectURL(img.src);
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        image: dataUrl,
        processingTime
      };

    } catch (error) {
      console.error('Simple background removal failed:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * 检测图片边缘的背景色
   */
  private detectEdgeColors(data: Uint8ClampedArray, width: number, height: number): { r: number; g: number; b: number }[] {
    const edgeColors: { r: number; g: number; b: number }[] = [];
    const colorCounts: Map<string, number> = new Map();

    // 采样边缘像素
    const sampleSize = Math.min(10, Math.floor(width / 4), Math.floor(height / 4));

    // 顶部边缘
    for (let x = 0; x < width; x += sampleSize) {
      const index = (x + 0 * width) * 4;
      const color = `${data[index]},${data[index + 1]},${data[index + 2]}`;
      colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
    }

    // 底部边缘
    for (let x = 0; x < width; x += sampleSize) {
      const index = (x + (height - 1) * width) * 4;
      const color = `${data[index]},${data[index + 1]},${data[index + 2]}`;
      colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
    }

    // 左侧边缘
    for (let y = 0; y < height; y += sampleSize) {
      const index = (0 + y * width) * 4;
      const color = `${data[index]},${data[index + 1]},${data[index + 2]}`;
      colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
    }

    // 右侧边缘
    for (let y = 0; y < height; y += sampleSize) {
      const index = ((width - 1) + y * width) * 4;
      const color = `${data[index]},${data[index + 1]},${data[index + 2]}`;
      colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
    }

    // 找出最常见的颜色
    let maxCount = 0;
    let dominantColor = '';

    for (const [color, count] of colorCounts) {
      if (count > maxCount) {
        maxCount = count;
        dominantColor = color;
      }
    }

    if (dominantColor) {
      const [r, g, b] = dominantColor.split(',').map(Number);
      edgeColors.push({ r, g, b });
    }

    return edgeColors;
  }

  /**
   * 解析颜色字符串为 RGB 对象
   */
  private parseColor(colorStr: string): { r: number; g: number; b: number } {
    // 处理 hex 颜色
    if (colorStr.startsWith('#')) {
      const hex = colorStr.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b };
    }

    // 处理 rgb 颜色
    if (colorStr.startsWith('rgb')) {
      const matches = colorStr.match(/\d+/g);
      if (matches && matches.length >= 3) {
        return {
          r: parseInt(matches[0]),
          g: parseInt(matches[1]),
          b: parseInt(matches[2])
        };
      }
    }

    // 默认白色
    return { r: 255, g: 255, b: 255 };
  }

  /**
   * 检查浏览器兼容性
   */
  checkCompatibility(): {
    canvas: boolean;
    imageData: boolean;
    supported: boolean;
  } {
    const canvas = (() => {
      try {
        const testCanvas = document.createElement('canvas');
        return !!(testCanvas.getContext && testCanvas.getContext('2d'));
      } catch {
        return false;
      }
    })();

    const imageData = (() => {
      try {
        const testCanvas = document.createElement('canvas');
        const ctx = testCanvas.getContext('2d');
        if (!ctx) return false;

        testCanvas.width = 1;
        testCanvas.height = 1;
        const data = ctx.getImageData(0, 0, 1, 1);
        return data && data.data && data.data.length === 4;
      } catch {
        return false;
      }
    })();

    return {
      canvas,
      imageData,
      supported: canvas && imageData
    };
  }

  /**
   * 获取推荐设置
   */
  getRecommendedSettings() {
    return {
      threshold: 50, // 增加阈值，更宽松的匹配
      backgroundColor: '#FFFFFF',
      outputFormat: 'image/png' as const,
      quality: 0.9
    };
  }
}

// 导出单例实例
export const simpleBackgroundRemovalService = SimpleBackgroundRemovalService.getInstance();
