/**
 * Rate Limiting Middleware
 *
 * En développement : utilise une Map en mémoire
 * En production : utilise Upstash Redis (si configuré)
 *
 * Pour activer Upstash en production :
 * 1. npm install @upstash/ratelimit @upstash/redis
 * 2. Ajoutez les variables d'environnement :
 *    UPSTASH_REDIS_REST_URL=https://...
 *    UPSTASH_REDIS_REST_TOKEN=...
 */

// Store en mémoire pour le développement
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Nettoyage périodique du store
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 60000); // Nettoyage toutes les 60 secondes
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Rate limiter en mémoire (développement)
 */
async function inMemoryRateLimiter(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    // Créer un nouveau record
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: now + config.windowMs,
    };
  }

  // Incrémenter le compteur
  record.count++;

  if (record.count > config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: record.resetAt,
    };
  }

  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - record.count,
    reset: record.resetAt,
  };
}

/**
 * Rate limiter avec Upstash (production)
 * Décommentez et installez @upstash/ratelimit pour l'activer
 */
/*
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

const uploadRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
});

const generateRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
});

const regenerateRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
});

async function upstashRateLimiter(
  identifier: string,
  ratelimit: Ratelimit
): Promise<RateLimitResult> {
  const result = await ratelimit.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}
*/

/**
 * Rate limiter principal
 */
export async function rateLimit(
  identifier: string,
  endpoint: 'upload' | 'generate' | 'regenerate' | 'validate'
): Promise<RateLimitResult> {
  const configs: Record<string, RateLimitConfig> = {
    upload: { maxRequests: 10, windowMs: 60000 }, // 10 req/min
    generate: { maxRequests: 5, windowMs: 60000 }, // 5 req/min
    regenerate: { maxRequests: 10, windowMs: 60000 }, // 10 req/min
    validate: { maxRequests: 20, windowMs: 60000 }, // 20 req/min
  };

  const config = configs[endpoint];
  if (!config) {
    throw new Error(`Invalid endpoint: ${endpoint}`);
  }

  // Utiliser Upstash si configuré, sinon utiliser le rate limiter en mémoire
  const hasUpstash = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

  if (hasUpstash) {
    // return upstashRateLimiter(identifier, ratelimitInstance);
    console.log('[Rate Limit] Upstash configuré mais commenté - utilisez le code ci-dessus');
  }

  return inMemoryRateLimiter(`${endpoint}:${identifier}`, config);
}

/**
 * Helper pour obtenir l'identifiant du client (IP ou user ID)
 */
export function getClientIdentifier(request: Request): string {
  // Essayer de récupérer l'IP depuis les headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }

  if (realIp) {
    return realIp;
  }

  // Fallback
  return 'unknown';
}
