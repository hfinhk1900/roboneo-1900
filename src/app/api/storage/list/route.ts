import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * List files from R2 storage bucket folder
 * For now, using hardcoded image list as a fallback since we know the URLs work
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || '';

    console.log(`📁 Requesting folder: ${folder}`);

    // For the Landing-photostock folder, return known working images
    if (folder === 'roboneo/Landing-photostock') {
      // Hardcoded list based on the working URL pattern you provided
      const baseUrl =
        'https://pub-cfc94129019546e1887e6add7f39ef74.r2.dev/Landing-photostock';

      // Use all 16 images with correct formats (ps01, ps03, ps04 are PNG, others are JPG)
      const images = [];
      for (let i = 1; i <= 16; i++) {
        const paddedNum = i.toString().padStart(2, '0');
        // ps01, ps03, ps04 are PNG format, others are JPG
        const extension = [1, 3, 4].includes(i) ? 'png' : 'jpg';
        images.push({
          key: `Landing-photostock/ps${paddedNum}.${extension}`,
          url: `${baseUrl}/ps${paddedNum}.${extension}`,
          size: 0, // Unknown size
          lastModified: new Date().toISOString(),
          filename: `ps${paddedNum}.${extension}`,
        });
      }

      console.log(
        `📁 Generated ${images.length} potential images from folder: ${folder}`
      );
      console.log(`📸 Sample image URL: ${images[0]?.url}`);

      const response = NextResponse.json({
        success: true,
        folder,
        images,
        count: images.length,
        note: 'Using hardcoded image list based on known URL pattern',
      });

      // Add cache headers - cache for 1 hour (3600 seconds)
      response.headers.set(
        'Cache-Control',
        'public, max-age=3600, s-maxage=3600'
      );
      response.headers.set('ETag', `"photostock-${images.length}-v1"`);

      return response;
    }

    // For other folders, return empty for now
    return NextResponse.json({
      success: true,
      folder,
      images: [],
      count: 0,
      note: 'Only Landing-photostock folder is currently supported',
    });
  } catch (error) {
    console.error('❌ Error listing storage files:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        folder: '',
        images: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}
