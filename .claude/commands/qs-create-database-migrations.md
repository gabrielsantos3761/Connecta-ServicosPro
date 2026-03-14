# Create Database Migrations

Create and manage database schema migrations safely

## Instructions

1. **Migration Strategy Planning**
   - Assess current schema and identify required changes
   - Plan zero-downtime migration approach for production
   - Consider backward compatibility during deployment window
   - Identify rollback requirements and risks
   - Estimate migration duration and impact on running transactions

2. **Migration Framework Setup**
   ```javascript
   // MigrationManager: tracks versions via schema_migrations table
   // Uses distributed locking to prevent concurrent migrations
   // Supports both SQL and JavaScript migration formats

   CREATE TABLE IF NOT EXISTS schema_migrations (
     id SERIAL PRIMARY KEY,
     version VARCHAR(255) UNIQUE NOT NULL,
     name VARCHAR(255) NOT NULL,
     executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
     execution_time_ms INTEGER,
     batch INTEGER NOT NULL DEFAULT 1
   );

   CREATE TABLE IF NOT EXISTS migration_lock (
     id INTEGER PRIMARY KEY DEFAULT 1,
     locked BOOLEAN DEFAULT FALSE,
     locked_at TIMESTAMP WITH TIME ZONE,
     locked_by VARCHAR(255),
     CONSTRAINT single_row CHECK (id = 1)
   );
   ```

3. **SQL Migration Template**
   ```sql
   -- Migration: 20240115_001_add_user_profile_fields
   -- +migrate Up
   ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
   ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
   ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(255);

   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_bio_search
   ON users USING gin(to_tsvector('english', COALESCE(bio, '')));

   -- +migrate Down
   DROP INDEX CONCURRENTLY IF EXISTS idx_users_bio_search;
   ALTER TABLE users DROP COLUMN IF EXISTS bio;
   ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;
   ALTER TABLE users DROP COLUMN IF EXISTS website;
   ```

4. **JavaScript Migration Template**
   ```javascript
   // migrations/20240115_002_migrate_user_data.js
   module.exports = {
     async up(db) {
       // Complex data transformation
       const users = await db.query('SELECT id, full_name FROM users');
       for (const user of users.rows) {
         const [firstName, ...rest] = user.full_name.split(' ');
         const lastName = rest.join(' ');
         await db.query(
           'UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3',
           [firstName, lastName, user.id]
         );
       }
       // Verify data integrity
       const mismatches = await db.query(
         'SELECT COUNT(*) FROM users WHERE first_name IS NULL'
       );
       if (parseInt(mismatches.rows[0].count) > 0) {
         throw new Error('Data integrity check failed');
       }
     },

     async down(db) {
       await db.query(
         "UPDATE users SET full_name = CONCAT(first_name, ' ', last_name)"
       );
     }
   };
   ```

5. **Zero-Downtime Table Restructuring**
   ```sql
   -- Phase 1: Add new column (nullable, no lock needed)
   ALTER TABLE orders ADD COLUMN new_status VARCHAR(50);

   -- Phase 2: Create trigger to keep both columns in sync
   CREATE OR REPLACE FUNCTION sync_order_status() RETURNS TRIGGER AS $$
   BEGIN
     NEW.new_status := NEW.status::text;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER sync_order_status_trigger
   BEFORE INSERT OR UPDATE ON orders
   FOR EACH ROW EXECUTE FUNCTION sync_order_status();

   -- Phase 3: Backfill existing data in batches
   DO $$
   DECLARE batch_size INT := 1000;
   DECLARE last_id BIGINT := 0;
   BEGIN
     LOOP
       UPDATE orders
       SET new_status = status::text
       WHERE id > last_id AND new_status IS NULL
       ORDER BY id LIMIT batch_size
       RETURNING MAX(id) INTO last_id;
       EXIT WHEN NOT FOUND OR last_id IS NULL;
       PERFORM pg_sleep(0.1); -- throttle to avoid lock contention
     END LOOP;
   END $$;

   -- Phase 4 (next deployment): Add NOT NULL constraint and drop old column
   ALTER TABLE orders ALTER COLUMN new_status SET NOT NULL;
   DROP TRIGGER sync_order_status_trigger ON orders;
   DROP FUNCTION sync_order_status();
   ALTER TABLE orders DROP COLUMN status;
   ALTER TABLE orders RENAME COLUMN new_status TO status;
   ```

6. **Safe Index Creation**
   ```sql
   -- Always use CONCURRENTLY to avoid table locks
   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_created
   ON orders(user_id, created_at DESC);

   -- Monitor index creation progress
   SELECT phase, blocks_done, blocks_total,
          round(100.0 * blocks_done / NULLIF(blocks_total, 0), 2) AS pct_done
   FROM pg_stat_progress_create_index
   WHERE relid = 'orders'::regclass;
   ```

7. **Pre-Flight Production Checks**
   ```javascript
   const preflightChecks = async (db) => {
     // 1. Check for blocking transactions
     const blockers = await db.query(`
       SELECT count(*) FROM pg_stat_activity
       WHERE state = 'active' AND query_start < NOW() - INTERVAL '5 minutes'
     `);
     if (parseInt(blockers.rows[0].count) > 0) {
       throw new Error('Long-running transactions detected. Delay migration.');
     }

     // 2. Check table size (warn for large tables)
     const tableSize = await db.query(`
       SELECT pg_size_pretty(pg_total_relation_size('orders')) AS size,
              pg_total_relation_size('orders') AS bytes
     `);
     if (tableSize.rows[0].bytes > 1024 * 1024 * 1024) { // > 1GB
       console.warn('Large table detected. Migration may take significant time.');
     }

     // 3. Verify recent backup
     // Add your backup verification logic here

     return true;
   };
   ```

8. **CLI Interface**
   ```bash
   # Run all pending migrations
   npm run migrate up

   # Rollback last N migrations
   npm run migrate down 1

   # Show migration status
   npm run migrate status

   # Test migrations (up then down then up again)
   npm run migrate test

   # Create new migration
   npm run migrate create add_payment_method_to_users
   ```

9. **CI/CD Integration**
   ```yaml
   # GitHub Actions example
   - name: Run database migrations
     env:
       DATABASE_URL: ${{ secrets.DATABASE_URL }}
     run: |
       # Run pre-flight checks
       npm run migrate:preflight

       # Run migrations with timeout
       timeout 300 npm run migrate up

       # Verify migration success
       npm run migrate status
   ```

10. **Monitoring and Alerting**
    - Track migration execution time
    - Alert on migrations exceeding time thresholds
    - Monitor error rates during and after migration
    - Log all migration activities with timing data
    - Send notifications on failure with rollback instructions
