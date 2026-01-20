/**
 * CSS styles for the error page
 * Based on Laravel Ignition's design with Tailwind-like utilities
 */

export const ERROR_PAGE_CSS = `
/* Base reset and typography */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: max(13px, min(1.3vw, 16px));
  overflow-x: hidden;
  overflow-y: scroll;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, Cantarell, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  background-color: #e5e7eb;
  color: #1f2937;
  min-height: 100vh;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  body.auto, body.dark {
    background-color: #111827;
    color: #e5e7eb;
  }
}

body.dark {
  background-color: #111827;
  color: #e5e7eb;
}

/* Container */
.error-page-container {
  max-width: 90rem;
  margin: 0 auto;
  padding: 1.5rem;
}

@media (min-width: 1024px) {
  .error-page-container {
    padding: 2.5rem;
  }
}

/* Header bar */
.error-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  height: 2.5rem;
  background-color: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
}

body.dark .error-header {
  background-color: #1f2937;
  border-color: rgba(107, 114, 128, 0.2);
}

.error-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.error-header-status {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  background-color: #ef4444;
}

.error-header-type {
  font-weight: 500;
  color: #1f2937;
}

body.dark .error-header-type {
  color: #e5e7eb;
}

.error-header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
  background-color: transparent;
  color: #6b7280;
}

.btn:hover {
  color: #4f46e5;
  background-color: rgba(79, 70, 229, 0.1);
}

body.dark .btn {
  color: #9ca3af;
}

body.dark .btn:hover {
  color: #818cf8;
  background-color: rgba(129, 140, 248, 0.1);
}

/* Main content */
.error-main {
  margin-top: 5rem;
  margin-bottom: 2.5rem;
}

/* Error card */
.error-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 2.5rem;
}

body.dark .error-card {
  background-color: #1f2937;
}

.error-card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

body.dark .error-card-header {
  border-color: rgba(107, 114, 128, 0.2);
}

.error-class {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  word-break: break-word;
  margin-bottom: 0.5rem;
}

body.dark .error-class {
  color: #e5e7eb;
}

.error-file {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 1rem;
}

body.dark .error-file {
  color: #9ca3af;
}

.error-message {
  font-size: 1rem;
  color: #374151;
  line-height: 1.625;
}

body.dark .error-message {
  color: #d1d5db;
}

/* Badges */
.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid;
}

.badge-gray {
  background-color: #f3f4f6;
  border-color: #e5e7eb;
  color: #6b7280;
}

body.dark .badge-gray {
  background-color: rgba(107, 114, 128, 0.1);
  border-color: rgba(107, 114, 128, 0.3);
  color: #9ca3af;
}

.badge-red {
  background-color: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.5);
  color: #dc2626;
}

body.dark .badge-red {
  background-color: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.badge-violet {
  background-color: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.5);
  color: #7c3aed;
}

body.dark .badge-violet {
  background-color: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
}

/* Request info bar */
.request-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

body.dark .request-bar {
  background-color: rgba(0, 0, 0, 0.1);
  border-color: rgba(107, 114, 128, 0.2);
}

.http-status {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  background-color: #ef4444;
}

.http-method {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: #e5e7eb;
  color: #374151;
}

body.dark .http-method {
  background-color: rgba(107, 114, 128, 0.3);
  color: #d1d5db;
}

.request-url {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.875rem;
  color: #374151;
  word-break: break-all;
}

body.dark .request-url {
  color: #d1d5db;
}

/* Section */
.section {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  overflow: hidden;
}

body.dark .section {
  background-color: #1f2937;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
  color: #374151;
}

body.dark .section-header {
  border-color: rgba(107, 114, 128, 0.2);
  color: #d1d5db;
}

.section-header svg {
  width: 1rem;
  height: 1rem;
  color: #6b7280;
}

body.dark .section-header svg {
  color: #9ca3af;
}

.section-content {
  padding: 1rem 1.5rem;
}

/* Stack trace */
.stack-frame {
  border-bottom: 1px solid #e5e7eb;
}

body.dark .stack-frame {
  border-color: rgba(107, 114, 128, 0.2);
}

.stack-frame:last-child {
  border-bottom: none;
}

.stack-frame-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: background-color 0.15s;
}

.stack-frame-header:hover {
  background-color: rgba(107, 114, 128, 0.05);
}

body.dark .stack-frame-header:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.stack-frame.app .stack-frame-header {
  background-color: rgba(239, 68, 68, 0.05);
}

body.dark .stack-frame.app .stack-frame-header {
  background-color: rgba(239, 68, 68, 0.1);
}

.stack-frame-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  margin-top: 0.375rem;
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.stack-frame.app .stack-frame-dot {
  background-color: #ef4444;
}

.stack-frame.vendor .stack-frame-dot {
  background-color: #9ca3af;
}

.stack-frame-info {
  flex: 1;
  min-width: 0;
}

.stack-frame-function {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.875rem;
  color: #1f2937;
  word-break: break-word;
}

body.dark .stack-frame-function {
  color: #e5e7eb;
}

.stack-frame-location {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

body.dark .stack-frame-location {
  color: #9ca3af;
}

.stack-frame-toggle {
  color: #9ca3af;
  padding: 0.25rem;
  cursor: pointer;
  transition: transform 0.15s;
}

.stack-frame-toggle.expanded {
  transform: rotate(180deg);
}

/* Vendor frames group */
.vendor-group {
  padding: 0.75rem 1.5rem;
  color: #6b7280;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

body.dark .vendor-group {
  color: #9ca3af;
  border-color: rgba(107, 114, 128, 0.2);
}

.vendor-group:hover {
  background-color: rgba(107, 114, 128, 0.05);
}

body.dark .vendor-group:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.vendor-group-icon {
  width: 1rem;
  height: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e5e7eb;
  border-radius: 0.25rem;
  font-size: 0.625rem;
}

body.dark .vendor-group-icon {
  background-color: rgba(107, 114, 128, 0.3);
}

/* Code snippet */
.code-snippet {
  background-color: #1f2937;
  border-radius: 0.375rem;
  margin: 0 1.5rem 1rem;
  overflow: hidden;
}

.code-line {
  display: flex;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8125rem;
  line-height: 1.5;
}

.code-line-number {
  width: 4rem;
  text-align: right;
  padding: 0 0.75rem;
  color: #6b7280;
  background-color: rgba(0, 0, 0, 0.2);
  user-select: none;
  flex-shrink: 0;
}

.code-line-content {
  flex: 1;
  padding: 0 1rem;
  overflow-x: auto;
  white-space: pre;
  color: #e5e7eb;
}

.code-line.highlighted {
  background-color: rgba(239, 68, 68, 0.3);
}

.code-line.highlighted .code-line-number {
  background-color: rgba(239, 68, 68, 0.5);
  color: white;
}

/* Context tables */
.context-table {
  width: 100%;
  border-collapse: collapse;
}

.context-table th,
.context-table td {
  padding: 0.5rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
}

body.dark .context-table th,
body.dark .context-table td {
  border-color: rgba(107, 114, 128, 0.2);
}

.context-table th {
  font-weight: 500;
  color: #6b7280;
  width: 30%;
  vertical-align: top;
}

body.dark .context-table th {
  color: #9ca3af;
}

.context-table td {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #374151;
  word-break: break-word;
}

body.dark .context-table td {
  color: #d1d5db;
}

/* Queries */
.query-item {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

body.dark .query-item {
  border-color: rgba(107, 114, 128, 0.2);
}

.query-item:last-child {
  border-bottom: none;
}

.query-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.query-driver {
  font-size: 0.75rem;
  color: #6b7280;
}

body.dark .query-driver {
  color: #9ca3af;
}

.query-time {
  font-size: 0.75rem;
  color: #9ca3af;
}

.query-sql {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8125rem;
  color: #374151;
  line-height: 1.5;
  word-break: break-word;
}

body.dark .query-sql {
  color: #d1d5db;
}

/* SQL syntax highlighting */
.query-sql .keyword {
  color: #dc2626;
}

body.dark .query-sql .keyword {
  color: #f87171;
}

.query-sql .string {
  color: #2563eb;
}

body.dark .query-sql .string {
  color: #60a5fa;
}

.query-sql .number {
  color: #059669;
}

body.dark .query-sql .number {
  color: #34d399;
}

/* Empty state */
.empty-state {
  padding: 2rem;
  text-align: center;
  color: #9ca3af;
  font-size: 0.875rem;
  font-style: italic;
}

/* Binary/Matrix footer effect */
.matrix-footer {
  position: relative;
  overflow: hidden;
  height: 12rem;
  margin-top: 2rem;
  background: linear-gradient(to bottom, transparent, #111827);
}

.matrix-footer::before {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(239, 68, 68, 0.03) 2px,
    rgba(239, 68, 68, 0.03) 4px
  );
}

.matrix-columns {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: space-between;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.625rem;
  line-height: 1.2;
  color: rgba(239, 68, 68, 0.2);
  overflow: hidden;
  opacity: 0.5;
}

.matrix-column {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  white-space: pre;
  animation: matrix-scroll 20s linear infinite;
}

@keyframes matrix-scroll {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}

/* Responsive */
@media (max-width: 640px) {
  .error-header {
    padding: 0 1rem;
  }

  .section-content,
  .stack-frame-header {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .code-snippet {
    margin-left: 1rem;
    margin-right: 1rem;
    border-radius: 0;
  }
}

/* Animation */
.fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Print styles */
@media print {
  .error-header,
  .matrix-footer,
  .btn {
    display: none !important;
  }

  body {
    background: white !important;
    color: black !important;
  }

  .error-card,
  .section {
    box-shadow: none !important;
    border: 1px solid #e5e7eb !important;
  }
}
`

export default ERROR_PAGE_CSS
