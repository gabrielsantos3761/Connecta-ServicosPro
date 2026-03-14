# Generate API Documentation

Auto-generate API reference documentation

## Instructions

1. **API Documentation Strategy Analysis**
   - Analyze current API structure and endpoints
   - Identify documentation requirements (REST, GraphQL, gRPC, etc.)
   - Assess existing code annotations and documentation
   - Determine documentation output formats and hosting requirements
   - Plan documentation automation and maintenance strategy

2. **Documentation Tool Selection**
   - Choose appropriate API documentation tools:
     - **OpenAPI/Swagger**: REST API documentation with Swagger UI
     - **Redoc**: Modern OpenAPI documentation renderer
     - **GraphQL**: GraphiQL, Apollo Studio, GraphQL Playground
     - **Postman**: API documentation with collections
     - **Insomnia**: API documentation and testing
     - **API Blueprint**: Markdown-based API documentation
     - **JSDoc/TSDoc**: Code-first documentation generation
   - Consider factors: API type, team workflow, hosting, interactivity

3. **Code Annotation and Schema Definition**
   - Add comprehensive code annotations for API endpoints
   - Define request/response schemas and data models
   - Add parameter descriptions and validation rules
   - Document authentication and authorization requirements
   - Add example requests and responses

4. **OpenAPI Specification Generation**
   ```javascript
   // swagger.js — auto-generate from JSDoc comments
   const swaggerJsdoc = require('swagger-jsdoc');

   const options = {
     definition: {
       openapi: '3.0.0',
       info: {
         title: 'API Reference',
         version: '1.0.0',
         description: 'Auto-generated API documentation',
       },
       components: {
         securitySchemes: {
           bearerAuth: {
             type: 'http',
             scheme: 'bearer',
             bearerFormat: 'JWT',
           }
         }
       },
       security: [{ bearerAuth: [] }]
     },
     apis: ['./routes/**/*.js', './controllers/**/*.js']
   };

   const specs = swaggerJsdoc(options);
   ```

5. **Controller Documentation Example**
   ```javascript
   /**
    * @swagger
    * /api/v1/users:
    *   get:
    *     summary: List all users
    *     tags: [Users]
    *     security:
    *       - bearerAuth: []
    *     parameters:
    *       - in: query
    *         name: page
    *         schema: { type: integer, minimum: 1, default: 1 }
    *       - in: query
    *         name: limit
    *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
    *       - in: query
    *         name: search
    *         schema: { type: string }
    *     responses:
    *       200:
    *         description: Users retrieved successfully
    *         content:
    *           application/json:
    *             schema:
    *               $ref: '#/components/schemas/UserListResponse'
    *       401:
    *         $ref: '#/components/responses/UnauthorizedError'
    *
    *   post:
    *     summary: Create a new user
    *     tags: [Users]
    *     requestBody:
    *       required: true
    *       content:
    *         application/json:
    *           schema:
    *             $ref: '#/components/schemas/CreateUserInput'
    *     responses:
    *       201:
    *         description: User created successfully
    *       400:
    *         $ref: '#/components/responses/ValidationError'
    *       409:
    *         description: Email already exists
    */
   ```

6. **Interactive Documentation Setup**
   ```javascript
   const swaggerUi = require('swagger-ui-express');

   app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
     explorer: true,
     swaggerOptions: {
       docExpansion: 'none',
       filter: true,
       showRequestDuration: true,
       persistAuthorization: true,
     },
     customCss: '.swagger-ui .topbar { display: none }',
   }));

   // Serve raw spec for tooling
   app.get('/api/docs/spec.json', (req, res) => res.json(specs));
   ```

7. **Documentation Content Enhancement**
   - Add comprehensive API guides and tutorials
   - Create authentication and authorization documentation
   - Add error handling and status code documentation
   - Create SDK and client library documentation
   - Add rate limiting and usage guidelines
   - Document webhook events and payload schemas
   - Include code samples in multiple languages

8. **Documentation Hosting and Deployment**
   - Set up documentation hosting (GitHub Pages, Netlify, Vercel)
   - Configure custom domain and SSL
   - Set up documentation search and navigation
   - Configure analytics to track most-read sections
   - Enable versioned documentation per API version

9. **Automation and CI/CD Integration**
   ```yaml
   # GitHub Actions: auto-deploy docs on API changes
   - name: Generate and deploy API docs
     run: |
       npm run generate:docs
       npm run validate:docs   # Validate OpenAPI spec
     env:
       NODE_ENV: production
   ```

10. **Maintenance and Quality Assurance**
    - Set up documentation linting (spectral for OpenAPI)
    - Configure documentation feedback and improvement workflows
    - Set up broken link detection
    - Validate examples match actual API behavior
    - Automate changelog generation from git history
    - Review documentation with each PR that changes API contracts
