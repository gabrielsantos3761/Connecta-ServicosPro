# Firebase Data Connect Overview

Firebase Data Connect is a relational database service built on Cloud SQL PostgreSQL that enables developers to define schemas and operations using GraphQL, with automatic SDK generation for multiple platforms.

## Key Structure

The framework organizes projects into three main components:

- **Schema definition** (`schema/schema.gql`): Where you model your data using GraphQL types
- **Operations** (`connector/queries.gql` and `mutations.gql`): Where you define client-facing GraphQL operations
- **Configuration files** (`dataconnect.yaml`, `connector.yaml`): Service and connector settings

## Development Approach

The documentation emphasizes a four-step workflow:

1. **Data modeling** using GraphQL with decorators like `@table` and `@col`
2. **Operations definition** including queries, mutations, and special operations like upserts
3. **Security implementation** via authorization decorators and row-level controls
4. **SDK generation** for web, mobile, and other platforms

## Notable Capabilities

The service supports advanced features including vector search, full-text search, complex filtering with logical operators, transactional operations, and nested data access across relationships.

## Deployment

The tool provides CLI commands for initialization, local development via emulator, SDK code generation, and production deployment through Firebase tools.