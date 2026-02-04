# Error Chaining

Chain operations on Results for clean, railway-oriented programming.

## Overview

Error chaining allows you to compose multiple operations that may fail, handling errors at each step while maintaining a clean, readable code flow.

## Basic Chaining with map

Transform successful values:

```typescript
import { Result, Ok, Err } from 'ts-error-handling'

function parseNumber(str: string): Result<number, string> {
  const num = Number(str)
  return Number.isNaN(num) ? Err('Invalid number') : Ok(num)
}

const result = parseNumber('42')
  .map((n) => n * 2)        // 84
  .map((n) => n.toString()) // "84"
  .map((s) => `Result: ${s}`) // "Result: 84"
```

## Chaining with flatMap

Chain operations that return Results:

```typescript
function validateAge(age: number): Result<number, string> {
  return age >= 0 && age <= 150
    ? Ok(age)
    : Err('Invalid age')
}

function validateEmail(email: string): Result<string, string> {
  return email.includes('@')
    ? Ok(email)
    : Err('Invalid email')
}

const result = parseNumber(ageInput)
  .flatMap(validateAge)
  .flatMap((age) => {
    // Can use previous values in the chain
    return validateEmail(emailInput).map((email) => ({
      age,
      email,
    }))
  })
```

## Error Transformation

Transform error types along the chain:

```typescript
type ValidationError = { field: string; message: string }
type ApiError = { code: number; message: string }

const result = validateInput(data)
  .mapErr((e): ApiError => ({
    code: 400,
    message: e.message,
  }))
  .flatMap(callApi)
  .mapErr((e): ApiError => ({
    code: e.code ?? 500,
    message: e.message,
  }))
```

## Combining Chains

Combine multiple independent chains:

```typescript
import { combine } from 'ts-error-handling'

const nameResult = validateName(name)
const emailResult = validateEmail(email)
const ageResult = validateAge(age)

// Combine all results
const userResult = combine([nameResult, emailResult, ageResult])
  .map(([name, email, age]) => ({ name, email, age }))

// Or use combineObject for named results
const userResult = combineObject({
  name: nameResult,
  email: emailResult,
  age: ageResult,
})
```

## Async Chaining

Chain async operations:

```typescript
import { ResultAsync } from 'ts-error-handling'

const result = await ResultAsync.from(fetchUser(id))
  .flatMap((user) => fetchOrders(user.id))
  .flatMap((orders) => calculateTotal(orders))
  .map((total) => ({ total, currency: 'USD' }))
```

## Tapping into the Chain

Perform side effects without breaking the chain:

```typescript
const result = validateUser(data)
  .tap((user) => {
    // Log success, doesn't affect the chain
    console.log('User validated:', user.id)
  })
  .tapErr((error) => {
    // Log errors, doesn't affect the chain
    reportError(error)
  })
  .flatMap(saveUser)
```

## Early Returns

Exit the chain early on certain conditions:

```typescript
const result = fetchUser(id)
  .ensure(
    (user) => user.isActive,
    () => new Error('User is inactive')
  )
  .flatMap(processUser)
```
