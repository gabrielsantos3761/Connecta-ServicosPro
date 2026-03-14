# Error Analysis

Analyze, categorize, and resolve application errors systematically

## Usage
```
/error-analysis $ARGUMENTS
```

## Overview

Systematic error management framework covering root cause analysis, error handling improvements, logging, monitoring, and prevention strategies.

---

## Instructions

1. **Error Categorization**
   - Classify error types (validation, authentication, network, database, business logic, system)
   - Identify root causes through stack trace examination
   - Trace error propagation across service boundaries
   - Assess error frequency, impact, and user exposure
   - Prioritize errors by severity and business impact

2. **Root Cause Analysis**
   ```javascript
   // Structured error investigation approach
   const investigateError = async (errorReport) => {
     // 1. Parse stack trace
     const stackFrames = parseStackTrace(errorReport.stack);
     const originFile = stackFrames[0];

     // 2. Correlate with logs using request ID
     const relatedLogs = await queryLogs({
       requestId: errorReport.requestId,
       timeRange: { from: errorReport.timestamp - 60000, to: errorReport.timestamp }
     });

     // 3. Check for recent deployments
     const recentDeployments = await getDeployments({ since: '24h' });

     // 4. Identify affected users/requests
     const impact = await queryMetrics({
       metric: 'error_rate',
       filter: `path="${errorReport.path}"`,
       window: '1h'
     });

     return { originFile, relatedLogs, recentDeployments, impact };
   };
   ```

3. **Custom Exception Architecture**
   ```javascript
   // Base application error with structured metadata
   class AppError extends Error {
     constructor(message, options = {}) {
       super(message);
       this.name = this.constructor.name;
       this.statusCode = options.statusCode || 500;
       this.errorCode = options.errorCode || 'INTERNAL_ERROR';
       this.isOperational = options.isOperational !== false;
       this.context = options.context || {};
       Error.captureStackTrace(this, this.constructor);
     }
   }

   class ValidationError extends AppError {
     constructor(message, fields) {
       super(message, { statusCode: 400, errorCode: 'VALIDATION_ERROR' });
       this.fields = fields;
     }
   }

   class NotFoundError extends AppError {
     constructor(resource, id) {
       super(`${resource} not found`, { statusCode: 404, errorCode: 'NOT_FOUND' });
       this.context = { resource, id };
     }
   }

   class DatabaseError extends AppError {
     constructor(message, query) {
       super(message, { statusCode: 500, errorCode: 'DATABASE_ERROR' });
       this.context = { query };
       this.isOperational = false; // Non-operational: needs developer attention
     }
   }
   ```

4. **Retry Mechanism with Exponential Backoff**
   ```javascript
   const retry = async (fn, options = {}) => {
     const {
       maxAttempts = 3,
       initialDelay = 100,
       maxDelay = 5000,
       backoffFactor = 2,
       retryOn = (err) => err.statusCode >= 500
     } = options;

     let lastError;
     for (let attempt = 1; attempt <= maxAttempts; attempt++) {
       try {
         return await fn();
       } catch (err) {
         lastError = err;
         if (attempt === maxAttempts || !retryOn(err)) throw err;

         const delay = Math.min(
           initialDelay * Math.pow(backoffFactor, attempt - 1),
           maxDelay
         );
         const jitter = Math.random() * 0.1 * delay; // 10% jitter
         await new Promise(resolve => setTimeout(resolve, delay + jitter));

         console.warn(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms`);
       }
     }
     throw lastError;
   };
   ```

5. **Circuit Breaker Pattern**
   ```javascript
   class CircuitBreaker {
     constructor(fn, options = {}) {
       this.fn = fn;
       this.failureThreshold = options.failureThreshold || 5;
       this.resetTimeout = options.resetTimeout || 60000;
       this.state = 'CLOSED'; // CLOSED | OPEN | HALF_OPEN
       this.failureCount = 0;
       this.lastFailureTime = null;
     }

     async execute(...args) {
       if (this.state === 'OPEN') {
         if (Date.now() - this.lastFailureTime > this.resetTimeout) {
           this.state = 'HALF_OPEN';
         } else {
           throw new Error('Circuit breaker is OPEN');
         }
       }

       try {
         const result = await this.fn(...args);
         this.onSuccess();
         return result;
       } catch (err) {
         this.onFailure();
         throw err;
       }
     }

     onSuccess() {
       this.failureCount = 0;
       this.state = 'CLOSED';
     }

     onFailure() {
       this.failureCount++;
       this.lastFailureTime = Date.now();
       if (this.failureCount >= this.failureThreshold) {
         this.state = 'OPEN';
         console.error(`Circuit breaker OPENED after ${this.failureCount} failures`);
       }
     }
   }
   ```

6. **Structured Error Logging**
   ```javascript
   const logger = require('./logger');

   // Global uncaught exception handler
   process.on('uncaughtException', (err) => {
     logger.error('Uncaught exception', {
       message: err.message,
       stack: err.stack,
       type: 'UNCAUGHT_EXCEPTION'
     });
     process.exit(1);
   });

   process.on('unhandledRejection', (reason, promise) => {
     logger.error('Unhandled rejection', {
       reason: reason?.message || reason,
       stack: reason?.stack,
       type: 'UNHANDLED_REJECTION'
     });
   });

   // Express error handler with correlation IDs
   const errorHandler = (err, req, res, next) => {
     const errorId = req.requestId || require('crypto').randomUUID();

     logger.error('Request error', {
       errorId,
       errorCode: err.errorCode || 'UNKNOWN',
       message: err.message,
       statusCode: err.statusCode || 500,
       path: req.path,
       method: req.method,
       userId: req.user?.id,
       stack: err.isOperational ? undefined : err.stack
     });

     // Mask internal errors from response
     const message = err.isOperational ? err.message : 'Internal server error';
     res.status(err.statusCode || 500).json({
       status: 'error',
       errorId,
       message,
       ...(err.fields && { fields: err.fields })
     });
   };
   ```

7. **Error Monitoring Integration**
   ```javascript
   // Sentry integration example
   const Sentry = require('@sentry/node');

   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
     tracesSampleRate: 0.1,
     beforeSend(event, hint) {
       // Mask PII before sending
       if (event.user) {
         delete event.user.email;
         delete event.user.ip_address;
       }
       return event;
     }
   });

   // Capture with context
   const captureError = (err, context = {}) => {
     Sentry.withScope((scope) => {
       scope.setExtras(context);
       scope.setTag('errorCode', err.errorCode);
       Sentry.captureException(err);
     });
   };
   ```

8. **Input Validation and Prevention**
   ```javascript
   // Schema validation at API boundaries
   const { z } = require('zod');

   const UserSchema = z.object({
     email: z.string().email('Invalid email format'),
     age: z.number().min(18, 'Must be 18 or older').max(120),
     name: z.string().min(1).max(100).trim()
   });

   const validateInput = (schema) => (req, res, next) => {
     try {
       req.body = schema.parse(req.body);
       next();
     } catch (err) {
       next(new ValidationError('Validation failed', err.errors));
     }
   };
   ```

9. **Error Test Coverage**
   ```javascript
   describe('Error handling', () => {
     it('returns 404 for missing resource', async () => {
       const res = await request(app).get('/api/users/999999');
       expect(res.status).toBe(404);
       expect(res.body).toMatchObject({
         status: 'error',
         message: 'User not found'
       });
     });

     it('retries on transient database errors', async () => {
       jest.spyOn(db, 'query').mockRejectedValueOnce(new Error('Connection reset'));
       const result = await userService.findById(1);
       expect(result).toBeDefined();
       expect(db.query).toHaveBeenCalledTimes(2); // 1 failure + 1 retry
     });

     it('opens circuit breaker after threshold failures', async () => {
       const cb = new CircuitBreaker(failingFn, { failureThreshold: 3 });
       for (let i = 0; i < 3; i++) {
         await expect(cb.execute()).rejects.toThrow();
       }
       expect(cb.state).toBe('OPEN');
       await expect(cb.execute()).rejects.toThrow('Circuit breaker is OPEN');
     });
   });
   ```

10. **Error Prevention Checklist**
    - [ ] All external inputs validated at API boundary
    - [ ] Database queries use parameterized statements (no SQL injection)
    - [ ] Async functions wrapped in try/catch or using error middleware
    - [ ] External service calls wrapped in circuit breakers with fallbacks
    - [ ] Sensitive data masked in logs and error responses
    - [ ] Uncaught exception and unhandled rejection handlers registered
    - [ ] Error rates monitored with alerts configured
    - [ ] Post-deployment smoke tests covering error scenarios
