# Error Recovery

Implement robust error recovery strategies for resilient applications.

## Overview

Error recovery allows your application to gracefully handle failures and potentially continue operation through fallbacks, retries, and circuit breakers.

## Basic Recovery with unwrapOr

```typescript
import { Result, Ok, Err } from 'ts-error-handling'

// Provide a default value on error
const config = loadConfig()
  .unwrapOr(defaultConfig)

// Provide a computed default
const user = fetchUser(id)
  .unwrapOrElse(() => createGuestUser())
```

## Recovery with orElse

Chain alternative operations:

```typescript
// Try primary, fall back to secondary
const data = fetchFromPrimary()
  .orElse(() => fetchFromCache())
  .orElse(() => fetchFromBackup())

// With error transformation
const result = apiCall()
  .orElse((apiError) => {
    if (apiError.code === 'RATE_LIMITED') {
      return fetchFromCache()
    }
    return Err(apiError)
  })
```

## Retry Strategies

Implement retry logic for transient failures:

```typescript
import { ResultAsync } from 'ts-error-handling'

async function withRetry<T, E>(
  operation: () => Promise<Result<T, E>>,
  options: {
    maxAttempts: number
    delayMs: number
    backoff?: 'linear' | 'exponential'
    shouldRetry?: (error: E, attempt: number) => boolean
  }
): Promise<Result<T, E>> {
  let lastError: E
  let delay = options.delayMs

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    const result = await operation()

    if (result.isOk()) {
      return result
    }

    lastError = result.error

    if (options.shouldRetry && !options.shouldRetry(lastError, attempt)) {
      break
    }

    if (attempt < options.maxAttempts) {
      await sleep(delay)

      if (options.backoff === 'exponential') {
        delay *= 2
      } else if (options.backoff === 'linear') {
        delay += options.delayMs
      }
    }
  }

  return Err(lastError!)
}

// Usage
const result = await withRetry(
  () => callExternalApi(),
  {
    maxAttempts: 3,
    delayMs: 1000,
    backoff: 'exponential',
    shouldRetry: (error) => error.code === 'TIMEOUT',
  }
)
```

## Circuit Breaker Pattern

Prevent cascading failures:

```typescript
class CircuitBreaker<T, E> {
  private failures = 0
  private lastFailure: number = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private operation: () => Promise<Result<T, E>>,
    private options: {
      failureThreshold: number
      resetTimeout: number
    }
  ) {}

  async execute(): Promise<Result<T, CircuitBreakerError | E>> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > this.options.resetTimeout) {
        this.state = 'half-open'
      } else {
        return Err(new CircuitBreakerError('Circuit is open'))
      }
    }

    const result = await this.operation()

    if (result.isErr()) {
      this.failures++
      this.lastFailure = Date.now()

      if (this.failures >= this.options.failureThreshold) {
        this.state = 'open'
      }

      return result
    }

    // Success - reset circuit
    this.failures = 0
    this.state = 'closed'
    return result
  }
}

// Usage
const breaker = new CircuitBreaker(callExternalService, {
  failureThreshold: 5,
  resetTimeout: 30000,
})

const result = await breaker.execute()
```

## Fallback Chains

Create sophisticated fallback chains:

```typescript
class FallbackChain<T, E> {
  private strategies: Array<() => Promise<Result<T, E>>> = []

  add(strategy: () => Promise<Result<T, E>>): this {
    this.strategies.push(strategy)
    return this
  }

  async execute(): Promise<Result<T, E[]>> {
    const errors: E[] = []

    for (const strategy of this.strategies) {
      const result = await strategy()

      if (result.isOk()) {
        return Ok(result.value)
      }

      errors.push(result.error)
    }

    return Err(errors)
  }
}

// Usage
const chain = new FallbackChain<Data, Error>()
  .add(() => fetchFromApi())
  .add(() => fetchFromCache())
  .add(() => fetchFromLocalStorage())
  .add(() => Promise.resolve(Ok(defaultData)))

const result = await chain.execute()
```

## Graceful Degradation

Provide degraded functionality on errors:

```typescript
interface Feature {
  enabled: boolean
  data?: any
}

async function loadFeatures(): Promise<Record<string, Feature>> {
  const features: Record<string, Feature> = {}

  // Each feature loads independently
  features.recommendations = await loadRecommendations()
    .map((data) => ({ enabled: true, data }))
    .unwrapOr({ enabled: false })

  features.analytics = await loadAnalytics()
    .map((data) => ({ enabled: true, data }))
    .unwrapOr({ enabled: false })

  return features
}
```
