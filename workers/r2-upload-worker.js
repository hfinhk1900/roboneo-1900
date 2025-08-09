/**
 * Cloudflare Worker for R2 Image Uploads
 * 
 * This worker handles downloading images from KIE AI and uploading them to R2
 * to avoid using Vercel bandwidth. Deploy this as a Cloudflare Worker.
 * 
 * Environment Variables needed in Cloudflare:
 * - R2_BUCKET: Your R2 bucket binding
 * - API_SECRET: Secret key for authenticating requests
 * 
 * Usage:
 * POST https://your-worker.workers.dev/
 * {
 *   "sourceUrl": "https://kie-ai-image-url.com/image.png",
 *   "destinationKey": "stickers/task-123.png"
 * }
 */

export default {
  async fetch(request, env, ctx) {
    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      // Parse request body
      const body = await request.json();
      const { sourceUrl, destinationKey, apiSecret } = body;

      // Validate request
      if (!sourceUrl || !destinationKey) {
        return Response.json(
          { error: 'Missing sourceUrl or destinationKey' },
          { status: 400 }
        );
      }

      // Optional: Verify API secret if configured
      if (env.API_SECRET && apiSecret !== env.API_SECRET) {
        return Response.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // 1. Download image from source URL
      console.log(`Downloading from: ${sourceUrl}`);
      const imageResponse = await fetch(sourceUrl);
      
      if (!imageResponse.ok) {
        return Response.json(
          { error: `Failed to download image: ${imageResponse.status}` },
          { status: 500 }
        );
      }

      // Get image data
      const imageBuffer = await imageResponse.arrayBuffer();
      const contentType = imageResponse.headers.get('content-type') || 'image/png';

      // 2. Upload to R2
      console.log(`Uploading to R2: ${destinationKey}`);
      
      const uploadResult = await env.R2_BUCKET.put(destinationKey, imageBuffer, {
        httpMetadata: {
          contentType: contentType,
          cacheControl: 'public, max-age=31536000', // Cache for 1 year
        },
        customMetadata: {
          sourceUrl: sourceUrl,
          uploadedAt: new Date().toISOString(),
        },
      });

      if (!uploadResult) {
        return Response.json(
          { error: 'Failed to upload to R2' },
          { status: 500 }
        );
      }

      // 3. Generate public URL
      // Assuming R2 public bucket is configured
      const publicUrl = `${env.R2_PUBLIC_URL}/${destinationKey}`;

      // Return success response
      return Response.json({
        success: true,
        url: publicUrl,
        key: destinationKey,
        size: imageBuffer.byteLength,
      });

    } catch (error) {
      console.error('Worker error:', error);
      return Response.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  },
};

/**
 * Scheduled handler for cleanup (optional)
 * Cleans up old images from R2
 */
export async function scheduled(event, env, ctx) {
  // Optional: Implement cleanup logic for old images
  // This runs on a schedule defined in wrangler.toml
  
  const ONE_MONTH_AGO = new Date();
  ONE_MONTH_AGO.setMonth(ONE_MONTH_AGO.getMonth() - 1);

  try {
    // List objects in bucket
    const objects = await env.R2_BUCKET.list({
      prefix: 'stickers/',
    });

    let deleted = 0;
    for (const object of objects.objects) {
      // Check if object is older than 1 month
      if (new Date(object.uploaded) < ONE_MONTH_AGO) {
        await env.R2_BUCKET.delete(object.key);
        deleted++;
      }
    }

    console.log(`Cleanup completed: ${deleted} old images deleted`);
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}
