import { v4 as uuidv4 } from 'uuid';

export function newIdempotencyKey(): string {
  try {
    // Prefer crypto.randomUUID when available
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      // @ts-ignore
      return crypto.randomUUID();
    }
  } catch {}
  return uuidv4();
}
