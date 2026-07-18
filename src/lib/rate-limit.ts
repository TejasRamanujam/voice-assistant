type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 10_000

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfter: number
}

export function getClientIp(headers: Headers): string {
  const realIp = headers.get('x-real-ip')?.trim()
  if (realIp) return realIp.slice(0, 64)

  const vercelForwarded = headers.get('x-vercel-forwarded-for')
  if (vercelForwarded) return vercelForwarded.split(',')[0].trim().slice(0, 64)

  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const chain = forwarded.split(',')
    return chain[chain.length - 1].trim().slice(0, 64)
  }

  return 'unknown'
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now()
): RateLimitResult {
  let bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs }
  }

  bucket.count += 1
  buckets.set(key, bucket)

  if (buckets.size > MAX_BUCKETS) {
    for (const [candidate, value] of buckets) {
      if (value.resetAt <= now) buckets.delete(candidate)
    }
    while (buckets.size > MAX_BUCKETS) {
      const oldest = buckets.keys().next().value
      if (oldest === undefined) break
      buckets.delete(oldest)
    }
  }

  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  }
}

export function resetRateLimitsForTests() {
  buckets.clear()
}
