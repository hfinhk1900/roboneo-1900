import { NextResponse } from 'next/server';

/**
 * Test endpoint to verify Stripe webhook setup
 * This endpoint can be called to check if the webhook route is accessible
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      message: 'Stripe webhook test endpoint is working',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
