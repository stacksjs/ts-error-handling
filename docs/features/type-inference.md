# Type Inference

Leverage TypeScript's type system for fully typed error handling.

## Overview

ts-error-handling provides complete type inference, ensuring your success and error types flow through your code correctly.

## Basic Type Inference

```typescript
import { Result, Ok, Err } from 'ts-error-handling'

// TypeScript infers Result<number, string>
function divide(a: number, b: number) {
  if (b === 0) return Err('Division by zero')
  return Ok(a / b)
}

const result = divide(10, 2)
// result is typed as Result<number, string>

if (result.isOk()) {
  // result.value is typed as number
  console.log(result.value)
}

if (result.isErr()) {
  // result.error is typed as string
  console.log(result.error)
}
```

## Extracting Types

Extract success and error types from Results:

```typescript
import { InferOk, InferErr } from 'ts-error-handling'

type MyResult = Result<User, ApiError>

type SuccessType = InferOk<MyResult>  // User
type ErrorType = InferErr<MyResult>   // ApiError
```

## Generic Functions

Create generic functions that preserve types:

```typescript
function processResult<T, E>(
  result: Result<T, E>,
  onOk: (value: T) => void,
  onErr: (error: E) => void
): void {
  if (result.isOk()) {
    onOk(result.value)
  } else {
    onErr(result.error)
  }
}

// Types are preserved through the function
processResult(
  divide(10, 2),
  (value) => console.log(value),  // value: number
  (error) => console.log(error),  // error: string
)
```

## Type Narrowing

Results narrow types correctly:

```typescript
const result: Result<User, ValidationError | NetworkError> = fetchUser(id)

if (result.isErr()) {
  const error = result.error
  // error is typed as ValidationError | NetworkError

  if (error instanceof ValidationError) {
    // error is narrowed to ValidationError
  }
}
```

## Mapped Types

Types flow through transformations:

```typescript
const result = Ok({ name: 'John', age: 30 })
  .map((user) => user.name)  // Result<string, never>
  .map((name) => name.length) // Result<number, never>

// Final type is Result<number, never>
```

## Union Error Types

Combine error types from multiple operations:

```typescript
type ParseError = { type: 'parse'; message: string }
type ValidationError = { type: 'validation'; field: string }
type ApiError = { type: 'api'; code: number }

function process(input: string): Result<Data, ParseError | ValidationError | ApiError> {
  return parse(input)           // Result<Raw, ParseError>
    .flatMap(validate)          // Result<Valid, ValidationError>
    .flatMap(sendToApi)         // Result<Data, ApiError>
}

// TypeScript correctly infers the union error type
```

## Discriminated Unions

Use discriminated unions for error handling:

```typescript
type AppError =
  | { kind: 'not_found'; id: string }
  | { kind: 'unauthorized'; reason: string }
  | { kind: 'validation'; errors: string[] }

function handleError(error: AppError) {
  switch (error.kind) {
    case 'not_found':
      return `Not found: ${error.id}`
    case 'unauthorized':
      return `Unauthorized: ${error.reason}`
    case 'validation':
      return `Validation errors: ${error.errors.join(', ')}`
  }
}
```

## Strict Mode

Enable strict type checking for Results:

```typescript
// @ts-expect-error - Cannot access value on Err
const value = Err('error').value

// Use unwrap methods for explicit access
const value = result.unwrap() // throws if Err
const value = result.unwrapOr(defaultValue)
const value = result.expect('Custom error message')
```
