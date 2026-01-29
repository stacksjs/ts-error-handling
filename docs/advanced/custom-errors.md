# Custom Error Types

Create domain-specific error types for better error handling and debugging.

## Overview

Custom error types allow you to create structured, type-safe errors that provide rich context for debugging and user-facing error messages.

## Basic Custom Errors

```typescript
import { Result, Ok, Err } from 'ts-error-handling'

// Simple custom error class
class ValidationError extends Error {
  constructor(
    public field: string,
    public rule: string,
    message: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

function validateEmail(email: string): Result<string, ValidationError> {
  if (!email.includes('@')) {
    return Err(new ValidationError('email', 'format', 'Invalid email format'))
  }
  return Ok(email)
}
```

## Error Hierarchies

Create a hierarchy of error types:

```typescript
// Base error class
abstract class AppError extends Error {
  abstract readonly code: string
  abstract readonly statusCode: number

  toJSON() {
    return {
      code: this.code,
      message: this.message,
    }
  }
}

// Specific error types
class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND'
  readonly statusCode = 404

  constructor(public resource: string, public id: string) {
    super(`${resource} with id ${id} not found`)
  }
}

class UnauthorizedError extends AppError {
  readonly code = 'UNAUTHORIZED'
  readonly statusCode = 401

  constructor(reason?: string) {
    super(reason ?? 'Authentication required')
  }
}

class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR'
  readonly statusCode = 400

  constructor(public errors: Record<string, string[]>) {
    super('Validation failed')
  }

  toJSON() {
    return {
      ...super.toJSON(),
      errors: this.errors,
    }
  }
}
```

## Discriminated Union Errors

Use discriminated unions for exhaustive error handling:

```typescript
type UserError =
  | { type: 'not_found'; userId: string }
  | { type: 'invalid_email'; email: string }
  | { type: 'duplicate_email'; email: string }
  | { type: 'weak_password'; requirements: string[] }

function createUser(data: CreateUserInput): Result<User, UserError> {
  if (!isValidEmail(data.email)) {
    return Err({ type: 'invalid_email', email: data.email })
  }

  if (emailExists(data.email)) {
    return Err({ type: 'duplicate_email', email: data.email })
  }

  const passwordCheck = checkPassword(data.password)
  if (!passwordCheck.valid) {
    return Err({
      type: 'weak_password',
      requirements: passwordCheck.missing,
    })
  }

  return Ok(saveUser(data))
}

// Exhaustive handling
function handleUserError(error: UserError): string {
  switch (error.type) {
    case 'not_found':
      return `User ${error.userId} not found`
    case 'invalid_email':
      return `Invalid email: ${error.email}`
    case 'duplicate_email':
      return `Email already registered: ${error.email}`
    case 'weak_password':
      return `Password must have: ${error.requirements.join(', ')}`
  }
}
```

## Error Context

Add context to errors as they propagate:

```typescript
class ContextualError extends Error {
  public context: Record<string, unknown> = {}

  addContext(key: string, value: unknown): this {
    this.context[key] = value
    return this
  }

  static wrap(error: Error, context: Record<string, unknown>): ContextualError {
    const contextual = new ContextualError(error.message)
    contextual.stack = error.stack
    contextual.context = context
    return contextual
  }
}

// Usage
function processOrder(orderId: string): Result<Order, ContextualError> {
  return fetchOrder(orderId)
    .mapErr((e) => ContextualError.wrap(e, { orderId, stage: 'fetch' }))
    .flatMap((order) =>
      validateOrder(order).mapErr((e) =>
        ContextualError.wrap(e, { orderId, stage: 'validate', order })
      )
    )
}
```

## Error Serialization

Serialize errors for logging and API responses:

```typescript
interface SerializableError {
  code: string
  message: string
  details?: Record<string, unknown>
  stack?: string
}

function serializeError(error: AppError): SerializableError {
  return {
    code: error.code,
    message: error.message,
    details: error instanceof ValidationError ? { errors: error.errors } : undefined,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  }
}
```

## Error Recovery Strategies

Define recovery strategies for different error types:

```typescript
const errorRecovery: Record<string, (error: AppError) => Result<any, AppError>> = {
  NOT_FOUND: (error) => Ok(null), // Return null for not found
  RATE_LIMITED: (error) => {
    // Retry after delay
    return ResultAsync.fromPromise(
      new Promise((r) => setTimeout(r, 1000))
    ).flatMap(() => retryOperation())
  },
  UNAUTHORIZED: (error) => {
    // Attempt token refresh
    return refreshToken().flatMap(() => retryOperation())
  },
}
```
