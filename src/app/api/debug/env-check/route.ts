import { auth } from '@/lib/auth';
import { getBaseUrl } from '@/lib/urls/urls';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Environment variables check endpoint
 * Only accessible to authenticated users and in non-production for security
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

    const envCheck = {
      // Base URL
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'NOT SET',
      calculatedBaseUrl: getBaseUrl(),

      // Payment Provider
      NEXT_PUBLIC_PAYMENT_PROVIDER:
        process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || 'NOT SET',

      // Creem
      CREEM_API_KEY: process.env.CREEM_API_KEY ? 'SET' : 'NOT SET',
      CREEM_WEBHOOK_SECRET: process.env.CREEM_WEBHOOK_SECRET
        ? 'SET'
        : 'NOT SET',

      // Creem Price IDs
      NEXT_PUBLIC_CREEM_PRICE_PRO_YEARLY:
        process.env.NEXT_PUBLIC_CREEM_PRICE_PRO_YEARLY || 'NOT SET',
      NEXT_PUBLIC_CREEM_PRICE_PRO_MONTHLY:
        process.env.NEXT_PUBLIC_CREEM_PRICE_PRO_MONTHLY || 'NOT SET',
      NEXT_PUBLIC_CREEM_PRICE_ULTIMATE_YEARLY:
        process.env.NEXT_PUBLIC_CREEM_PRICE_ULTIMATE_YEARLY || 'NOT SET',
      NEXT_PUBLIC_CREEM_PRICE_ULTIMATE_MONTHLY:
        process.env.NEXT_PUBLIC_CREEM_PRICE_ULTIMATE_MONTHLY || 'NOT SET',

      // Environment info
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL || 'NOT SET',

      // Client-side check
      windowOrigin:
        typeof window !== 'undefined' ? window.location?.origin : 'SERVER_SIDE',

      timestamp: new Date().toISOString(),
    };

    console.log('[Env Check]', envCheck);

    return NextResponse.json({
      success: true,
      envCheck,
    });
  } catch (error) {
    console.error('Environment check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
