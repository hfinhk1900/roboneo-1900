import { handleWebhookEvent } from '@/payment';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Creem webhook handler
 * Receives webhook events from Creem and forwards to payment module
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const payload = await req.text();

  // Common header names to try; adjust once Creem's official header is confirmed
  const signature =
    req.headers.get('creem-signature') ||
    req.headers.get('x-creem-signature') ||
    req.headers.get('x-signature') ||
    '';

  console.log(
    'Creem webhook received with signature:',
    signature ? signature.substring(0, 10) + '...' : '(missing)'
  );

  try {
    if (!payload) {
      console.error('Missing webhook payload');
      return NextResponse.json({ error: 'Missing webhook payload' }, { status: 400 });
    }

    if (!signature) {
      console.warn('Missing Creem signature header');
    }

    await handleWebhookEvent(payload, signature);
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error in Creem webhook route:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 400 });
  }
}

