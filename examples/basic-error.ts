/**
 * Basic Error Example
 *
 * Run with: bun examples/basic-error.ts
 * Then open: http://localhost:3000/error
 */

import { createErrorHandler, renderError } from '../src'

// Create an error handler
const errorHandler = createErrorHandler({
  appName: 'My Application',
  theme: 'auto',
  showEnvironment: true,
  showRequest: true,
})

// Set framework info
errorHandler.setFramework('Bun', Bun.version)

// Simulate some errors
function riskyOperation(): never {
  throw new Error('Something went wrong in riskyOperation!')
}

function anotherFunction() {
  return riskyOperation()
}

function topLevelFunction() {
  return anotherFunction()
}

// Create a simple server to demonstrate the error page
const server = Bun.serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url)

    if (url.pathname === '/error') {
      try {
        topLevelFunction()
      }
      catch (error) {
        // Set request context
        errorHandler.setRequest(req)

        // Render the error page
        const html = errorHandler.render(error as Error, 500)
        return new Response(html, {
          status: 500,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
      }
    }

    // Homepage with links
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error Handling Examples</title>
          <style>
            body { font-family: system-ui; max-width: 800px; margin: 0 auto; padding: 2rem; }
            a { display: block; padding: 1rem; margin: 0.5rem 0; background: #f0f0f0; text-decoration: none; color: #333; border-radius: 0.5rem; }
            a:hover { background: #e0e0e0; }
          </style>
        </head>
        <body>
          <h1>Error Handling Examples</h1>
          <p>Click on the links below to see different error pages:</p>
          <a href="/error">Basic Error (500)</a>
          <a href="/not-found">Not Found (404)</a>
          <a href="/forbidden">Forbidden (403)</a>
          <a href="/validation">Validation Error (422)</a>
          <a href="/database-error">Database Error with Queries</a>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    })
  },
})

console.log(`Server running at http://localhost:${server.port}`)
console.log('Visit http://localhost:3000/error to see the error page')
