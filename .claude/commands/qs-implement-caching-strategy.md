# Implement Caching Strategy

Design and implement a comprehensive multi-layer caching solution

## Instructions

1. **Caching Strategy Analysis**
   - Analyze application architecture and identify caching opportunities
   - Assess current performance bottlenecks and data access patterns
   - Define caching requirements (TTL, invalidation, consistency)
   - Plan multi-layer caching architecture (browser, CDN, application, database)
   - Evaluate caching technologies and storage solutions

2. **HTTP Caching Headers**
   ```javascript
   // Express.js cache control middleware
   app.use((req, res, next) => {
     // Static assets: long-term caching with content hash in filename
     if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$/)) {
       res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
     }
     // API responses: short-term public caching
     else if (req.url.startsWith('/api/public/')) {
       res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
     }
     // Authenticated API: no shared caching
     else if (req.url.startsWith('/api/')) {
       res.setHeader('Cache-Control', 'private, no-cache');
     }
     next();
   });
   ```

3. **Redis Distributed Cache**
   ```javascript
   const redis = require('redis');
   const client = redis.createClient({ url: process.env.REDIS_URL });

   class RedisCache {
     static async get(key) {
       try {
         const value = await client.get(key);
         return value ? JSON.parse(value) : null;
       } catch (err) {
         console.error('Cache get error:', err);
         return null; // Graceful degradation
       }
     }

     static async set(key, value, ttl = 600) {
       try {
         await client.setEx(key, ttl, JSON.stringify(value));
         return true;
       } catch (err) {
         console.error('Cache set error:', err);
         return false;
       }
     }

     // Pattern-based invalidation
     static async invalidatePattern(pattern) {
       const keys = await client.keys(pattern);
       if (keys.length > 0) await client.del(keys);
     }

     // Memoize expensive operations
     static async memoize(key, fn, ttl = 600) {
       let result = await this.get(key);
       if (result === null) {
         result = await fn();
         await this.set(key, result, ttl);
       }
       return result;
     }
   }
   ```

4. **API Response Caching Middleware**
   ```javascript
   const cacheMiddleware = (ttl = 300) => async (req, res, next) => {
     if (req.method !== 'GET') return next();

     const key = `api:${req.user?.id || 'anon'}:${req.originalUrl}`;
     const cached = await RedisCache.get(key);

     if (cached) {
       res.setHeader('X-Cache', 'HIT');
       return res.json(cached);
     }

     res.setHeader('X-Cache', 'MISS');

     // Intercept res.json to cache the response
     const originalJson = res.json.bind(res);
     res.json = (data) => {
       RedisCache.set(key, data, ttl);
       return originalJson(data);
     };

     next();
   };

   // Usage
   router.get('/products', cacheMiddleware(600), productController.list);
   ```

5. **Event-Driven Cache Invalidation**
   ```javascript
   class CacheInvalidator {
     static invalidateUser(userId) {
       const patterns = [
         `api:${userId}:*`,
         `user:${userId}*`,
       ];
       patterns.forEach(p => RedisCache.invalidatePattern(p));
     }

     static invalidateProduct(productId) {
       RedisCache.invalidatePattern(`api:*:/api/products*`);
       RedisCache.invalidatePattern(`product:${productId}*`);
     }
   }

   // Trigger on data mutations
   app.put('/api/products/:id', async (req, res) => {
     await productService.update(req.params.id, req.body);
     CacheInvalidator.invalidateProduct(req.params.id);
     res.json({ success: true });
   });
   ```

6. **React Query Client-Side Caching**
   ```javascript
   import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 5 * 60 * 1000,    // Data is fresh for 5 minutes
         gcTime: 30 * 60 * 1000,       // Keep in cache for 30 minutes
         retry: 3,
         refetchOnWindowFocus: false,
       },
     },
   });

   // Usage in components
   const { data, isLoading } = useQuery({
     queryKey: ['products', filters],
     queryFn: () => api.getProducts(filters),
     staleTime: 10 * 60 * 1000, // Override for this query
   });

   // Invalidate after mutations
   const mutation = useMutation({
     mutationFn: api.updateProduct,
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['products'] });
     },
   });
   ```

7. **Cache Warming**
   ```javascript
   class CacheWarmer {
     static async warmOnStartup() {
       console.log('Warming cache...');
       await Promise.all([
         this.warmPopularProducts(),
         this.warmCategoryList(),
         this.warmSiteConfig(),
       ]);
       console.log('Cache warmed successfully');
     }

     static async warmPopularProducts() {
       const products = await db.query(
         'SELECT * FROM products WHERE status = $1 ORDER BY view_count DESC LIMIT 100',
         ['active']
       );
       await RedisCache.set('popular_products', products.rows, 3600);
     }
   }

   // Schedule periodic re-warming
   const cron = require('node-cron');
   cron.schedule('0 */6 * * *', CacheWarmer.warmOnStartup);
   ```

8. **Cache Metrics and Monitoring**
   ```javascript
   class CacheMetrics {
     static hits = 0;
     static misses = 0;

     static wrapWithMetrics(cache) {
       return {
         get: async (key) => {
           const value = await cache.get(key);
           value !== null ? this.hits++ : this.misses++;
           return value;
         },
         set: cache.set.bind(cache),
       };
     }

     static getHitRate() {
       const total = this.hits + this.misses;
       return total > 0 ? (this.hits / total * 100).toFixed(2) : 0;
     }
   }

   // Expose metrics endpoint
   app.get('/api/internal/cache-stats', (req, res) => {
     res.json({
       hitRate: `${CacheMetrics.getHitRate()}%`,
       hits: CacheMetrics.hits,
       misses: CacheMetrics.misses
     });
   });
   ```

9. **Database Query Result Caching**
   ```javascript
   // ORM-level caching with cache-aside pattern
   const getProduct = async (id) => {
     const key = `product:${id}`;
     return RedisCache.memoize(key, async () => {
       const result = await db.query(
         'SELECT p.*, c.name as category FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = $1',
         [id]
       );
       return result.rows[0] || null;
     }, 900); // 15 minutes
   };
   ```

10. **Testing Cache Behavior**
    ```javascript
    describe('Caching', () => {
      it('serves cached response on second request', async () => {
        const start1 = Date.now();
        await request(app).get('/api/products').expect(200);
        const duration1 = Date.now() - start1;

        const start2 = Date.now();
        const res2 = await request(app).get('/api/products').expect(200);
        const duration2 = Date.now() - start2;

        expect(res2.headers['x-cache']).toBe('HIT');
        expect(duration2).toBeLessThan(duration1 / 2);
      });

      it('invalidates cache after update', async () => {
        await request(app).get('/api/products').expect(200);
        await request(app).put('/api/products/1').send({ name: 'Updated' });
        const res = await request(app).get('/api/products');
        expect(res.headers['x-cache']).toBe('MISS');
      });
    });
    ```
