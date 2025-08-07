/**
 * Production-grade Sticker API - Improved Version with Enhanced Features
 * Endpoint: /api/image-to-sticker-improved
 *
 * Tech Stack:
 * - GPT Image 1 (DALL-E 3): High-quality style transfer with built-in safety moderation
 * - R2 Storage: For persisting generated images
 * - Sharp: For server-side image pre-processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/storage';
import { nanoid } from 'nanoid';
import { OPENAI_IMAGE_CONFIG, validateImageFile } from '@/lib/image-validation';
import { CREDITS_PER_IMAGE } from '@/config/credits-config';

// Enhanced Style configurations mapping user request to a high-quality, direct-use prompt
export const STYLE_CONFIGS = {
  'ios': {
    name: 'iOS Sticker',
    userPrompt: "Learn the Apple iOS emoji style and turn the people in the photo into 3D sticker avatars that match that style. Recreate people's body shapes, face shapes, skin tones, facial features, and expressions. Keep every detail—facial accessories, hairstyles and hair accessories, clothing, other accessories, facial expressions, and pose—exactly the same as in the original photo. Remove all background completely, making it fully transparent. Include only the full figures with no background elements, ensuring the final image looks like an official iOS emoji sticker with transparent background.",
    imageUrl: '/styles/ios.png'
  },
  'pixel': {
    name: 'Pixel Art',
    userPrompt: 'Transform the people in this photo into a die-cut sticker in a retro pixel art style. Keep all the original details of the people - their poses, expressions, clothing, and accessories - but render them in a blocky, pixelated aesthetic with a limited color palette and visible grid structure. Remove all background completely, making it fully transparent. The sticker should have clean edges with no background elements, giving it a die-cut appearance.',
    imageUrl: '/styles/pixel.png'
  },
  'lego': {
    name: 'LEGO',
    userPrompt: 'Transform the people in this photo into LEGO minifigure style stickers. Keep all the original details of the people - their poses, expressions, clothing, and accessories - but render them with glossy, plastic-like appearance and the iconic blocky shapes and features of classic LEGO characters. Remove all background completely, making it fully transparent. The sticker should have clean edges with no background elements, giving it a professional die-cut sticker appearance.',
    imageUrl: '/styles/lego.png'
  },
  'snoopy': {
    name: 'Snoopy',
    userPrompt: 'Transform the people in this photo into stickers in the charming, hand-drawn art style of Charles M. Schulz\'s Peanuts comics, featuring Snoopy-like characteristics. Keep all the original details of the people - their poses, expressions, clothing, and accessories - but render them with simple, bold, and expressive black outlines with a classic, cartoonish feel. Remove all background completely, making it fully transparent. The sticker should have clean edges with no background elements, giving it a die-cut appearance.',
    imageUrl: '/styles/snoopy.png'
  }
};

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

        console.log('📊 [IMPROVED] Original image:', { format: metadata.format, size: `${metadata.width}x${metadata.height}`, fileSize: `${Math.round(inputBuffer.length / 1024)}KB` });

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

        console.log('✅ [IMPROVED] Preprocessing complete:', { finalSize: `${targetSize}x${targetSize}`, fileSize: `${Math.round(finalBuffer.length / 1024)}KB` });

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
        console.error('❌ [IMPROVED] Preprocessing failed:', error);
        return null;
    }
}


/**
 * Core style transfer using GPT Image 1 with improved prompting
 */
async function gptStyleTransferImproved(base64Data: string, prompt: string, style: string, apiKey: string): Promise<string | null> {
  try {
        console.log(`🎨 [IMPROVED] Calling GPT Image 1 for ${style} style transfer with MEDIUM quality...`);
    console.log(`📝 [IMPROVED] Using enhanced prompt: "${prompt.substring(0, 100)}..."`);
    console.log(`💰 [IMPROVED] Cost optimized: ~$0.042 per image (vs $0.169 high quality)`);

    const formData = new FormData();
    const imageBuffer = Buffer.from(base64Data.split(',')[1], 'base64');
    formData.append('image', new Blob([imageBuffer], { type: 'image/png' }), 'image.png');
    formData.append('prompt', prompt);
    formData.append('model', 'gpt-image-1');
    formData.append('n', '1');
    formData.append('size', '1024x1024');
         formData.append('quality', 'medium'); // Use medium quality for cost-effective results
    formData.append('background', 'transparent'); // Ensure transparent background

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [IMPROVED] GPT Image 1 API failed:', errorText);
      return null;
    }

    const data = await response.json();
    const stickerBase64 = data.data?.[0]?.b64_json;

    if (!stickerBase64) {
      console.error('❌ [IMPROVED] No sticker b64_json data received.');
      console.error('Full OpenAI response:', JSON.stringify(data, null, 2));
      return null;
    }

    console.log(`✅ [IMPROVED] GPT Image 1 ${style} generation successful.`);
    return stickerBase64;
  } catch (error) {
    console.error('❌ [IMPROVED] GPT Image 1 exception:', error);
    return null;
  }
}


/**
 * Main API handler - Improved Version
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    console.log('🚀 [IMPROVED] Starting enhanced sticker generation...');

    // Development mode: return mock response to avoid API calls (check first)
    if (process.env.NODE_ENV === 'development' && process.env.MOCK_API === 'true') {
      console.log('🧪 [IMPROVED] Development mode: returning mock sticker response');
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
        version: 'improved',
        mock: true
      });
    }

    // 1. Check user authentication and credits
    const { getSession } = await import('@/lib/server');
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check user credits
    const { canGenerateStickerAction } = await import('@/actions/credits-actions');
    const creditsCheck = await canGenerateStickerAction({ requiredCredits: CREDITS_PER_IMAGE });

    if (!creditsCheck?.data?.success || !creditsCheck.data.data?.canGenerate) {
      return NextResponse.json({
        error: 'Insufficient credits',
        required: CREDITS_PER_IMAGE,
        current: creditsCheck?.data?.data?.currentCredits || 0
      }, { status: 402 });
    }

    console.log(`💳 [IMPROVED] User ${session.user.id} has ${creditsCheck.data.data.currentCredits} credits, proceeding with generation...`);

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

    // ✅ Add file validation
    console.log('🔍 [IMPROVED] Validating file...');
    const validation = validateImageFile(imageFile);
    if (!validation.isValid) {
      console.log(`❌ [IMPROVED] File validation failed: ${validation.error}`);
      return NextResponse.json({
        error: validation.error || 'Invalid file format or size'
      }, { status: 400 });
    }

        // Additional file size check for server-side safety
    if (imageFile.size > OPENAI_IMAGE_CONFIG.maxFileSize) {
      const maxSizeMB = OPENAI_IMAGE_CONFIG.maxFileSize / 1024 / 1024;
      return NextResponse.json({
        error: `File size exceeds the ${maxSizeMB}MB limit`
      }, { status: 400 });
    }

    // Check file type
    if (!OPENAI_IMAGE_CONFIG.allowedFileTypes.includes(imageFile.type as any)) {
      return NextResponse.json({
        error: `File type not supported. Please use ${OPENAI_IMAGE_CONFIG.allowedFileTypes.join(', ')}`
      }, { status: 400 });
    }

    console.log(`✅ [IMPROVED] File validation passed: ${imageFile.name} (${Math.round(imageFile.size / 1024)}KB, ${imageFile.type})`);

    if (!(style in STYLE_CONFIGS)) {
      return NextResponse.json({ error: `Invalid style. Supported: ${Object.keys(STYLE_CONFIGS).join(', ')}` }, { status: 400 });
    }

    // 1. Preprocess Image
    const originalBuffer = Buffer.from(await imageFile.arrayBuffer());
    const preprocessed = await preprocessToSquareRGBA(originalBuffer);
    if (!preprocessed) {
      return NextResponse.json({ error: 'Failed to preprocess image' }, { status: 500 });
    }

    // 2. Get enhanced prompt for the style
    const prompt = STYLE_CONFIGS[style as StickerStyle].userPrompt;
    console.log(`✅ [IMPROVED] Using enhanced prompt for style: ${style}`);

    // 3. Enhanced Style Transfer
    const stickerBase64 = await gptStyleTransferImproved(preprocessed.base64Data, prompt, style, apiKey);
    if (!stickerBase64) {
      return NextResponse.json({ error: 'Failed to generate sticker with improved GPT Image 1' }, { status: 500 });
    }

    // 4. Upload to R2
    console.log('☁️ [IMPROVED] Uploading sticker to R2...');
    const stickerBuffer = Buffer.from(stickerBase64, 'base64');
    const filename = `improved-${style}-${nanoid()}.png`;
    const { url: r2Url } = await uploadFile(stickerBuffer, filename, 'image/png', 'stickers');
    console.log(`✅ [IMPROVED] Upload successful! URL: ${r2Url}`);

    // 5. Deduct credits after successful generation
    const { deductCreditsAction } = await import('@/actions/credits-actions');
    const deductResult = await deductCreditsAction({
      userId: session.user.id,
      amount: CREDITS_PER_IMAGE
    });

    if (deductResult?.data?.success) {
      console.log(`💰 [IMPROVED] Deducted ${CREDITS_PER_IMAGE} credits. Remaining: ${deductResult.data.data?.remainingCredits}`);
    } else {
      console.warn('⚠️ [IMPROVED] Failed to deduct credits, but sticker was generated successfully');
    }

    // 6. Return enhanced response
    const elapsed = Date.now() - startTime;
    console.log(`🎉 [IMPROVED] Enhanced sticker generation complete! Total time: ${Math.round(elapsed/1000)}s`);

    return NextResponse.json({
      url: r2Url,
      style: style,
      size: `${preprocessed.metadata.finalSize.width}x${preprocessed.metadata.finalSize.height}`,
      source: 'image-to-sticker-improved-api',
      version: 'improved',
      processTime: `${Math.round(elapsed/1000)}s`,
      quality: 'medium'
    });

  } catch (error) {
    console.error('❌ [IMPROVED] Sticker generation failed:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'Production-grade Sticker API - Improved Version',
    version: '2.1.0',
    styles: Object.keys(STYLE_CONFIGS),
    features: ['Enhanced prompts', 'Medium quality (cost optimized)', 'Better style transfer', 'Improved logging'],
    costOptimization: 'Medium quality: ~$0.042 per image (75% cost reduction)'
  });
}
