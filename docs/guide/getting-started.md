# Getting Started

ts-error-handling is a fully typed error handling library for TypeScript, inspired by Rust's `Result` type and [neverthrow](https://github.com/supermacro/neverthrow). It provides a type-safe way to handle errors without throwing exceptions, enabling railway-oriented programming patterns.

## Why Result Types?

Traditional error handling with try/catch has several problems:

1. **Hidden Control Flow** - Exceptions can be thrown from anywhere
2. **Type Safety** - TypeScript can't track what errors a function might throw
3. **Composition** - Chaining operations that might fail is awkward
4. **Forgetting to Handle** - Easy to forget to catch errors

Result types solve these issues by making errors explicit in your type signatures:

```typescript
// Traditional - what errors can this throw?
function divide(a: number, b: number): number {
  if (b === 0) throw new Error('Division by zero')
  return a / b
}

// With Result - errors are explicit in the type
function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return err('Division by zero')
  return ok(a / b)
}
```

## Installation

Install ts-error-handling using your preferred package manager:

```bash
# Using bun
bun add ts-error-handling

# Using npm
npm install ts-error-handling

# Using yarn
yarn add ts-error-handling

# Using pnpm
pnpm add ts-error-handling
```

## Basic Usage

### Creating Results

Use `ok()` for success and `err()` for failure:

```typescript
import { ok, err } from 'ts-error-handling'
import type { Result } from 'ts-error-handling'

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return err('Division by zero')
  }
  return ok(a / b)
}

const result = divide(10, 2)

if (result.isOk) {
  console.log('Result:', result.value) // 5
} else {
  console.log('Error:', result.error)
}
```

### Type Narrowing

TypeScript automatically narrows the type after checking `isOk` or `isErr`:

```typescript
const result: Result<number, string> = divide(10, 0)

if (result.isOk) {
  // TypeScript knows result is Ok<number, string>
  console.log(result.value) // number - accessible
  // result.error - not accessible (type error)
} else {
  // TypeScript knows result is Err<number, string>
  console.log(result.error) // string - accessible
  // result.value - not accessible (type error)
}
```

### Transforming Results

#### map()

Transform the success value:

```typescript
const result = ok(21)
  .map(x => x * 2) // Ok(42)

err('failed')
  .map(x => x * 2) // Still Err('failed')
```

#### mapErr()

Transform the error value:

```typescript
ok(42)
  .mapErr(e => e.toUpperCase()) // Still Ok(42)

err('failed')
  .mapErr(e => e.toUpperCase()) // Err('FAILED')
```

#### andThen() (flatMap)

Chain operations that return Results:

```typescript
function parseNumber(s: string): Result<number, string> {
  const n = parseInt(s)
  return isNaN(n) ? err('Not a number') : ok(n)
}

function validatePositive(n: number): Result<number, string> {
  return n > 0 ? ok(n) : err('Must be positive')
}

const result = parseNumber('42')
  .andThen(validatePositive)
  .map(n => n * 2)

// ok(84)
```

#### orElse()

Recover from errors:

```typescript
function getFromCache(): Result<string, string> {
  return err('Cache miss')
}

function getFromDatabase(): Result<string, string> {
  return ok('data from database')
}

const result = getFromCache()
  .orElse(() => getFromDatabase())

// ok('data from database')
```

### Pattern Matching

Use `match` for exhaustive handling:

```typescript
const result = divide(10, 0)

const message = result.match({
  ok: value => `Result: ${value}`,
  err: error => `Error: ${error}`
})
// 'Error: Division by zero'
```

### Unwrapping

Extract values from Results:

```typescript
// unwrap() - throws if Err
ok(42).unwrap() // 42
err('failed').unwrap() // throws Error

// unwrapOr() - provides default
ok(42).unwrapOr(0) // 42
err('failed').unwrapOr(0) // 0

// unwrapOrElse() - computes default from error
ok(42).unwrapOrElse(e => 0) // 42
err('failed').unwrapOrElse(e => e.length) // 6

// expect() - throws with custom message
ok(42).expect('should work') // 42
err('failed').expect('should work') // throws 'should work'
```

## Utility Functions

### tryCatch()

Convert throwing functions to Result:

```typescript
import { tryCatch } from 'ts-error-handling'

const result = tryCatch(
  () => JSON.parse('{"name": "John"}'),
  error => `Parse error: ${error}`
)
// ok({ name: 'John' })

const errorResult = tryCatch(
  () => JSON.parse('invalid'),
  error => `Parse error: ${error}`
)
// err('Parse error: ...')
```

### fromNullable()

Convert nullable values to Result:

```typescript
import { fromNullable } from 'ts-error-handling'

interface Config {
  apiKey?: string
}

function getApiKey(config: Config): Result<string, string> {
  return fromNullable(config.apiKey, 'API key is required')
}

getApiKey({ apiKey: 'secret' }) // ok('secret')
getApiKey({}) // err('API key is required')
```

### combine()

Combine multiple Results:

```typescript
import { combine } from 'ts-error-handling'

const results = combine([
  ok(1),
  ok(2),
  ok(3)
])
// ok([1, 2, 3])

const withError = combine([
  ok(1),
  err('failed'),
  ok(3)
])
// err('failed')
```

### combineWithAllErrors()

Collect all errors:

```typescript
import { combineWithAllErrors } from 'ts-error-handling'

const result = combineWithAllErrors([
  err('error 1'),
  ok(2),
  err('error 3')
])
// err(['error 1', 'error 3'])
```

## Practical Examples

### API Request

```typescript
import { tryCatchAsync } from 'ts-error-handling'

interface User {
  id: number
  name: string
}

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
  console.log(`Hello, ${result.value.name}`)
} else {
  console.error(result.error)
}
```

### Form Validation

```typescript
interface FormData {
  email: string
  password: string
  age: string
}

function validateEmail(email: string): Result<string, string> {
  return email.includes('@')
    ? ok(email)
    : err('Invalid email format')
}

function validatePassword(password: string): Result<string, string> {
  return password.length >= 8
    ? ok(password)
    : err('Password must be at least 8 characters')
}

function validateAge(ageStr: string): Result<number, string> {
  const age = parseInt(ageStr)
  if (isNaN(age)) return err('Age must be a number')
  if (age < 18) return err('Must be at least 18')
  return ok(age)
}

function validateForm(data: FormData): Result<{ email: string; password: string; age: number }, string[]> {
  return combineWithAllErrors([
    validateEmail(data.email),
    validatePassword(data.password),
    validateAge(data.age)
  ]).map(([email, password, age]) => ({ email, password, age }))
}

// Usage
const result = validateForm({
  email: 'invalid',
  password: '123',
  age: '15'
})

if (result.isErr) {
  console.log('Validation errors:', result.error)
  // ['Invalid email format', 'Password must be at least 8 characters', 'Must be at least 18']
}
```

### Pipeline Processing

```typescript
function pipeline(input: string): Result<number, string> {
  return ok(input)
    .andThen(s => {
      const trimmed = s.trim()
      return trimmed.length > 0 ? ok(trimmed) : err('Empty input')
    })
    .andThen(s => {
      const num = parseInt(s)
      return isNaN(num) ? err('Not a number') : ok(num)
    })
    .andThen(n => n >= 0 ? ok(n) : err('Must be non-negative'))
    .map(n => n * 2)
}

pipeline('  42  ') // ok(84)
pipeline('  -5  ') // err('Must be non-negative')
pipeline('hello') // err('Not a number')
pipeline('   ') // err('Empty input')
```

## Best Practices

### 1. Return Results from Functions

Make error cases explicit in your function signatures:

```typescript
// Good - errors are part of the type
function findUser(id: number): Result<User, 'not*found' | 'db*error'>

// Avoid - caller doesn't know what can fail
function findUser(id: number): User // throws?
```

### 2. Use Specific Error Types

```typescript
// Good - specific error types
type ParseError = 'invalid*json' | 'missing*field' | 'invalid_type'
function parse(input: string): Result<Data, ParseError>

// Avoid - generic string errors
function parse(input: string): Result<Data, string>
```

### 3. Transform Early, Unwrap Late

```typescript
// Good - keep as Result until needed
const result = fetchData()
  .andThen(validate)
  .map(transform)
  .match({
    ok: data => renderSuccess(data),
    err: error => renderError(error)
  })

// Avoid - unwrapping early
const data = fetchData().unwrap() // Might throw!
const validated = validate(data).unwrap() // Might throw!
```

### 4. Use combineWithAllErrors for Validation

```typescript
// Good - collect all errors
const result = combineWithAllErrors([
  validateEmail(email),
  validatePassword(password),
  validateAge(age)
])

// Less ideal - stops at first error
const result = combine([
  validateEmail(email),
  validatePassword(password),
  validateAge(age)
])
```

## Next Steps

- [Result Type](/guide/result) - Complete Result API reference
- [Option Type](/guide/option) - Handling optional values
- [Async Handling](/guide/async) - Working with async operations
