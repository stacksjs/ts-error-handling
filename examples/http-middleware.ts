/**
 * HTTP Middleware Example
 *
 * Run with: bun examples/http-middleware.ts
 *
 * Shows how to use the error handler as middleware in an HTTP server.
 */

import { errorResponse, createErrorHandler, renderProductionErrorPage } from '../src'

// Simple middleware-based error handling
const handler = createErrorHandler({
  appName: 'API Server',
  theme: 'auto',
})

handler.setFramework('Bun HTTP', Bun.version)

// Simulated API routes
const routes: Record<string, (req: Request) => Promise<Response>> = {
  '/api/users': async () => {
    return Response.json({ users: [{ id: 1, name: 'John' }] })
  },

  '/api/users/42': async () => {
    throw new Error('User with ID 42 not found in the database')
  },

  '/api/protected': async () => {
    const error = new Error('Authentication token is missing or invalid')
    error.name = 'UnauthorizedError'
    throw error
  },

  '/api/slow': async () => {
    // Simulate a timeout
    await new Promise(resolve => setTimeout(resolve, 100))
    throw new Error('Request timeout: The operation took too long to complete')
  },
}

const server = Bun.serve({
  port: 3001,

  async fetch(req) {
    const url = new URL(req.url)

    // Set request context
    handler.setRequest(req)

    // Homepage
    if (url.pathname === '/') {
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>API Error Demo</title>
            <style>
              body { font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 1rem; }
              a { display: block; margin: 0.5rem 0; }
              code { background: #f0f0f0; padding: 0.25rem 0.5rem; border-radius: 0.25rem; }
            </style>
          </head>
          <body>
            <h1>API Error Middleware Demo</h1>
            <p>Click the links to see error handling in action:</p>
            <a href="/api/users">GET /api/users <code>200 OK</code></a>
            <a href="/api/users/42">GET /api/users/42 <code>500 Error</code></a>
            <a href="/api/protected">GET /api/protected <code>401 Unauthorized</code></a>
            <a href="/api/slow">GET /api/slow <code>Timeout Error</code></a>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } })
    }

    // API routes with error handling middleware
    const routeHandler = routes[url.pathname]

    if (routeHandler) {
      try {
        return await routeHandler(req)
      }
      catch (error) {
        // Determine status code
        let status = 500
        if (error instanceof Error) {
          if (error.name === 'UnauthorizedError') status = 401
          if (error.name === 'NotFoundError') status = 404
          if (error.name === 'ValidationError') status = 422
        }

        // Check if client wants JSON
        const acceptHeader = req.headers.get('Accept') || ''
        if (acceptHeader.includes('application/json')) {
          return Response.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status }
          )
        }

        // Return HTML error page
        return handler.handleError(error as Error, status)
      }
    }

    // 404 for unknown routes
    const notFoundError = new Error(`Route ${url.pathname} not found`)
    notFoundError.name = 'NotFoundError'
    return handler.handleError(notFoundError, 404)
  },
})

console.log(`API server running at http://localhost:${server.port}`)
