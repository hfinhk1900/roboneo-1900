import { websiteConfig } from '@/config/website';
import { headers } from 'next/headers';

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

/**
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */
export async function validateTurnstileToken(token: string) {
  const turnstileEnabled = websiteConfig.features.enableTurnstileCaptcha;
  if (!turnstileEnabled) {
    console.log('validateTurnstileToken, turnstile is disabled');
    return false;
  }

  if (!process.env.TURNSTILE_SECRET_KEY) {
    console.error('validateTurnstileToken, TURNSTILE_SECRET_KEY is not set');
    return false;
  }

  try {
    const ip = (await headers()).get('x-forwarded-for') || undefined;
    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: token,
          remoteip: ip,
        }),
      }
    );
    const data = (await res.json()) as TurnstileResponse;
    return data.success;
  } catch (e) {
    console.error('validateTurnstileToken, request failed:', e);
    return false;
  }
}

/**
 * Detailed validation to help diagnose failures; returns error codes and messages.
 */
export async function validateTurnstileTokenDetailed(token: string): Promise<{
  valid: boolean;
  errorCodes?: string[];
  message?: string;
  hostname?: string;
}> {
  const turnstileEnabled = websiteConfig.features.enableTurnstileCaptcha;
  if (!turnstileEnabled) {
    return { valid: false, message: 'Turnstile is disabled in config' };
  }
  if (!process.env.TURNSTILE_SECRET_KEY) {
    return { valid: false, message: 'TURNSTILE_SECRET_KEY is not set' };
  }
  try {
    const ip = (await headers()).get('x-forwarded-for') || undefined;
    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: token,
          remoteip: ip,
        }),
      }
    );
    const data = (await res.json()) as TurnstileResponse;
    if (data.success) return { valid: true, hostname: data.hostname };
    const codes = data['error-codes'] || [];
    // Map common codes to friendly messages
    const map: Record<string, string> = {
      'missing-input-secret': 'Server secret is missing',
      'invalid-input-secret': 'Server secret is invalid',
      'missing-input-response': 'Captcha token is missing',
      'invalid-input-response': 'Captcha token is invalid or expired',
      'bad-request': 'Bad request to Turnstile',
      'timeout-or-duplicate': 'Captcha token timed out or already used',
      'internal-error': 'Turnstile internal error',
    };
    const msg = codes.map((c) => map[c] || c).join(', ') || 'Captcha validation failed';
    return { valid: false, errorCodes: codes, message: msg, hostname: data.hostname };
  } catch (e) {
    return {
      valid: false,
      message: e instanceof Error ? e.message : 'Captcha validation request failed',
    };
  }
}
