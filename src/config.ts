import type { ErrorHandlingConfig } from './types'
import { loadConfig } from 'bunfig'

export const defaultConfig: ErrorHandlingConfig = {
  verbose: true,
}

// eslint-disable-next-line antfu/no-top-level-await
export const config: ErrorHandlingConfig = await loadConfig({
  name: 'error-handling',
  defaultConfig,
})
