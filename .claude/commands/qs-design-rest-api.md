# Design REST API

Design RESTful API architecture

## Instructions

1. **API Design Strategy and Planning**
   - Analyze business requirements and define API scope
   - Identify resources, entities, and their relationships
   - Plan API versioning strategy and backward compatibility
   - Define authentication and authorization requirements
   - Plan for scalability, rate limiting, and performance

2. **RESTful Resource Design**
   - Design resource-based endpoints following REST principles
   - Use nouns for resources, HTTP verbs for actions
   - Structure nested resources for related data (e.g., `/users/:id/orders`)
   - Plan pagination, filtering, and sorting query parameters
   - Define consistent URL naming conventions (kebab-case)

3. **HTTP Methods and Status Codes**
   ```
   GET    /resources          → 200 List resources
   GET    /resources/:id      → 200 Get resource, 404 Not found
   POST   /resources          → 201 Created, 400 Validation error, 409 Conflict
   PUT    /resources/:id      → 200 Updated, 404 Not found
   PATCH  /resources/:id      → 200 Updated, 404 Not found
   DELETE /resources/:id      → 204 No content, 404 Not found
   ```

4. **Request/Response Data Models**
   ```javascript
   // Standardized API response format
   class ApiResponse {
     constructor(status, message, data = null, meta = null) {
       this.status = status;           // 'success' | 'error'
       this.message = message;
       this.timestamp = new Date().toISOString();
       if (data !== null) this.data = data;
       if (meta !== null) this.meta = meta;
     }
   }

   // Standardized error class
   class ApiError extends Error {
     constructor(statusCode, message, errors = null) {
       super(message);
       this.statusCode = statusCode;
       this.isOperational = true;
       this.errors = errors;
     }
   }
   ```

5. **Request Validation**
   ```javascript
   // Validation middleware pattern (Joi example)
   const validateRequest = (schema) => (req, res, next) => {
     const { error, value } = schema.validate(req.body, {
       abortEarly: false,
       stripUnknown: true
     });
     if (error) {
       return res.status(400).json({
         status: 'error',
         message: 'Validation failed',
         details: error.details.map(d => ({
           field: d.path.join('.'),
           message: d.message
         }))
       });
     }
     req.body = value;
     next();
   };
   ```

6. **Authentication Middleware**
   ```javascript
   // JWT authentication
   const authenticate = async (req, res, next) => {
     const token = req.headers.authorization?.replace('Bearer ', '');
     if (!token) throw ApiError.unauthorized('Access token required');

     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       req.user = await userService.findById(decoded.userId);
       if (!req.user || req.user.status !== 'active') {
         throw ApiError.unauthorized('Account not active');
       }
       next();
     } catch (err) {
       next(ApiError.unauthorized('Invalid or expired token'));
     }
   };

   // Role-based authorization
   const authorize = (...roles) => (req, res, next) => {
     if (!roles.includes(req.user?.role)) {
       return next(ApiError.forbidden('Insufficient permissions'));
     }
     next();
   };
   ```

7. **Pagination Pattern**
   ```javascript
   // Cursor-based or offset pagination
   const paginate = async (query, { page = 1, limit = 20 }) => {
     const offset = (page - 1) * limit;
     const [data, total] = await Promise.all([
       query.limit(limit).offset(offset),
       query.count()
     ]);
     return {
       data,
       pagination: {
         page,
         limit,
         total,
         totalPages: Math.ceil(total / limit),
         hasNext: page * limit < total,
         hasPrev: page > 1
       }
     };
   };
   ```

8. **Error Handling Middleware**
   ```javascript
   const errorHandler = (error, req, res, next) => {
     const statusCode = error.statusCode || 500;
     const message = error.isOperational ? error.message : 'Internal server error';

     res.status(statusCode).json({
       status: 'error',
       message,
       errors: error.errors || undefined,
       timestamp: new Date().toISOString(),
       ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
     });
   };
   ```

9. **API Versioning**
   ```javascript
   // URL path versioning (preferred)
   app.use('/api/v1', v1Router);
   app.use('/api/v2', v2Router);

   // Add deprecation headers for old versions
   app.use('/api/v1', (req, res, next) => {
     res.set('Deprecation', 'version="v1"');
     res.set('Sunset', 'Sat, 01 Jan 2025 00:00:00 GMT');
     next();
   });
   ```

10. **OpenAPI/Swagger Documentation**
    - Annotate controllers with JSDoc Swagger comments
    - Define request/response schemas in components section
    - Document authentication requirements per endpoint
    - Include example values for all parameters
    - Set up Swagger UI at `/api/docs` for interactive testing

11. **Rate Limiting**
    ```javascript
    const rateLimit = require('express-rate-limit');
    app.use('/api/', rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: { status: 'error', message: 'Too many requests' }
    }));
    ```

12. **API Testing Strategy**
    - Unit test controllers with mocked services
    - Integration test full request/response cycles
    - Contract test API schema compliance
    - Performance test under expected load
    - Security test authentication and authorization boundaries
