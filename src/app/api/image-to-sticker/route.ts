/**
 * Production-grade Sticker API - based on OpenAI best practices
 * Endpoint: /api/image-to-sticker
 *
 * Tech Stack:
 * - GPT Image 1 (DALL-E 3): High-quality style transfer with built-in safety moderation
 * - R2 Storage: For persisting generated images
 * - Sharp: For server-side image pre-processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/storage';
import { nanoid } from 'nanoid';

// Style configurations mapping user request to a high-quality, direct-use prompt
const STYLE_CONFIGS = {
  ios: {
    description: "Apple iOS emoji style 3D sticker avatar",
    userPrompt: "Learn the Apple iOS emoji style and turn the people in the photo into 3D sticker avatars that match that style. Recreate people's body shapes, face shapes, skin tones, facial features, and expressions. Keep every detail—facial accessories, hairstyles and hair accessories, clothing, other accessories, facial expressions, and pose—exactly the same as in the original photo. Remove background and include only the full figures, ensuring the final image looks like an official iOS emoji sticker."
  },
  pixel: {
    description: "Pixel art style sticker",
    userPrompt: "Learn the Pixel Art style and generate a sticker avatar of the person in the photo in this style. Imitate the body shape, face shape, skin tone, facial features, and expression. Keep the person's facial accessories, hairstyle and hair accessories, clothing, accessories, expression, and pose consistent with the original image. The background should be white, include only the full figure, and ensure the final image looks like a Pixel Art style character."
  },
  lego: {
    description: "LEGO minifigure style sticker",
    userPrompt: "Learn the LEGO Minifigure style and generate a sticker avatar of the person in the photo in this style. Imitate the body shape, face shape, skin tone, facial features, and expression. Keep the person's facial accessories, hairstyle and hair accessories, clothing, accessories, expression, and pose consistent with the original image. Remove the background, include only the full figure, and ensure the final image looks like a LEGO Minifigure-style character."
  },
  snoopy: {
    description: "Snoopy cartoon style sticker",
    userPrompt: "Learn the Peanuts comic strip style and turn the person in the photo into a sticker avatar in that style. Recreate the person's body shape, face shape, skin tone, facial features, and expression. Keep all the details in the image—facial accessories, hairstyle and hair accessories, clothing, other accessories, facial expression, and pose—the same. Remove background and include only the full figure to ensure the final image looks like an official Peanuts-style character."
  }
} as const;

type StickerStyle = keyof typeof STYLE_CONFIGS;

/**
 * Pre-processes an image to be a square RGBA PNG compatible with OpenAI
 */
async function preprocessToSquareRGBA(inputBuffer: Buffer): Promise<{
  processedBuffer: Buffer;
  base64Data: string;
  metadata: {
    originalSize: { width: number; height: number };
    finalSize: { width: number; height: number };
    format: string;
  };
} | null> {
    try {
        const sharp = (await import('sharp')).default;
        const image = sharp(inputBuffer);
        const metadata = await image.metadata();
        const targetSize = 1024;

        console.log('📊 Original image:', { format: metadata.format, size: `${metadata.width}x${metadata.height}`, fileSize: `${Math.round(inputBuffer.length / 1024)}KB` });

        const processedImage = image.resize(targetSize, targetSize, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }).png({
            compressionLevel: 6,
            adaptiveFiltering: true,
            force: true
        });

        const finalBuffer = await (metadata.hasAlpha ? processedImage : processedImage.ensureAlpha()).toBuffer();

        if (finalBuffer.length > 4 * 1024 * 1024) {
            throw new Error('Image is too large after processing (> 4MB)');
        }

        console.log('✅ Preprocessing complete:', { finalSize: `${targetSize}x${targetSize}`, fileSize: `${Math.round(finalBuffer.length / 1024)}KB` });

        return {
            processedBuffer: finalBuffer,
            base64Data: `data:image/png;base64,${finalBuffer.toString('base64')}`,
            metadata: {
                originalSize: { width: metadata.width || 0, height: metadata.height || 0 },
                finalSize: { width: targetSize, height: targetSize },
                format: metadata.format || 'unknown'
            }
        };
    } catch (error) {
        console.error('❌ Preprocessing failed:', error);
        return null;
    }
}


/**
 * Core style transfer using GPT Image 1
 */
async function gptStyleTransfer(base64Data: string, prompt: string, apiKey: string): Promise<string | null> {
  try {
    console.log('🎨 Calling GPT Image 1 for style transfer...');
    const formData = new FormData();
    const imageBuffer = Buffer.from(base64Data.split(',')[1], 'base64');
    formData.append('image', new Blob([imageBuffer], { type: 'image/png' }), 'image.png');
    formData.append('prompt', prompt);
    formData.append('model', 'gpt-image-1');
    formData.append('n', '1');
    formData.append('size', '1024x1024');

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ GPT Image 1 API failed:', errorText);
      return null;
    }

    const data = await response.json();
    const stickerBase64 = data.data?.[0]?.b64_json;

    if (!stickerBase64) {
      console.error('❌ No sticker b64_json data received.');
      console.error('Full OpenAI response:', JSON.stringify(data, null, 2));
      return null;
    }

    console.log('✅ GPT Image 1 generation successful.');
    return stickerBase64;
  } catch (error) {
    console.error('❌ GPT Image 1 exception:', error);
    return null;
  }
}


/**
 * Main API handler
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    console.log('🚀 Starting sticker generation...');

    // Development mode: return mock response to avoid API calls
    if (process.env.NODE_ENV === 'development' && process.env.MOCK_API === 'true') {
      console.log('🧪 Development mode: returning mock sticker response');
      const formData = await req.formData();
      const style = (formData.get('style') as string) || 'ios';

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Return a local test image URL
      const mockImageUrl = '/debug-output/test_snoopy_1754371168455.png';

      return NextResponse.json({
        url: mockImageUrl,
        style: style,
        processTime: '2.0s',
        mock: true
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const formData = await req.formData();
    const imageFile = formData.get('imageFile') as File;
    const style = (formData.get('style') as string) || 'ios';

    if (!imageFile) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }
    if (!(style in STYLE_CONFIGS)) {
      return NextResponse.json({ error: `Invalid style. Supported: ${Object.keys(STYLE_CONFIGS).join(', ')}` }, { status: 400 });
    }

    // 1. Preprocess Image
    const originalBuffer = Buffer.from(await imageFile.arrayBuffer());
    const preprocessed = await preprocessToSquareRGBA(originalBuffer);
    if (!preprocessed) {
      return NextResponse.json({ error: 'Failed to preprocess image' }, { status: 500 });
    }

    // 2. Get pre-defined high-quality prompt (skips GPT-4o optimization)
    const prompt = STYLE_CONFIGS[style as StickerStyle].userPrompt;
    console.log(`✅ Using direct prompt for style: ${style}`);

    // 3. Style Transfer
    const stickerBase64 = await gptStyleTransfer(preprocessed.base64Data, prompt, apiKey);
    if (!stickerBase64) {
      return NextResponse.json({ error: 'Failed to generate sticker with GPT Image 1' }, { status: 500 });
    }

    // 4. Upload to R2
    console.log('☁️ Uploading sticker to R2...');
    const stickerBuffer = Buffer.from(stickerBase64, 'base64');
    const filename = `${style}-${nanoid()}.png`;
    const { url: r2Url } = await uploadFile(stickerBuffer, filename, 'image/png', 'stickers');
    console.log(`✅ Upload successful! URL: ${r2Url}`);

    // 5. Return simplified response
    const elapsed = Date.now() - startTime;
    console.log(`🎉 Sticker generation complete! Total time: ${Math.round(elapsed/1000)}s`);

    return NextResponse.json({
      url: r2Url,
      style: style,
      size: `${preprocessed.metadata.finalSize.width}x${preprocessed.metadata.finalSize.height}`,
      source: 'image-to-sticker-api',
    });

  } catch (error) {
    console.error('❌ Sticker generation failed:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'Production-grade Sticker API',
    version: '2.0.0',
    styles: Object.keys(STYLE_CONFIGS)
  });
}
