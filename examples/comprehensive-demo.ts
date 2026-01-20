/**
 * Comprehensive Error Handling Demo
 *
 * Run with: bun examples/comprehensive-demo.ts
 * Then open: http://localhost:3000
 *
 * This demo shows all the features of the Ignition-style error pages:
 * - Stack traces with code snippets
 * - Request context
 * - Routing information
 * - Database queries
 * - Environment info
 */

import {
  createErrorHandler,
  renderProductionErrorPage,
  HTTP_ERRORS,
} from '../src'

// Create the error handler with full configuration
const errorHandler = createErrorHandler({
  appName: 'Stacks Demo',
  theme: 'auto',
  showEnvironment: true,
  showQueries: true,
  showRequest: true,
  enableCopyMarkdown: true,
  snippetLines: 8,
  basePaths: [process.cwd()],
})

// Set framework info
errorHandler.setFramework('Stacks', '0.70.0')

// Simulated database queries
function simulateDbQueries() {
  errorHandler.clearQueries()
  errorHandler.addQuery(
    `SELECT * FROM "users" WHERE "id" = 'lBUnYzSl0ilmZFDWSjqoYnlRJwHSxfAqxESKzfJ' LIMIT 1`,
    9.22,
    'pgsql'
  )
  errorHandler.addQuery(
    `SELECT * FROM "sessions" WHERE "user_id" = 42 ORDER BY "created_at" DESC`,
    3.15,
    'pgsql'
  )
  errorHandler.addQuery(
    `INSERT INTO "activity_logs" ("user_id", "action", "created_at") VALUES (42, 'page_view', NOW())`,
    1.87,
    'pgsql'
  )
}

// Custom error classes
class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

class DatabaseError extends Error {
  constructor(message: string, public query?: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}

class AuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

// Error-prone functions with realistic call stacks
class UserService {
  static async findById(id: string) {
    return UserRepository.find(id)
  }
}

class UserRepository {
  static find(id: string) {
    return DatabaseConnection.query(`SELECT * FROM users WHERE id = '${id}'`)
  }
}

class DatabaseConnection {
  static query(sql: string): never {
    throw new DatabaseError(
      `SQLSTATE[42S02]: Base table or view not found: Table 'users' doesn't exist`,
      sql
    )
  }
}

class AuthController {
  static login(email: string, password: string) {
    return AuthService.authenticate(email, password)
  }
}

class AuthService {
  static authenticate(email: string, _password: string): never {
    throw new AuthenticationError(
      `Invalid credentials for user: ${email}. Please check your email and password.`
    )
  }
}

class PaymentController {
  static processPayment(amount: number) {
    return PaymentGateway.charge(amount)
  }
}

class PaymentGateway {
  static charge(amount: number): never {
    throw new Error(
      `Payment processing failed: Unable to charge $${amount.toFixed(2)}. Card was declined.`
    )
  }
}

// Server
const server = Bun.serve({
  port: 3000,

  async fetch(req) {
    const url = new URL(req.url)

    // Set request context for all routes
    errorHandler.setRequest(req)

    try {
      switch (url.pathname) {
        case '/':
          return homepage()

        case '/database-error':
          simulateDbQueries()
          errorHandler.setRouting({
            controller: 'UserController',
            routeName: 'users.show',
            middleware: ['auth', 'verified', 'throttle:60,1'],
          })
          await UserService.findById('42')
          break

        case '/auth-error':
          errorHandler.setRouting({
            controller: 'AuthController',
            routeName: 'auth.login',
            middleware: ['guest', 'throttle:5,1'],
          })
          AuthController.login('user@example.com', 'wrongpassword')
          break

        case '/validation-error':
          errorHandler.setRouting({
            controller: 'UserController',
            routeName: 'users.store',
            middleware: ['auth', 'can:create-users'],
          })
          throw new ValidationError(
            'The email field must be a valid email address.',
            'email'
          )

        case '/payment-error':
          simulateDbQueries()
          errorHandler.setRouting({
            controller: 'PaymentController',
            routeName: 'payments.process',
            middleware: ['auth', 'verified', 'can:make-payments'],
          })
          PaymentController.processPayment(99.99)
          break

        case '/not-found':
          const notFoundError = new Error('The requested page could not be found.')
          notFoundError.name = 'NotFoundError'
          return new Response(errorHandler.render(notFoundError, 404), {
            status: 404,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          })

        case '/forbidden':
          const forbiddenError = new Error('You do not have permission to access this resource.')
          forbiddenError.name = 'ForbiddenError'
          errorHandler.setRouting({
            controller: 'AdminController',
            routeName: 'admin.dashboard',
            middleware: ['auth', 'role:admin'],
          })
          return new Response(errorHandler.render(forbiddenError, 403), {
            status: 403,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          })

        case '/production-404':
          return new Response(renderProductionErrorPage(404), {
            status: 404,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          })

        case '/production-500':
          return new Response(renderProductionErrorPage(500, 'An unexpected error occurred. Please try again later.'), {
            status: 500,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          })

        case '/production-503':
          return new Response(renderProductionErrorPage(503, 'We are currently performing maintenance. Please check back soon.'), {
            status: 503,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          })

        default:
          const error = new Error(`Route ${url.pathname} not found`)
          error.name = 'RouteNotFoundError'
          return new Response(errorHandler.render(error, 404), {
            status: 404,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          })
      }
    }
    catch (error) {
      // Determine status code based on error type
      let status = 500
      if (error instanceof ValidationError) status = 422
      if (error instanceof AuthenticationError) status = 401
      if (error instanceof DatabaseError) status = 500

      return new Response(errorHandler.render(error as Error, status), {
        status,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    return homepage()
  },
})

function homepage() {
  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Error Handling Demo - Stacks</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
          color: #e5e7eb;
          min-height: 100vh;
          padding: 3rem;
        }
        .container { max-width: 64rem; margin: 0 auto; }
        h1 {
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        }
        .subtitle {
          color: #9ca3af;
          font-size: 1.125rem;
          margin-bottom: 3rem;
        }
        h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 2rem 0 1rem;
          color: #e5e7eb;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }
        a {
          display: block;
          padding: 1.5rem;
          background: rgba(31, 41, 55, 0.5);
          border: 1px solid rgba(75, 85, 99, 0.3);
          border-radius: 0.75rem;
          text-decoration: none;
          transition: all 0.2s;
        }
        a:hover {
          background: rgba(31, 41, 55, 0.8);
          border-color: rgba(239, 68, 68, 0.5);
          transform: translateY(-2px);
        }
        .card-title {
          font-weight: 600;
          color: #e5e7eb;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .card-desc { color: #9ca3af; font-size: 0.875rem; line-height: 1.5; }
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .badge-red { background: rgba(239, 68, 68, 0.2); color: #f87171; }
        .badge-yellow { background: rgba(234, 179, 8, 0.2); color: #fbbf24; }
        .badge-blue { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
        .badge-gray { background: rgba(107, 114, 128, 0.2); color: #9ca3af; }
        .badge-green { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Error Handling Demo</h1>
        <p class="subtitle">Ignition-style error pages for TypeScript/Bun applications</p>

        <h2>Development Error Pages</h2>
        <p style="color: #6b7280; margin-bottom: 1rem; font-size: 0.875rem;">
          Full stack traces, code snippets, and debugging context
        </p>
        <div class="grid">
          <a href="/database-error">
            <div class="card-title">
              <span class="badge badge-red">500</span>
              Database Error
            </div>
            <div class="card-desc">
              Simulates a database connection error with query tracking and routing context.
            </div>
          </a>

          <a href="/auth-error">
            <div class="card-title">
              <span class="badge badge-yellow">401</span>
              Authentication Error
            </div>
            <div class="card-desc">
              Failed login attempt with invalid credentials.
            </div>
          </a>

          <a href="/validation-error">
            <div class="card-title">
              <span class="badge badge-blue">422</span>
              Validation Error
            </div>
            <div class="card-desc">
              Form validation failure with field-specific error.
            </div>
          </a>

          <a href="/payment-error">
            <div class="card-title">
              <span class="badge badge-red">500</span>
              Payment Error
            </div>
            <div class="card-desc">
              Payment gateway failure with query context.
            </div>
          </a>

          <a href="/not-found">
            <div class="card-title">
              <span class="badge badge-gray">404</span>
              Not Found
            </div>
            <div class="card-desc">
              Page not found error in development mode.
            </div>
          </a>

          <a href="/forbidden">
            <div class="card-title">
              <span class="badge badge-yellow">403</span>
              Forbidden
            </div>
            <div class="card-desc">
              Access denied error with routing context.
            </div>
          </a>
        </div>

        <h2>Production Error Pages</h2>
        <p style="color: #6b7280; margin-bottom: 1rem; font-size: 0.875rem;">
          User-friendly error pages without sensitive information
        </p>
        <div class="grid">
          <a href="/production-404">
            <div class="card-title">
              <span class="badge badge-gray">404</span>
              Production 404
            </div>
            <div class="card-desc">
              Clean "not found" page for production environments.
            </div>
          </a>

          <a href="/production-500">
            <div class="card-title">
              <span class="badge badge-red">500</span>
              Production 500
            </div>
            <div class="card-desc">
              Generic server error page without stack traces.
            </div>
          </a>

          <a href="/production-503">
            <div class="card-title">
              <span class="badge badge-green">503</span>
              Maintenance Mode
            </div>
            <div class="card-desc">
              Service unavailable page for maintenance.
            </div>
          </a>
        </div>
      </div>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   Error Handling Demo Server                                  ║
║                                                               ║
║   Server running at: http://localhost:${server.port}                  ║
║                                                               ║
║   Visit the homepage to see all available error examples.     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`)
