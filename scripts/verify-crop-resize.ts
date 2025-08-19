/**
 * Verify crop+resize pipeline using sharp.
 *
 * Usage:
 *   pnpm tsx scripts/verify-crop-resize.ts <inputPath> <WxH> <outputPath>
 * Example:
 *   pnpm tsx scripts/verify-crop-resize.ts public/test-img.jpg 1024x1024 public/debug-output/test-cropped-1024.jpg
 */

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

function fail(message: string): never {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function parseSize(arg: string): { width: number; height: number } {
  const match = arg?.trim().match(/^(\d+)x(\d+)$/i);
  if (!match) {
    fail(`Invalid size "${arg}". Expected format: WxH, e.g., 1024x1024`);
  }
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    fail(`Invalid numeric size: ${arg}`);
  }
  return { width, height };
}

async function main() {
  const [inputPath, sizeArg, outputPath] = process.argv.slice(2);
  if (!inputPath || !sizeArg || !outputPath) {
    console.log(
      'Usage: pnpm tsx scripts/verify-crop-resize.ts <inputPath> <WxH> <outputPath>'
    );
    process.exit(1);
  }

  if (!fs.existsSync(inputPath)) {
    fail(`Input file not found: ${inputPath}`);
  }

  const { width, height } = parseSize(sizeArg);
  const outDir = path.dirname(outputPath);
  fs.mkdirSync(outDir, { recursive: true });

  const inputMeta = await sharp(inputPath).metadata();
  console.log('📥 Input metadata:', {
    format: inputMeta.format,
    width: inputMeta.width,
    height: inputMeta.height,
    hasAlpha: inputMeta.hasAlpha,
  });

  const ext = path.extname(outputPath).toLowerCase();
  const pipeline = sharp(inputPath)
    .rotate() // respect EXIF orientation
    .resize(width, height, {
      fit: 'cover', // 等比裁剪铺满
      position: 'centre',
      withoutEnlargement: false, // 允许放大
    });

  if (ext === '.png') {
    pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
  } else if (ext === '.webp') {
    pipeline.webp({ quality: 90 });
  } else {
    pipeline.jpeg({ quality: 85, mozjpeg: true });
  }

  await pipeline.toFile(outputPath);
  const outMeta = await sharp(outputPath).metadata();

  console.log('📤 Output written:', outputPath);
  console.log('📦 Output metadata:', {
    format: outMeta.format,
    width: outMeta.width,
    height: outMeta.height,
    hasAlpha: outMeta.hasAlpha,
  });

  const ok = outMeta.width === width && outMeta.height === height;
  if (!ok) {
    fail('Output size mismatch');
  }
  console.log('✅ Verification passed: cover crop to exact target size');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
