/**
 * In-memory sliding-window rate limiter for protecting sensitive API endpoints
 * against brute-force, denial-of-service, and credential stuffing attacks.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < 15 * 60 * 1000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  limit: number;      // Maximum allowed requests
  windowMs: number;   // Time window in milliseconds
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { limit: 60, windowMs: 60 * 1000 }
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const windowStart = now - options.windowMs;

  let record = rateLimitStore.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(identifier, record);
  }

  // Filter timestamps within the current window
  record.timestamps = record.timestamps.filter((t) => t > windowStart);

  if (record.timestamps.length >= options.limit) {
    const oldest = record.timestamps[0] || now;
    const resetMs = Math.max(0, oldest + options.windowMs - now);
    return {
      allowed: false,
      remaining: 0,
      resetMs,
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: options.limit - record.timestamps.length,
    resetMs: options.windowMs,
  };
}

/**
 * Standard preset limits for different sensitivity tiers
 */
export const RateLimitPresets = {
  // Login: 5 attempts per minute per IP
  AUTH_LOGIN: { limit: 5, windowMs: 60 * 1000 },
  // Register: 3 registrations per 5 minutes per IP
  AUTH_REGISTER: { limit: 3, windowMs: 5 * 60 * 1000 },
  // Password reset: 3 requests per 10 minutes per IP
  PASSWORD_RESET: { limit: 3, windowMs: 10 * 60 * 1000 },
  // Send email: 15 emails per minute per user
  MAIL_SEND: { limit: 15, windowMs: 60 * 1000 },
  // Standard API: 120 requests per minute
  STANDARD_API: { limit: 120, windowMs: 60 * 1000 },
};

