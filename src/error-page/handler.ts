import type { ErrorPageConfig, ErrorPageData, EnvironmentContext, QueryInfo, RequestContext, RoutingContext } from './types'
import { createErrorPageDataFromError, enhanceStackFrames, parseStackTrace } from './stack-trace'
import { renderErrorPage, renderProductionErrorPage } from './renderer'

/**
 * Error handler class for generating beautiful error pages
 */
export class ErrorHandler {
  private config: ErrorPageConfig
  private queries: QueryInfo[] = []
  private requestContext?: RequestContext
  private routingContext?: RoutingContext
  private environmentContext?: EnvironmentContext
  private customContext: Record<string, unknown> = {}

  constructor(config: ErrorPageConfig = {}) {
    this.config = {
      showFullPaths: false,
      showEnvironment: true,
      showQueries: true,
      showRequest: true,
      appName: 'Application',
      snippetLines: 8,
      basePaths: [process.cwd()],
      theme: 'auto',
      enableCopyMarkdown: true,
      enableShare: false,
      ...config,
    }

    // Auto-detect environment
    this.environmentContext = this.detectEnvironment()
  }

  /**
   * Detect runtime environment
   */
  private detectEnvironment(): EnvironmentContext {
    const env: EnvironmentContext = {
      platform: process.platform,
      cwd: process.cwd(),
      environment: process.env.NODE_ENV || 'development',
    }

    // Detect Node.js version
    if (process.versions.node) {
      env.nodeVersion = process.versions.node
    }

    // Detect Bun version
    if (process.versions.bun) {
      env.bunVersion = process.versions.bun
    }

    return env
  }

  /**
   * Set framework information
   */
  setFramework(name: string, version?: string): this {
    this.environmentContext = {
      ...this.environmentContext,
      framework: name,
      frameworkVersion: version,
    }
    return this
  }

  /**
   * Set custom environment context
   */
  setEnvironment(env: Partial<EnvironmentContext>): this {
    this.environmentContext = {
      ...this.environmentContext,
      ...env,
    }
    return this
  }

  /**
   * Set request context from a Request object or custom data
   */
  setRequest(request: Request | RequestContext): this {
    if (request instanceof Request) {
      const url = new URL(request.url)
      this.requestContext = {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
        queryParams: Object.fromEntries(url.searchParams.entries()),
      }
    }
    else {
      this.requestContext = request
    }
    return this
  }

  /**
   * Set routing context
   */
  setRouting(routing: RoutingContext): this {
    this.routingContext = routing
    return this
  }

  /**
   * Add a database query to track
   */
  addQuery(query: string, time?: number, connection?: string): this {
    this.queries.push({ query, time, connection })
    return this
  }

  /**
   * Clear tracked queries
   */
  clearQueries(): this {
    this.queries = []
    return this
  }

  /**
   * Add custom context data
   */
  addContext(key: string, value: unknown): this {
    this.customContext[key] = value
    return this
  }

  /**
   * Clear all context
   */
  clearContext(): this {
    this.customContext = {}
    return this
  }

  /**
   * Create error page data from an Error object
   */
  createErrorData(error: Error, httpStatus?: number): ErrorPageData {
    const baseData = createErrorPageDataFromError(
      error,
      this.config.basePaths,
      this.config.snippetLines,
    )

    return {
      ...baseData,
      httpStatus,
      request: this.requestContext,
      routing: this.routingContext,
      environment: this.environmentContext,
      queries: [...this.queries],
      context: { ...this.customContext },
      handled: false,
    }
  }

  /**
   * Render an error page from an Error object
   */
  render(error: Error, httpStatus: number = 500): string {
    const data = this.createErrorData(error, httpStatus)
    return renderErrorPage(data, this.config)
  }

  /**
   * Render a production-safe error page (no stack traces)
   */
  renderProduction(status: number, message?: string): string {
    return renderProductionErrorPage(status, message)
  }

  /**
   * Middleware-style error handler for HTTP frameworks
   */
  handleError(error: Error, status: number = 500): Response {
    const isDevelopment = this.environmentContext?.environment !== 'production'
    const html = isDevelopment
      ? this.render(error, status)
      : this.renderProduction(status)

    return new Response(html, {
      status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  }

  /**
   * Create a clone of this handler with the same config
   */
  clone(): ErrorHandler {
    const handler = new ErrorHandler(this.config)
    handler.requestContext = this.requestContext
    handler.routingContext = this.routingContext
    handler.environmentContext = this.environmentContext
    handler.queries = [...this.queries]
    handler.customContext = { ...this.customContext }
    return handler
  }
}

/**
 * Create a new error handler instance
 */
export function createErrorHandler(config?: ErrorPageConfig): ErrorHandler {
  return new ErrorHandler(config)
}

/**
 * Quick helper to render an error page
 */
export function renderError(error: Error, options?: {
  status?: number
  request?: Request | RequestContext
  config?: ErrorPageConfig
}): string {
  const handler = new ErrorHandler(options?.config)

  if (options?.request) {
    handler.setRequest(options.request)
  }

  return handler.render(error, options?.status)
}

/**
 * Quick helper to create an error Response
 */
export function errorResponse(error: Error, options?: {
  status?: number
  request?: Request | RequestContext
  config?: ErrorPageConfig
}): Response {
  const handler = new ErrorHandler(options?.config)

  if (options?.request) {
    handler.setRequest(options.request)
  }

  return handler.handleError(error, options?.status)
}
