# Design Database Schema

Design optimized database schemas

## Instructions

1. **Requirements Analysis and Data Modeling**
   - Analyze business requirements and data relationships
   - Identify entities, attributes, and relationships
   - Define data types, constraints, and validation rules
   - Plan for scalability and future requirements
   - Consider data access patterns and query requirements

2. **Entity Relationship Design**
   - Create comprehensive entity relationship diagrams
   - Design normalized schemas (3NF minimum, selective denormalization for read performance)
   - Define primary keys, foreign keys, and unique constraints
   - Plan junction tables for many-to-many relationships
   - Consider hierarchical data structures (adjacency list, nested sets, closure tables)

3. **User Management Schema Example**
   ```sql
   CREATE TABLE users (
     id BIGSERIAL PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     username VARCHAR(50) UNIQUE NOT NULL,
     password_hash VARCHAR(255) NOT NULL,
     first_name VARCHAR(100) NOT NULL,
     last_name VARCHAR(100) NOT NULL,
     phone VARCHAR(20),
     date_of_birth DATE,
     email_verified BOOLEAN DEFAULT FALSE,
     status user_status DEFAULT 'active',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
     deleted_at TIMESTAMP WITH TIME ZONE,
     CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
   );

   CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');

   CREATE TABLE roles (
     id SERIAL PRIMARY KEY,
     name VARCHAR(50) UNIQUE NOT NULL,
     description TEXT,
     permissions JSONB DEFAULT '[]',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   );

   CREATE TABLE user_roles (
     user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
     role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
     assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
     assigned_by BIGINT REFERENCES users(id),
     PRIMARY KEY (user_id, role_id)
   );
   ```

4. **Performance Optimization — Strategic Indexing**
   ```sql
   -- Single column indexes for frequently queried fields
   CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
   CREATE INDEX CONCURRENTLY idx_users_status ON users(status) WHERE status != 'active';

   -- Composite indexes for common query patterns
   CREATE INDEX CONCURRENTLY idx_orders_user_status_date
   ON orders(user_id, status, created_at);

   -- Partial indexes for specific conditions
   CREATE INDEX CONCURRENTLY idx_products_low_stock
   ON products(inventory_quantity)
   WHERE inventory_tracking = true AND inventory_quantity <= low_stock_threshold;

   -- Full-text search
   CREATE INDEX CONCURRENTLY idx_products_search_vector
   ON products USING gin(search_vector);

   -- JSONB indexes
   CREATE INDEX CONCURRENTLY idx_products_attributes
   ON products USING gin(attributes);
   ```

5. **Audit Trail Pattern**
   ```sql
   CREATE TABLE audit_log (
     id BIGSERIAL PRIMARY KEY,
     table_name VARCHAR(255) NOT NULL,
     record_id BIGINT NOT NULL,
     operation audit_operation NOT NULL,
     old_values JSONB,
     new_values JSONB,
     changed_fields TEXT[],
     user_id BIGINT REFERENCES users(id),
     ip_address INET,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   );

   CREATE TYPE audit_operation AS ENUM ('INSERT', 'UPDATE', 'DELETE');
   ```

6. **Soft Delete Pattern**
   ```sql
   -- Add soft delete to any table
   ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

   -- Create view that excludes soft-deleted records
   CREATE VIEW active_users AS
   SELECT * FROM users WHERE deleted_at IS NULL;
   ```

7. **Partitioning Strategy for Large Tables**
   ```sql
   CREATE TABLE orders_partitioned (
     LIKE orders INCLUDING ALL
   ) PARTITION BY RANGE (created_at);

   CREATE TABLE orders_2024_01 PARTITION OF orders_partitioned
   FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
   ```

8. **Data Integrity and Constraints**
   ```sql
   -- Custom domain types for reusable validation
   CREATE DOMAIN email_address AS VARCHAR(255)
   CHECK (VALUE ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

   CREATE DOMAIN positive_decimal AS DECIMAL(10,2)
   CHECK (VALUE >= 0);

   -- Row Level Security
   ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

   CREATE POLICY orders_user_access ON orders
   FOR ALL TO authenticated_users
   USING (user_id = current_user_id());
   ```

9. **Temporal Data — Price History Example**
   ```sql
   CREATE TABLE product_price_history (
     id BIGSERIAL PRIMARY KEY,
     product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
     price DECIMAL(10,2) NOT NULL,
     effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
     effective_to TIMESTAMP WITH TIME ZONE,
     created_by BIGINT REFERENCES users(id),
     EXCLUDE USING gist (
       product_id WITH =,
       tstzrange(effective_from, effective_to, '[)') WITH &&
     )
   );
   ```

10. **Schema Documentation**
    ```sql
    COMMENT ON TABLE users IS 'User accounts and authentication information';
    COMMENT ON COLUMN users.email IS 'Unique email address for user authentication';
    COMMENT ON COLUMN users.status IS 'Current status: active, inactive, suspended, pending_verification';
    ```

11. **Security — Database Roles**
    ```sql
    CREATE ROLE app_readonly;
    GRANT CONNECT ON DATABASE myapp TO app_readonly;
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_readonly;

    CREATE ROLE app_readwrite;
    GRANT app_readonly TO app_readwrite;
    GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_readwrite;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_readwrite;
    ```
