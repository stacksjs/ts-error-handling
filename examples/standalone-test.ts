/**
 * Standalone Test
 *
 * Run with: cd /Users/chrisbreuer/Code/Libraries\ \&\ CLIs/ts-error-handling && bun examples/standalone-test.ts
 *
 * This starts a simple server to view all error page variations.
 */

import { createErrorHandler, renderProductionErrorPage } from '../src/error-page'

const handler = createErrorHandler({
  appName: 'Error Demo',
  theme: 'auto',
  showEnvironment: true,
  showQueries: true,
})

handler.setFramework('Bun', Bun.version)

// Test error to generate stack trace
function innerFunction() {
  throw new Error('This is a test error message to demonstrate the Ignition-style error page')
}

function middleFunction() {
  return innerFunction()
}

function outerFunction() {
  return middleFunction()
}

const server = Bun.serve({
  port: 3333,
  fetch(req) {
    const url = new URL(req.url)
    handler.setRequest(req)

    // Development error page
    if (url.pathname === '/dev') {
      try {
        handler.addQuery('SELECT * FROM users WHERE id = 1', 5.23, 'mysql')
        handler.addQuery('SELECT * FROM posts WHERE user_id = 1 ORDER BY created_at DESC LIMIT 10', 12.45, 'mysql')
        handler.setRouting({
          controller: 'UserController@show',
          routeName: 'users.show',
          middleware: ['auth', 'verified'],
        })
        outerFunction()
      }
      catch (e) {
        return new Response(handler.render(e as Error, 500), {
          status: 500,
          headers: { 'Content-Type': 'text/html' },
        })
      }
    }

    // Production error pages
    if (url.pathname === '/prod-404') {
      return new Response(renderProductionErrorPage(404), {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
      })
    }

    if (url.pathname === '/prod-500') {
      return new Response(renderProductionErrorPage(500), {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      })
    }

    if (url.pathname === '/prod-503') {
      return new Response(renderProductionErrorPage(503, 'We are currently performing maintenance.'), {
        status: 503,
        headers: { 'Content-Type': 'text/html' },
      })
    }

    // Homepage
    return new Response(`<!DOCTYPE html>
<html>
<head>
  <title>Error Page Demo</title>
  <style>
    body { font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 1rem; background: #111; color: #eee; }
    h1 { color: #ef4444; }
    a { display: block; padding: 1rem; margin: 0.5rem 0; background: #222; color: #eee; text-decoration: none; border-radius: 0.5rem; }
    a:hover { background: #333; }
  </style>
</head>
<body>
  <h1>Error Page Demo</h1>
  <p>Click to view different error pages:</p>
  <a href="/dev">Development Error (500) - Full Stack Trace</a>
  <a href="/prod-404">Production 404 - Not Found</a>
  <a href="/prod-500">Production 500 - Server Error</a>
  <a href="/prod-503">Production 503 - Maintenance</a>
</body>
</html>`, { headers: { 'Content-Type': 'text/html' } })
  },
})

console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🔥 Error Page Demo Server Running                            ║
║                                                                ║
║   Open: http://localhost:${server.port}                               ║
║                                                                ║
║   Pages:                                                       ║
║   • /dev      - Development error with full stack trace        ║
║   • /prod-404 - Production 404 page                            ║
║   • /prod-500 - Production 500 page                            ║
║   • /prod-503 - Production maintenance page                    ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`)
