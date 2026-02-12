import type { PickierConfig } from 'pickier'

const config: PickierConfig = {
  verbose: false,

  ignores: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.git/**',
    'fixtures/**',
  ],

  lint: {
    extensions: ['ts', 'js', 'json', 'md', 'yaml', 'yml'],
  },

  format: {
    extensions: ['ts', 'js', 'json', 'md', 'yaml', 'yml'],
    indent: 2,
    quotes: 'single',
    semi: false,
    trimTrailingWhitespace: true,
    maxConsecutiveBlankLines: 1,
    finalNewline: 'one',
  },

  rules: {
    noDebugger: 'error',
    noConsole: 'warn',
  },

  pluginRules: {},
}

export default config
