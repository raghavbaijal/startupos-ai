import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { headers } from 'next/headers';

let ratelimiter: Ratelimit | null = null;

const isPlaceholder =
  !process.env.UPSTASH_REDIS_REST_URL ||
  process.env.UPSTASH_REDIS_REST_URL.includes('placeholder');

if (!isPlaceholder) {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // Rate limit configuration: 15 requests per 60 seconds
    ratelimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(15, '60 s'),
      analytics: true,
      prefix: 'startupos_ratelimit',
    });
  } catch (err) {
    console.error('[Rate Limiter] Failed to initialize Upstash Redis:', err);
  }
}

/**
 * Checks if a given request identified by a user ID or IP is rate limited
 * Allows 15 requests per minute.
 */
export async function checkRateLimit(userId?: string) {
  let identifier = userId;

  // Fallback to IP address if no authenticated user is present
  if (!identifier) {
    try {
      const reqHeaders = await headers();
      const ip = reqHeaders.get('x-forwarded-for') || reqHeaders.get('x-real-ip') || '127.0.0.1';
      identifier = ip.split(',')[0].trim();
    } catch (e) {
      identifier = 'anonymous-client';
    }
  }

  if (isPlaceholder || !ratelimiter) {
    console.log(`[Rate Limiter] Upstash Redis is in placeholder/local mode. Skipping check for client: ${identifier}`);
    return { success: true, limit: 15, remaining: 15, reset: Date.now() + 60000 };
  }

  try {
    const result = await ratelimiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (err) {
    console.error('[Rate Limiter] Error executing limit check, falling back to allow:', err);
    // Graceful fallback to avoid stopping production due to Redis issues
    return { success: true, limit: 15, remaining: 15, reset: Date.now() + 60000 };
  }
}
