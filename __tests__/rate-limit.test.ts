import {
  checkRateLimit,
  getClientIp,
  resetRateLimitsForTests,
} from '@/lib/rate-limit'

describe('public relay rate limiting', () => {
  beforeEach(resetRateLimitsForTests)

  it('blocks requests after the configured budget', () => {
    expect(checkRateLimit('chat:203.0.113.4', 2, 60_000, 1_000).allowed).toBe(true)
    expect(checkRateLimit('chat:203.0.113.4', 2, 60_000, 1_001).allowed).toBe(true)
    const blocked = checkRateLimit('chat:203.0.113.4', 2, 60_000, 1_002)
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfter).toBe(60)
  })

  it('keeps route and client budgets isolated', () => {
    checkRateLimit('chat:203.0.113.4', 1, 60_000, 1_000)
    expect(checkRateLimit('tts:203.0.113.4', 1, 60_000, 1_001).allowed).toBe(true)
    expect(checkRateLimit('chat:203.0.113.5', 1, 60_000, 1_001).allowed).toBe(true)
  })

  it('resets an expired window', () => {
    checkRateLimit('chat:203.0.113.4', 1, 1_000, 1_000)
    expect(checkRateLimit('chat:203.0.113.4', 1, 1_000, 1_500).allowed).toBe(false)
    expect(checkRateLimit('chat:203.0.113.4', 1, 1_000, 2_000).allowed).toBe(true)
  })

  it('prefers proxy-controlled client IP headers', () => {
    expect(getClientIp(new Headers({ 'x-real-ip': '203.0.113.9' }))).toBe('203.0.113.9')
    expect(getClientIp(new Headers({ 'x-forwarded-for': 'spoofed, 198.51.100.8' }))).toBe(
      '198.51.100.8'
    )
  })
})
