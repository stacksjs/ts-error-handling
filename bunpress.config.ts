import type { BunpressConfig } from 'bunpress'

const config: BunpressConfig = {
  name: 'ts-error-handling',
  description: 'Type-safe error handling inspired by Rust Result type',
  url: 'https://ts-error-handling.stacksjs.org',
  theme: 'docs',

  nav: [
    { text: 'Guide', link: '/guide/getting-started' },
    { text: 'API', link: '/guide/result' },
    { text: 'GitHub', link: 'https://github.com/stacksjs/ts-error-handling' },
  ],

  sidebar: [
    {
      text: 'Introduction',
      items: [
        { text: 'Overview', link: '/' },
        { text: 'Getting Started', link: '/guide/getting-started' },
      ],
    },
    {
      text: 'Core Types',
      items: [
        { text: 'Result Type', link: '/guide/result' },
        { text: 'Option Type', link: '/guide/option' },
        { text: 'Async Handling', link: '/guide/async' },
      ],
    },
    {
      text: 'Features',
      items: [
        { text: 'Pattern Matching', link: '/features/pattern-matching' },
        { text: 'Error Chaining', link: '/features/chaining' },
        { text: 'Type Inference', link: '/features/type-inference' },
        { text: 'Framework Integration', link: '/features/integration' },
      ],
    },
    {
      text: 'Advanced',
      items: [
        { text: 'Custom Error Types', link: '/advanced/custom-errors' },
        { text: 'Error Recovery', link: '/advanced/recovery' },
        { text: 'Combining Results', link: '/advanced/combining' },
        { text: 'Performance Tips', link: '/advanced/performance' },
      ],
    },
  ],

  socialLinks: [
    { icon: 'github', link: 'https://github.com/stacksjs/ts-error-handling' },
  ],
}

export default config
