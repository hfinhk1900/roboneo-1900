let validated = false;

function requireVars(names: string[]): string[] {
  const missing: string[] = [];
  for (const n of names) if (!process.env[n]) missing.push(n);
  return missing;
}

export function ensureProductionEnv(): void {
  if (validated) return;
  if (process.env.NODE_ENV !== 'production') {
    validated = true;
    return;
  }

  const hardRequired = [
    'URL_SIGNING_SECRET',
    'STORAGE_REGION',
    'STORAGE_ENDPOINT',
    'STORAGE_ACCESS_KEY_ID',
    'STORAGE_SECRET_ACCESS_KEY',
    'STORAGE_BUCKET_NAME',
  ];
  const missing = requireVars(hardRequired);
  if (missing.length) {
    // Throwing here will let the route return 500; surfaces misconfig early
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  // Recommended (warn-only)
  const softRequired = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'];
  const softMissing = requireVars(softRequired);
  if (softMissing.length) {
    console.warn(
      `Optional env not set (recommended for multi-instance): ${softMissing.join(', ')}`
    );
  }

  validated = true;
}

