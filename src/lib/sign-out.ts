import { authClient } from '@/lib/auth-client';

interface SignOutResult {
  ok: boolean;
  status?: number;
  error?: unknown;
  alreadySignedOut?: boolean;
}

/**
 * Call Better Auth sign out endpoint and normalize the response.
 * Treat missing session (400/401) as success so the UI can proceed.
 */
export async function signOutUser(): Promise<SignOutResult> {
  try {
    const result = await authClient.signOut();

    const error = (result as { error?: { status?: number } | null })?.error;
    const status = typeof error?.status === 'number' ? error.status : undefined;

    if (!error) {
      return { ok: true }; // Signed out successfully
    }

    if (status === 400 || status === 401) {
      // Session already gone – treat as signed out to avoid blocking the user
      return { ok: true, status, alreadySignedOut: true };
    }

    return { ok: false, status, error };
  } catch (error) {
    return { ok: false, error };
  }
}
