# Optimize Database Performance

Optimize database queries and performance

## Instructions

1. **Database Performance Analysis**
   - Analyze current database performance and identify bottlenecks
   - Review slow query logs and execution plans
   - Assess database schema design and normalization
   - Evaluate indexing strategy and query patterns
   - Monitor database resource utilization (CPU, memory, I/O)

2. **Query Optimization**
   ```sql
   -- Enable query logging for analysis
   ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1 second
   SELECT pg_reload_conf();

   -- Analyze query performance with full details
   EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
   SELECT u.id, u.name, COUNT(o.id) as order_count
   FROM users u
   LEFT JOIN orders o ON u.id = o.user_id
   WHERE u.created_at > '2023-01-01'
   GROUP BY u.id, u.name
   ORDER BY order_count DESC;

   -- Optimize with proper indexing
   CREATE INDEX CONCURRENTLY idx_users_created_at ON users(created_at);
   CREATE INDEX CONCURRENTLY idx_orders_user_id ON orders(user_id);
   CREATE INDEX CONCURRENTLY idx_orders_user_created ON orders(user_id, created_at);
   ```

3. **Index Strategy Optimization**
   ```sql
   -- Find indexes with low usage (candidates for removal)
   SELECT
     schemaname, tablename, indexname,
     idx_scan as index_scans,
     seq_scan as table_scans,
     round(idx_scan::float / NULLIF(idx_scan + seq_scan, 0) * 100, 2) as index_usage_pct
   FROM pg_stat_user_indexes
   WHERE seq_scan > idx_scan
   ORDER BY index_usage_pct ASC;

   -- Identify slow queries needing indexes
   SELECT query, calls, total_time, mean_time, rows
   FROM pg_stat_statements
   WHERE mean_time > 1000 -- queries taking > 1 second
   ORDER BY mean_time DESC
   LIMIT 20;

   -- Covering index for common query patterns
   CREATE INDEX CONCURRENTLY idx_orders_covering
   ON orders(user_id, status, created_at)
   INCLUDE (total_amount, discount);

   -- Partial index for selective conditions
   CREATE INDEX CONCURRENTLY idx_active_products_category
   ON products(category_id, price)
   WHERE status = 'active' AND inventory_quantity > 0;
   ```

4. **Schema Design Optimization**
   ```sql
   -- Materialized view for complex aggregations
   CREATE MATERIALIZED VIEW monthly_sales_summary AS
   SELECT
     DATE_TRUNC('month', created_at) as month,
     category_id,
     COUNT(*) as order_count,
     SUM(total_amount) as total_revenue,
     AVG(total_amount) as avg_order_value
   FROM orders
   WHERE created_at >= DATE_TRUNC('year', CURRENT_DATE)
   GROUP BY DATE_TRUNC('month', created_at), category_id;

   -- Refresh on schedule (or via trigger)
   REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_sales_summary;

   -- Partitioning for large tables
   CREATE TABLE orders_partitioned (
     LIKE orders INCLUDING ALL
   ) PARTITION BY RANGE (created_at);

   CREATE TABLE orders_2024_q1 PARTITION OF orders_partitioned
   FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
   ```

5. **Connection Pool Optimization**
   ```javascript
   const { Pool } = require('pg');

   const pool = new Pool({
     max: 20,                    // Maximum connections
     idleTimeoutMillis: 30000,   // Release idle connections after 30s
     connectionTimeoutMillis: 2000, // Fail fast on connection timeout
     maxUses: 7500,              // Refresh connections after N uses
     statement_timeout: 30000,   // Kill queries after 30s
   });

   // Monitor pool health
   setInterval(() => {
     console.log('Pool stats:', {
       total: pool.totalCount,
       idle: pool.idleCount,
       waiting: pool.waitingCount,
     });
   }, 60000);
   ```

6. **Query Result Caching**
   ```javascript
   class QueryCache {
     static async cachedQuery(sql, params = [], ttl = 300) {
       const key = `query:${Buffer.from(sql + JSON.stringify(params)).toString('base64')}`;
       let result = await redis.get(key);

       if (result) {
         return JSON.parse(result); // Cache hit
       }

       // Cache miss: execute and store
       const dbResult = await pool.query(sql, params);
       await redis.setex(key, ttl, JSON.stringify(dbResult.rows));
       return dbResult.rows;
     }

     // Invalidate when data changes
     static async invalidateTable(tableName) {
       const keys = await redis.keys(`query:*${tableName}*`);
       if (keys.length > 0) await redis.del(keys);
     }
   }
   ```

7. **Read Replica Load Balancing**
   ```javascript
   class DatabaseCluster {
     constructor() {
       this.writePool = new Pool({ host: process.env.DB_WRITE_HOST });
       this.readPools = [
         new Pool({ host: process.env.DB_READ1_HOST }),
         new Pool({ host: process.env.DB_READ2_HOST }),
       ];
       this.readIndex = 0;
     }

     getReadPool() {
       const pool = this.readPools[this.readIndex];
       this.readIndex = (this.readIndex + 1) % this.readPools.length;
       return pool;
     }

     async query(sql, params, forceWrite = false) {
       const isWrite = /^\s*(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)/i.test(sql);
       const pool = (isWrite || forceWrite) ? this.writePool : this.getReadPool();
       return pool.query(sql, params);
     }
   }
   ```

8. **Database Monitoring**
   ```sql
   -- Active connections and long-running queries
   SELECT pid, now() - query_start AS duration, state, query
   FROM pg_stat_activity
   WHERE state != 'idle'
   AND (now() - query_start) > interval '5 minutes'
   ORDER BY duration DESC;

   -- Table bloat (dead tuples)
   SELECT tablename,
     pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size,
     n_dead_tup,
     n_live_tup,
     round(n_dead_tup::numeric / NULLIF(n_live_tup, 0) * 100, 2) as dead_pct
   FROM pg_stat_user_tables
   WHERE n_dead_tup > 1000
   ORDER BY dead_pct DESC;

   -- Index efficiency
   SELECT relname as table, indexrelname as index,
     idx_scan, seq_scan,
     pg_size_pretty(pg_relation_size(indexrelid)) as index_size
   FROM pg_stat_user_indexes
   ORDER BY seq_scan DESC
   LIMIT 20;
   ```

9. **Vacuum and Maintenance**
   ```sql
   -- Schedule regular maintenance
   -- Using pg_cron extension:
   SELECT cron.schedule('nightly-vacuum', '0 2 * * *',
     'VACUUM ANALYZE;');

   -- Manual targeted vacuum for high-bloat tables
   VACUUM (ANALYZE, VERBOSE) orders;

   -- Reindex a bloated index with zero downtime
   REINDEX INDEX CONCURRENTLY idx_orders_user_id;
   ```

10. **Performance Benchmarking**
    ```javascript
    // Benchmark queries before/after optimization
    const benchmark = async (query, params, iterations = 100) => {
      const times = [];
      for (let i = 0; i < iterations; i++) {
        const start = process.hrtime.bigint();
        await pool.query(query, params);
        times.push(Number(process.hrtime.bigint() - start) / 1e6);
      }
      const sorted = times.sort((a, b) => a - b);
      return {
        avg: times.reduce((a, b) => a + b) / times.length,
        p50: sorted[Math.floor(iterations * 0.5)],
        p95: sorted[Math.floor(iterations * 0.95)],
        p99: sorted[Math.floor(iterations * 0.99)],
        min: sorted[0],
        max: sorted[iterations - 1]
      };
    };
    ```
