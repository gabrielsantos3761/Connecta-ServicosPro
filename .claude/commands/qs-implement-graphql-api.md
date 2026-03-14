# Implement GraphQL API

Design and implement a production-ready GraphQL API

## Instructions

1. **Schema-First Design**
   - Define types, queries, mutations, and subscriptions
   - Use custom scalars for domain types (DateTime, EmailAddress, Upload)
   - Design input types for mutations
   - Plan connection types for cursor-based pagination
   - Define union and interface types for polymorphic data

2. **Apollo Server Setup**
   ```javascript
   const { ApolloServer } = require('@apollo/server');
   const { expressMiddleware } = require('@apollo/server/express4');

   const server = new ApolloServer({
     typeDefs,
     resolvers,
     plugins: [
       ApolloServerPluginDrainHttpServer({ httpServer }),
       // Disable introspection in production
       process.env.NODE_ENV === 'production'
         ? ApolloServerPluginLandingPageDisabled()
         : ApolloServerPluginLandingPageLocalDefault()
     ],
     formatError: (err) => {
       // Don't expose internal errors to clients
       if (err.extensions?.code === 'INTERNAL_SERVER_ERROR') {
         return new GraphQLError('Internal server error');
       }
       return err;
     }
   });
   ```

3. **Type Definitions**
   ```graphql
   scalar DateTime
   scalar EmailAddress

   type User {
     id: ID!
     email: EmailAddress!
     firstName: String!
     lastName: String!
     fullName: String!   # computed field
     createdAt: DateTime!
     orders(first: Int, after: String): OrderConnection!
   }

   type Query {
     me: User
     user(id: ID!): User
     users(filter: UserFilter, first: Int, after: String): UserConnection!
   }

   type Mutation {
     createUser(input: CreateUserInput!): CreateUserPayload!
     updateUser(id: ID!, input: UpdateUserInput!): UpdateUserPayload!
     deleteUser(id: ID!): DeleteUserPayload!
   }

   type Subscription {
     orderStatusChanged(orderId: ID!): Order!
   }

   # Relay-style pagination
   type UserConnection {
     edges: [UserEdge!]!
     pageInfo: PageInfo!
     totalCount: Int!
   }

   type UserEdge {
     cursor: String!
     node: User!
   }

   type PageInfo {
     hasNextPage: Boolean!
     hasPreviousPage: Boolean!
     startCursor: String
     endCursor: String
   }
   ```

4. **Resolver Implementation**
   ```javascript
   const resolvers = {
     Query: {
       me: (_, __, { user }) => {
         if (!user) throw new GraphQLError('Not authenticated', {
           extensions: { code: 'UNAUTHENTICATED' }
         });
         return userService.findById(user.id);
       },
       users: async (_, { filter, first = 20, after }, { user }) => {
         requireAuth(user);
         requireRole(user, ['admin', 'manager']);
         return userService.findUsers({ filter, first, after });
       }
     },
     User: {
       fullName: (user) => `${user.firstName} ${user.lastName}`,
       orders: (user, args, { loaders }) =>
         loaders.ordersByUserId.load(user.id)
     },
     Mutation: {
       createUser: async (_, { input }, { user }) => {
         requireAuth(user);
         requireRole(user, ['admin']);
         const newUser = await userService.createUser(input);
         return { user: newUser };
       }
     },
     Subscription: {
       orderStatusChanged: {
         subscribe: (_, { orderId }) =>
           pubsub.asyncIterator(`ORDER_STATUS_${orderId}`)
       }
     }
   };
   ```

5. **DataLoader — Solving N+1 Queries**
   ```javascript
   const DataLoader = require('dataloader');

   // Batch function loads all IDs in one query
   const createOrdersByUserIdLoader = () => new DataLoader(
     async (userIds) => {
       const orders = await Order.findAll({
         where: { userId: userIds }
       });
       // Group by userId and return in same order as input
       const orderMap = userIds.reduce((map, id) => {
         map[id] = orders.filter(o => o.userId === id);
         return map;
       }, {});
       return userIds.map(id => orderMap[id] || []);
     },
     { cache: true }
   );

   // Create loaders per request (in context factory)
   const createContext = ({ req }) => ({
     user: req.user,
     loaders: {
       ordersByUserId: createOrdersByUserIdLoader()
     }
   });
   ```

6. **Query Complexity and Depth Limiting**
   ```javascript
   const { createComplexityLimitRule } = require('graphql-query-complexity');
   const depthLimit = require('graphql-depth-limit');

   const server = new ApolloServer({
     validationRules: [
       depthLimit(10),
       createComplexityLimitRule(1000, {
         scalarCost: 1,
         objectCost: 2,
         listFactor: 10
       })
     ]
   });
   ```

7. **Authentication and Authorization**
   ```javascript
   const { shield, rule, and } = require('graphql-shield');

   const isAuthenticated = rule()((_, __, { user }) => !!user);
   const isAdmin = rule()((_, __, { user }) => user?.role === 'admin');
   const isOwner = rule()(async (_, { id }, { user }) => user?.id === id);

   const permissions = shield({
     Query: {
       me: isAuthenticated,
       users: and(isAuthenticated, isAdmin),
       user: and(isAuthenticated, isOwner)
     },
     Mutation: {
       createUser: and(isAuthenticated, isAdmin),
       updateUser: and(isAuthenticated, isOwner)
     }
   });
   ```

8. **Response Caching**
   ```javascript
   const { ResponseCache } = require('@apollo/server-plugin-response-cache');

   const server = new ApolloServer({
     plugins: [
       ResponseCache({
         sessionId: ({ request }) =>
           request.http.headers.get('authorization') || null,
       })
     ],
     cacheControl: {
       defaultMaxAge: 300
     }
   });

   // Per-field cache hints
   const typeDefs = gql`
     type Product @cacheControl(maxAge: 3600) {
       id: ID!
       name: String!
       price: Float! @cacheControl(maxAge: 60)  # price changes more often
     }
   `;
   ```

9. **Real-time Subscriptions**
   ```javascript
   const { PubSub } = require('graphql-subscriptions');
   // For distributed systems, use Redis PubSub:
   // const { RedisPubSub } = require('graphql-redis-subscriptions');

   const pubsub = new PubSub();

   // Publish from mutations
   const resolvers = {
     Mutation: {
       updateOrderStatus: async (_, { orderId, status }) => {
         const order = await orderService.updateStatus(orderId, status);
         pubsub.publish(`ORDER_STATUS_${orderId}`, {
           orderStatusChanged: order
         });
         return order;
       }
     }
   };
   ```

10. **Error Handling**
    ```javascript
    const { GraphQLError } = require('graphql');

    // Custom error codes
    throw new GraphQLError('User not found', {
      extensions: {
        code: 'USER_NOT_FOUND',
        http: { status: 404 }
      }
    });

    // Error codes to use:
    // UNAUTHENTICATED    - 401: Not logged in
    // FORBIDDEN          - 403: Logged in but no permission
    // NOT_FOUND          - 404: Resource not found
    // BAD_USER_INPUT     - 400: Validation error
    // INTERNAL_SERVER_ERROR - 500: Unexpected error
    ```

11. **Testing**
    ```javascript
    // Integration test example
    describe('Query: users', () => {
      it('returns users list for admin', async () => {
        const response = await server.executeOperation({
          query: `query { users { edges { node { id email } } } }`,
        }, {
          contextValue: { user: adminUser, loaders: createLoaders() }
        });

        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data.users.edges).toBeDefined();
      });
    });
    ```

12. **Production Configuration**
    - Disable introspection in production
    - Set query depth and complexity limits
    - Enable persisted queries for performance
    - Configure APQ (Automatic Persisted Queries) for CDN caching
    - Set up query tracing and performance monitoring
