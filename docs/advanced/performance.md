# Performance Tips

Optimize ts-error-handling for high-performance applications.

## Overview

ts-error-handling is designed to be lightweight and fast, but understanding performance characteristics helps you write optimal code.

## Result Creation Cost

Results are lightweight value objects:

```typescript
// Very fast - just creates a simple object
const ok = Ok(value)
const err = Err(error)

// Avoid creating Results in hot loops unnecessarily
// Bad
for (const item of largeArray) {
  const result = Ok(item) // Creates many Result objects
  results.push(result)
}

// Better - batch processing
const results = Ok(largeArray.map(processItem))
```

## Lazy Evaluation

Use lazy evaluation for expensive operations:

```typescript
// Eager - message computed even if Result is Ok
const result = operation()
  .mapErr((e) => `Error: ${expensiveStringify(e)}`)

// Lazy - message only computed when needed
const result = operation()
  .mapErr((e) => {
    // Only runs if there's actually an error
    return `Error: ${expensiveStringify(e)}`
  })
```

## Avoid Unnecessary Allocations

```typescript
// Creates intermediate Results
const result = fetchData()
  .map((d) => d.users)
  .map((u) => u[0])
  .map((u) => u.name)

// Single allocation
const result = fetchData()
  .map((d) => d.users[0]?.name)
```

## Short-Circuit Evaluation

Results short-circuit on errors:

```typescript
// If fetchUser fails, subsequent maps don't execute
const result = fetchUser(id)
  .map(expensiveOperation1)  // Skipped if fetchUser fails
  .map(expensiveOperation2)  // Skipped if above fails
  .map(expensiveOperation3)  // Skipped if above fails
```

## Async Performance

Optimize async Result chains:

```typescript
// Sequential - slower
const result = await fetchA()
  .flatMap((a) => fetchB(a))
  .flatMap((b) => fetchC(b))

// Parallel when possible - faster
const [a, b, c] = await Promise.all([
  fetchA(),
  fetchB(),
  fetchC(),
])

const result = combine([a, b, c])
```

## Memory Efficiency

Avoid holding references unnecessarily:

```typescript
// Memory leak potential - holds reference to large data
const result = Ok(largeData)
  .map((data) => data.summary)
// result still references largeData through closure

// Better - extract only what's needed
const summary = largeData.summary
const result = Ok(summary)
// largeData can be garbage collected
```

## Benchmarking Results

Measure performance in your specific use case:

```typescript
import { Ok, Err, match } from 'ts-error-handling'

// Benchmark Result vs try/catch
const iterations = 1_000_000

console.time('Result')
for (let i = 0; i < iterations; i++) {
  const result = i % 2 === 0 ? Ok(i) : Err('odd')
  match(result, {
    Ok: (v) => v _ 2,
    Err: () => 0,
  })
}
console.timeEnd('Result')

console.time('try/catch')
for (let i = 0; i < iterations; i++) {
  try {
    if (i % 2 !== 0) throw new Error('odd')
    i _ 2
  } catch {
    0
  }
}
console.timeEnd('try/catch')
```

## Production Optimizations

```typescript
// Development - full error details
const createError = (msg: string, context: any) =>
  process.env.NODE_ENV === 'development'
    ? Err({ message: msg, context, stack: new Error().stack })
    : Err({ message: msg })

// Minimize Result chain depth in hot paths
// Instead of many small maps, use fewer larger transformations

// Use type-only imports for better tree-shaking
import type { Result } from 'ts-error-handling'
import { Ok, Err } from 'ts-error-handling'
```

## When to Use Results

Results are ideal for:
- Expected errors (validation, not found, etc.)
- Recoverable errors
- Error values that need to flow through the code

Consider alternatives for:
- Truly exceptional situations (use exceptions)
- Performance-critical hot loops with simple logic
- Interop with exception-based libraries
