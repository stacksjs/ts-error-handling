import type { PickierConfig } from 'pickier'

const config: PickierConfig = {
  verbose: false,

  ignores: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.git/**',
    'fixtures/**',
    'CHANGELOG.md',
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
    noConsole: 'off',
  },

  pluginRules: {
    'ts/no-top-level-await': 'off',
    'style/brace-style': 'off',
    'style/max-statements-per-line': 'off',
    'quotes': 'off',
    'style/quotes': 'off',
    'pickier/quotes': 'off',
    'markdown/no-inline-html': 'off',
    'markdown/code-block-style': 'off',
    'markdown/blanks-around-fences': 'off',
    'markdown/blanks-around-lists': 'off',
    'markdown/no-emphasis-as-heading': 'off',
    'markdown/no-duplicate-heading': 'off',
    'markdown/no-trailing-punctuation': 'off',
    'markdown/link-image-style': 'off',
    'markdown/link-image-reference-definitions': 'off',
    'markdown/reference-links-images': 'off',
    'markdown/single-title': 'off',
    'markdown/heading-increment': 'off',
    'markdown/descriptive-link-text': 'off',
    'no-super-linear-backtracking': 'off',
  },
}

export default config
