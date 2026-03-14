# Setup Rate Limiting

Implement comprehensive API rate limiting across multiple layers

## Instructions

1. **Rate Limiting Strategy Analysis**
   - Identify endpoints requiring rate limiting
   - Define rate limit tiers by user type (anonymous, authenticated, premium)
   - Choose rate limiting algorithm based on requirements
   - Plan Redis-backed distributed rate limiting for multi-instance deployments
   - Define response headers and error messages

2. **Sliding Window Algorithm**
   ```javascript
   // Tracks requests within a moving time window
   const slidingWindowRateLimit = async (redis, key, limit, windowMs) => {
     const now = Date.now();
     const windowStart = now - windowMs;

     const pipe = redis.pipeline();
     pipe.zremrangebyscore(key, 0, windowStart);  // Remove old entries
     pipe.zadd(key, now, now.toString());           // Add current request
     pipe.zcard(key);                               // Count requests in window
     pipe.pexpire(key, windowMs);                   // Set expiry
     const results = await pipe.exec();

     const requestCount = results[2][1];
     return { allowed: requestCount <= limit, count: requestCount };
   };
   ```

3. **Token Bucket Algorithm**
   ```javascript
   // Allows bursts while maintaining average rate
   // Uses Lua script for atomic Redis operations
   const tokenBucketScript = `
     local key = KEYS[1]
     local capacity = tonumber(ARGV[1])
     local refillRate = tonumber(ARGV[2])  -- tokens per second
     local now = tonumber(ARGV[3])

     local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
     local tokens = tonumber(bucket[1]) or capacity
     local lastRefill = tonumber(bucket[2]) or now

     -- Refill tokens based on elapsed time
     local elapsed = now - lastRefill
     tokens = math.min(capacity, tokens + (elapsed * refillRate))

     if tokens >= 1 then
       tokens = tokens - 1
       redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
       redis.call('EXPIRE', key, 3600)
       return {1, math.floor(tokens)}  -- allowed, remaining
     else
       return {0, 0}  -- blocked
     end
   `;
   ```

4. **Tier-Based Rate Limiting Middleware**
   ```javascript
   const RATE_LIMIT_TIERS = {
     anonymous: { requests: 100, windowMs: 15 * 60 * 1000 },
     authenticated: { requests: 500, windowMs: 15 * 60 * 1000 },
     premium: { requests: 2000, windowMs: 15 * 60 * 1000 },
     admin: { requests: 10000, windowMs: 15 * 60 * 1000 }
   };

   const rateLimitMiddleware = async (req, res, next) => {
     // Skip internal requests
     if (req.headers['x-internal-request']) return next();

     const tier = req.user?.subscription || (req.user ? 'authenticated' : 'anonymous');
     const { requests: limit, windowMs } = RATE_LIMIT_TIERS[tier];

     // Key by user ID when authenticated, otherwise by IP
     const identifier = req.user?.id || req.ip;
     const key = `rate_limit:${tier}:${identifier}:${req.path}`;

     const { allowed, count } = await slidingWindowRateLimit(
       redis, key, limit, windowMs
     );

     // Set standard rate limit headers
     res.set({
       'X-RateLimit-Limit': limit,
       'X-RateLimit-Remaining': Math.max(0, limit - count),
       'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString(),
       'X-RateLimit-Policy': `${limit};w=${windowMs / 1000}`
     });

     if (!allowed) {
       return res.status(429).json({
         status: 'error',
         message: 'Too many requests',
         retryAfter: Math.ceil(windowMs / 1000)
       });
     }

     next();
   };
   ```

5. **Authentication-Specific Limits**
   ```javascript
   // Track failed login attempts by email/username (not user ID)
   // Prevents enumeration attacks while allowing legitimate users
   const loginRateLimit = async (req, res, next) => {
     const email = req.body.email?.toLowerCase();
     if (!email) return next();

     const key = `login_attempts:${email}`;
     const attempts = await redis.incr(key);
     if (attempts === 1) await redis.expire(key, 900); // 15 min window

     if (attempts > 5) {
       const ttl = await redis.ttl(key);
       return res.status(429).json({
         status: 'error',
         message: 'Too many login attempts',
         retryAfter: ttl
       });
     }

     // Clear on successful login
     req.on('success', () => redis.del(key));
     next();
   };
   ```

6. **Adaptive Rate Limiting**
   ```javascript
   // Reduce limits when system is under stress
   const getAdaptiveLimit = async (baseLimit) => {
     const cpuUsage = await getCpuUsage();
     if (cpuUsage > 0.8) return Math.floor(baseLimit * 0.5);  // 50% under high CPU
     if (cpuUsage > 0.6) return Math.floor(baseLimit * 0.75); // 75% under medium CPU
     return baseLimit;
   };
   ```

7. **Quota Management (Monthly Limits)**
   ```javascript
   // Separate from per-minute rate limits
   const checkMonthlyQuota = async (userId, plan) => {
     const quotaLimits = { free: 1000, pro: 10000, enterprise: 100000 };
     const month = new Date().toISOString().slice(0, 7); // YYYY-MM
     const key = `quota:${userId}:${month}`;

     const used = parseInt(await redis.get(key) || '0');
     const limit = quotaLimits[plan] || quotaLimits.free;

     if (used >= limit) {
       return { allowed: false, used, limit };
     }

     await redis.incr(key);
     await redis.expireat(key, getEndOfMonthTimestamp());
     return { allowed: true, used: used + 1, limit };
   };
   ```

8. **Monitoring and Analytics**
   ```javascript
   // Record every rate limit decision for dashboards
   const recordRateLimitEvent = async (key, allowed, tier) => {
     const event = {
       key, allowed, tier,
       timestamp: Date.now(),
       endpoint: req.path
     };
     await redis.lpush('rate_limit_events', JSON.stringify(event));
     await redis.ltrim('rate_limit_events', 0, 9999); // Keep last 10k events

     if (!allowed) {
       await redis.incr(`rate_limit_blocks:${tier}:${new Date().toISOString().slice(0,10)}`);
     }
   };
   ```

9. **Dynamic Configuration**
   ```javascript
   // Update limits without application restart
   class RateLimitConfigManager {
     async updateLimit(tier, newLimit) {
       await redis.hset('rate_limit_config', tier, JSON.stringify(newLimit));
       await redis.publish('rate_limit_config_updated', tier);
     }

     async getLimit(tier) {
       const cached = await redis.hget('rate_limit_config', tier);
       return cached ? JSON.parse(cached) : RATE_LIMIT_TIERS[tier];
     }
   }
   ```

10. **Testing Rate Limits**
    ```javascript
    describe('Rate Limiting', () => {
      it('blocks requests exceeding limit', async () => {
        const requests = Array(101).fill().map(() =>
          request(app).get('/api/data').set('X-Forwarded-For', '1.2.3.4')
        );
        const responses = await Promise.all(requests);
        const blocked = responses.filter(r => r.status === 429);
        expect(blocked.length).toBeGreaterThan(0);
      });

      it('sets correct rate limit headers', async () => {
        const res = await request(app).get('/api/data');
        expect(res.headers['x-ratelimit-limit']).toBeDefined();
        expect(res.headers['x-ratelimit-remaining']).toBeDefined();
        expect(res.headers['x-ratelimit-reset']).toBeDefined();
      });
    });
    ```
