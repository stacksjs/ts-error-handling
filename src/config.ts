import type { ErrorHandlingConfig } from './types'
import { loadConfig } from 'bunfig'

export const defaultConfig: ErrorHandlingConfig = {
  verbose: true,
}

// Lazy-loaded config to avoid top-level await (enables bun --compile)
let _config: ErrorHandlingConfig | null = null

export async function getConfig(): Promise<ErrorHandlingConfig> {
  if (!_config) {
    _config = await loadConfig({
  name: 'error-handling',
  defaultConfig,
})
  }
  return _config
}

// For backwards compatibility - synchronous access with default fallback
export const config: ErrorHandlingConfig = defaultConfig
