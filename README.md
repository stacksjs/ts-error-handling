<p align="center"><img src=".github/art/cover.jpg" alt="Social Card of this repo"></p>

[![npm version][npm-version-src]][npm-version-href]
[![GitHub Actions][github-actions-src]][github-actions-href]
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
<!-- [![npm downloads][npm-downloads-src]][npm-downloads-href] -->
<!-- [![Codecov][codecov-src]][codecov-href] -->

# TypeScript Error Handling

A fully typed error handling library for TypeScript, inspired by Rust's `Result` type and [neverthrow](https://github.com/supermacro/neverthrow). This library provides a type-safe way to handle errors without throwing exceptions, enabling railway-oriented programming patterns.

## Features

- **Fully Typed**: Leverage TypeScript's type system for complete type safety
- **Narrow Type Guards**: Automatic type narrowing with `isOk` and `isErr`
- **Zero Dependencies**: Lightweight and self-contained
- **Rust-Inspired API**: Familiar patterns from Rust's Result type
- **Railway-Oriented Programming**: Chain operations safely with `map`, `andThen`, and more
- **Async Support**: First-class support for async operations
- **Comprehensive Utilities**: Combine, traverse, sequence, and more

## Installation

```bash
# bun
bun add ts-error-handling

# npm
npm install ts-error-handling

# pnpm
pnpm add ts-error-handling
```

## Quick Start

```typescript
import type { Result } from 'ts-error-handling'
import { err, ok } from 'ts-error-handling'

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return err('Division by zero')
  }
  return ok(a / b)
}

const result = divide(10, 2)

if (result.isOk) {
  console.log(result.value) // 5
}
else {
  console.log(result.error) // Type-safe error handling
}
```

## Core API

### Creating Results

```typescript
import { err, ok } from 'ts-error-handling'

const success = ok(42) // Result<number, never>
const failure = err('error') // Result<never, string>
```

### Type Narrowing

```typescript
const result: Result<number, string> = ok(42)

if (result.isOk) {
  // TypeScript knows result is Ok<number, string>
  console.log(result.value) // number
}
else {
  // TypeScript knows result is Err<number, string>
  console.log(result.error) // string
}
```

### Transforming Results

```typescript
// map: Transform the Ok value
ok(21).map(x => x * 2) // Ok(42)
err('failed').map(x => x * 2) // Err('failed')

// mapErr: Transform the Err value
ok(42).mapErr(e => e.toUpperCase()) // Ok(42)
err('failed').mapErr(e => e.toUpperCase()) // Err('FAILED')

// andThen: Chain Result-returning operations
ok(21)
  .andThen(x => ok(x * 2))
  .andThen(x => x > 40 ? ok(x) : err('too small')) // Ok(42)

// orElse: Recover from errors
err('failed')
  .orElse(e => ok(0)) // Ok(0)
```

### Pattern Matching

```typescript
const message = result.match({
  ok: value => `Success: ${value}`,
  err: error => `Error: ${error}`
})
```

### Unwrapping Values

```typescript
ok(42).unwrap() // 42
err('failed').unwrap() // throws Error

ok(42).unwrapOr(0) // 42
err('failed').unwrapOr(0) // 0

ok(42).unwrapOrElse(e => 0) // 42
err('failed').unwrapOrElse(e => 0) // 0

ok(42).expect('should work') // 42
err('failed').expect('should work') // throws with custom message
```

## Utility Functions

### Exception Handling

```typescript
import { fromPromise, tryCatch, tryCatchAsync } from 'ts-error-handling'

// Synchronous exception handling
const result = tryCatch(
  () => JSON.parse(jsonString),
  error => `Parse error: ${error}`
)

// Async exception handling
const asyncResult = await tryCatchAsync(
  async () => await fetch('/api/data'),
  error => new ApiError(error)
)

// Convert Promise to Result
const promiseResult = await fromPromise(
  fetch('/api/users/1'),
  error => `Failed to fetch: ${error}`
)
```

### Combining Results

```typescript
import { all, combine, combineWithAllErrors } from 'ts-error-handling'

// Combine - stops at first error
const result1 = combine([
  validateEmail(email),
  validatePassword(password),
  validateAge(age)
]) // Result<[string, string, number], string>

// Combine with all errors collected
const result2 = combineWithAllErrors([
  validateEmail(email),
  validatePassword(password),
  validateAge(age)
]) // Result<[string, string, number], string[]>

// Alternative syntax using all()
const result3 = all([ok(1), ok(2), ok(3)]) // Result<number[], string>
```

### Array Operations

```typescript
import { partition, traverse, traverseAsync } from 'ts-error-handling'

// Transform array with Result-returning function
const numbers = traverse(['1', '2', '3'], (s) => {
  const n = Number.parseInt(s)
  return Number.isNaN(n) ? err('Invalid') : ok(n)
}) // Result<number[], string>

// Async version
const users = await traverseAsync([1, 2, 3], async (id) => {
  return fetchUser(id)
}) // Promise<Result<User[], ApiError>>

// Partition into successes and failures
const results = [ok(1), err('error'), ok(2)]
const [successes, failures] = partition(results)
// successes: [1, 2], failures: ['error']
```

### Working with Nullable Values

```typescript
import { fromNullable } from 'ts-error-handling'

interface Config {
  apiKey?: string
}

function getApiKey(config: Config): Result<string, string> {
  return fromNullable(config.apiKey, 'API key is required')
}
```

### Advanced Utilities

```typescript
import {
  any,
  filter,
  flatten,
  getOrElse,
  swap,
  tap,
  toPromise,
  unwrapOrThrow
} from 'ts-error-handling'

// Flatten nested Results
const nested: Result<Result<number, string>, string> = ok(ok(42))
const flat = flatten(nested) // Result<number, string>

// Side effects without modifying Result
const logged = tap(
  result,
  value => console.log('Success:', value),
  error => console.error('Error:', error)
)

// Swap Ok and Err
const swapped = swap(ok(42)) // Err(42)
const swapped2 = swap(err('failed')) // Ok('failed')

// Filter based on predicate
const filtered = filter(
  ok(42),
  n => n > 0,
  'must be positive'
) // Ok(42) if > 0, else Err('must be positive')

// Convert to exception at boundaries
const value = unwrapOrThrow(result, e => new Error(e))

// Convert to Promise
const promise = toPromise(result) // Promise<T>

// Get value or compute default
const value2 = getOrElse(result, e => defaultValue)

// Return first Ok, or last Err
const first = any([err('e1'), ok(42), err('e2')]) // Ok(42)
```

### Async Operations

```typescript
import { parallel, sequence } from 'ts-error-handling'

// Execute operations sequentially (stops at first error)
const sequential = await sequence([
  async () => fetchUser(1),
  async () => fetchUser(2),
  async () => fetchUser(3)
]) // Result<User[], ApiError>

// Execute operations in parallel
const parallelResult = await parallel([
  async () => fetchUser(1),
  async () => fetchUser(2),
  async () => fetchUser(3)
]) // Result<User[], ApiError>
```

## Why Use Result Types?

1. **Explicit Error Handling**: Errors are part of the function signature
2. **No Hidden Control Flow**: No try/catch blocks, exceptions are values
3. **Type Safety**: The compiler enforces error handling
4. **Composability**: Chain operations without nested error handling
5. **Self-Documenting**: Function signatures show what can fail and how

## Examples

See the [examples.ts](examples.ts) file for comprehensive examples including:

- Async operations
- Form validation with error collection
- Railway-oriented programming
- API client implementation
- Array operations with `traverse`
- Sequential and parallel execution

## Complete API Reference

### Core Functions

| Function | Description |
|----------|-------------|
| `ok<T, E>(value: T)` | Creates a successful Result |
| `err<T, E>(error: E)` | Creates a failed Result |
| `isResult<T, E>(value: unknown)` | Type guard to check if value is a Result |

### Result Methods

| Method | Description |
|--------|-------------|
| `.map<U>(fn: (value: T) => U)` | Transform the Ok value |
| `.mapErr<F>(fn: (error: E) => F)` | Transform the Err value |
| `.andThen<U>(fn: (value: T) => Result<U, E>)` | Chain Result-returning operations |
| `.orElse<F>(fn: (error: E) => Result<T, F>)` | Recover from errors |
| `.match<U>(patterns: {...})` | Pattern matching on Ok/Err |
| `.unwrap()` | Get value or throw |
| `.unwrapOr(defaultValue: T)` | Get value or return default |
| `.unwrapOrElse(fn: (error: E) => T)` | Get value or compute default |
| `.expect(msg: string)` | Get value or throw with custom message |

### Exception Handling

| Function | Description |
|----------|-------------|
| `tryCatch<T, E>(fn, errorHandler?)` | Wrap function that might throw |
| `tryCatchAsync<T, E>(fn, errorHandler?)` | Wrap async function that might throw |
| `fromPromise<T, E>(promise, errorHandler?)` | Convert Promise to Result |

### Combining Results

| Function | Description |
|----------|-------------|
| `combine<T[]>(results)` | Combine Results, stop at first error |
| `combineWithAllErrors<T[]>(results)` | Combine Results, collect all errors |
| `all<T, E>(results)` | Collect all Ok values or return first Err |
| `any<T, E>(results)` | Return first Ok or last Err |

### Array Operations

| Function | Description |
|----------|-------------|
| `traverse<T, U, E>(items, fn)` | Map over array with Result-returning function |
| `traverseAsync<T, U, E>(items, fn)` | Async version of traverse |
| `partition<T, E>(results)` | Split Results into [successes, failures] |

### Async Operations

| Function | Description |
|----------|-------------|
| `sequence<T, E>(operations)` | Execute async operations sequentially |
| `parallel<T, E>(operations)` | Execute async operations in parallel |

### Transformations

| Function | Description |
|----------|-------------|
| `flatten<T, E>(result)` | Flatten nested Result<Result<T, E>, E> |
| `swap<T, E>(result)` | Swap Ok and Err values |
| `filter<T, E>(result, predicate, error)` | Filter Result based on predicate |

### Utilities

| Function | Description |
|----------|-------------|
| `fromNullable<T, E>(value, error)` | Convert nullable to Result |
| `tap<T, E>(result, onOk?, onErr?)` | Side effects without modifying Result |
| `unwrapOrThrow<T, E>(result, mapError?)` | Convert to exception at boundaries |
| `toPromise<T, E>(result, mapError?)` | Convert Result to Promise |
| `getOrElse<T, E>(result, fn)` | Get value or compute default |

### Type Utilities

| Type | Description |
|------|-------------|
| `Result<T, E>` | Union of Ok<T, E> and Err<T, E> |
| `ResultAsync<T, E>` | Promise<Result<T, E>> |
| `InferOkType<T>` | Extract Ok type from Result |
| `InferErrType<T>` | Extract Err type from Result |

## Testing

```bash
bun test
```

## Changelog

Please see our [releases](https://github.com/stackjs/bun-ts-starter/releases) page for more information on what has changed recently.

## Contributing

Please see [CONTRIBUTING](.github/CONTRIBUTING.md) for details.

## Community

For help, discussion about best practices, or any other conversation that would benefit from being searchable:

[Discussions on GitHub](https://github.com/stacksjs/ts-starter/discussions)

For casual chit-chat with others using this package:

[Join the Stacks Discord Server](https://discord.gg/stacksjs)

## Postcardware

“Software that is free, but hopes for a postcard.” We love receiving postcards from around the world showing where Stacks is being used! We showcase them on our website too.

Our address: Stacks.js, 12665 Village Ln #2306, Playa Vista, CA 90094, United States 🌎

## Sponsors

We would like to extend our thanks to the following sponsors for funding Stacks development. If you are interested in becoming a sponsor, please reach out to us.

- [JetBrains](https://www.jetbrains.com/)
- [The Solana Foundation](https://solana.com/)

## License

The MIT License (MIT). Please see [LICENSE](LICENSE.md) for more information.

Made with 💙

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/bun-ts-starter?style=flat-square
[npm-version-href]: https://npmjs.com/package/bun-ts-starter
[github-actions-src]: https://img.shields.io/github/actions/workflow/status/stacksjs/ts-starter/ci.yml?style=flat-square&branch=main
[github-actions-href]: https://github.com/stacksjs/ts-starter/actions?query=workflow%3Aci

<!-- [codecov-src]: https://img.shields.io/codecov/c/gh/stacksjs/ts-starter/main?style=flat-square
[codecov-href]: https://codecov.io/gh/stacksjs/ts-starter -->
