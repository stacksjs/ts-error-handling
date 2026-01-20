/**
 * Error page rendering module
 * Inspired by Laravel's Ignition error handler
 */

// Types
export type {
  CodeSnippet,
  EnvironmentContext,
  ErrorPageConfig,
  ErrorPageData,
  HttpError,
  HttpStatusCode,
  JobContext,
  QueryInfo,
  RequestContext,
  RoutingContext,
  StackFrame,
  UserContext,
} from './types'

export { HTTP_ERRORS } from './types'

// Stack trace utilities
export {
  createErrorPageDataFromError,
  enhanceStackFrames,
  formatStackFrame,
  getCodeSnippet,
  groupVendorFrames,
  parseStackTrace,
} from './stack-trace'

// Renderer
export {
  renderErrorPage,
  renderProductionErrorPage,
} from './renderer'

// Handler
export {
  createErrorHandler,
  errorResponse,
  ErrorHandler,
  renderError,
} from './handler'

// Styles
export { ERROR_PAGE_CSS } from './styles'
