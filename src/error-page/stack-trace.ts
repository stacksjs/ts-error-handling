import * as fs from 'node:fs'
import * as path from 'node:path'
import type { CodeSnippet, ErrorPageData, StackFrame } from './types'

/**
 * Regular expressions for parsing stack traces
 */
const V8_STACK_REGEX = /^\s*at\s+(?:(.+?)\s+\()?(?:(.+?):(\d+)(?::(\d+))?|([^)]+))\)?$/
const BUN_STACK_REGEX = /^\s*at\s+(?:(.+?)\s+)?\(?(.+?):(\d+):(\d+)\)?$/

/**
 * Patterns to identify vendor/library frames
 */
const VENDOR_PATTERNS = [
  /node_modules/,
  /internal\//,
  /native\//,
  /<anonymous>/,
  /\[native code\]/,
  /bun:/,
  /node:/,
]

/**
 * Parse a stack trace string into structured frames
 */
export function parseStackTrace(stack: string | undefined, basePaths: string[] = []): StackFrame[] {
  if (!stack)
    return []

  const lines = stack.split('\n')
  const frames: StackFrame[] = []

  for (const line of lines) {
    const frame = parseStackLine(line, basePaths)
    if (frame) {
      frames.push(frame)
    }
  }

  return frames
}

/**
 * Parse a single stack trace line
 */
function parseStackLine(line: string, basePaths: string[]): StackFrame | null {
  // Try V8/Node.js format
  let match = line.match(V8_STACK_REGEX)
  if (!match) {
    // Try Bun format
    match = line.match(BUN_STACK_REGEX)
  }

  if (!match)
    return null

  const [, functionName, filePath, lineNum, colNum] = match

  if (!filePath)
    return null

  const lineNumber = lineNum ? Number.parseInt(lineNum, 10) : 0
  const colNumber = colNum ? Number.parseInt(colNum, 10) : undefined

  // Determine if it's a vendor frame
  const isVendor = VENDOR_PATTERNS.some(pattern => pattern.test(filePath))
  const isApp = !isVendor

  // Parse function/method name
  let fn = functionName || '<anonymous>'
  let method: string | undefined

  if (fn.includes('.')) {
    const parts = fn.split('.')
    method = parts.pop()
    fn = parts.join('.')
  }

  // Clean up file path
  let cleanPath = filePath
  for (const basePath of basePaths) {
    if (cleanPath.startsWith(basePath)) {
      cleanPath = cleanPath.slice(basePath.length)
      if (cleanPath.startsWith('/'))
        cleanPath = cleanPath.slice(1)
      break
    }
  }

  return {
    file: cleanPath,
    line: lineNumber,
    column: colNumber,
    function: fn,
    method,
    isApp,
    isVendor,
  }
}

/**
 * Get a code snippet from a file around a specific line
 */
export function getCodeSnippet(
  filePath: string,
  targetLine: number,
  contextLines: number = 8,
): CodeSnippet | undefined {
  try {
    if (!fs.existsSync(filePath))
      return undefined

    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')

    const startLine = Math.max(1, targetLine - contextLines)
    const endLine = Math.min(lines.length, targetLine + contextLines)

    const snippetLines: CodeSnippet['lines'] = []
    for (let i = startLine; i <= endLine; i++) {
      snippetLines.push({
        line: i,
        code: lines[i - 1] || '',
        highlighted: i === targetLine,
      })
    }

    return {
      startLine,
      lines: snippetLines,
    }
  }
  catch {
    return undefined
  }
}

/**
 * Enhance stack frames with code snippets
 */
export function enhanceStackFrames(frames: StackFrame[], snippetLines: number = 8): StackFrame[] {
  return frames.map((frame) => {
    if (frame.isVendor)
      return frame

    // Try to resolve the full path if needed
    let fullPath = frame.file
    if (!path.isAbsolute(fullPath)) {
      fullPath = path.resolve(process.cwd(), fullPath)
    }

    const snippet = getCodeSnippet(fullPath, frame.line, snippetLines)

    return {
      ...frame,
      codeSnippet: snippet,
    }
  })
}

/**
 * Format a stack frame for display
 */
export function formatStackFrame(frame: StackFrame): string {
  const parts: string[] = []

  if (frame.function && frame.function !== '<anonymous>') {
    if (frame.method) {
      parts.push(`${frame.function}.${frame.method}`)
    }
    else {
      parts.push(frame.function)
    }
    parts.push(' ')
  }

  parts.push(frame.file)

  if (frame.line) {
    parts.push(`:${frame.line}`)
    if (frame.column) {
      parts.push(`:${frame.column}`)
    }
  }

  return parts.join('')
}

/**
 * Create error page data from an Error object
 */
export function createErrorPageDataFromError(
  error: Error,
  basePaths: string[] = [],
  snippetLines: number = 8,
): ErrorPageData {
  const frames = parseStackTrace(error.stack, basePaths)
  const enhancedFrames = enhanceStackFrames(frames, snippetLines)

  // Get the first app frame for file/line info
  const firstAppFrame = enhancedFrames.find(f => f.isApp) || enhancedFrames[0]

  return {
    exceptionClass: error.name || 'Error',
    message: error.message,
    file: firstAppFrame?.file,
    line: firstAppFrame?.line,
    column: firstAppFrame?.column,
    stackFrames: enhancedFrames,
    handled: false,
    occurredAt: new Date(),
  }
}

/**
 * Group consecutive vendor frames
 */
export function groupVendorFrames(frames: StackFrame[]): Array<StackFrame | { isVendorGroup: true; count: number; frames: StackFrame[] }> {
  const result: Array<StackFrame | { isVendorGroup: true; count: number; frames: StackFrame[] }> = []
  let vendorGroup: StackFrame[] = []

  for (const frame of frames) {
    if (frame.isVendor) {
      vendorGroup.push(frame)
    }
    else {
      if (vendorGroup.length > 0) {
        result.push({
          isVendorGroup: true,
          count: vendorGroup.length,
          frames: vendorGroup,
        })
        vendorGroup = []
      }
      result.push(frame)
    }
  }

  if (vendorGroup.length > 0) {
    result.push({
      isVendorGroup: true,
      count: vendorGroup.length,
      frames: vendorGroup,
    })
  }

  return result
}
