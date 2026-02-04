# Async Error Handling

ts-error-handling provides first-class support for asynchronous operations. This guide covers handling async errors with Result types.

## Core Async Functions

### tryCatchAsync()

Wraps async functions that might throw:

```typescript
import { tryCatchAsync } from 'ts-error-handling'
import type { Result } from 'ts-error-handling'

async function fetchUser(id: number): Promise<Result<User, string>> {
  return tryCatchAsync(
    async () => {
      const response = await fetch(`/api/users/${id}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      return response.json()
    },
    error => `Failed to fetch user: ${error}`
  )
}

// Usage
const result = await fetchUser(1)
if (result.isOk) {
  console.log('User:', result.value)
} else {
  console.error('Error:', result.error)
}
```

### fromPromise()

Converts a Promise to a Result:

```typescript
import { fromPromise } from 'ts-error-handling'

// Basic usage
const result = await fromPromise(
  fetch('/api/data'),
  error => `Request failed: ${error}`
)

// With typed errors
interface ApiError {
  code: number
  message: string
}

const typedResult = await fromPromise(
  fetch('/api/data'),
  (error): ApiError => ({
    code: error.status || 500,
    message: error.message
  })
)
```

## ResultAsync Type

The `ResultAsync<T, E>` type alias represents a Promise that resolves to a Result:

```typescript
type ResultAsync<T, E> = Promise<Result<T, E>>
```

### Creating ResultAsync

```typescript
import { ok, err } from 'ts-error-handling'
import type { ResultAsync } from 'ts-error-handling'

// Async function returning ResultAsync
async function validateAsync(
  data: unknown
): ResultAsync<ValidData, ValidationError> {
  // Simulate async validation
  await new Promise(resolve => setTimeout(resolve, 100))

  if (isValid(data)) {
    return ok(data as ValidData)
  }
  return err({ field: 'data', message: 'Invalid data' })
}
```

## Chaining Async Operations

### Sequential Chaining

```typescript
import { tryCatchAsync, fromPromise } from 'ts-error-handling'

async function processOrder(orderId: string) {
  // Step 1: Fetch order
  const orderResult = await tryCatchAsync(
    async () => await db.orders.findById(orderId),
    e => `Failed to fetch order: ${e}`
  )

  if (orderResult.isErr) return orderResult

  // Step 2: Validate order
  const validationResult = orderResult
    .andThen(order =>
      order.items.length > 0
        ? ok(order)
        : err('Order has no items')
    )

  if (validationResult.isErr) return validationResult

  // Step 3: Process payment
  const paymentResult = await tryCatchAsync(
    async () => await paymentService.charge(validationResult.value),
    e => `Payment failed: ${e}`
  )

  return paymentResult
}
```

### Using andThen with Async

Since `andThen` is synchronous, you need to await Results before chaining:

```typescript
async function pipeline(input: string): ResultAsync<FinalResult, string> {
  // Step 1
  const step1 = await tryCatchAsync(
    async () => await firstOperation(input),
    e => `Step 1 failed: ${e}`
  )

  if (step1.isErr) return step1

  // Step 2 (depends on step 1)
  const step2 = await tryCatchAsync(
    async () => await secondOperation(step1.value),
    e => `Step 2 failed: ${e}`
  )

  if (step2.isErr) return step2

  // Step 3 (depends on step 2)
  return tryCatchAsync(
    async () => await thirdOperation(step2.value),
    e => `Step 3 failed: ${e}`
  )
}
```

## Parallel Async Operations

### parallel()

Execute async operations in parallel and collect results:

```typescript
import { parallel } from 'ts-error-handling'

// Define async operations
const operations = [
  async () => await fetchUser(1),
  async () => await fetchUser(2),
  async () => await fetchUser(3)
]

// Run in parallel
const result = await parallel(operations)
// Ok([User1, User2, User3]) or Err(firstError)
```

### sequence()

Execute async operations sequentially, stopping at first error:

```typescript
import { sequence } from 'ts-error-handling'

const operations = [
  async () => {
    console.log('Step 1')
    return ok('step1')
  },
  async () => {
    console.log('Step 2')
    return ok('step2')
  },
  async () => {
    console.log('Step 3')
    return err('Step 3 failed')
  },
  async () => {
    console.log('Step 4') // Never executed
    return ok('step4')
  }
]

const result = await sequence(operations)
// Err('Step 3 failed')
// Logs: Step 1, Step 2, Step 3
```

### traverseAsync()

Map over an array with an async Result-returning function:

```typescript
import { traverseAsync } from 'ts-error-handling'

async function fetchUser(id: number): ResultAsync<User, string> {
  return tryCatchAsync(
    async () => await api.getUser(id),
    e => `Failed to fetch user ${id}: ${e}`
  )
}

// Fetch multiple users
const result = await traverseAsync([1, 2, 3], fetchUser)
// Ok([User1, User2, User3]) or Err(firstError)
```

## Error Recovery

### Retry Pattern

```typescript
import { tryCatchAsync, ok, err } from 'ts-error-handling'
import type { Result, ResultAsync } from 'ts-error-handling'

interface RetryOptions {
  maxRetries: number
  delayMs: number
  backoffMultiplier?: number
}

async function withRetry<T, E>(
  operation: () => ResultAsync<T, E>,
  options: RetryOptions
): ResultAsync<T, E> {
  const { maxRetries, delayMs, backoffMultiplier = 2 } = options
  let lastError: E | undefined
  let currentDelay = delayMs

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await operation()

    if (result.isOk) {
      return result
    }

    lastError = result.error

    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, currentDelay))
      currentDelay *= backoffMultiplier
    }
  }

  return err(lastError!)
}

// Usage
const result = await withRetry(
  () => tryCatchAsync(
    async () => await fetch('/api/unstable'),
    e => `Request failed: ${e}`
  ),
  { maxRetries: 3, delayMs: 1000 }
)
```

### Fallback Pattern

```typescript
async function withFallback<T, E>(
  primary: () => ResultAsync<T, E>,
  fallback: () => ResultAsync<T, E>
): ResultAsync<T, E> {
  const primaryResult = await primary()

  if (primaryResult.isOk) {
    return primaryResult
  }

  // Try fallback
  return fallback()
}

// Usage
const result = await withFallback(
  () => fetchFromPrimary(),
  () => fetchFromBackup()
)
```

### Circuit Breaker Pattern

```typescript
interface CircuitBreakerState {
  failures: number
  lastFailure: number | null
  isOpen: boolean
}

function createCircuitBreaker(
  threshold: number,
  resetTimeMs: number
) {
  const state: CircuitBreakerState = {
    failures: 0,
    lastFailure: null,
    isOpen: false
  }

  return async function execute<T, E>(
    operation: () => ResultAsync<T, E>,
    fallback: E
  ): ResultAsync<T, E> {
    // Check if circuit should be reset
    if (
      state.isOpen &&
      state.lastFailure &&
      Date.now() - state.lastFailure > resetTimeMs
    ) {
      state.isOpen = false
      state.failures = 0
    }

    // Circuit is open - fail fast
    if (state.isOpen) {
      return err(fallback)
    }

    const result = await operation()

    if (result.isErr) {
      state.failures++
      state.lastFailure = Date.now()

      if (state.failures >= threshold) {
        state.isOpen = true
      }
    } else {
      state.failures = 0
    }

    return result
  }
}

// Usage
const breaker = createCircuitBreaker(3, 30000)

const result = await breaker(
  () => fetchExternalService(),
  'Service unavailable'
)
```

## Timeout Handling

```typescript
import { err, ok } from 'ts-error-handling'
import type { ResultAsync } from 'ts-error-handling'

async function withTimeout<T, E>(
  operation: () => ResultAsync<T, E>,
  timeoutMs: number,
  timeoutError: E
): ResultAsync<T, E> {
  return Promise.race([
    operation(),
    new Promise<Result<T, E>>(resolve =>
      setTimeout(() => resolve(err(timeoutError)), timeoutMs)
    )
  ])
}

// Usage
const result = await withTimeout(
  () => fetchSlowService(),
  5000,
  'Operation timed out'
)
```

## Practical Examples

### API Client

```typescript
import { tryCatchAsync, fromPromise, combineWithAllErrors } from 'ts-error-handling'
import type { Result, ResultAsync } from 'ts-error-handling'

interface ApiError {
  status: number
  message: string
  code?: string
}

class ApiClient {
  constructor(private baseUrl: string) {}

  private async request<T>(
    path: string,
    options?: RequestInit
  ): ResultAsync<T, ApiError> {
    return tryCatchAsync(
      async () => {
        const response = await fetch(`${this.baseUrl}${path}`, options)

        if (!response.ok) {
          const error = await response.json().catch(() => ({}))
          throw {
            status: response.status,
            message: error.message || response.statusText,
            code: error.code
          }
        }

        return response.json()
      },
      (error): ApiError => {
        if (error.status) return error
        return {
          status: 0,
          message: error.message || 'Network error'
        }
      }
    )
  }

  async get<T>(path: string): ResultAsync<T, ApiError> {
    return this.request<T>(path)
  }

  async post<T>(path: string, body: unknown): ResultAsync<T, ApiError> {
    return this.request<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  }
}

// Usage
const api = new ApiClient('https://api.example.com')

const userResult = await api.get<User>('/users/1')
userResult.match({
  ok: user => console.log('User:', user),
  err: error => console.error(`Error ${error.status}: ${error.message}`)
})
```

### Database Operations

```typescript
import { tryCatchAsync, sequence } from 'ts-error-handling'
import type { ResultAsync } from 'ts-error-handling'

interface DbError {
  code: string
  message: string
  query?: string
}

class Database {
  async query<T>(sql: string, params: unknown[]): ResultAsync<T, DbError> {
    return tryCatchAsync(
      async () => {
        // Simulated database query
        return await this.connection.execute(sql, params)
      },
      (error): DbError => ({
        code: error.code || 'UNKNOWN',
        message: error.message,
        query: sql
      })
    )
  }

  async transaction<T>(
    operations: (() => ResultAsync<unknown, DbError>)[]
  ): ResultAsync<T[], DbError> {
    // Start transaction
    const startResult = await this.query('BEGIN', [])
    if (startResult.isErr) return startResult as any

    // Execute operations sequentially
    const operationResult = await sequence(operations)

    if (operationResult.isErr) {
      // Rollback on error
      await this.query('ROLLBACK', [])
      return operationResult as any
    }

    // Commit on success
    const commitResult = await this.query('COMMIT', [])
    if (commitResult.isErr) {
      await this.query('ROLLBACK', [])
      return commitResult as any
    }

    return ok(operationResult.value) as any
  }
}

// Usage
const db = new Database()

const result = await db.transaction([
  () => db.query('INSERT INTO users (name) VALUES (?)', ['John']),
  () => db.query('INSERT INTO logs (action) VALUES (?)', ['user_created'])
])

result.match({
  ok: () => console.log('Transaction committed'),
  err: error => console.error('Transaction failed:', error.message)
})
```

### File Operations

```typescript
import { tryCatchAsync } from 'ts-error-handling'
import type { ResultAsync } from 'ts-error-handling'
import { readFile, writeFile } from 'fs/promises'

interface FileError {
  path: string
  operation: 'read' | 'write'
  message: string
}

async function readFileResult(path: string): ResultAsync<string, FileError> {
  return tryCatchAsync(
    async () => await readFile(path, 'utf-8'),
    (error): FileError => ({
      path,
      operation: 'read',
      message: error.message
    })
  )
}

async function writeFileResult(
  path: string,
  content: string
): ResultAsync<void, FileError> {
  return tryCatchAsync(
    async () => await writeFile(path, content, 'utf-8'),
    (error): FileError => ({
      path,
      operation: 'write',
      message: error.message
    })
  )
}

// Pipeline: read, transform, write
async function processFile(
  inputPath: string,
  outputPath: string,
  transform: (content: string) => string
): ResultAsync<void, FileError> {
  const readResult = await readFileResult(inputPath)

  if (readResult.isErr) return readResult as any

  const transformed = transform(readResult.value)

  return writeFileResult(outputPath, transformed)
}

// Usage
const result = await processFile(
  'input.txt',
  'output.txt',
  content => content.toUpperCase()
)

result.match({
  ok: () => console.log('File processed successfully'),
  err: error => console.error(
    `Failed to ${error.operation} ${error.path}: ${error.message}`
  )
})
```

## Best Practices

### 1. Handle Errors at Boundaries

```typescript
// Good - handle at API boundary
app.get('/users/:id', async (req, res) => {
  const result = await fetchUser(req.params.id)

  result.match({
    ok: user => res.json(user),
    err: error => res.status(404).json({ error })
  })
})
```

### 2. Use Typed Errors

```typescript
// Good - specific error types
type ApiError =
  | { type: 'not_found'; id: string }
  | { type: 'unauthorized'; reason: string }
  | { type: 'server_error'; details: string }

// Avoid - generic string errors
type ApiError = string
```

### 3. Compose Async Operations

```typescript
// Good - compose with Result methods
async function processUser(id: string) {
  const user = await fetchUser(id)
  if (user.isErr) return user

  const validated = user.andThen(validateUser)
  if (validated.isErr) return validated

  return saveUser(validated.value)
}
```

### 4. Provide Context in Errors

```typescript
// Good - errors have context
const result = await tryCatchAsync(
  () => api.createOrder(data),
  error => ({
    operation: 'create_order',
    orderId: data.id,
    originalError: error.message
  })
)
```

### 5. Use Helper Functions

```typescript
// Create reusable async helpers
const fetchJson = <T>(url: string) =>
  tryCatchAsync(
    async () => {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json() as T
    },
    e => `Failed to fetch ${url}: ${e}`
  )

// Use throughout codebase
const users = await fetchJson<User[]>('/api/users')
const posts = await fetchJson<Post[]>('/api/posts')
```
