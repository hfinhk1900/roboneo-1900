import { auth } from '@/lib/auth';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Debug endpoint to check Creem configuration
 * Only accessible to authenticated users
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow this in non-production environments for security
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Debug endpoint not available in production' },
        { status: 403 }
      );
    }

    const creemApiKey = process.env.CREEM_API_KEY;
    const creemWebhookSecret = process.env.CREEM_WEBHOOK_SECRET;
    const paymentProvider = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER;

    const debug = {
      paymentProvider,
      creemApiKey: creemApiKey
        ? `${creemApiKey.substring(0, 8)}...`
        : 'NOT SET',
      creemWebhookSecret: creemWebhookSecret ? 'SET' : 'NOT SET',
      environment: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      timestamp: new Date().toISOString(),
    };

    console.log('[Creem Debug]', debug);

    return NextResponse.json({
      success: true,
      debug,
    });
  } catch (error) {
    console.error('Creem debug error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
