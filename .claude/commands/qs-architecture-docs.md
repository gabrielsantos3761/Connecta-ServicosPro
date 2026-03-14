# Create Architecture Documentation

Create comprehensive architecture documentation for the system

## Instructions

1. **Discovery and Analysis**
   - Examine system architecture and component relationships
   - Identify architectural patterns in use (microservices, monolith, CQRS, event-driven, etc.)
   - Map system boundaries and external integrations
   - Analyze data flows between components
   - Identify key stakeholders and their concerns

2. **Framework Selection**
   - Use C4 Model for hierarchical architecture diagrams:
     - **Context**: System in relation to users and external systems
     - **Container**: High-level technology choices and responsibilities
     - **Component**: Internal structure of each container
     - **Code**: Implementation-level details (only when necessary)
   - Capture Architecture Decision Records (ADRs) for design choices
   - Use Mermaid or PlantUML for diagrams as code

3. **System Context Documentation**
   ```markdown
   ## System Context

   ### External Users
   - End users: [description]
   - Administrators: [description]
   - Third-party integrations: [list]

   ### External Systems
   - Payment providers: [names and integration type]
   - Authentication providers: [names]
   - Notification services: [names]
   - Analytics platforms: [names]

   ### System Boundaries
   - What this system owns
   - What it delegates to external systems
   - Data that crosses boundaries
   ```

4. **Container Architecture**
   ```mermaid
   graph TB
     subgraph "Frontend Layer"
       WebApp[Web Application<br/>React/Next.js]
       MobileApp[Mobile App<br/>React Native]
     end

     subgraph "API Layer"
       APIGateway[API Gateway<br/>nginx/Kong]
       AppServer[Application Server<br/>Node.js/Express]
     end

     subgraph "Data Layer"
       Database[(Primary Database<br/>PostgreSQL)]
       Cache[(Cache<br/>Redis)]
       FileStorage[(File Storage<br/>S3)]
     end

     WebApp --> APIGateway
     MobileApp --> APIGateway
     APIGateway --> AppServer
     AppServer --> Database
     AppServer --> Cache
     AppServer --> FileStorage
   ```

5. **Component Details**
   - Document internal modules and their responsibilities
   - Define interfaces between components
   - Document design patterns applied (Repository, Service Layer, etc.)
   - Organize code structure documentation
   - Map component ownership to teams

6. **Data Architecture**
   ```markdown
   ## Data Architecture

   ### Databases
   - Primary: PostgreSQL — transactional data, user records, orders
   - Cache: Redis — sessions, rate limiting, temporary data
   - Search: Elasticsearch — product search, full-text queries (if applicable)

   ### Data Flows
   - User registration: Web -> API -> PostgreSQL -> Email service
   - Order processing: Web -> API -> PostgreSQL -> Payment provider -> Webhook

   ### Data Governance
   - PII data: encrypted at rest, access logged
   - Retention policies: user data 7 years, logs 90 days
   - Backup: daily snapshots, 30-day retention
   ```

7. **Security Architecture**
   ```markdown
   ## Security Considerations

   ### Authentication Flow
   - JWT-based stateless authentication
   - Token refresh: sliding window, 7-day max lifetime
   - MFA: TOTP-based for admin accounts

   ### Authorization Model
   - RBAC: roles (admin, manager, user, guest)
   - Resource-level permissions for sensitive operations

   ### Threat Model
   - External attack surface: API endpoints, authentication
   - Internal trust boundaries: service-to-service communication
   - Data sensitivity levels and handling requirements

   ### Compliance
   - LGPD requirements: data subject rights, consent management
   - Audit logging: all authentication events, data mutations
   ```

8. **Quality Attributes**
   ```markdown
   ## Non-Functional Requirements

   ### Performance
   - API p95 response time: < 500ms
   - Database query targets: < 100ms for 95th percentile
   - Page load target: < 3 seconds on 4G

   ### Scalability
   - Horizontal scaling: stateless application servers
   - Database: read replicas for query distribution
   - Caching: Redis for session and query result caching

   ### Reliability
   - Uptime target: 99.9% (< 8.7 hours downtime/year)
   - RTO: 1 hour, RPO: 15 minutes
   - Circuit breakers for external service failures

   ### Observability
   - Metrics: Prometheus + Grafana
   - Logging: structured JSON, centralized aggregation
   - Tracing: distributed trace IDs across service calls
   ```

9. **Architecture Decision Records (ADRs)**
   ```markdown
   ## ADR-001: Use PostgreSQL as primary database

   **Status**: Accepted
   **Date**: 2024-01-15

   ### Context
   Need a relational database for transactional data with strong ACID guarantees.

   ### Decision
   Use PostgreSQL as the primary database.

   ### Consequences
   **Positive**: ACID transactions, JSON support, excellent tooling
   **Negative**: Requires careful schema migration management
   **Neutral**: Team needs PostgreSQL expertise

   ### Alternatives Considered
   - MySQL: similar capabilities but fewer features
   - MongoDB: flexible schema but weaker transactions
   ```

10. **Documentation Automation**
    - Generate dependency graphs from package.json
    - Auto-extract API documentation from code annotations
    - Create ERD diagrams from database schema
    - Set up documentation pipeline in CI/CD
    - Configure documentation review as part of PR process
    - Schedule quarterly architecture review sessions
