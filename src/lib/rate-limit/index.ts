// In-memory token bucket rate limiter
const ipRequests = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string, limit = 60, windowSeconds = 60): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = ipRequests.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}
