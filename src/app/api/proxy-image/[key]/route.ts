import { join } from 'path';
import { readFile } from 'fs/promises';
import { type NextRequest, NextResponse } from 'next/server';
import { verifySignedUrl } from '@/lib/signed-url';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params; // Await params for Next.js 15
    const decodedKey = decodeURIComponent(key);

    console.log('Proxy image request for:', decodedKey);

    // Handle local images (serve from public directory)
    if (decodedKey.startsWith('/')) {
      try {
        const publicPath = join(
          process.cwd(),
          'public',
          decodedKey.substring(1)
        );
        console.log('Attempting to read local file:', publicPath);

        const imageBuffer = await readFile(publicPath);

        // Determine content type based on file extension
        const ext = decodedKey.toLowerCase();
        let contentType = 'image/png';
        if (ext.includes('.jpg') || ext.includes('.jpeg'))
          contentType = 'image/jpeg';
        if (ext.includes('.gif')) contentType = 'image/gif';
        if (ext.includes('.webp')) contentType = 'image/webp';

        return new NextResponse(imageBuffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
          },
        });
      } catch (fileError) {
        console.error('Error reading local file:', fileError);
        return new NextResponse('Local image not found', { status: 404 });
      }
    }

    // Handle external URLs by proxying the image
    if (decodedKey.includes('http')) {
      console.log('Proxying external URL:', decodedKey);

      // 验证签名URL（如果包含签名参数）
      if (decodedKey.includes('signature=')) {
        const isValid = verifySignedUrl(decodedKey);
        if (!isValid) {
          console.warn('Proxy access denied: Invalid or expired signature URL');
          return new NextResponse('Access denied - Invalid or expired URL', { status: 403 });
        }
        console.log('✅ Signed URL verified for proxy');
      }

      const response = await fetch(decodedKey);

      if (!response.ok) {
        console.error(
          'External fetch failed:',
          response.status,
          response.statusText
        );
        return new NextResponse('External image not found', { status: 404 });
      }

      const imageBuffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/png';

      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
        },
      });
    }

    // For other cases, return 404
    console.log('No matching handler for key:', decodedKey);
    return new NextResponse('Image not found', { status: 404 });
  } catch (error) {
    console.error('Error in proxy-image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
