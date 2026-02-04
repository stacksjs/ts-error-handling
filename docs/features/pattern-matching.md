# Pattern Matching

Use pattern matching to elegantly handle Result and Option types with exhaustive case handling.

## Overview

Pattern matching provides a clean, functional approach to handling different states of Result and Option types, ensuring all cases are handled at compile time.

## Basic Pattern Matching

```typescript
import { Result, Ok, Err, match } from 'ts-error-handling'

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return Err('Division by zero')
  return Ok(a / b)
}

const result = divide(10, 2)

// Pattern match on the result
const message = match(result, {
  Ok: (value) => `Result: ${value}`,
  Err: (error) => `Error: ${error}`,
})

console.log(message) // "Result: 5"
```

## Match with Options

```typescript
import { Option, Some, None, match } from 'ts-error-handling'

function findUser(id: string): Option<User> {
  const user = users.find((u) => u.id === id)
  return user ? Some(user) : None
}

const user = findUser('123')

const greeting = match(user, {
  Some: (u) => `Hello, ${u.name}!`,
  None: () => 'User not found',
})
```

## Exhaustive Matching

TypeScript ensures all cases are handled:

```typescript
type Status = 'pending' | 'approved' | 'rejected'

function getStatusResult(status: Status): Result<string, string> {
  // ...
}

// TypeScript error if a case is missing
const message = match(result, {
  Ok: (value) => value,
  // Error: Property 'Err' is missing
})
```

## Nested Matching

Handle complex nested structures:

```typescript
type ApiResponse = Result<Option<User>, ApiError>

const response: ApiResponse = fetchUser(id)

const message = match(response, {
  Ok: (maybeUser) =>
    match(maybeUser, {
      Some: (user) => `Found: ${user.name}`,
      None: () => 'User not found',
    }),
  Err: (error) => `API Error: ${error.message}`,
})
```

## Match with Guards

Add conditions to pattern matching:

```typescript
const result = processPayment(amount)

const message = matchWith(result, [
  {
    pattern: 'Ok',
    guard: (value) => value > 1000,
    handler: (value) => `Large payment: $${value}`,
  },
  {
    pattern: 'Ok',
    handler: (value) => `Payment: $${value}`,
  },
  {
    pattern: 'Err',
    handler: (error) => `Failed: ${error}`,
  },
])
```

## Match Expressions

Use match as an expression:

```typescript
const status = match(result, {
  Ok: () => 'success' as const,
  Err: () => 'failure' as const,
})

// status is typed as 'success' | 'failure'
```

## Partial Matching

Handle only specific cases:

```typescript
import { matchOk, matchErr } from 'ts-error-handling'

// Only handle Ok case
matchOk(result, (value) => {
  console.log('Success:', value)
})

// Only handle Err case
matchErr(result, (error) => {
  reportError(error)
})
```
