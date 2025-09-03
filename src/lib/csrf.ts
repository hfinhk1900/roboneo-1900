import { type NextRequest, NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/urls/urls';

/**
 * Minimal CSRF protection using same-origin policy verification.
 * - Allows safe methods (GET/HEAD/OPTIONS)
 * - For state-changing methods, verifies the Origin (or Referer) matches base origin
 * - Returns a NextResponse(403) when check fails; otherwise returns null
 */
export function enforceSameOriginCsrf(
  request: NextRequest
): NextResponse | null {
  const method = request.method?.toUpperCase() || 'GET';
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return null;
  }

  const baseOrigin = (() => {
    try {
      return new URL(getBaseUrl()).origin;
    } catch {
      return '';
    }
  })();

  const origin = request.headers.get('origin');
  if (origin) {
    if (baseOrigin && origin !== baseOrigin) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
    }
    return null;
  }

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (baseOrigin && refOrigin !== baseOrigin) {
        return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
    }
  }

  // If neither Origin nor Referer, allow (to avoid breaking older clients);
  // rely on SameSite cookies and auth checks as additional layers.
  return null;
}

