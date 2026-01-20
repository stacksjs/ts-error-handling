/**
 * Types for the error page rendering system
 * Inspired by Laravel's Ignition error handler
 */

export interface StackFrame {
  /** File path where the error occurred */
  file: string
  /** Line number in the file */
  line: number
  /** Column number (if available) */
  column?: number
  /** Function name */
  function?: string
  /** Class/method name */
  method?: string
  /** Whether this is an application frame vs vendor/library */
  isApp: boolean
  /** Whether this is a vendor frame */
  isVendor: boolean
  /** Code snippet around the error line */
  codeSnippet?: CodeSnippet
}

export interface CodeSnippet {
  /** Starting line number */
  startLine: number
  /** Lines of code with line numbers */
  lines: Array<{ line: number; code: string; highlighted: boolean }>
}

export interface RequestContext {
  /** HTTP method (GET, POST, etc.) */
  method?: string
  /** Request URL */
  url?: string
  /** Request headers */
  headers?: Record<string, string>
  /** Query parameters */
  queryParams?: Record<string, string>
  /** Request body (if applicable) */
  body?: unknown
  /** Cookies */
  cookies?: Record<string, string>
}

export interface RoutingContext {
  /** Controller/handler name */
  controller?: string
  /** Route name */
  routeName?: string
  /** Middleware chain */
  middleware?: string[]
  /** Route parameters */
  params?: Record<string, string>
}

export interface EnvironmentContext {
  /** Node.js version */
  nodeVersion?: string
  /** Bun version (if applicable) */
  bunVersion?: string
  /** Framework name */
  framework?: string
  /** Framework version */
  frameworkVersion?: string
  /** Environment (development, production, etc.) */
  environment?: string
  /** OS platform */
  platform?: string
  /** Current working directory */
  cwd?: string
}

export interface QueryInfo {
  /** SQL query */
  query: string
  /** Execution time in milliseconds */
  time?: number
  /** Connection name */
  connection?: string
}

export interface ErrorPageData {
  /** Error class/type name */
  exceptionClass: string
  /** Error message */
  message: string
  /** Error code (if applicable) */
  code?: string | number
  /** File where error originated */
  file?: string
  /** Line number where error originated */
  line?: number
  /** Column number */
  column?: number
  /** Full stack trace */
  stackFrames: StackFrame[]
  /** Whether the error was handled or not */
  handled: boolean
  /** HTTP status code */
  httpStatus?: number
  /** Request context */
  request?: RequestContext
  /** Routing context */
  routing?: RoutingContext
  /** Environment context */
  environment?: EnvironmentContext
  /** Database queries executed before error */
  queries?: QueryInfo[]
  /** Custom context data */
  context?: Record<string, unknown>
  /** Documentation links */
  documentationLinks?: string[]
  /** Timestamp when error occurred */
  occurredAt: Date
}

export interface ErrorPageConfig {
  /** Whether to show full file paths */
  showFullPaths?: boolean
  /** Whether to show environment context */
  showEnvironment?: boolean
  /** Whether to show queries */
  showQueries?: boolean
  /** Whether to show request details */
  showRequest?: boolean
  /** Custom application name */
  appName?: string
  /** Custom application version */
  appVersion?: string
  /** Number of lines to show in code snippets */
  snippetLines?: number
  /** Base paths to strip from file paths */
  basePaths?: string[]
  /** Theme: 'light' | 'dark' | 'auto' */
  theme?: 'light' | 'dark' | 'auto'
  /** Custom CSS to inject */
  customCss?: string
  /** Enable copy to markdown feature */
  enableCopyMarkdown?: boolean
  /** Enable share feature (requires server endpoint) */
  enableShare?: boolean
}

export type HttpStatusCode = 400 | 401 | 403 | 404 | 405 | 408 | 422 | 429 | 500 | 502 | 503 | 504

export interface HttpError {
  status: HttpStatusCode
  message: string
  title: string
}

export const HTTP_ERRORS: Record<HttpStatusCode, Pick<HttpError, 'title' | 'message'>> = {
  400: { title: 'Bad Request', message: 'The server could not understand the request.' },
  401: { title: 'Unauthorized', message: 'Authentication is required to access this resource.' },
  403: { title: 'Forbidden', message: 'You do not have permission to access this resource.' },
  404: { title: 'Not Found', message: 'The requested resource could not be found.' },
  405: { title: 'Method Not Allowed', message: 'The HTTP method is not allowed for this resource.' },
  408: { title: 'Request Timeout', message: 'The server timed out waiting for the request.' },
  422: { title: 'Unprocessable Entity', message: 'The request was well-formed but could not be processed.' },
  429: { title: 'Too Many Requests', message: 'You have exceeded the rate limit.' },
  500: { title: 'Internal Server Error', message: 'An unexpected error occurred on the server.' },
  502: { title: 'Bad Gateway', message: 'The server received an invalid response from an upstream server.' },
  503: { title: 'Service Unavailable', message: 'The service is temporarily unavailable.' },
  504: { title: 'Gateway Timeout', message: 'The server did not receive a timely response from an upstream server.' },
}
