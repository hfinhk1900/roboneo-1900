export type RateLimitConfig = {
  bgRemovePerIpPerMin: number;
  generatePerUserPerMin: number; // aibg/productshot/sticker
  signPerUserPerMin: number;
};

function readInt(name: string, def: number): number {
  const raw = process.env[name];
  if (!raw) return def;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

let cached: RateLimitConfig | null = null;

export function getRateLimitConfig(): RateLimitConfig {
  if (cached) return cached;
  cached = {
    bgRemovePerIpPerMin: readInt('RL_BG_REMOVE_PER_MIN', 10),
    generatePerUserPerMin: readInt('RL_GENERATE_PER_MIN', 15),
    signPerUserPerMin: readInt('RL_SIGN_PER_MIN', 30),
  };
  return cached;
}

