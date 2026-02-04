import type { ErrorPageConfig, ErrorPageData, JobContext, QueryInfo, StackFrame, UserContext } from './types'
import { HTTP_ERRORS } from './types'
import { groupVendorFrames } from './stack-trace'
import { ERROR_PAGE_CSS } from './styles'

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Format a stack frame for display
 */
function formatFrameFunction(frame: StackFrame): string {
  if (!frame.function || frame.function === '<anonymous>') {
    return escapeHtml(frame.file)
  }

  if (frame.method) {
    return `<span class="text-violet">${escapeHtml(frame.function)}</span>.<span class="text-blue">${escapeHtml(frame.method)}</span>`
  }

  return escapeHtml(frame.function)
}

/**
 * Format a file location
 */
function formatLocation(frame: StackFrame): string {
  let loc = escapeHtml(frame.file)
  if (frame.line) {
    loc += `:${frame.line}`
    if (frame.column) {
      loc += `:${frame.column}`
    }
  }
  return loc
}

/**
 * Highlight SQL keywords
 */
function highlightSql(sql: string): string {
  const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'GROUP', 'BY', 'ORDER', 'LIMIT', 'OFFSET', 'AS', 'IN', 'NOT', 'NULL', 'IS', 'LIKE', 'BETWEEN', 'HAVING', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'DISTINCT', 'CREATE', 'ALTER', 'DROP', 'TABLE', 'INDEX', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'CASCADE', 'UNION', 'ALL', 'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END']

  let result = escapeHtml(sql)

  // Highlight keywords (case insensitive)
  for (const keyword of keywords) {
    const regex = new RegExp(`\\b(${keyword})\\b`, 'gi')
    result = result.replace(regex, '<span class="keyword">$1</span>')
  }

  // Highlight strings
  result = result.replace(/'([^']*)'/g, '<span class="string">\'$1\'</span>')

  // Highlight numbers
  result = result.replace(/\b(\d+)\b/g, '<span class="number">$1</span>')

  return result
}

/**
 * Generate the code snippet HTML
 */
function renderCodeSnippet(frame: StackFrame): string {
  if (!frame.codeSnippet)
    return ''

  const lines = frame.codeSnippet.lines.map((line) => {
    const highlightedClass = line.highlighted ? ' highlighted' : ''
    return `<div class="code-line${highlightedClass}">
      <span class="code-line-number">${line.line}</span>
      <span class="code-line-content">${escapeHtml(line.code)}</span>
    </div>`
  }).join('')

  return `<div class="code-snippet">${lines}</div>`
}

/**
 * Render a single stack frame
 */
function renderStackFrame(frame: StackFrame, index: number): string {
  const frameClass = frame.isApp ? 'app' : 'vendor'
  const hasSnippet = !!frame.codeSnippet

  return `
    <div class="stack-frame ${frameClass}" data-index="${index}">
      <div class="stack-frame-header" onclick="toggleFrame(${index})">
        <div class="stack-frame-dot"></div>
        <div class="stack-frame-info">
          <div class="stack-frame-function">${formatFrameFunction(frame)}</div>
          <div class="stack-frame-location">${formatLocation(frame)}</div>
        </div>
        ${hasSnippet ? `<span class="stack-frame-toggle" id="toggle-${index}">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
        </span>` : ''}
      </div>
      ${hasSnippet ? `<div class="stack-frame-code" id="code-${index}" style="display: none;">
        ${renderCodeSnippet(frame)}
      </div>` : ''}
    </div>
  `
}

/**
 * Render a vendor frames group
 */
function renderVendorGroup(count: number, frames: StackFrame[], groupIndex: number): string {
  return `
    <div class="vendor-group" onclick="toggleVendorGroup(${groupIndex})">
      <span class="vendor-group-icon">
        <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
          <rect width="8" height="8" rx="1"/>
        </svg>
      </span>
      <span>${count} vendor frame${count > 1 ? 's' : ''}</span>
      <span class="stack-frame-toggle" id="vendor-toggle-${groupIndex}">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="2" fill="none"/>
        </svg>
      </span>
    </div>
    <div class="vendor-group-frames" id="vendor-frames-${groupIndex}" style="display: none;">
      ${frames.map((f, i) => renderStackFrame(f, groupIndex * 1000 + i)).join('')}
    </div>
  `
}

/**
 * Render the stack trace section
 */
function renderStackTrace(frames: StackFrame[]): string {
  const grouped = groupVendorFrames(frames)

  let html = ''
  let groupIndex = 0

  for (const item of grouped) {
    if ('isVendorGroup' in item) {
      html += renderVendorGroup(item.count, item.frames, groupIndex++)
    }
    else {
      html += renderStackFrame(item, groupIndex++)
    }
  }

  return html
}

/**
 * Render queries section
 */
function renderQueries(queries: QueryInfo[]): string {
  if (!queries || queries.length === 0) {
    return '<div class="empty-state">// NO QUERIES</div>'
  }

  return queries.map((query, index) => `
    <div class="query-item">
      <div class="query-meta">
        <span class="query-driver">${query.connection ? escapeHtml(query.connection) : 'sql'}</span>
        ${query.time !== undefined ? `<span class="query-time">${query.time.toFixed(2)}ms</span>` : ''}
      </div>
      <div class="query-sql">${highlightSql(query.query)}</div>
    </div>
  `).join('')
}

/**
 * Render context section as table
 */
function renderContextTable(context: Record<string, unknown>): string {
  const entries = Object.entries(context)
  if (entries.length === 0) {
    return '<div class="empty-state">// NO DATA</div>'
  }

  return `
    <table class="context-table">
      <tbody>
        ${entries.map(([key, value]) => `
          <tr>
            <th>${escapeHtml(key)}</th>
            <td>${escapeHtml(typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value))}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

/**
 * Render user context section
 */
function renderUserSection(user?: UserContext): string {
  if (!user) return ''

  const hasData = user.id || user.email || user.name || user.roles?.length

  if (!hasData) return ''

  return `
    <div class="section fade-in">
      <div class="section-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        User
      </div>
      <div class="section-content">
        <table class="context-table">
          <tbody>
            ${user.id ? `<tr><th>ID</th><td>${escapeHtml(String(user.id))}</td></tr>` : ''}
            ${user.email ? `<tr><th>Email</th><td>${escapeHtml(user.email)}</td></tr>` : ''}
            ${user.name ? `<tr><th>Name</th><td>${escapeHtml(user.name)}</td></tr>` : ''}
            ${user.roles?.length ? `<tr><th>Roles</th><td>${user.roles.map(r => escapeHtml(r)).join(', ')}</td></tr>` : ''}
          </tbody>
        </table>
      </div>
    </div>
  `
}

/**
 * Render job context section (for queue job errors)
 */
function renderJobSection(job?: JobContext): string {
  if (!job) return ''

  const hasData = job.name || job.queue || job.uuid || job.attempt

  if (!hasData) return ''

  return `
    <div class="section fade-in">
      <div class="section-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
        Queue Job
      </div>
      <div class="section-content">
        <table class="context-table">
          <tbody>
            ${job.name ? `<tr><th>Job</th><td>${escapeHtml(job.name)}</td></tr>` : ''}
            ${job.queue ? `<tr><th>Queue</th><td>${escapeHtml(job.queue)}</td></tr>` : ''}
            ${job.uuid ? `<tr><th>UUID</th><td><code>${escapeHtml(job.uuid)}</code></td></tr>` : ''}
            ${job.attempt !== undefined ? `<tr><th>Attempt</th><td>${job.attempt}${job.maxAttempts ? ` / ${job.maxAttempts}` : ''}</td></tr>` : ''}
            ${job.timeout ? `<tr><th>Timeout</th><td>${job.timeout}s</td></tr>` : ''}
            ${job.payload ? `<tr><th>Payload</th><td><pre style="margin: 0; font-size: 0.875rem; white-space: pre-wrap;">${escapeHtml(JSON.stringify(job.payload, null, 2))}</pre></td></tr>` : ''}
          </tbody>
        </table>
      </div>
    </div>
  `
}

/**
 * Generate the matrix/binary footer effect
 */
function renderMatrixFooter(): string {
  const generateColumn = () => {
    let binary = ''
    for (let i = 0; i < 200; i++) {
      binary += Math.random() > 0.5 ? '1' : '0'
      if (Math.random() > 0.9)
        binary += '\n'
    }
    return binary
  }

  const columns = Array.from({ length: 20 }, () =>
    `<div class="matrix-column" style="animation-delay: ${Math.random() * -20}s">${generateColumn()}</div>`,
  ).join('')

  return `<div class="matrix-footer"><div class="matrix-columns">${columns}</div></div>`
}

/**
 * Generate the full error page HTML
 */
export function renderErrorPage(data: ErrorPageData, config: ErrorPageConfig = {}): string {
  const {
    showFullPaths = false,
    showEnvironment = true,
    showQueries = true,
    showRequest = true,
    appName = 'Application',
    appVersion,
    theme = 'auto',
    customCss = '',
    enableCopyMarkdown = true,
  } = config

  const httpError = data.httpStatus ? HTTP_ERRORS[data.httpStatus as keyof typeof HTTP_ERRORS] : null
  const statusTitle = httpError?.title || 'Error'

  // Build badges
  const badges: string[] = []
  if (data.environment?.framework) {
    badges.push(`<span class="badge badge-gray">${escapeHtml(data.environment.framework)} ${data.environment.frameworkVersion || ''}</span>`)
  }
  if (data.environment?.nodeVersion) {
    badges.push(`<span class="badge badge-gray">Node ${escapeHtml(data.environment.nodeVersion)}</span>`)
  }
  if (data.environment?.bunVersion) {
    badges.push(`<span class="badge badge-gray">Bun ${escapeHtml(data.environment.bunVersion)}</span>`)
  }
  badges.push(`<span class="badge ${data.handled ? 'badge-gray' : 'badge-red'}">${data.handled ? 'HANDLED' : 'UNHANDLED'}</span>`)
  if (data.code !== undefined) {
    badges.push(`<span class="badge badge-violet">CODE ${escapeHtml(String(data.code))}</span>`)
  }

  // Build request bar
  let requestBar = ''
  if (showRequest && data.request?.url) {
    requestBar = `
      <div class="request-bar">
        ${data.httpStatus ? `<span class="http-status">${data.httpStatus}</span>` : ''}
        ${data.request.method ? `<span class="http-method">${escapeHtml(data.request.method)}</span>` : ''}
        <span class="request-url">${escapeHtml(data.request.url)}</span>
      </div>
    `
  }

  // Build routing section
  let routingSection = ''
  if (data.routing && (data.routing.controller || data.routing.routeName || data.routing.middleware?.length)) {
    routingSection = `
      <div class="section fade-in">
        <div class="section-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
          Routing
        </div>
        <div class="section-content">
          <table class="context-table">
            <tbody>
              ${data.routing.controller ? `<tr><th>CONTROLLER</th><td>${escapeHtml(data.routing.controller)}</td></tr>` : ''}
              ${data.routing.routeName ? `<tr><th>ROUTE NAME</th><td>${escapeHtml(data.routing.routeName)}</td></tr>` : ''}
              ${data.routing.middleware?.length ? `<tr><th>MIDDLEWARE</th><td>${data.routing.middleware.map(m => escapeHtml(m)).join(', ')}</td></tr>` : ''}
            </tbody>
          </table>
        </div>
      </div>
    `
  }

  // Build environment section
  let envSection = ''
  if (showEnvironment && data.environment) {
    const envContext: Record<string, unknown> = {}
    if (data.environment.platform)
      envContext.Platform = data.environment.platform
    if (data.environment.nodeVersion)
      envContext['Node Version'] = data.environment.nodeVersion
    if (data.environment.bunVersion)
      envContext['Bun Version'] = data.environment.bunVersion
    if (data.environment.cwd)
      envContext.CWD = data.environment.cwd
    if (data.environment.environment)
      envContext.Environment = data.environment.environment

    if (Object.keys(envContext).length > 0) {
      envSection = `
        <div class="section fade-in">
          <div class="section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4M12 8h.01"/>
            </svg>
            Environment
          </div>
          <div class="section-content">
            ${renderContextTable(envContext)}
          </div>
        </div>
      `
    }
  }

  // Build queries section
  let queriesSection = ''
  if (showQueries && data.queries) {
    queriesSection = `
      <div class="section fade-in">
        <div class="section-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <ellipse cx="12" cy="5" rx="9" ry="3"/>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
          </svg>
          Queries
          <span style="margin-left: auto; font-size: 0.75rem; color: #6b7280;">${data.queries.length} of ${data.queries.length}</span>
        </div>
        <div class="section-content" style="padding: 0;">
          ${renderQueries(data.queries)}
        </div>
      </div>
    `
  }

  // Build request details section
  let requestDetailsSection = ''
  if (showRequest && data.request) {
    const hasHeaders = data.request.headers && Object.keys(data.request.headers).length > 0
    const hasBody = data.request.body !== undefined

    if (hasHeaders || hasBody) {
      requestDetailsSection = `
        <div class="section fade-in">
          <div class="section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 21V9"/>
            </svg>
            Request
          </div>
          <div class="section-content">
            ${hasHeaders ? `
              <h4 style="font-size: 0.75rem; font-weight: 600; color: #6b7280; margin-bottom: 0.5rem; text-transform: uppercase;">Headers</h4>
              ${renderContextTable(data.request.headers!)}
            ` : ''}
            ${hasBody ? `
              <h4 style="font-size: 0.75rem; font-weight: 600; color: #6b7280; margin: 1rem 0 0.5rem; text-transform: uppercase;">Body</h4>
              <pre style="font-family: monospace; font-size: 0.875rem; white-space: pre-wrap;">${escapeHtml(typeof data.request.body === 'object' ? JSON.stringify(data.request.body, null, 2) : String(data.request.body))}</pre>
            ` : `<div class="empty-state">// NO REQUEST BODY</div>`}
          </div>
        </div>
      `
    }
  }

  return `<!DOCTYPE html>
<html lang="en" class="${theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.exceptionClass)} - ${escapeHtml(appName)}</title>
  <style>${ERROR_PAGE_CSS}${customCss}</style>
</head>
<body class="${theme}">
  <header class="error-header">
    <div class="error-header-left">
      <span class="error-header-status">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <circle cx="6" cy="6" r="5"/>
        </svg>
        ${escapeHtml(statusTitle)}
      </span>
      <span class="error-header-type">${escapeHtml(data.exceptionClass)}</span>
    </div>
    <div class="error-header-actions">
      ${enableCopyMarkdown ? `
        <button class="btn" onclick="copyAsMarkdown()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy as Markdown
        </button>
      ` : ''}
    </div>
  </header>

  <main class="error-main">
    <div class="error-page-container">
      <!-- Error Card -->
      <div class="error-card fade-in">
        <div class="error-card-header">
          <h1 class="error-class">${escapeHtml(data.exceptionClass)}</h1>
          ${data.file ? `<div class="error-file">${escapeHtml(data.file)}${data.line ? `:${data.line}` : ''}</div>` : ''}
          <p class="error-message">${escapeHtml(data.message)}</p>
          <div class="badges">${badges.join('')}</div>
        </div>
        ${requestBar}
      </div>

      <!-- Stack Trace -->
      <div class="section fade-in">
        <div class="section-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          Exception trace
        </div>
        <div class="section-content" style="padding: 0;">
          ${renderStackTrace(data.stackFrames)}
        </div>
      </div>

      ${routingSection}
      ${renderUserSection(data.user)}
      ${renderJobSection(data.job)}
      ${envSection}
      ${queriesSection}
      ${requestDetailsSection}

      <!-- Matrix Footer -->
      ${renderMatrixFooter()}
    </div>
  </main>

  <script>
    function toggleFrame(index) {
      const code = document.getElementById('code-' + index);
      const toggle = document.getElementById('toggle-' + index);
      if (code) {
        if (code.style.display === 'none') {
          code.style.display = 'block';
          toggle?.classList.add('expanded');
        } else {
          code.style.display = 'none';
          toggle?.classList.remove('expanded');
        }
      }
    }

    function toggleVendorGroup(index) {
      const frames = document.getElementById('vendor-frames-' + index);
      const toggle = document.getElementById('vendor-toggle-' + index);
      if (frames) {
        if (frames.style.display === 'none') {
          frames.style.display = 'block';
          toggle?.classList.add('expanded');
        } else {
          frames.style.display = 'none';
          toggle?.classList.remove('expanded');
        }
      }
    }

    function copyAsMarkdown() {
      const data = ${JSON.stringify({
        exceptionClass: data.exceptionClass,
        message: data.message,
        file: data.file,
        line: data.line,
        stackFrames: data.stackFrames.slice(0, 10).map(f => ({
          file: f.file,
          line: f.line,
          function: f.function,
        })),
      })};

      let md = '## ' + data.exceptionClass + '\\n\\n';
      md += '**Message:** ' + data.message + '\\n\\n';
      if (data.file) {
        md += '**Location:** \`' + data.file + (data.line ? ':' + data.line : '') + '\`\\n\\n';
      }
      md += '### Stack Trace\\n\\n';
      md += '\`\`\`\\n';
      data.stackFrames.forEach(function(f) {
        md += (f.function || '<anonymous>') + ' at ' + f.file + (f.line ? ':' + f.line : '') + '\\n';
      });
      md += '\`\`\`\\n';

      navigator.clipboard.writeText(md).then(function() {
        alert('Copied to clipboard!');
      });
    }

    // Expand first app frame by default
    document.addEventListener('DOMContentLoaded', function() {
      const firstAppFrame = document.querySelector('.stack-frame.app');
      if (firstAppFrame) {
        const index = firstAppFrame.dataset.index;
        toggleFrame(index);
      }
    });
  </script>
</body>
</html>`
}

/**
 * Create a simple error response for production
 */
export function renderProductionErrorPage(status: number, customMessage?: string): string {
  const error = HTTP_ERRORS[status as keyof typeof HTTP_ERRORS] || {
    title: 'Error',
    message: 'An unexpected error occurred.',
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${status} - ${escapeHtml(error.title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
      color: #e5e7eb;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .container {
      text-align: center;
      max-width: 32rem;
    }
    .status {
      font-size: 6rem;
      font-weight: 800;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
      margin-bottom: 1rem;
    }
    .title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .message {
      color: #9ca3af;
      line-height: 1.6;
    }
    .back {
      margin-top: 2rem;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: #6b7280;
      text-decoration: none;
      transition: color 0.2s;
    }
    .back:hover { color: #ef4444; }
  </style>
</head>
<body>
  <div class="container">
    <div class="status">${status}</div>
    <h1 class="title">${escapeHtml(error.title)}</h1>
    <p class="message">${escapeHtml(customMessage || error.message)}</p>
    <a href="javascript:history.back()" class="back">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      Go Back
    </a>
  </div>
</body>
</html>`
}
